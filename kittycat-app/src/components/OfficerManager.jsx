import { useState, useRef } from 'react';
import { useCases } from '../hooks/useCases';
import ConfirmModal from './ConfirmModal';
import CustomDropdown from './CustomDropdown';
import CustomDatePicker from './CustomDatePicker';
import WeeklyAnnounceModal from './WeeklyAnnounceModal';
import { Users, Save, ShieldAlert, Link as LinkIcon, Plus, X, Download, Camera, Trophy } from 'lucide-react';
import html2canvas from 'html2canvas';
import './OfficerManager.css';

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

const OFFICER_STATUSES = [
    { value: 'active', label: 'ยังอยู่', color: '#4ade80' },
    { value: 'leave', label: 'ลาพักร้อน', color: '#fbbf24' },
    { value: 'pending_discharge', label: 'รอปลด', color: '#f87171' },
    { value: 'resigned', label: 'ลาออก', color: '#94a3b8' },
    { value: 'not-counted', label: 'ไม่นับเข้า', color: '#64748b' },
    { value: '', label: 'ไม่ระบุ', color: '#64748b' }
];

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

const getRankWeight = (rankStr) => {
    if (!rankStr) return 99; // 'ไม่ระบุ'
    return POLICE_RANKS_ORDER[rankStr] || 98;
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

export default function OfficerManager() {
    const { officerStats, saveOfficerData } = useCases();
    const [searchTerm, setSearchTerm] = useState('');
    const [rankFilter, setRankFilter] = useState('all');
    const [saving, setSaving] = useState(false);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { }
    });

    const [aliasModal, setAliasModal] = useState({
        isOpen: false,
        officerName: null,
        aliases: [],
        newAlias: ''
    });

    const [pendingChange, setPendingChange] = useState(null);
    const [promotedOfficers, setPromotedOfficers] = useState([]);
    const [exportingImage, setExportingImage] = useState(false);
    const [announceModalOpen, setAnnounceModalOpen] = useState(false);
    const exportRef = useRef(null);

    const openModal = (title, message, type, onConfirm = () => { }) => {
        setModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeModal = () => setModal({ ...modal, isOpen: false });

    const openAliasModal = (officer) => {
        setAliasModal({
            isOpen: true,
            officerName: officer.name,
            aliases: officer.aliases || [],
            newAlias: ''
        });
    };

    const closeAliasModal = () => {
        setAliasModal({ ...aliasModal, isOpen: false });
    };

    const handleAddAlias = () => {
        if (!aliasModal.newAlias.trim()) return;
        if (aliasModal.aliases.includes(aliasModal.newAlias.trim())) return;

        setAliasModal(prev => ({
            ...prev,
            aliases: [...prev.aliases, prev.newAlias.trim()],
            newAlias: ''
        }));
    };

    const handleRemoveAlias = (aliasToRemove) => {
        setAliasModal(prev => ({
            ...prev,
            aliases: prev.aliases.filter(a => a !== aliasToRemove)
        }));
    };

    const handleSaveAliases = async () => {
        setSaving(true);
        try {
            await saveOfficerData(aliasModal.officerName, { aliases: aliasModal.aliases });
            closeAliasModal();
        } catch (error) {
            openModal('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกชื่อเดิมได้: ' + error.message, 'danger');
        } finally {
            setSaving(false);
        }
    };

    const requestRankChange = (officerName, oldRank, newRank) => {
        if (oldRank === newRank) return;
        setPendingChange({
            type: 'rank',
            officerName,
            oldRank,
            newRank,
            message: `คุณแน่ใจหรือไม่ที่จะเปลี่ยนยศของ ${officerName} จาก ${oldRank || 'ไม่ระบุ'} เป็น ${newRank || 'ไม่ระบุ'}?`
        });
        openModal('ยืนยันการเปลี่ยนยศ', `คุณแน่ใจหรือไม่ที่จะเปลี่ยนยศของ ${officerName} จาก ${oldRank || 'ไม่ระบุ'} เป็น ${newRank || 'ไม่ระบุ'}?`, 'warning');
    };

    const requestStatusChange = (officerName, oldStatus, newStatus) => {
        if (oldStatus === newStatus) return;
        const oldLabel = OFFICER_STATUSES.find(s => s.value === oldStatus)?.label || 'ไม่ระบุ';
        const newLabel = OFFICER_STATUSES.find(s => s.value === newStatus)?.label || 'ไม่ระบุ';

        setPendingChange({
            type: 'status',
            officerName,
            oldStatus,
            newStatus,
            message: `คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะของ ${officerName} จาก ${oldLabel} เป็น ${newLabel}?`
        });
        openModal('ยืนยันการเปลี่ยนสถานะ', `คุณแน่ใจหรือไม่ที่จะเปลี่ยนสถานะของ ${officerName} จาก ${oldLabel} เป็น ${newLabel}?`, 'warning');
    };

    const confirmPendingChange = async () => {
        if (!pendingChange) return;
        const { type, officerName, newRank, newStatus, message } = pendingChange;

        try {
            if (type === 'rank') {
                await saveOfficerData(officerName, { rank: newRank });
                // Add to promoted list for export
                setPromotedOfficers(prev => {
                    const existing = prev.filter(p => p.name !== officerName);
                    return [...existing, { name: officerName, oldRank: pendingChange.oldRank, newRank, date: new Date().toLocaleDateString('th-TH') }];
                });
            } else if (type === 'status') {
                await saveOfficerData(officerName, { status: newStatus });
            }
        } catch (error) {
            console.error(`Error updating ${type}: `, error);
            // Replace the confirmation modal with error modal manually
            setModal({
                isOpen: true,
                title: 'เกิดข้อผิดพลาด',
                message: `เกิดข้อผิดพลาดในการอัปเดต: ${error.message}`,
                type: 'danger',
                onConfirm: () => { }
            });
        } finally {
            setPendingChange(null);
        }
    };

    const handleExportPromotions = async () => {
        if (promotedOfficers.length === 0 || !exportRef.current) return;
        setExportingImage(true);
        try {
            // Temporarily unhide to capture
            exportRef.current.style.display = 'block';
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: '#0f172a', // dark theme background
                scale: 2
            });
            exportRef.current.style.display = 'none';

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `ประกาศเลื่อนยศ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.png`;
            link.click();
        } catch (error) {
            console.error("Export Failed", error);
            setModal({ isOpen: true, title: 'Export Failed', message: 'ไม่สามารถบันทึกรูปภาพได้: ' + error.message, type: 'danger', onConfirm: () => { } });
        } finally {
            setExportingImage(false);
        }
    };

    const handleJoinDateChange = async (officerName, newDate) => {
        try {
            await saveOfficerData(officerName, { joinDate: newDate });
        } catch (error) {
            console.error("Error updating join date: ", error);
            openModal('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัปเดตวันที่สมัคร: ' + error.message, 'danger');
        }
    };

    const filteredOfficers = officerStats.filter(officer => {
        if (!officer.name) return false;

        // Filter by rank
        if (rankFilter !== 'all') {
            const officerRank = officer.rank || '';
            if (officerRank !== rankFilter) return false;
        }

        const query = searchTerm.toLowerCase();
        return officer.name.toLowerCase().includes(query);
    });

    // 1. แบ่งกลุ่มเจ้านาที่
    const activeOfficers = [];
    const unassignedOfficers = [];
    const resignedOfficers = [];
    const notCountedOfficers = [];

    filteredOfficers.forEach(officer => {
        const status = officer.status;
        if (status === 'resigned') {
            resignedOfficers.push(officer);
        } else if (status === 'not-counted') {
            notCountedOfficers.push(officer);
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
        return b.total - a.total;
    };

    activeOfficers.sort(sortOfficersFn);
    unassignedOfficers.sort(sortOfficersFn);
    resignedOfficers.sort(sortOfficersFn);
    notCountedOfficers.sort(sortOfficersFn);

    const renderOfficerRow = (officer, index, indexPrefix = '') => {
        const statusValue = officer.status === undefined ? '' : officer.status;
        const statusObj = OFFICER_STATUSES.find(s => s.value === statusValue) || OFFICER_STATUSES[4];
        const rankColor = getRankColor(officer.rank);

        const isResigned = statusValue === 'resigned';

        return (
            <tr key={officer.name} style={{ background: rankColor }}>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {indexPrefix || index + 1}
                </td>
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="fw-bold" style={{ color: isResigned ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: isResigned ? 'line-through' : 'none' }}>
                            {officer.name}
                        </span>
                        {isResigned && <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '10px' }}>ลาออก</span>}
                        {!isResigned && officer.status === '' && <span style={{ fontSize: '0.75rem', background: 'rgba(100,116,139,0.2)', color: '#94a3b8', padding: '2px 6px', borderRadius: '10px' }}>ไม่มีข้อมูล</span>}

                        <button
                            className="btn-icon"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: (officer.aliases && officer.aliases.length > 0) ? '#3b82f6' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                transition: 'background 0.2s'
                            }}
                            title="จัดการชื่อเดิม/เชื่อมโยงคดี"
                            onClick={() => openAliasModal(officer)}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <LinkIcon size={14} />
                        </button>
                    </div>
                </td>
                {/* Cases count removed as requested */}
                <td>
                    <CustomDatePicker
                        value={officer.joinDate || ''}
                        onChange={(val) => handleJoinDateChange(officer.name, val)}
                    />
                </td>
                <td>
                    <CustomDropdown
                        options={POLICE_RANKS}
                        value={officer.rank || ''}
                        onChange={(val) => requestRankChange(officer.name, officer.rank || '', val)}
                        style={{
                            width: '180px'
                        }}
                    />
                </td>
                <td>
                    <CustomDropdown
                        options={OFFICER_STATUSES}
                        value={statusValue}
                        onChange={(val) => requestStatusChange(officer.name, statusValue, val)}
                        style={{
                            width: '150px',
                            color: statusObj?.color || 'white'
                        }}
                        renderValue={(opt) => <span style={{ color: opt?.color || 'white', fontWeight: 'bold' }}>{opt?.label || 'ไม่ระบุ'}</span>}
                        renderOption={(opt) => <span style={{ color: opt?.color || 'white', fontWeight: 'bold' }}>{opt?.label || 'ไม่ระบุ'}</span>}
                        listAlign="right"
                    />
                </td>
            </tr>
        );
    }

    return (
        <div className="officer-manager">
            <div className="om-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <ShieldAlert size={24} /> จัดการข้อมูลและสถานะเจ้าหน้าที่
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn"
                        onClick={() => setAnnounceModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gradient-1)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(236,72,153,0.3)', fontWeight: 'bold' }}
                    >
                        <Trophy size={18} />
                        ประกาศผลงานประจำสัปดาห์
                    </button>
                    <CustomDropdown
                        options={[{ value: 'all', label: 'ทั้งหมด (ยศ)' }, ...POLICE_RANKS]}
                        value={rankFilter}
                        onChange={setRankFilter}
                        style={{ width: '200px' }}
                    />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อเจ้าหน้าที่..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            outline: 'none',
                            width: '250px'
                        }}
                    />
                    {promotedOfficers.length > 0 && (
                        <button
                            className="btn btn-primary"
                            onClick={handleExportPromotions}
                            disabled={exportingImage}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-green)', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}
                        >
                            <Camera size={18} />
                            {exportingImage ? 'กำลังบันทึก...' : `ส่งออกประกาศยศ (${promotedOfficers.length})`}
                        </button>
                    )}
                </div>
            </div>

            {/* Section 1: Active Officers */}
            <div className="table-container" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    รายชื่อเจ้าหน้าที่
                </h3>
                <table className="officers-manage-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
                            <th>ชื่อเจ้าหน้าที่</th>
                            <th>วันที่สมัคร</th>
                            <th>ยศ/ตำแหน่ง</th>
                            <th>สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeOfficers.length === 0 ? (
                            <tr><td colSpan="5" className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>ไม่มีข้อมูล</td></tr>
                        ) : (
                            activeOfficers.map((officer, index) => renderOfficerRow(officer, index, null))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Section 2: Unassigned Officers */}
            {unassignedOfficers.length > 0 && (
                <div className="table-container" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#94a3b8', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        ยังไม่ได้ระบุข้อมูล
                    </h3>
                    <table className="officers-manage-table" style={{ opacity: 0.8 }}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
                                <th>ชื่อเจ้าหน้าที่</th>
                                <th>วันที่สมัคร</th>
                                <th>ยศ/ตำแหน่ง</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unassignedOfficers.map((officer, index) => renderOfficerRow(officer, index, '-'))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Section 3: Not-Counted Officers */}
            {notCountedOfficers.length > 0 && (
                <div className="table-container" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#64748b', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        ไม่นับเข้า / ยกเว้นการนับ
                    </h3>
                    <table className="officers-manage-table" style={{ opacity: 0.7, filter: 'grayscale(0.4)' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
                                <th>ชื่อเจ้าหน้าที่</th>
                                <th>วันที่สมัคร</th>
                                <th>ยศ/ตำแหน่ง</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notCountedOfficers.map((officer, index) => renderOfficerRow(officer, index, '-'))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Section 4: Resigned Officers */}
            {resignedOfficers.length > 0 && (
                <div className="table-container">
                    <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        ลาออก / พ้นสภาพ
                    </h3>
                    <table className="officers-manage-table" style={{ opacity: 0.6, filter: 'grayscale(0.6)' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>ลำดับ</th>
                                <th>ชื่อเจ้าหน้าที่</th>
                                <th>วันที่สมัคร</th>
                                <th>ยศ/ตำแหน่ง</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resignedOfficers.map((officer, index) => renderOfficerRow(officer, index, '-'))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />

            {/* Alias Modal */}
            {aliasModal.isOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="modal-content" style={{
                        background: 'var(--bg-card)',
                        backdropFilter: 'blur(20px)',
                        padding: '24px',
                        borderRadius: '20px',
                        width: '400px',
                        maxWidth: '90%',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                <LinkIcon size={20} color="var(--accent-blue)" />
                                เชื่อมโยงชื่อเดิม
                            </h3>
                            <button onClick={closeAliasModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                            เพิ่มชื่อเดิมของ <strong style={{ color: 'var(--text-primary)' }}>{aliasModal.officerName}</strong> เพื่อรวมยอดคดีจากชื่อเก่าเข้าด้วยกัน
                        </p>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', position: 'relative' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="พิมพ์ชื่อเดิม..."
                                    value={aliasModal.newAlias}
                                    onChange={e => setAliasModal({ ...aliasModal, newAlias: e.target.value })}
                                    onKeyPress={e => e.key === 'Enter' && handleAddAlias()}
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                                        border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
                                        fontSize: '0.95rem'
                                    }}
                                />
                                {aliasModal.newAlias.trim().length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, width: '100%',
                                        background: 'rgba(15, 23, 42, 0.98)', border: '1px solid var(--border)',
                                        borderRadius: '8px', marginTop: '4px', zIndex: 10,
                                        boxShadow: '0 8px 25px rgba(0,0,0,0.6)', maxHeight: '150px', overflowY: 'auto'
                                    }}>
                                        {officerStats.filter(opt => opt.name !== aliasModal.officerName && !aliasModal.aliases.includes(opt.name) && opt.name.toLowerCase().includes(aliasModal.newAlias.toLowerCase())).slice(0, 5).map(opt => (
                                            <div
                                                key={opt.name}
                                                style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                                onClick={() => setAliasModal(prev => ({ ...prev, aliases: [...prev.aliases, opt.name], newAlias: '' }))}
                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                {opt.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleAddAlias}
                                className="btn btn-primary"
                                style={{
                                    padding: '10px 16px', borderRadius: '10px', border: 'none',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: 0,
                                    height: '42px'
                                }}
                            >
                                <Plus size={16} /> เพิ่ม
                            </button>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', maxHeight: '150px', overflowY: 'auto' }}>
                            {aliasModal.aliases.length === 0 ? (
                                <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '12px 0' }}>
                                    ยังไม่มีการเชื่อมโยงชื่อเดิม
                                </li>
                            ) : (
                                aliasModal.aliases.map((alias, idx) => (
                                    <li key={idx} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 14px', background: 'var(--bg-secondary)',
                                        border: '1px solid rgba(236,72,153,0.1)',
                                        borderRadius: '10px', marginBottom: '6px',
                                        color: 'var(--text-primary)'
                                    }}>
                                        <span>{alias}</span>
                                        <button
                                            onClick={() => handleRemoveAlias(alias)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '4px' }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <X size={16} />
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={closeAliasModal}
                                className="btn btn-secondary"
                                style={{
                                    padding: '8px 16px', borderRadius: '10px',
                                    cursor: 'pointer', margin: 0
                                }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveAliases}
                                disabled={saving}
                                className="btn btn-primary"
                                style={{
                                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: saving ? 0.7 : 1, margin: 0,
                                    background: 'var(--accent-green)'
                                }}
                            >
                                {saving ? 'กำลังบันทึก...' : <><Save size={16} /> บันทึก</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal overrides */}
            <ConfirmModal
                isOpen={modal.isOpen && pendingChange}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onClose={() => { closeModal(); setPendingChange(null); }}
                onConfirm={confirmPendingChange}
            />
            {/* Standard Alert Modal */}
            <ConfirmModal
                isOpen={modal.isOpen && !pendingChange}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
            />

            {/* Hidden HTML2Canvas Export Board */}
            <div ref={exportRef} style={{
                display: 'none',
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                width: '800px',
                background: 'linear-gradient(180deg, #180911 0%, #2e0917 100%)',
                padding: '40px',
                color: 'white',
                fontFamily: 'Prompt, sans-serif',
                borderRadius: '16px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <img src="/kittycat_white_png.png" alt="Logo" style={{ height: '90px', marginBottom: '16px' }} />
                    <h1 style={{ margin: 0, fontSize: '28px', color: '#f472b6' }}>ประกาศเลื่อนยศผู้มีรายชื่อต่อไปนี้</h1>
                    <p style={{ margin: '8px 0 0 0', color: '#fbcfe8', fontSize: '18px' }}>วันที่ {new Date().toLocaleDateString('th-TH')}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(244,114,182,0.2)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(244,114,182,0.3)' }}>
                                <th style={{ textAlign: 'left', padding: '12px', color: '#f472b6', width: '40%' }}>ชื่อเจ้าหน้าที่</th>
                                <th style={{ textAlign: 'right', padding: '12px', color: '#fb7185', width: '30%' }}>จากยศ</th>
                                <th style={{ textAlign: 'right', padding: '12px', color: '#4ade80', width: '30%' }}>เป็นยศ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotedOfficers.map((po, i) => (
                                <tr key={po.name} style={{ borderBottom: i !== promotedOfficers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <td style={{ padding: '16px 12px', fontSize: '18px' }}>{po.name}</td>
                                    <td style={{ padding: '16px 12px', fontSize: '16px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{po.oldRank || 'ไม่ระบุ'}</td>
                                    <td style={{ padding: '16px 12px', fontSize: '18px', textAlign: 'right', fontWeight: 'bold' }}>{po.newRank || 'ไม่ระบุ'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ textAlign: 'center', margin: '40px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                    สร้างโดยระบบ CMS Kitty Cat PD
                </div>
            </div>
        </div>
    );
}
