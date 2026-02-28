import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                try {
                    const docSnap = await getDoc(doc(db, "users", u.uid));
                    let role = 'user';

                    if (u.email && u.email.toLowerCase() === 'chatpisit.safe.sh@gmail.com') {
                        role = 'superadmin';
                    } else if (docSnap.exists()) {
                        role = docSnap.data().role || 'user';
                    }

                    setUser({ ...u, role });
                    setIsAdmin(role === 'admin' || role === 'superadmin');
                    setIsSuperAdmin(role === 'superadmin');
                } catch (e) {
                    console.error("Error fetching role from DB:", e);
                    // Fallback to checking email
                    const isSuper = u.email && u.email.toLowerCase() === 'chatpisit.safe.sh@gmail.com';
                    const fallbackRole = isSuper ? 'superadmin' : 'user';
                    setUser({ ...u, role: fallbackRole });
                    setIsAdmin(isSuper);
                    setIsSuperAdmin(isSuper);
                }
            } else {
                setUser(null);
                setIsAdmin(false);
                setIsSuperAdmin(false);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const logOut = () => {
        return signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, logOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
