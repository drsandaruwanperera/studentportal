/*
 * Dr. Sandaruwan LMS service worker.
 * Does not cache pages, Firestore responses or student account data.
 * Handles background Firebase Cloud Messaging notifications only.
 */
importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAKbrx_tt4SXi1obmDIvqUVi2VmcXCs0_8",
  authDomain: "answersheet2026.firebaseapp.com",
  projectId: "answersheet2026",
  storageBucket: "answersheet2026.firebasestorage.app",
  messagingSenderId: "953495846284",
  appId: "1:953495846284:web:0f1f9def812a5cbef16aa9"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Dr. Sandaruwan LMS";
  const body = payload?.notification?.body || "You have a new LMS announcement.";
  const target = payload?.data?.url || payload?.fcmOptions?.link || "./announcements.html";
  return self.registration.showNotification(title, {
    body,
    icon: "./icons/dr-sandaruwan-lms-192.png",
    badge: "./icons/dr-sandaruwan-lms-192.png",
    tag: "dr-sandaruwan-lms-announcement",
    renotify: false,
    data: { url: target }
  });
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "./announcements.html";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
