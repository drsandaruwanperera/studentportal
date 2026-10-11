// STAGING ONLY — never import this file from production pages.
// Replace the API key placeholder with the web API key from the staging Firebase console.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "REPLACE_WITH_STAGING_WEB_API_KEY",
  authDomain: "drsandaruwan-lms-staging.firebaseapp.com",
  projectId: "drsandaruwan-lms-staging",
  storageBucket: "drsandaruwan-lms-staging.firebasestorage.app",
  messagingSenderId: "514464683670",
  appId: "1:514464683670:web:b0ddf4f0b9f34edf5d94b7"
};

const app = initializeApp(firebaseConfig, "lms-staging-preview");
export const db = getFirestore(app);
