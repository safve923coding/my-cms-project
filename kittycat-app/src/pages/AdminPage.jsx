import { useAuth } from '../hooks/useAuth';
import { useCases } from '../hooks/useCases';
import { useDiscordScraper } from '../hooks/useDiscordScraper';
import UserManager from '../components/UserManager';
import ConfirmModal from '../components/ConfirmModal';
import { Database, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function AdminPage() {
    const { user, loading, isAdmin } = useAuth();
    const navigate = useNavigate();

    const {
        allCases,
        clearAll, importCases
    } = useCases();

    const { fetching, progress, fetchError, fetchNewCases } = useDiscordScraper();

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { }
    });

    const openModal = (title, message, type, onConfirm = () => { }) => {
        setModal({ isOpen: true, title, message, type, onConfirm });
    };

    const closeModal = () => setModal({ ...modal, isOpen: false });

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            navigate('/'); // Redirect if not logged in or not an admin
        }
    }, [user, loading, isAdmin, navigate]);

    const handleUpdateData = () => {
        openModal(
            'ยืนยันการอัปเดต',
            'คุณต้องการดึงข้อมูลล่าสุดจาก Discord ใช่หรือไม่?',
            'info',
            async () => {
                const newCases = await fetchNewCases(allCases);
                if (newCases && newCases.length > 0) {
                    importCases(newCases);
                }
            }
        );
    };

    const handleClearAll = () => {
        openModal(
            'ล้างข้อมูลเตือนความจำ',
            'คุณแน่ใจหรือไม่ที่จะลบข้อมูลคดีทั้งหมดทิ้ง? (ไม่สามารถย้อนกลับได้)',
            'danger',
            () => {
                clearAll();
            }
        );
    }

    if (loading) {
        return (
            <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading"><div className="spinner"></div><div className="loading-text">กำลังตรวจสอบสิทธิ์...</div></div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <h2>ไม่มีสิทธิ์เข้าถึง</h2>
                    <p>กำลังพากลับไปยังหน้าหลัก...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <div className="header" style={{ marginBottom: '2rem' }}>
                <div className="header-left">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldAlert size={32} color="#ff6b6b" />
                        ระบบจัดการสำหรับแอดมิน
                    </h1>
                    <p>จัดการฐานข้อมูลคดีและบัญชีผู้ใช้งาน</p>
                </div>
            </div>

            <div className="panel" style={{ marginBottom: '2rem' }}>
                <div className="panel-header">
                    <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database size={20} /> จัดการฐานข้อมูล (Database)
                    </span>
                </div>
                <div className="panel-body">
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleUpdateData}
                            disabled={fetching}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCw size={18} className={fetching ? 'spin' : ''} />
                            {fetching ? 'กำลังอัพเดท...' : 'ดึงข้อมูลล่าสุดจาก Discord'}
                        </button>

                        <button
                            className="btn btn-danger"
                            onClick={handleClearAll}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Trash2 size={18} /> ล้างข้อมูลคดีทั้งหมด
                        </button>
                    </div>

                    {(progress || fetchError) && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: fetchError ? '4px solid #ff6b6b' : '4px solid #69b3a2' }}>
                            <span style={{ color: fetchError ? '#ff6b6b' : '#69b3a2' }}>{fetchError || progress}</span>
                        </div>
                    )}
                </div>
            </div>

            <UserManager />

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
