import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import ConfirmModal from './ConfirmModal';
import { Users, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import './UserManager.css';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth(); // To protect self-deletion

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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by creation date
            usersList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId, userEmail) => {
        if (userEmail && userEmail.toLowerCase() === 'chatpisit.safe.sh@gmail.com') {
            openModal('ไม่อนุญาต', 'ไม่สามารถลบบัญชีผู้ดูแลหลักได้ (Superadmin Protected)', 'info');
            return;
        }

        if (currentUser && currentUser.uid === userId) {
            openModal('ไม่อนุญาต', 'คุณไม่สามารถลบบัญชีของตัวเองได้', 'info');
            return;
        }

        openModal(
            'ยืนยันการลบผู้ใช้',
            `คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ ${userEmail} ออกจากระบบ? (ไม่สามารถย้อนกลับได้)`,
            'danger',
            async () => {
                try {
                    await deleteDoc(doc(db, "users", userId));
                    fetchUsers();
                } catch (error) {
                    console.error("Error deleting user: ", error);
                    openModal('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบผู้ใช้: ' + error.message, 'danger');
                }
            }
        );
    };

    const handleRoleChange = async (userId, userEmail, newRole) => {
        if (userEmail && userEmail.toLowerCase() === 'chatpisit.safe.sh@gmail.com') {
            fetchUsers();
            openModal('ไม่อนุญาต', 'ไม่สามารถเปลี่ยนยศผู้ดูแลหลักได้ (Superadmin Protected)', 'info');
            return;
        }

        if (currentUser && currentUser.uid === userId) {
            fetchUsers();
            openModal('ไม่อนุญาต', 'คุณไม่สามารถเปลี่ยนยศตัวเองได้', 'info');
            return;
        }

        const roleName = newRole === 'admin' ? 'แอดมิน' : 'ทั่วไป';

        openModal(
            'ยืนยันการเปลี่ยนยศ',
            `คุณต้องการเปลี่ยนยศของ ${userEmail} เป็น "${roleName}" ใช่หรือไม่?`,
            'default',
            async () => {
                try {
                    await updateDoc(doc(db, "users", userId), { role: newRole });
                    fetchUsers();
                } catch (error) {
                    console.error("Error updating role: ", error);
                    openModal('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเปลี่ยนยศ: ' + error.message, 'danger');
                    fetchUsers();
                }
            }
        );
    };


    if (loading) return <div className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลผู้ใช้...</div>;

    return (
        <div className="user-manager">
            <div className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Users size={24} /> จัดการบัญชีผู้ใช้งาน
                </h2>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={fetchUsers}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <RefreshCw size={16} /> รีเฟรช
                </button>
            </div>

            <div className="table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ชื่อผู้ใช้</th>
                            <th>อีเมล</th>
                            <th>วันที่สมัคร</th>
                            <th>ยศ (Role)</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan="5" className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                        ) : (
                            users.map(u => {
                                const isSuperAdmin = u.email && u.email.toLowerCase() === 'chatpisit.safe.sh@gmail.com';
                                const isSelf = currentUser && currentUser.uid === u.id;
                                const isProtected = isSuperAdmin || isSelf;

                                return (
                                    <tr key={u.id}>
                                        <td className="fw-bold">{u.displayName || 'Unknown'} {isSuperAdmin && <ShieldAlert size={14} color="#f59e0b" style={{ marginLeft: '4px' }} />}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : '-'}
                                        </td>
                                        <td>
                                            {isSuperAdmin ? (
                                                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>ผู้ดูแล (Superadmin)</span>
                                            ) : (
                                                <select
                                                    className="role-select"
                                                    value={u.role || 'user'}
                                                    onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                                                    disabled={isProtected}
                                                    style={{
                                                        opacity: isProtected ? 0.5 : 1
                                                    }}
                                                >
                                                    <option value="user">ทั่วไป (User)</option>
                                                    <option value="admin">แอดมิน (Admin)</option>
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteUser(u.id, u.email)}
                                                disabled={isProtected}
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: isProtected ? 0.3 : 1 }}
                                            >
                                                <Trash2 size={14} /> ลบ
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
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
