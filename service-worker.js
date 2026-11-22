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

// Keep a small list of unique unread announcement IDs. IndexedDB survives
// service-worker restarts, so the Home Screen badge count remains reliable.
const LMS_BADGE_DB = "dr-sandaruwan-lms-badge";
const LMS_BADGE_STORE = "state";
const LMS_BADGE_KEY = "unreadAnnouncementIds";

function openLmsBadgeDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LMS_BADGE_DB, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LMS_BADGE_STORE)) {
        database.createObjectStore(LMS_BADGE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open notification badge storage."));
  });
}

async function changeLmsAppBadge(action, announcementId = "") {
  let unreadIds = [];
  try {
    const database = await openLmsBadgeDb();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(LMS_BADGE_STORE, "readwrite");
      const store = transaction.objectStore(LMS_BADGE_STORE);
      if (action === "clear") {
        store.delete(LMS_BADGE_KEY);
      } else {
        const request = store.get(LMS_BADGE_KEY);
        request.onsuccess = () => {
          unreadIds = Array.isArray(request.result) ? request.result.map(String) : [];
          const id = String(announcementId || ("push-" + Date.now()));
          if (!unreadIds.includes(id)) unreadIds.push(id);
          unreadIds = unreadIds.slice(-99);
          store.put(unreadIds, LMS_BADGE_KEY);
        };
        request.onerror = () => reject(request.error || new Error("Could not read notification badge state."));
      }
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not update notification badge state."));
      transaction.onabort = () => reject(transaction.error || new Error("Notification badge update was cancelled."));
    });
    database.close();
  } catch (error) {
    console.warn("LMS app badge storage could not be updated.", error);
  }

  const count = action === "clear" ? 0 : unreadIds.length;
  try {
    if (count > 0 && typeof self.navigator.setAppBadge === "function") {
      await self.navigator.setAppBadge(count);
    } else if (typeof self.navigator.clearAppBadge === "function") {
      await self.navigator.clearAppBadge();
    } else if (count > 0 && typeof self.navigator.setAppBadge === "function") {
      await self.navigator.setAppBadge();
    }
  } catch (error) {
    console.info("This device did not allow the LMS Home Screen badge to update.", error);
  }
  return count;
}

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Dr. Sandaruwan LMS";
  const body = payload?.notification?.body || "You have a new LMS announcement.";
  const target = payload?.data?.url || payload?.fcmOptions?.link || "./announcements.html";
  const announcementId = payload?.data?.announcementId || ("push-" + Date.now());

  return Promise.all([
    changeLmsAppBadge("add", announcementId),
    self.registration.showNotification(title, {
      body,
      icon: "./icons/dr-sandaruwan-lms-192.png",
      badge: "./icons/dr-sandaruwan-lms-192.png",
      tag: "dr-sandaruwan-lms-" + String(announcementId),
      renotify: false,
      data: { url: target }
    })
  ]);
});

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  if (type === "LMS_ADD_APP_BADGE") {
    event.waitUntil(changeLmsAppBadge("add", event.data?.announcementId || ""));
  } else if (type === "LMS_CLEAR_APP_BADGE") {
    event.waitUntil(changeLmsAppBadge("clear"));
  }
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
    await changeLmsAppBadge("clear");
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
