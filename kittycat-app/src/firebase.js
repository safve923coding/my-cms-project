import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCNSU9pW1bRZSqDSHh9eXrfLtM2O9chKRI",
    authDomain: "vorrexlaw.firebaseapp.com",
    projectId: "vorrexlaw",
    storageBucket: "vorrexlaw.firebasestorage.app",
    messagingSenderId: "1041003538723",
    appId: "1:1041003538723:web:c34ad635bc8b1420bf4496"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
