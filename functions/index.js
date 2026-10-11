const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { createHash } = require("node:crypto");

initializeApp();

const db = getFirestore();
const REGION = "asia-south1";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

// Transitional endpoint: keeps the existing Student ID + password interface.
// It must be deployed and tested before any Firestore rules are tightened.
exports.studentIdLogin = onCall(
  {
    region: REGION,
    enforceAppCheck: true,
    maxInstances: 10,
  },
  async (request) => {
    const studentId = String(request.data?.studentId || "")
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
    const password = String(request.data?.password || "");

    if (!/^[A-Z0-9_-]{3,32}$/.test(studentId) || password.length < 1 || password.length > 256) {
      throw new HttpsError("unauthenticated", "Invalid Student ID or password.");
    }

    const ip = String(request.rawRequest?.ip || "unknown");
    const rateKey = createHash("sha256")
      .update(studentId + "|" + ip)
      .digest("hex");
    const rateRef = db.collection("_loginRateLimits").doc(rateKey);
    const now = Date.now();

    // Atomic rate limit per Student ID + source IP.
    const rate = await db.runTransaction(async (tx) => {
      const snap = await tx.get(rateRef);
      const data = snap.exists ? snap.data() : {};
      const start = Number(data.windowStartedAt || 0);
      const attempts = start && now - start < WINDOW_MS ? Number(data.attempts || 0) : 0;
      if (attempts >= MAX_ATTEMPTS) return { blocked: true };

      tx.set(rateRef, {
        windowStartedAt: attempts === 0 ? now : start,
        attempts: attempts + 1,
        expiresAt: new Date(now + WINDOW_MS),
      });
      return { blocked: false };
    });

    if (rate.blocked) {
      throw new HttpsError("resource-exhausted", "Too many attempts. Please try again later.");
    }

    const studentRef = db.collection("students").doc(studentId);
    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) {
      throw new HttpsError("unauthenticated", "Invalid Student ID or password.");
    }

    const student = studentSnap.data() || {};
    const storedPassword = String(student.password ?? "");

    // Legacy compatibility only. Replace plaintext password storage with a proper
    // password-hash migration after the login endpoint is verified end-to-end.
    if (!storedPassword || storedPassword !== password) {
      throw new HttpsError("unauthenticated", "Invalid Student ID or password.");
    }

    // Student document IDs are normalized IDs, so they become stable auth UIDs.
    const uid = studentId;
    try {
      await getAuth().getUser(uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      await getAuth().createUser({ uid, disabled: false });
    }

    const customToken = await getAuth().createCustomToken(uid, {
      role: "student",
      studentId: uid,
    });

    return {
      customToken,
      studentId: uid,
      studentType: String(student.studentType || student.grade || ""),
    };
  }
);
