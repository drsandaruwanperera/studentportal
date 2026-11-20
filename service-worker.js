/*
 * Dr. Sandaruwan LMS service worker.
 *
 * This first PWA release intentionally does not cache pages, Firestore
 * responses, student records, or other account data. The LMS requires
 * an internet connection; avoiding private-data caching protects students
 * who may share devices.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
