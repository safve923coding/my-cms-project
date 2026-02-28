import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, writeBatch, getDocs, orderBy, query } from 'firebase/firestore';

function getTimeRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
        case 'today': return { start: today, end: new Date(today.getTime() + 86400000) };
        case 'yesterday': return { start: new Date(today.getTime() - 86400000), end: today };
        case 'week': {
            const dow = today.getDay();
            return { start: new Date(today.getTime() - (dow === 0 ? 6 : dow - 1) * 86400000), end: new Date(now.getTime() + 86400000) };
        }
        case 'month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getTime() + 86400000) };
        case 'lastmonth': return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) };
        default: return null;
    }
}

const FILTER_LABELS = {
    all: 'ข้อมูลทั้งหมด', today: 'วันนี้', yesterday: 'เมื่อวาน',
    week: 'สัปดาห์นี้', month: 'เดือนนี้', lastmonth: 'เดือนที่แล้ว'
};

const LOCAL_STORAGE_KEY = 'kittycat_cases';

export function useCases() {
    const [allCases, setAllCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('all');

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

    // Officer counts (legacy compatibility)
    const officerCounts = {};
    filtered.forEach(c => {
        const n = c.officerName || 'ไม่ระบุ';
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

        const dow = today.getDay(); // 0 is Sunday
        const diffToMonday = (dow === 0 ? 6 : dow - 1);
        const thisWeekStartD = new Date(today.getTime() - diffToMonday * 86400000);
        const t_thisWeek = { start: thisWeekStartD.toISOString(), end: t_today.end };

        const lastWeekStartD = new Date(thisWeekStartD.getTime() - 7 * 86400000);
        const t_lastWeek = { start: lastWeekStartD.toISOString(), end: thisWeekStartD.toISOString() };

        const thisMonthStartD = new Date(now.getFullYear(), now.getMonth(), 1);
        const t_thisMonth = { start: thisMonthStartD.toISOString(), end: t_today.end };

        const lastMonthStartD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const t_lastMonth = { start: lastMonthStartD.toISOString(), end: thisMonthStartD.toISOString() };

        allCases.forEach(c => {
            const n = c.officerName || 'ไม่ระบุ';
            if (!stats[n]) {
                stats[n] = { name: n, total: 0, today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0 };
            }

            stats[n].total++;
            const ts = c.timestamp || '';

            if (ts >= t_today.start && ts < t_today.end) stats[n].today++;
            if (ts >= t_yest.start && ts < t_yest.end) stats[n].yesterday++;
            if (ts >= t_thisWeek.start && ts < t_thisWeek.end) stats[n].thisWeek++;
            if (ts >= t_lastWeek.start && ts < t_lastWeek.end) stats[n].lastWeek++;
            if (ts >= t_thisMonth.start && ts < t_thisMonth.end) stats[n].thisMonth++;
            if (ts >= t_lastMonth.start && ts < t_lastMonth.end) stats[n].lastMonth++;
        });

        return Object.values(stats).sort((a, b) => b.total - a.total);
    })();

    // Quick stats
    const quickStats = (() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayISO = today.toISOString();
        const tomorrowISO = new Date(today.getTime() + 86400000).toISOString();
        const dow = today.getDay();
        const weekStartISO = new Date(today.getTime() - (dow === 0 ? 6 : dow - 1) * 86400000).toISOString();

        let todayCount = 0, weekCount = 0;
        const officers = new Set();
        allCases.forEach(c => {
            const ts = c.timestamp || '';
            if (ts >= todayISO && ts < tomorrowISO) todayCount++;
            if (ts >= weekStartISO) weekCount++;
            if (c.officerName) officers.add(c.officerName);
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
            // Save to Firestore using a batch to avoid too many writes
            const batch = writeBatch(db);
            const casesRef = collection(db, 'cases');

            newCases.forEach(c => {
                const docRef = doc(casesRef, c.id);
                batch.set(docRef, {
                    ...c,
                    createdAt: new Date().toISOString()
                }, { merge: true }); // Use merge to not overwrite existing data unexpectedly
            });

            await batch.commit();
            console.log(`Successfully saved ${newCases.length} cases to Firestore`);
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            // We might want to alert the user here, but for now we fall back to local state
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

    return {
        loading, error, allCases,
        filtered, sortedOfficers, officerStats,
        quickStats,
        timeFilter, changeTimeFilter,
        filterLabel: FILTER_LABELS[timeFilter] || 'ทั้งหมด',
        clearAll, importCases,
    };
}
