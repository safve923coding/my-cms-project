import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, writeBatch, getDocs, orderBy, query } from 'firebase/firestore';

function getMondayStart(d) {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function getTimeRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
        case 'today': return { start: today, end: new Date(today.getTime() + 86400000) };
        case 'yesterday': return { start: new Date(today.getTime() - 86400000), end: today };
        case 'week': {
            const startOfWeek = getMondayStart(today);
            return { start: startOfWeek, end: new Date(today.getTime() + 86400000) };
        }
        case 'lastweek': {
            const endOfLastWeek = getMondayStart(today);
            const startOfLastWeek = new Date(endOfLastWeek.getTime() - 7 * 86400000);
            return { start: startOfLastWeek, end: endOfLastWeek };
        }
        case 'month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getTime() + 86400000) };
        case 'lastmonth': {
            const mStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const mEnd = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: mStart, end: mEnd };
        }
        default: return null;
    }
}

const FILTER_LABELS = {
    all: 'ข้อมูลทั้งหมด', today: 'วันนี้', yesterday: 'เมื่อวาน',
    week: 'สัปดาห์นี้', lastweek: 'สัปดาห์ที่แล้ว', month: 'เดือนนี้', lastmonth: 'เดือนที่แล้ว'
};

const LOCAL_STORAGE_KEY = 'kittycat_cases';

