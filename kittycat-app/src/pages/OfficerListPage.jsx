import { useState, useEffect } from 'react';
import { useCases } from '../hooks/useCases';
import { Users, Shield, Trophy } from 'lucide-react';
import CustomDropdown from '../components/CustomDropdown';
import './OfficerListPage.css';

export default function OfficerListPage() {
    const { loading, officerStats, quickStats } = useCases();
    const [searchTerm, setSearchTerm] = useState('');
    const [rankFilter, setRankFilter] = useState('all');

    const POLICE_RANKS_ORDER = {
        'ผบ.ตร.': 1,
        'รอง ผบ.ตร.': 2,
        'จเรตำรวจ': 3,
        'ผู้กำกับ': 4,
        'สารวัตร': 5,
        'ผู้กอง': 6,
        'ผู้บังคับหมวด': 7,
        'นายดาบตำรวจ': 8,
        'จ่าสิบตำรวจ': 9,
        'ผู้บังคับหมู่': 10,
        'นายร้อยตำรวจ': 11
    };

    // Ranks array for the dropdown filter
    const POLICE_RANKS = [
        { value: '', label: 'ไม่ระบุ' },
        { value: 'ผบ.ตร.', label: 'ผบ.ตร.' },
        { value: 'รอง ผบ.ตร.', label: 'รอง ผบ.ตร.' },
        { value: 'จเรตำรวจ', label: 'จเรตำรวจ' },
        { value: 'ผู้กำกับ', label: 'ผู้กำกับ' },
        { value: 'สารวัตร', label: 'สารวัตร' },
        { value: 'ผู้กอง', label: 'ผู้กอง' },
        { value: 'ผู้บังคับหมวด', label: 'ผู้บังคับหมวด' },
        { value: 'นายดาบตำรวจ', label: 'นายดาบตำรวจ' },
        { value: 'จ่าสิบตำรวจ', label: 'จ่าสิบตำรวจ' },
        { value: 'ผู้บังคับหมู่', label: 'ผู้บังคับหมู่' },
        { value: 'นายร้อยตำรวจ', label: 'นายร้อยตำรวจ' }
    ];

    const getRankWeight = (rankStr) => {
        if (!rankStr) return 99; // 'ไม่ระบุ' goes to bottom
        return POLICE_RANKS_ORDER[rankStr] || 98; // unknown ranks go just above 'ไม่ระบุ'
    };

    // Colors based on rank tier
    const getRankColor = (rankStr) => {
        switch (getRankWeight(rankStr)) {
            case 1: return 'rgba(220, 38, 38, 0.2)'; // Red
            case 2: return 'rgba(234, 88, 12, 0.2)'; // Orange-Red
            case 3: return 'rgba(217, 119, 6, 0.2)'; // Orange/Amber
            case 4: return 'rgba(202, 138, 4, 0.2)'; // Yellow
            case 5: return 'rgba(101, 163, 13, 0.2)'; // Lime
            case 6: return 'rgba(22, 163, 74, 0.2)'; // Green
            case 7: return 'rgba(13, 148, 136, 0.2)'; // Teal
            case 8: return 'rgba(8, 145, 178, 0.2)'; // Cyan
            case 9: return 'rgba(37, 99, 235, 0.2)'; // Blue
            case 10: return 'rgba(79, 70, 229, 0.2)'; // Indigo
            case 11: return 'rgba(147, 51, 234, 0.2)'; // Purple
            default: return 'transparent'; // Unassigned
        }
    };

    const filteredOfficers = officerStats.filter(officer => {
        // Filter out resigned/pending discharge? User didn't ask to hide them here, but we can filter by rank
        if (rankFilter !== 'all') {
            const officerRank = officer.rank || '';
            if (officerRank !== rankFilter) return false;
        }

        const query = searchTerm.toLowerCase();
        const nameMatch = (officer.name || '').toLowerCase().includes(query);
        const rankMatch = (officer.rank || '').toLowerCase().includes(query);
        return nameMatch || rankMatch;
    });

    // 1. แบ่งกลุ่มเจ้านาที่
    const activeOfficers = [];
    const unassignedOfficers = [];
    const resignedOfficers = [];

    filteredOfficers.forEach(officer => {
        const status = officer.status;
        if (status === 'resigned' || status === 'not-counted') {
            resignedOfficers.push(officer);
        } else if (!status || status === '') {
            unassignedOfficers.push(officer);
        } else {
            activeOfficers.push(officer);
        }
    });

    // 2. ฟังก์ชันเรียงลำดับ
    const sortOfficersFn = (a, b) => {
        const weightA = getRankWeight(a.rank);
        const weightB = getRankWeight(b.rank);

        if (weightA !== weightB) {
            return weightA - weightB;
        }

        // If ranks tied, sort by case total descending
        return b.total - a.total;
    };

    activeOfficers.sort(sortOfficersFn);
    unassignedOfficers.sort(sortOfficersFn);
    resignedOfficers.sort(sortOfficersFn);

    if (loading) {
        return (
            <div className="container">
                <div className="loading"><div className="spinner"></div><div className="loading-text">กำลังโหลดข้อมูลเจ้าหน้าที่...</div></div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Users size={32} color="var(--accent-blue)" />
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            รายชื่อเจ้าหน้าที่
                            {!loading && quickStats && (
                                <span className="badge badge-blue">{quickStats.officerCount} คน</span>
                            )}
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>ข้อมูลเจ้าหน้าที่ตำรวจทั้งหมดในหน่วย</p>
                    </div>
                </div>

                <div className="header-right" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <CustomDropdown
                        options={[{ value: 'all', label: 'ทั้งหมด (ยศ)' }, ...POLICE_RANKS]}
                        value={rankFilter}
                        onChange={setRankFilter}
                        style={{ width: '220px', minHeight: '44px' }}
                    />

                    <input
                        type="text"
                        placeholder="ค้นหาชื่อเจ้าหน้าที่..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '250px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div className="panel" style={{ marginTop: '1rem' }}>
                <div className="panel-body" style={{ padding: 0 }}>
                    <div className="table-container">
                        {/* Section 1: Active Officers */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ margin: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                รายชื่อเจ้าหน้าที่
                            </h3>
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px', textAlign: 'center' }}>ลำดับ</th>
                                        <th>ชื่อเจ้าหน้าที่</th>
                                        <th>ยศ / ตำแหน่ง</th>
                                        <th style={{ textAlign: 'center' }}>วันที่สมัคร</th>
                                        <th style={{ textAlign: 'center' }}>สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeOfficers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                                                ไม่พบข้อมูลเจ้าหน้าที่
                                            </td>
                                        </tr>
                                    ) : (
                                        activeOfficers.map((officer, index) => {
                                            const rankColor = getRankColor(officer.rank);
                                            const rankWeight = getRankWeight(officer.rank);

                                            return (
                                                <tr key={officer.name || index} style={{ background: rankColor }}>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                                        {index + 1}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div className="officer-avatar-sm" style={{
                                                                width: '32px', height: '32px', borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, var(--accent-blue), #3b82f6)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 'bold', fontSize: '0.9rem'
                                                            }}>
                                                                {officer.name ? officer.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                                                                {officer.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {officer.rank ? (
                                                            <span className="rank-badge" style={{ fontSize: '0.85rem' }}>{officer.rank}</span>
                                                        ) : (
                                                            <span className="rank-unassigned" style={{ fontSize: '0.85rem' }}>ไม่ระบุ</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        {officer.joinDate ? new Date(officer.joinDate).toLocaleDateString('th-TH') : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.85rem', background: 'rgba(34,197,94,0.2)', color: '#22c55e', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                                                            ปกติ
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Section 2: Unassigned Officers */}
                        {unassignedOfficers.length > 0 && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ margin: '1rem', color: '#94a3b8', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                    ยังไม่ได้ระบุข้อมูล
                                </h3>
                                <table className="users-table" style={{ opacity: 0.8 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '80px', textAlign: 'center' }}>ลำดับ</th>
                                            <th>ชื่อเจ้าหน้าที่</th>
                                            <th>ยศ / ตำแหน่ง</th>
                                            <th style={{ textAlign: 'center' }}>วันที่สมัคร</th>
                                            <th style={{ textAlign: 'center' }}>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unassignedOfficers.map((officer, index) => {
                                            const rankColor = getRankColor(officer.rank);

                                            return (
                                                <tr key={officer.name || index} style={{ background: rankColor }}>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>-</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div className="officer-avatar-sm" style={{
                                                                width: '32px', height: '32px', borderRadius: '50%',
                                                                background: '#475569',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 'bold', fontSize: '0.9rem'
                                                            }}>
                                                                {officer.name ? officer.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span className="fw-bold" style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                                                                {officer.name}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', background: 'rgba(100,116,139,0.2)', color: '#94a3b8', padding: '2px 6px', borderRadius: '10px' }}>ไม่มีข้อมูล</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {officer.rank ? (
                                                            <span className="rank-badge" style={{ fontSize: '0.85rem', opacity: 0.7 }}>{officer.rank}</span>
                                                        ) : (
                                                            <span className="rank-unassigned" style={{ fontSize: '0.85rem' }}>ไม่ระบุ</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', opacity: 0.7 }}>
                                                        {officer.joinDate ? new Date(officer.joinDate).toLocaleDateString('th-TH') : '-'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.85rem', background: 'rgba(100,116,139,0.2)', color: '#94a3b8', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                                                            ไม่มีข้อมูล
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Resigned Officers section removed as per request */}
                    </div>
                </div>
            </div>
        </div>
    );
}
