// =====================================================
// FIREBASE APP
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth, signInWithCustomToken, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

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
    apiKey: "AIzaSyAKbrx_tt4SXi1obmDIvqUVi2VmcXCs0_8",
    authDomain: "answersheet2026.firebaseapp.com",
    projectId: "answersheet2026",
    storageBucket: "answersheet2026.firebasestorage.app",
    messagingSenderId: "953495846284",
    appId: "1:953495846284:web:0f1f9def812a5cbef16aa9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, "asia-south1");

// Callable backend verifies Student ID + password server-side and returns
// a Firebase custom token. Students keep the existing login credentials.
const studentIdLoginCallable = httpsCallable(functions, "studentIdLogin");

async function loginWithStudentId(studentId, password) {
    const response = await studentIdLoginCallable({ studentId, password });
    const customToken = response?.data?.customToken;
    const authenticatedStudentId = response?.data?.studentId;

    if (!customToken || authenticatedStudentId !== String(studentId).trim().replace(/\\s+/g, "").toUpperCase()) {
        throw new Error("Invalid login response.");
    }

    await signInWithCustomToken(auth, customToken);
    return response.data;
}

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
    loginWithStudentId,
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

}
