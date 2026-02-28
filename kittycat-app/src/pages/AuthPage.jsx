import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

export default function AuthPage() {
    const [tab, setTab] = useState('login');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingAuth, setLoadingAuth] = useState(false);
    const { user, loading, isAdmin } = useAuth();
    const navigate = useNavigate();
    const particlesRef = useRef(null);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            if (isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    }, [user, loading, isAdmin, navigate]);

    // Floating particles
    useEffect(() => {
        const container = particlesRef.current;
        if (!container) return;
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (8 + Math.random() * 12) + 's';
            p.style.animationDelay = Math.random() * 8 + 's';
            p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
            p.style.background = `rgba(${99 + Math.random() * 140}, ${102 + Math.random() * 100}, 241, ${0.15 + Math.random() * 0.25})`;
            container.appendChild(p);
        }
        return () => { container.innerHTML = ''; };
    }, []);

    const hideMessages = () => { setError(''); setSuccess(''); };
    const switchTab = (t) => { setTab(t); hideMessages(); };

    const loginWithEmail = async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
        setLoadingAuth(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
            setLoadingAuth(false);
            const errMap = {
                'auth/user-not-found': 'ไม่พบบัญชีนี้',
                'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
                'auth/invalid-email': 'อีเมลไม่ถูกต้อง',
                'auth/too-many-requests': 'ล็อกอินบ่อยเกินไป กรุณารอสักครู่',
                'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
            };
            setError(errMap[e.code] || e.message);
        }
    };

    const registerWithEmail = async () => {
        const displayName = document.getElementById('regDisplayName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regPasswordConfirm').value;
        if (!displayName) { setError('กรุณากรอกชื่อผู้ใช้'); return; }
        if (!email) { setError('กรุณากรอกอีเมล'); return; }
        if (password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
        if (password !== confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }
        setLoadingAuth(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName });

            // Determine role based on specific superadmin email
            const newRole = email.toLowerCase() === 'chatpisit.safe.sh@gmail.com' ? 'superadmin' : 'user';

            // Save user to Firestore for admin management
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: newRole,
                createdAt: new Date().toISOString()
            });

        } catch (e) {
            setLoadingAuth(false);
            const errMap = {
                'auth/email-already-in-use': 'อีเมลนี้ถูกใช้แล้ว',
                'auth/invalid-email': 'อีเมลไม่ถูกต้อง',
                'auth/weak-password': 'รหัสผ่านง่ายเกินไป',
            };
            setError(errMap[e.code] || e.message);
        }
    };

    const loginWithGoogle = async () => {
        setLoadingAuth(true);
        try {
            const cred = await signInWithPopup(auth, googleProvider);

            // Just in case it's a new user, update or set their db record
            await setDoc(doc(db, "users", cred.user.uid), {
                uid: cred.user.uid,
                email: cred.user.email,
                displayName: cred.user.displayName,
                lastLogin: new Date().toISOString()
            }, { merge: true });

        } catch (e) {
            setLoadingAuth(false);
            if (e.code !== 'auth/popup-closed-by-user') {
                setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ: ' + e.message);
            }
        }
    };

    if (loading) {
        return <div className="page-center"><div className="spinner"></div></div>;
    }

    return (
        <>
            <div className="particles" ref={particlesRef}></div>
            {loadingAuth && (
                <div className="loading-overlay show">
                    <div className="spinner"></div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>กำลังเข้าสู่ระบบ...</div>
                </div>
            )}
            <div className="page-center">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-logo">
                            <img src="/images/kittycat_white_png.png" alt="Kitty Cat" style={{ height: '64px', marginBottom: '16px' }} />
                            <h1>KITTY CAT PD</h1>
                            <p>Case Management System</p>
                        </div>

                        {/* Tabs */}
                        <div className="auth-tabs">
                            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>เข้าสู่ระบบ</button>
                            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>สมัครสมาชิก</button>
                        </div>

                        {error && <div className="error-msg show">{error}</div>}
                        {success && <div className="success-msg show">{success}</div>}

                        {/* Login Form */}
                        {tab === 'login' && (
                            <div className="auth-form active">
                                <div className="form-group">
                                    <label>อีเมล</label>
                                    <input type="email" id="loginEmail" placeholder="example@gmail.com" autoComplete="email" />
                                </div>
                                <div className="form-group">
                                    <label>รหัสผ่าน</label>
                                    <input type="password" id="loginPassword" placeholder="••••••••" autoComplete="current-password"
                                        onKeyDown={e => { if (e.key === 'Enter') loginWithEmail(); }} />
                                </div>
                                <button className="btn btn-primary" onClick={loginWithEmail}>เข้าสู่ระบบ</button>
                                <div className="divider">หรือ</div>
                                <button className="btn btn-google" onClick={loginWithGoogle}>
                                    <GoogleIcon />
                                    เข้าสู่ระบบด้วย Google
                                </button>
                            </div>
                        )}

                        {/* Register Form */}
                        {tab === 'register' && (
                            <div className="auth-form active">
                                <div className="form-group">
                                    <label>ชื่อผู้ใช้</label>
                                    <input type="text" id="regDisplayName" placeholder="ชื่อที่ต้องการแสดง" autoComplete="name" />
                                </div>
                                <div className="form-group">
                                    <label>อีเมล</label>
                                    <input type="email" id="regEmail" placeholder="example@gmail.com" autoComplete="email" />
                                </div>
                                <div className="form-group">
                                    <label>รหัสผ่าน</label>
                                    <input type="password" id="regPassword" placeholder="อย่างน้อย 6 ตัวอักษร" autoComplete="new-password" />
                                </div>
                                <div className="form-group">
                                    <label>ยืนยันรหัสผ่าน</label>
                                    <input type="password" id="regPasswordConfirm" placeholder="กรอกรหัสผ่านอีกครั้ง" autoComplete="new-password"
                                        onKeyDown={e => { if (e.key === 'Enter') registerWithEmail(); }} />
                                </div>
                                <button className="btn btn-primary" onClick={registerWithEmail}>สมัครสมาชิก</button>
                                <div className="divider">หรือ</div>
                                <button className="btn btn-google" onClick={loginWithGoogle}>
                                    <GoogleIcon />
                                    สมัครด้วย Google
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}
