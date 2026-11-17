import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCSGiXler9FGAF7YegktDo_2bRI7HnYe28",
    authDomain: "proyecto-m4-e22f9.firebaseapp.com",
    projectId: "proyecto-m4-e22f9",
    storageBucket: "proyecto-m4-e22f9.firebasestorage.app",
    messagingSenderId: "234672983800",
    appId: "1:234672983800:web:1da53b97f4383adeb9350d",
    measurementId: "G-E5JZRKCT81"
};

// Initialize Firebases
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };