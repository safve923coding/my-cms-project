import { useState, useEffect } from 'react';
import { useCases } from '../hooks/useCases';
import { useDiscordScraper } from '../hooks/useDiscordScraper';
import { Shield, Trophy, RefreshCw, TrendingUp, TrendingDown, Minus, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './DashboardPage.css';

const TIME_FILTERS = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'today', label: 'วันนี้' },
    { key: 'week', label: 'สัปดาห์นี้' },
    { key: 'lastweek', label: 'สัปดาห์ที่แล้ว' },
    { key: 'month', label: 'เดือนนี้' },
    { key: 'lastmonth', label: 'เดือนที่แล้ว' },
];

const COOLDOWN_MS = 0; // No cooldown

export default function DashboardPage() {
    const {
        loading, error, allCases,
        filtered, officerStats,
        quickStats,
        timeFilter, changeTimeFilter,
        filterLabel, importCases
    } = useCases();

    const { fetching, fetchNewCases } = useDiscordScraper();

    const [lastUpdate, setLastUpdate] = useState(() => {
        return parseInt(localStorage.getItem('last_public_update') || '0', 10);
    });

    // For driving the UI cooldown text updates
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const timeSinceLastUpdate = now - lastUpdate;
    const canUpdate = timeSinceLastUpdate >= COOLDOWN_MS;
    const minutesLeft = canUpdate ? 0 : Math.ceil((COOLDOWN_MS - timeSinceLastUpdate) / 60000);

    const [searchTerm, setSearchTerm] = useState('');
    const [updateToast, setUpdateToast] = useState(null);

    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { }
    });

    const openModal = (title, message, type) => {
        setModal({ isOpen: true, title, message, type, onConfirm: () => { } });
    };

    const closeModal = () => setModal(m => ({ ...m, isOpen: false }));

    const handlePublicUpdate = async () => {
        if (!canUpdate) {
            setUpdateToast(`กรุณารออีก ${minutesLeft} นาทีก่อนอัพเดท`);
            setTimeout(() => setUpdateToast(null), 3000);
            return;
        }
        const newCases = await fetchNewCases(allCases);
        if (newCases && newCases.length > 0) {
            importCases(newCases);
            setUpdateToast(`อัพเดทข้อมูลสำเร็จ เพิ่มใหม่ ${newCases.length} คดี`);
            setTimeout(() => setUpdateToast(null), 3000);
        } else if (newCases && newCases.length === 0) {
            setUpdateToast('อัพเดทสำเร็จ ข้อมูลล่าสุดแล้ว');
            setTimeout(() => setUpdateToast(null), 3000);
        } else {
            setUpdateToast('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            setTimeout(() => setUpdateToast(null), 3000);
        }
        const currentTime = Date.now();
        setLastUpdate(currentTime);
        setNow(currentTime); // Force UI update
        localStorage.setItem('last_public_update', currentTime.toString());
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading"><div className="spinner"></div><div className="loading-text">กำลังโหลด...</div></div>
            </div>
        );
    }

    // Dynamic sorting based on active time filter
    let sortedStats = [...officerStats]
        .filter(stat => stat.status !== 'resigned' && stat.status !== 'not-counted')
        .sort((a, b) => {
            if (timeFilter === 'today') return b.today - a.today;
            if (timeFilter === 'yesterday') return b.yesterday - a.yesterday;
            if (timeFilter === 'week') return b.thisWeek - a.thisWeek;
            if (timeFilter === 'lastweek') return b.lastWeek - a.lastWeek;
            if (timeFilter === 'month') return b.thisMonth - a.thisMonth;
            if (timeFilter === 'lastmonth') return b.lastMonth - a.lastMonth;
            return b.total - a.total; // Default 'all'
        });

    if (searchTerm) {
        sortedStats = sortedStats.filter(stat => stat.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Helper for rendering trend indicators
    const TrendIndicator = ({ current, previous }) => {
        const diff = current - previous;
        if (diff > 0) {
            return (
                <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={12} style={{ marginRight: '2px' }} />{diff}
                </div>
            );
        } else if (diff < 0) {
            return (
                <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDown size={12} style={{ marginRight: '2px' }} />{Math.abs(diff)}
                </div>
            );
        }
        return (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={12} style={{ marginRight: '2px' }} />0
            </div>
        );
    };

    return (
        <div className="container">
            {/* Header */}
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/kittycat_white_png.png" alt="Kitty Cat Logo" style={{ height: '48px', width: 'auto' }} />
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            Case Dashboard
                        </h1>
                        <p>ข้อมูล {allCases.length.toLocaleString()} คดี | อัพเดท: {new Date().toLocaleString('th-TH')}</p>
                    </div>
                </div>

                <div className="header-right" style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handlePublicUpdate}
                        disabled={fetching || !canUpdate}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (!canUpdate && !fetching) ? 0.7 : 1 }}
                    >
                        <RefreshCw size={18} className={fetching ? 'spin' : ''} />
                        {fetching ? 'กำลังอัพเดท...' : (!canUpdate ? `อัพเดทอีกครั้งใน ${minutesLeft} นาที` : 'กดเพื่ออัพเดทข้อมูล')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-banner show">
                    <span style={{ flex: 1 }}>{error}</span>
                </div>
            )}

            {/* Floating Auto-Dismiss Toast */}
            {updateToast && (
                <div style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999,
                    background: updateToast.includes('ผิดพลาด') ? 'rgba(239, 68, 68, 0.95)' : 'rgba(10, 10, 12, 0.85)',
                    border: updateToast.includes('ผิดพลาด') ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(244, 114, 182, 0.4)',
                    color: updateToast.includes('ผิดพลาด') ? 'white' : '#fbcfe8', padding: '16px 32px', borderRadius: '16px',
                    boxShadow: updateToast.includes('ผิดพลาด') ? '0 8px 32px rgba(239, 68, 68, 0.3)' : '0 8px 32px rgba(244, 114, 182, 0.15)',
                    backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: '12px',
                    animation: 'fadeInUp 0.3s ease-out', fontSize: '1.05rem'
                }}>
                    {updateToast.includes('ผิดพลาด') ? <AlertTriangle size={24} color="white" /> : <CheckCircle size={24} color="#f472b6" />}
                    <span style={{ fontWeight: '600', letterSpacing: '0.3px' }}>{updateToast}</span>
                </div>
            )}

            {/* Time Filter & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="time-filter" style={{ marginBottom: 0 }}>
                    {TIME_FILTERS.map(f => (
                        <button key={f.key} className={`time-btn${timeFilter === f.key ? ' active' : ''}`}
                            onClick={() => changeTimeFilter(f.key)}>{f.label}</button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px' }} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="ค้นหาชื่อเจ้าหน้าที่..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '250px', padding: '8px 16px 8px 36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'white', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid stats-4">
                <div className="stat-card"><div className="stat-label">คดีทั้งหมด</div><div className="stat-value sv-blue">{filtered.length.toLocaleString()}</div><div className="stat-sub">{filterLabel}</div></div>
                <div className="stat-card"><div className="stat-label">คดีวันนี้</div><div className="stat-value sv-cyan">{quickStats.todayCount.toLocaleString()}</div><div className="stat-sub">จำนวนคดีในวันนี้</div></div>
                <div className="stat-card"><div className="stat-label">คดีสัปดาห์นี้</div><div className="stat-value sv-green">{quickStats.weekCount.toLocaleString()}</div><div className="stat-sub">จำนวนคดีในสัปดาห์นี้</div></div>
                <div className="stat-card"><div className="stat-label">เจ้าหน้าที่</div><div className="stat-value sv-pink">{quickStats.officerCount.toLocaleString()}</div><div className="stat-sub">จำนวนเจ้าหน้าที่ทั้งหมด</div></div>
            </div>

            {/* Main Grid */}
            <div className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
                {/* Officer Stats Table */}
                <div className="panel">
                    <div className="panel-header">
                        <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Trophy size={20} color="#fbbf24" />
                            อันดับและสถิติเจ้าหน้าที่ {timeFilter !== 'all' ? `(เรียงตาม${filterLabel})` : ''}
                        </span>
                        <span className="badge badge-blue">{sortedStats.length} คน</span>
                    </div>
                    <div className="panel-body" style={{ padding: 0 }}>
                        {sortedStats.length === 0 ? (
                            <div className="loading" style={{ padding: '2rem' }}><div className="loading-text">ไม่พบสถิติเจ้าหน้าที่</div></div>
                        ) : (
                            <div className="stats-table-container">
                                <table className="stats-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60px', textAlign: 'center' }}>อันดับ</th>
                                            <th>ชื่อเจ้าหน้าที่</th>
                                            {timeFilter === 'all' && <th style={{ textAlign: 'center' }}>วันนี้</th>}
                                            {timeFilter === 'all' && <th style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>เมื่อวาน</th>}
                                            {timeFilter === 'all' && <th style={{ textAlign: 'center' }}>สัปดาห์นี้</th>}
                                            {timeFilter === 'all' && <th style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>สัปดาห์ที่แล้ว</th>}
                                            {timeFilter === 'all' && <th style={{ textAlign: 'center' }}>เดือนนี้</th>}
                                            {timeFilter === 'all' && <th style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>เดือนที่แล้ว</th>}

                                            {timeFilter === 'today' && <th style={{ textAlign: 'center' }}>วันนี้</th>}
                                            {timeFilter === 'yesterday' && <th style={{ textAlign: 'center' }}>เมื่อวาน</th>}
                                            {timeFilter === 'week' && (
                                                <>
                                                    <th style={{ textAlign: 'center' }}>จ.</th>
                                                    <th style={{ textAlign: 'center' }}>อ.</th>
                                                    <th style={{ textAlign: 'center' }}>พ.</th>
                                                    <th style={{ textAlign: 'center' }}>พฤ.</th>
                                                    <th style={{ textAlign: 'center' }}>ศ.</th>
                                                    <th style={{ textAlign: 'center' }}>ส.</th>
                                                    <th style={{ textAlign: 'center' }}>อา.</th>
                                                    <th style={{ textAlign: 'center' }}>สัปดาห์นี้</th>
                                                </>
                                            )}
                                            {timeFilter === 'lastweek' && (
                                                <>
                                                    <th style={{ textAlign: 'center' }}>จ.</th>
                                                    <th style={{ textAlign: 'center' }}>อ.</th>
                                                    <th style={{ textAlign: 'center' }}>พ.</th>
                                                    <th style={{ textAlign: 'center' }}>พฤ.</th>
                                                    <th style={{ textAlign: 'center' }}>ศ.</th>
                                                    <th style={{ textAlign: 'center' }}>ส.</th>
                                                    <th style={{ textAlign: 'center' }}>อา.</th>
                                                    <th style={{ textAlign: 'center' }}>สัปดาห์ที่แล้ว</th>
                                                </>
                                            )}
                                            {timeFilter === 'month' && <th style={{ textAlign: 'center' }}>เดือนนี้</th>}
                                            {timeFilter === 'lastmonth' && <th style={{ textAlign: 'center' }}>เดือนที่แล้ว</th>}

                                            {timeFilter === 'all' && <th style={{ textAlign: 'center' }}>รวม</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedStats.map((stat, i) => (
                                            <tr key={stat.name} className={i < 3 ? 'top-rank-row' : ''}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div className={`officer-rank-sm ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default'}`}>{i + 1}</div>
                                                </td>
                                                <td className="fw-bold" style={{ color: 'var(--text-primary)' }}>{stat.name}</td>

                                                {/* ALL columns */}
                                                {timeFilter === 'all' && (
                                                    <>
                                                        <td style={{ textAlign: 'center', fontWeight: stat.today > 0 ? 'bold' : 'normal', color: stat.today > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.today}</div>
                                                            <TrendIndicator current={stat.today} previous={stat.yesterday} />
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.yesterday}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: stat.thisWeek > stat.lastWeek ? 'bold' : 'normal', color: stat.thisWeek > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.thisWeek}</div>
                                                            <TrendIndicator current={stat.thisWeek} previous={stat.lastWeek} />
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.lastWeek}</div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: stat.thisMonth > stat.lastMonth ? 'bold' : 'normal', color: stat.thisMonth > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.thisMonth}</div>
                                                            <TrendIndicator current={stat.thisMonth} previous={stat.lastMonth} />
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.lastMonth}</div>
                                                        </td>
                                                    </>
                                                )}

                                                {/* Single Focus columns */}
                                                {timeFilter === 'today' && (
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        <div style={{ fontSize: '1.25rem' }}>{stat.today}</div>
                                                        <TrendIndicator current={stat.today} previous={stat.yesterday} />
                                                    </td>
                                                )}
                                                {timeFilter === 'yesterday' && (
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        <div style={{ fontSize: '1.25rem' }}>{stat.yesterday}</div>
                                                    </td>
                                                )}
                                                {timeFilter === 'week' && (
                                                    <>
                                                        {stat.thisWeekDays.map((count, idx) => (
                                                            <td key={`tw-${idx}`} style={{ textAlign: 'center', color: count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                <div style={{ fontSize: '1.05rem', fontWeight: count > 0 ? '500' : 'normal' }}>{count}</div>
                                                            </td>
                                                        ))}
                                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.thisWeek}</div>
                                                            <TrendIndicator current={stat.thisWeek} previous={stat.lastWeek} />
                                                        </td>
                                                    </>
                                                )}
                                                {timeFilter === 'lastweek' && (
                                                    <>
                                                        {stat.lastWeekDays.map((count, idx) => (
                                                            <td key={`lw-${idx}`} style={{ textAlign: 'center', color: count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                <div style={{ fontSize: '1.05rem', fontWeight: count > 0 ? '500' : 'normal' }}>{count}</div>
                                                            </td>
                                                        ))}
                                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div style={{ fontSize: '1.25rem' }}>{stat.lastWeek}</div>
                                                        </td>
                                                    </>
                                                )}
                                                {timeFilter === 'month' && (
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        <div style={{ fontSize: '1.25rem' }}>{stat.thisMonth}</div>
                                                        <TrendIndicator current={stat.thisMonth} previous={stat.lastMonth} />
                                                    </td>
                                                )}
                                                {timeFilter === 'lastmonth' && (
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                                        <div style={{ fontSize: '1.25rem' }}>{stat.lastMonth}</div>
                                                    </td>
                                                )}

                                                {timeFilter === 'all' && (
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                                                        <div style={{ fontSize: '1.25rem' }}>{stat.total}</div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />
        </div>
    );
}
