import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Settings, LogOut, LogIn, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const { user, isAdmin, logOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        setOpen(false);
        try {
            await logOut();
            navigate('/');
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <nav className="main-nav">
            <div className="nav-inner">
                <NavLink to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/images/kittycat_white_png.png" alt="Kitty Cat Logo" style={{ height: '32px', width: 'auto' }} />
                    <span style={{ fontWeight: 'bold' }}>KITTY CAT PD</span>
                </NavLink>
                <button className="nav-hamburger" onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
                <div className={`nav-links${open ? ' open' : ''}`}>
                    <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Home size={18} /> หน้าหลัก
                    </NavLink>
                    {user ? (
                        <>
                            {isAdmin && (
                                <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Settings size={18} /> จัดการ
                                </NavLink>
                            )}
                            <button className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleLogout}>
                                <LogOut size={18} /> ออกจากระบบ
                            </button>
                        </>
                    ) : (
                        <NavLink to="/auth" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LogIn size={18} /> เข้าสู่ระบบ
                        </NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}
