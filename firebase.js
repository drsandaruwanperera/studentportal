// =====================================================
// FIREBASE APP
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    limit,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_REAL_FIREBASE_API_KEY",
    authDomain: "answersheet2026.firebaseapp.com",
    projectId: "answersheet2026",
    storageBucket: "answersheet2026.firebasestorage.app",
    messagingSenderId: "953495846284",
    appId: "1:953495846284:web:0f1f9def812a5cbef16aa9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    limit,
    writeBatch,
    auth,
    reauthenticateWithCredential,
    EmailAuthProvider
};

if (
    window.location.pathname.endsWith("/dashboard.html") ||
    window.location.pathname.endsWith("dashboard.html")
) {
    import("./dashboard-enhancements.js?v=1").catch((error) => {
        console.error("Dashboard enhancement module failed to load:", error);
    });

    import("./dashboard-paper-count-fix.js?v=1").catch((error) => {
        console.error("Dashboard paper count fix failed to load:", error);
    });

    import("./grade11-results-dashboard.js?v=1").catch((error) => {
        console.error("Grade 11 results module failed to load:", error);
    });

    import("./grade11-notification.js?v=2").catch((error) => {
        console.error("Grade 11 notification module failed to load:", error);
    });

    import("./al-answer-release-notification.js?v=2").catch((error) => {
        console.error("A/L answer release notification failed to load:", error);
    });
}
