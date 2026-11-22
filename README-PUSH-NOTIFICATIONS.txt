DR. SANDARUWAN LMS — ZERO-COST PUSH NOTIFICATION SETUP
=======================================================

Implemented components
----------------------
- Cloudflare Worker: dr-sandaruwan-lms-push
- Worker URL: https://dr-sandaruwan-lms-push.texascampus1.workers.dev
- Student opt-in UI: push-notifications.js (shown after student login)
- Background delivery: service-worker.js
- Student pages: dashboard.html and announcements.html
- Admin send control: admin-announcements.html ("Send Push" on published announcements)
- Subscriber records: Firestore collection pushSubscriptions

The feature is deployed in code, but cannot send notifications until the
Firebase keys below are configured. Do NOT commit a Firebase service-account
JSON file or private key to GitHub.

STEP 1 — Generate the Firebase Web Push public key
--------------------------------------------------
1. Open https://console.firebase.google.com/
2. Select the project: answersheet2026
3. Open Project settings (gear icon) > Cloud Messaging.
4. Find Web configuration > Web Push certificates.
5. Click Generate key pair (if there is no existing key pair).
6. Copy the PUBLIC key only. Do not share or expose a private key.

Add the public key to the root file push-config.js:
  vapidKey: "PASTE_PUBLIC_VAPID_KEY_HERE"

Save and commit the change to main. The public VAPID key is designed to be
used by the browser. Do not put the private VAPID key into the website.

STEP 2 — Create a Firebase service-account key (private)
--------------------------------------------------------
1. In the same Firebase project, open Project settings > Service accounts.
2. Generate a new private key and download the JSON file.
3. Keep this JSON file private. Never upload it to GitHub or paste it into chat.
4. In Google Cloud Console > IAM for project answersheet2026, find the service
   account email from that JSON file and grant:
   - Firebase Cloud Messaging API Admin (roles/firebasecloudmessaging.admin)
   - Cloud Datastore User (roles/datastore.user)
5. Ensure the Firebase Cloud Messaging API is enabled for the project.

STEP 3 — Store the service-account JSON as a Cloudflare Worker Secret
----------------------------------------------------------------------
1. Open https://dash.cloudflare.com/
2. Select the account with Workers subdomain "texascampus1".
3. Open Workers & Pages > dr-sandaruwan-lms-push > Settings.
4. Under Variables and Secrets, choose Add.
5. Type: Secret
6. Name: FIREBASE_SERVICE_ACCOUNT
7. Value: paste the complete downloaded service-account JSON contents.
8. Save and Deploy.

The Worker health check should then show configured: true:
  https://dr-sandaruwan-lms-push.texascampus1.workers.dev/health

STEP 4 — Student opt-in
-----------------------
After the static site deployment completes, students should:
1. Sign in to Dr. Sandaruwan LMS.
2. Open Dashboard or Announcements.
3. Press Enable Notifications.
4. Allow browser notifications.

On iPhone/iPad, install the LMS from Safari using Share > Add to Home Screen,
open the installed LMS app, then enable notifications. iOS web push requires
a supported iOS/iPadOS version (16.4 or later) and a Home Screen web app.

STEP 5 — Send an announcement notification
-------------------------------------------
1. Sign in as Super Admin.
2. Open Admin > Announcements.
3. Publish the announcement first.
4. Press Send Push next to the published announcement.
5. Re-enter the Super Admin password to authorize this send.
6. The dialog will show how many devices were sent to and how many failed.

Important
---------
- Only students who enabled notifications will receive push messages.
- Students who have not opted in will still see announcements inside the LMS.
- Browser permissions can be blocked by device/browser settings.
- FCM delivery and Cloudflare Worker Free usage are subject to each provider's
  current free-tier limits and policies. This is not an unlimited SLA.
- The Worker reads the existing Firestore admin record to re-check Super Admin
  credentials. The password is sent over HTTPS for this send request and is
  not stored by the Worker.
- Service-account private keys must remain in Cloudflare Secrets only.