export function useCases() {
    const [allCases, setAllCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('all');
    const [officerMetadata, setOfficerMetadata] = useState({});

    // Load data
    useEffect(() => {
        (async () => {
            try {
                let firebaseData = [];
                try {
                    const casesRef = collection(db, 'cases');
                    const q = query(casesRef, orderBy('timestamp', 'desc')); // Order by timestamp for UI
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        querySnapshot.forEach((doc) => {
                            firebaseData.push({ id: doc.id, ...doc.data() });
                        });
                    }
                } catch (fbError) {
                    console.error("Error fetching from Firebase:", fbError);
                }

                const resp = await fetch('/cases.json');
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                let localJsonData = await resp.json();

                let data = [...firebaseData, ...localJsonData];

                // Append local storage updates
                try {
                    const localDataStr = localStorage.getItem(LOCAL_STORAGE_KEY);
                    if (localDataStr) {
                        const localCases = JSON.parse(localDataStr);
                        data = [...data, ...localCases];
                    }
                } catch (e) {
                    console.error("Failed to load local cases", e);
                }

                // Deduplicate and process IDs
                const uniqueCasesMap = new Map();
                data.forEach((c, i) => {
                    const id = c.messageId || c.id || ('c_' + i);
                    c.id = id;
                    uniqueCasesMap.set(id, c);
                });

                data = Array.from(uniqueCasesMap.values());
                data.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
                setAllCases(data);
                // Fetch officer metadata (ranks/status)
                try {
                    const metadataSnapshot = await getDocs(collection(db, 'officer_metadata'));
                    const metadataObj = {};
                    metadataSnapshot.forEach(doc => {
                        metadataObj[doc.id] = doc.data();
                    });
                    setOfficerMetadata(metadataObj);
                } catch (metaError) {
                    console.error("Error fetching officer metadata:", metaError);
                }

            } catch (e) {
                setError('ไม่สามารถโหลดข้อมูล: ' + e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Filtering
    const getFiltered = useCallback(() => {
        let cases = allCases;
        const range = getTimeRange(timeFilter);
        if (range) {
            const s = range.start.toISOString(), e = range.end.toISOString();
            cases = cases.filter(c => { const ts = c.timestamp || ''; return ts >= s && ts < e; });
        }
        return cases;
    }, [allCases, timeFilter]);

    const filtered = getFiltered();

    // Build alias map
    const aliasMap = {};
    Object.keys(officerMetadata).forEach(mainName => {
        const aliases = officerMetadata[mainName].aliases || [];
        aliases.forEach(alias => {
            if (alias && alias.trim() !== '') {
                aliasMap[alias] = mainName;
            }
        });
    });

    // Officer counts (legacy compatibility)
    const officerCounts = {};
    filtered.forEach(c => {
        let n = c.officerName || 'ไม่ระบุ';
        if (aliasMap[n]) n = aliasMap[n];
        officerCounts[n] = (officerCounts[n] || 0) + 1;
    });
    const sortedOfficers = Object.entries(officerCounts).sort((a, b) => b[1] - a[1]);

    // Advanced officer stats table data
    const officerStats = (() => {
        const stats = {};
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const t_today = { start: today.toISOString(), end: new Date(today.getTime() + 86400000).toISOString() };
        const t_yest = { start: new Date(today.getTime() - 86400000).toISOString(), end: today.toISOString() };

        const thisWeekStartD = getMondayStart(today);
        const t_thisWeek = { start: thisWeekStartD.toISOString(), end: t_today.end };

        const lastWeekStartD = new Date(thisWeekStartD.getTime() - 7 * 86400000);
        const t_lastWeek = { start: lastWeekStartD.toISOString(), end: thisWeekStartD.toISOString() };

        const thisMonthStartD = new Date(now.getFullYear(), now.getMonth(), 1);
        const t_thisMonth = { start: thisMonthStartD.toISOString(), end: t_today.end };

        const lastMonthStartD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const t_lastMonth = { start: lastMonthStartD.toISOString(), end: thisMonthStartD.toISOString() };

        allCases.forEach(c => {
            let n = c.officerName || 'ไม่ระบุ';
            if (aliasMap[n]) n = aliasMap[n];

            if (!stats[n]) {
                const mainMeta = officerMetadata[n] || {};
                stats[n] = {
                    name: n,
                    total: 0, today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0,
                    thisWeekDays: [0, 0, 0, 0, 0, 0, 0], // Mon-Sun
                    lastWeekDays: [0, 0, 0, 0, 0, 0, 0], // Mon-Sun
                    aliases: mainMeta.aliases || []
                };
            }

            stats[n].total++;
            const ts = c.timestamp || '';

            if (ts >= t_today.start && ts < t_today.end) stats[n].today++;
            if (ts >= t_yest.start && ts < t_yest.end) stats[n].yesterday++;

            if (ts >= t_thisWeek.start && ts < t_thisWeek.end) {
                stats[n].thisWeek++;
                const d = new Date(ts);
                const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon, 6=Sun
                stats[n].thisWeekDays[dayIndex]++;
            }
            if (ts >= t_lastWeek.start && ts < t_lastWeek.end) {
                stats[n].lastWeek++;
                const d = new Date(ts);
                const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon, 6=Sun
                stats[n].lastWeekDays[dayIndex]++;
            }
            if (ts >= t_thisMonth.start && ts < t_thisMonth.end) stats[n].thisMonth++;
            if (ts >= t_lastMonth.start && ts < t_lastMonth.end) stats[n].lastMonth++;

            // Integrate metadata
            if (officerMetadata[n]) {
                stats[n].rank = officerMetadata[n].rank || 'นายร้อยตำรวจ';
                stats[n].status = officerMetadata[n].status || 'active';
                stats[n].joinDate = officerMetadata[n].joinDate || '';
            } else {
                stats[n].rank = 'นายร้อยตำรวจ';
                stats[n].status = 'active';
                stats[n].joinDate = '';
            }
        });

        return Object.values(stats).sort((a, b) => b.total - a.total);
    })();

    // Quick stats
    const quickStats = (() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayISO = today.toISOString();
        const tomorrowISO = new Date(today.getTime() + 86400000).toISOString();
        const weekStartISO = getMondayStart(today).toISOString();

        let todayCount = 0, weekCount = 0;
        const officers = new Set();

        allCases.forEach(c => {
            const ts = c.timestamp || '';
            if (ts >= todayISO && ts < tomorrowISO) todayCount++;
            if (ts >= weekStartISO) weekCount++;

            let n = c.officerName;
            if (n) {
                if (aliasMap[n]) n = aliasMap[n];

                // Exclude invalid statuses based on user request ("ไม่นับเข้า", "ลาออก")
                const meta = officerMetadata[n];
                if (meta) {
                    if (meta.status === 'resigned' || meta.status === 'not-counted') return;

                    // User also specified: must have a rank from the dropdown, OR be 'ไม่ระบุ' status (empty).
                    // This implies if they exist in the metadata they are considered an officer unless excluded by status above
                }
                officers.add(n);
            }
        });
        return { todayCount, weekCount, officerCount: officers.size, totalCount: allCases.length };
    })();

    // Actions
    const changeTimeFilter = (f) => {
        setTimeFilter(f);
    };

    const clearAll = () => {
        const count = allCases.length;
        setAllCases([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return count;
    };

    const importCases = async (newCases) => {
        if (!newCases || newCases.length === 0) return 0;

        newCases.forEach((c, i) => { if (!c.id) c.id = c.messageId || ('import_' + Date.now() + '_' + i); });

        try {
            // Firestore writeBatch has a limit of 500 writes
            const BATCH_LIMIT = 500;
            const casesRef = collection(db, 'cases');

            for (let i = 0; i < newCases.length; i += BATCH_LIMIT) {
                const chunk = newCases.slice(i, i + BATCH_LIMIT);
                const batch = writeBatch(db);

                chunk.forEach(c => {
                    const docRef = doc(casesRef, c.id);
                    batch.set(docRef, {
                        ...c,
                        createdAt: new Date().toISOString()
                    }, { merge: true });
                });

                await batch.commit();
            }
            console.log(`Successfully saved ${newCases.length} cases to Firestore in chunks`);
        } catch (error) {
            console.error("Error saving to Firestore:", error);
        }

        setAllCases(prev => {
            const merged = [...prev, ...newCases];
            const uniqueCasesMap = new Map();
            merged.forEach(c => uniqueCasesMap.set(c.id, c));
            const uniqueMerged = Array.from(uniqueCasesMap.values());

            uniqueMerged.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

            // Save to localStorage as a backup/fast cache
            try {
                const existingLocalStr = localStorage.getItem(LOCAL_STORAGE_KEY);
                const existingLocal = existingLocalStr ? JSON.parse(existingLocalStr) : [];
                const updatedLocal = [...existingLocal, ...newCases];

                const localMap = new Map();
                updatedLocal.forEach(c => localMap.set(c.id || c.messageId, c));
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(localMap.values())));
            } catch (err) {
                console.error("Error saving to local storage", err);
            }

            return uniqueMerged;
        });
        return newCases.length;
    };

    const saveOfficerData = async (officerName, data) => {
        try {
            const docRef = doc(db, 'officer_metadata', officerName);
            await setDoc(docRef, data, { merge: true });

            setOfficerMetadata(prev => ({
                ...prev,
                [officerName]: { ...(prev[officerName] || {}), ...data }
            }));

            return true;
        } catch (error) {
            console.error("Error saving officer metadata:", error);
            throw error;
        }
    };

    return {
        loading, error, allCases,
        filtered, sortedOfficers, officerStats,
        quickStats,
        timeFilter, changeTimeFilter,
        filterLabel: FILTER_LABELS[timeFilter] || 'ทั้งหมด',
        clearAll, importCases, saveOfficerData,
    };
}
