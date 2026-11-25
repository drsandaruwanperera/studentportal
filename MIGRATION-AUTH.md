# Phase 2 — Critical auth migration (draft, NOT merged, NOT deployed)

**Repo:** `drsandaruwanperera/studentportal`
**Base reviewed:** `main` HEAD `fed2445` (22 Nov 2026)
**Branch intended:** `draft/phase2-auth-migration`
**Status:** Preparation only. No code on `main` was changed, nothing was deployed,
no live Firebase setting was changed, no password was reset, no live data was deleted.
Branch `draft/phase2-auth-migration` now exists (created 2026-11-25 after write access was granted; the 429 that blocked preparation has cleared). The three draft files are on that branch in one commit. See “Blockers” at the end for what is still outstanding.

No passwords, keys or secret values are written in this document.

---

## 1. What was verified from code in this preparation

### 1.1 Draft PR #5 — the starting point, not the finish

- PR #5: “[Draft] Migrate student login to Firebase custom-token backend”,
  https://github.com/drsandaruwanperera/studentportal/pull/5
- State: open, draft, not merged. Head branch `security-auth-migration`,
  head SHA `a079d122ea08fe9bc193859fdcf66d7efa6b659c`, base `main`
  (`6a6a9c6790179ec0484b1385937d2d87f60cd00f`), created 2026-10-11.
  5 commits, 5 files changed, +180 / −50.
- Files in PR #5: `SECURITY-MIGRATION.md` (new), `app.js` (login wired to a
  callable), `firebase.js` (adds `loginWithStudentId` via `httpsCallable`),
  `functions/index.js` (new), `functions/package.json` (new).
- What PR #5 already does:
  - Callable `studentIdLogin` in `functions/index.js`, region `asia-south1`,
    `enforceAppCheck: true`, `maxInstances: 10`.
  - Server-side rate limit: 8 attempts per 15 minutes per Student ID + source
    IP, keyed by a SHA-256 hash of `studentId|ip`, stored in
    `_loginRateLimits` (TTL cleanup required — see §4.6).
  - Validates the Student ID format, reads `students/{studentId}` server-side,
    creates a Firebase Auth user on first login with `uid = studentId`
    (normalised uppercase), and issues a custom token with claims
    `{ role: "student", studentId: <uid> }`.
  - Client then calls `signInWithCustomToken(auth, customToken)` and reads the
    profile — grade detection and redirect flows are preserved in the PR.
- What PR #5 does **not** do (its own body and `SECURITY-MIGRATION.md` say so):
  - It still verifies the **legacy plaintext `password` field** server-side
    (“transitional step, not the final password-storage design”).
  - App Check is **not configured** — the callable enforces it, so login
    would be rejected until App Check is initialised in the frontend.
  - The Cloud Function is **not deployed** to project `answersheet2026`.
  - Admin auth is **not migrated**; the client-side destructive-operation
    password is **not removed**.
  - Dashboard / profile / registration / password-change reads and writes are
    **not migrated** to authenticated access.
  - No restrictive Firestore Rules are included. Its safety note: “Production
    Firestore Rules have not been changed. … the new login endpoint alone
    does not secure the entire app.”
  - **Do not merge PR #5 as it stands.** Finish the migration below first,
    then merge in a reviewed change.

### 1.2 Current login on `main` (verified)

- `firebase.js` (main): project `answersheet2026`
  (`authDomain: answersheet2026.firebaseapp.com`). `getAuth` is imported but
  no sign-in is used on `main` — there is no Firebase Auth login anywhere.
  No App Check anywhere on `main`.
- Student login (`app.js`, as shown by the PR #5 diff): unauthenticated
  `getDoc(doc(db, "students", studentId))`, then a plaintext comparison of
  `data.password` in the browser. The same plaintext pattern is in
  `change-password.js`, `student-registration.js`, `import-students.js` and
  `students.js` (per the earlier code review; re-verify each site before
  deleting the field).
- Admin login (`admin-login.js`, read in full): unauthenticated
  `getDoc(doc(db, "admins", username))`, fallback query on
  `where("username", "==", username)`, then plaintext comparison of
  `data.password` in the browser. On success it sets only
  `sessionStorage` flags: `adminLoggedIn="true"`, `adminUsername`,
  `adminRole` (normalised to `superadmin` or `limited`).
- Session gating (`session.js`, read in full): admin protection is
  `sessionStorage.getItem("adminLoggedIn") === "true"` plus a client-set
  `adminRole` string. Any user can set both in DevTools. `session.js` lists
  `student-deletion.html` among the super-admin pages — but that only matters
  if `session.js` is actually loaded by the page (see §1.5).
- Student session (`app.js`, per earlier review): `saveStudentSession` sets
  `loggedIn="true"`, `studentId`, `studentType`, `studentGrade`, `alYear`,
  `studentName`, `studentNIC` in `sessionStorage`. Dashboard checks only
  `loggedIn === "true"`. Cohort is therefore a browser-set value, not a
  verified fact.

### 1.3 Password change — verified, unauthenticated

- `change-password.js` (read in full): the student ID comes from
  `?id=` in the URL, falling back to `sessionStorage.getItem("studentId")`,
  with **no login check at all**. It reads the student doc, compares the
  current password in plaintext in the browser, then
  `updateDoc(ref, { password: newPassword, mustChangePassword: false })`.
  Minimum new-password length in this file is 8 characters, but the write
  itself is an unauthenticated client write to a plaintext field.
- Consequence: anyone who can read a `students` doc (see §1.6) can take over
  that account by changing its password. This endpoint must move server-side
  before any rule tightening (§3.3).

### 1.4 Recovery key — verified, keep this design, move verification server-side

- `student-recovery-setup.js` (read in full): this part is well designed.
  - Code: 20 characters, alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
    (32 symbols, no ambiguous `0/O/1/I`), generated with
    `window.crypto.getRandomValues` (20 random bytes, `value & 31` per byte),
    displayed grouped in fours (`XXXX-XXXX-XXXX-XXXX-XXXX`).
  - Only the SHA-256 hash is stored: `recoveryCodeHash` (64 hex chars) plus
    `recoveryCodeSetupComplete: true`. The full code is never stored.
  - Shown only once, in a modal that requires Print / Download and a
    “I have saved it” checkbox before Continue. The printable page states:
    “You will need it if you forget your student portal password.”
- `student-recovery-reset.js` (read in full, first ~200 lines + transaction):
  - Client-side `runTransaction`: normalises the Student ID and the entered
    code, hashes it with SHA-256 in the browser, compares it with
    `recoveryCodeHash`, enforces **max 2 resets per month** using a
    Sri Lanka (`Asia/Colombo`) month key, and then writes the new password
    (plaintext) and clears the login lock.
  - The 2-per-month limit is enforced only inside that client transaction, so
    a direct Firestore write bypasses it. The hash comparison itself is sound;
    the **location** (browser) is the problem.
- **Preserved flow (user-confirmed, 2026-11-25):**
  admin gives a student ID + temporary password → student logs in with it →
  student changes the password → the recovery key is shown on login, the
  student must save it → the recovery key is used **ONLY for password reset,
  not for direct login**. The user is building this at zero cost.
  Any new auth design must keep exactly this flow (temporary password →
  forced password change → recovery key shown and saved for password reset),
  not replace it with a different login students have not been told about.

### 1.5 Phase 0 containment — verified from code

- `student-deletion.html` (head read): a password card is the only gate
  visible in the page head; no `session.js` import was seen in the portion
  read. The earlier code review reported that `student-deletion.js` contains
  no `adminLoggedIn` / `sessionStorage` check at all and bulk-deletes with
  `deleteDoc(doc(db, "students", student.id))` after loading all students.
  **Re-verify the tail of `student-deletion.html` / `student-deletion.js`
  before relying on either claim** — the rate limit (see Blockers) stopped
  that final check in this preparation. The containment action does not
  depend on it: the page must be removed from the public site first either way.
- Hardcoded delete passwords: `search_code` for `DELETE_PASSWORD` returned
  4 files — `admin.js` (`SUPER_ADMIN_DELETE_PASSWORD`), `students.js`,
  `student-deletion.js` and `student-presence.js` (each defining a
  `DELETE_PASSWORD` constant compared in the browser). The values are in the
  public repo and are **not quoted anywhere in this document or in the draft
  files**. Rotate them immediately and never put a replacement value in
  client JS (see §2.7).
- `firestore.rules`: **absent** on `main` (verified — “file does not exist”).
  `firebase.json`: **absent** on `main` (verified). `functions/`:
  **absent** on `main` (verified — only exists on PR #5’s branch).
  `SECURITY-MIGRATION.md`: **absent** on `main` (verified — only on PR #5).
  Firestore Rules therefore live only in the Firebase console, unreviewed
  and unversioned. They could not be verified from the repo.

### 1.6 Why the current login cannot be locked down by Rules alone

- With no Firebase Auth, `request.auth` is always null, so no rule can
  distinguish a real student from an anonymous caller.
- The login itself depends on an unauthenticated read of `students/{id}`
  (to compare the password) and on unauthenticated client writes
  (password change, recovery reset, failed-login counter). Any rule that
  lets the current login work must let any internet user read/write those
  fields. That is why the migration order in §4 matters: **server login
  first, Rules last.**

### 1.7 Push worker — partially read, pattern to keep

- `cloudflare/push-worker.js` (head read): origin allow-list
  (`drsandaruwanperera.lk`, `www.` variant, `drsandaruwanperera.github.io`),
  project fallback `answersheet2026`, and the Firebase service-account JSON
  correctly kept in an environment secret (`env.FIREBASE_SERVICE_ACCOUNT`),
  not in the repo. Keep that pattern for any new server code. The worker’s
  admin-password handling was **not** re-verified in this preparation (prior
  review reported a plaintext comparison there) — verify it as part of §4.4
  and do not copy its auth pattern into the new functions.

---

## 2. Target design (zero-cost, free tier where possible)

All of the following use the existing Firebase project `answersheet2026`
(Blaze plan is **not** required for the design below; Cloud Functions gen 2
and Firestore both have free tiers that cover a school LMS of this size —
verify current quotas in the console before cutover, and set a billing
alert even on the free tier so a runaway function cannot surprise anyone).
Region: `asia-south1` (already chosen by PR #5 — closest to Sri Lanka).

### 2.1 Identity model

- One Firebase Auth user per student, `uid` = normalised uppercase Student ID
  (exactly as PR #5 does — stable, no email required, no student data model
  change for cohort/routing).
- One Firebase Auth user per admin, `uid` = `admin:<username>` (or the admin
  doc ID), **separate from student UIDs** so a student UID can never collide
  with an admin UID.
- Custom claims on the token, set server-side only:
  - Student: `{ role: "student", studentId: <uid>, cohort: <grade10|grade11|al2027|al2028>, alYear: <"2027"|"2028"|null> }`
  - Admin: `{ role: "admin", adminRole: "superadmin"|"limited", adminUsername: <username> }`
- The browser never decides role or cohort. `sessionStorage` flags
  (`loggedIn`, `adminLoggedIn`, `adminRole`, `studentType`, `alYear`) become
  **display hints only** — every protected read/write is gated by
  `request.auth.token` in Rules or by a verified token in a Function.
- `onAuthStateChanged` becomes the session check everywhere
  `sessionStorage.getItem("loggedIn")` is used today.

### 2.2 Password storage — salted hash, never plaintext

- Algorithm: **scrypt** (Node `crypto.scrypt`, built in — no extra paid
  dependency, no new npm package to audit). Parameters, e.g.
  `N=16384, r=8, p=1, keyLen=64`, per-user random 16-byte salt.
  Stored format (single string field, so no schema migration beyond a rename):
  `passwordHash: "scrypt$16384$8$1$<base64 salt>$<base64 hash>"`.
  (bcrypt via npm is an acceptable alternative if the team prefers it;
  do not invent a home-made hash, do not use plain SHA-256 for passwords —
  SHA-256 is correct for the *recovery code* in §2.4, it is not a password hash.)
- Fields on `students/{id}` after migration:
  - **Delete:** `password` (plaintext) — after every account is migrated.
  - **Add:** `passwordHash`, `passwordMigrated: true`,
    `mustChangePassword: true` (for accounts issued a temporary password),
    `passwordChangedAt` (server timestamp).
  - **Keep:** `recoveryCodeHash`, `recoveryCodeSetupComplete`,
    `recoveryResetsByMonth` (server-written only), cohort fields
    (`studentType`, `grade`, `alYear`, `cohort` — unchanged, but now
    *read* through the verified token, not trusted from the browser).
  - **Delete / stop writing from the client:** `failedLoginAttempts`,
    `accountLocked` (move to the server rate-limit store, §2.6).
  - **Keep, but never display:** do not render any password or password
    hash in the admin table (`students.js` `getPasswordHTML` and the
    `data-password` attribute must be deleted, as must the password column
    in the import preview in `import-students.js`).
- Minimum password length: **8 characters everywhere** (today it is 4 in
  `import-students.js` / `students.js`, 6 in `student-registration.js`,
  8 only in `change-password.js` / the recovery reset form).

### 2.3 Login — server-side, same student-facing flow

New / extended callables in `functions/index.js` (extend PR #5, do not start
a second backend):

1. `studentIdLogin({ studentId, password })` — PR #5’s callable, extended:
   - Keep the existing validation, the 8-per-15-minutes per Student ID + IP
     rate limit, and `enforceAppCheck: true`.
   - Verify against `passwordHash` (scrypt) instead of the plaintext field.
   - **Transitional compatibility (only if Dr. Sandaruwan approves it):**
     if `passwordMigrated` is false, verify the legacy plaintext field
     *once* server-side, then immediately hash the same password, store
     `passwordHash`, delete `password`, set `passwordMigrated: true` — all
     in the same Function invocation. This is a one-way bridge, not a
     permanent fallback. The recommended alternative is §2.8 (forced reset
     for everyone, no bridge).
   - Issue the custom token only on success, with the claims in §2.1.
     Return only `{ studentId, studentType, mustChangePassword,
     recoveryCodeSetupComplete }` — never a password or hash.
   - On failure return the same generic “Invalid Student ID or password.”
     for unknown ID, wrong password and locked-out accounts (do not leak
     which one).
2. `adminLogin({ username, password })` — new, same pattern, separate
   collection and separate claims. Admins must **not** be able to log in
   through `studentIdLogin` and vice versa. Rate-limit per username + IP,
   stricter (e.g. 5 per 15 minutes), and log every admin login attempt
   server-side.
3. After `signInWithCustomToken`, the client reads its own profile with
   `getDoc(doc(db, "students", auth.currentUser.uid))` — which the draft
   Rules in this branch now allow (§3). Grade detection, first-login /
   password-change routing and registration routing stay exactly as they are
   in PR #5’s `app.js` change.

### 2.4 Password change and recovery reset — server-side only

- `changePassword({ currentPassword, newPassword })` — new callable.
  - Requires a signed-in student. The target UID comes from
    `request.auth.uid`, **never** from a `?id=` parameter or from
    `sessionStorage`. The old `change-password.js` URL-param path must be
    deleted.
  - Verify the current password against `passwordHash` server-side, enforce
    min 8 characters and “different from current”, then store the new hash
    and set `mustChangePassword: false`.
- `resetPasswordWithRecoveryCode({ studentId, recoveryCode, newPassword })`
  — new callable, replacing the client transaction in
  `student-recovery-reset.js`.
  - Keep the exact code design verified in §1.4: normalise the code
    (uppercase, strip spaces/hyphens), SHA-256 it server-side, compare with
    `recoveryCodeHash` using a timing-safe comparison.
  - Enforce the **2 resets per calendar month** server-side, using the same
    `Asia/Colombo` month key, stored in `recoveryResetsByMonth` — a client
    can no longer bypass the limit by writing Firestore directly.
  - On success: store the new password hash, clear the server-side lockout
    for that student, and **invalidate the used recovery code** — set
    `recoveryCodeSetupComplete: false` and require the student to create a
    new recovery code on next login (via the existing
    `requireRecoveryCodeSetup` flow). A recovery code must not be reusable
    indefinitely after a reset.
  - Rate-limit this endpoint per Student ID + IP (e.g. 5 attempts per hour)
    — recovery codes are 20 characters from a 32-symbol alphabet, but
    guessing must still be expensive.
- `regenerateRecoveryCode` is **not** a separate public endpoint: recovery
  code creation stays inside an authenticated session (the existing setup
  modal), and the client still generates the code locally and stores only
  the hash — but the *write* of `recoveryCodeHash` must go through the
  draft Rules (§3), which allow a signed-in student to write only their own
  `recoveryCodeHash` / `recoveryCodeSetupComplete` fields, and nothing else
  on their own doc.

### 2.5 App Check — required before any callable is deployed

- Enable App Check for the web app in the Firebase console and initialise
  it in `firebase.js` before any callable is called (PR #5’s callable
  already sets `enforceAppCheck: true`; without this step every login is
  rejected).
- Zero-cost option: reCAPTCHA v3 via App Check (free tier). Register the
  site `drsandaruwanperera.lk` and the GitHub Pages preview origin if
  previews must log in; otherwise previews will fail App Check by design
  and that must be communicated to testers.
- Test App Check in the Firebase emulator first, then on a staging host,
  then on production — never debug it for the first time on the live login.

### 2.6 Rate limiting and lockout — server-side only

- Keep PR #5’s `_loginRateLimits` design (hashed Student ID + IP key,
  15-minute window, 8 attempts) and extend it to `adminLogin` and to
  `resetPasswordWithRecoveryCode`.
- Delete the client-side lockout: `app.js` `MAX_FAILED_LOGIN_ATTEMPTS = 2`,
  `recordFailedLoginAttempt`, and the client-writable `failedLoginAttempts` /
  `accountLocked` fields. Today anyone can lock any student’s account with
  two wrong guesses; after the migration a lockout is a server-side
  consequence of the rate limit, and only the server can clear it (via a
  successful recovery reset, §2.4, or an admin release function).
- Configure Firestore TTL for `_loginRateLimits.expiresAt` (PR #5 already
  notes this) so rate-limit documents are cleaned up automatically.

### 2.7 Deletion — server-side, super-admin only, no hardcoded password

- New callable `deleteStudent({ studentId, reason })` (and a bulk variant
  only if the admin UI genuinely needs it — prefer one-by-one with a
  confirmation per student).
  - Requires a signed-in admin whose token carries
    `adminRole: "superadmin"`. Limited admins are rejected server-side.
  - Deletes the `students/{id}` doc **and** the matching Firebase Auth user
    (`getAuth().deleteUser(uid)`) in the same Function, and writes an audit
    record to a server-only collection (e.g. `adminAudit`) with admin
    username, target ID, timestamp and reason. The audit collection is
    readable only by super-admins via Rules, writable only by Functions.
  - No password is asked for in the browser at all — the hardcoded delete
    passwords in `admin.js`, `students.js`, `student-deletion.js` and
    `student-presence.js` are deleted from the repo, and the values are
    rotated / retired (they are already public; rotating alone is not a fix).
- `student-deletion.html` / `student-deletion.js`:
  - **Phase 0 (today):** remove the page from the public site (or block it
    at hosting level) until the Function exists. Do not just add
    `session.js` to it — a sessionStorage flag is not a gate.
  - **Phase 2:** re-add it only as a thin UI that calls `deleteStudent`
    with the signed-in admin’s token. It must not load the full student
    list into the browser to delete from it — list via a paginated,
    super-admin-only query, and delete via the Function.

### 2.8 Forced reset for all students and admins (recommended)

- After the hash migration lands, **every** student and admin password is
  treated as compromised (they were stored in plaintext in a database that
  any reader of the open rules could read).
- Recommended cutover: set `mustChangePassword: true` and
  `passwordMigrated: false` for all accounts, issue each student a new
  temporary password through the existing admin channel (the same way
  temporary passwords are issued today — do not email or post passwords in
  plain text in a public channel), and require the change on next login.
  The recovery key must also be re-created on next login if the old one
  was created before the migration (its hash was stored alongside plaintext
  passwords; the code itself was not stored, so it is not directly exposed,
  but re-creation is the safe default — decide this with Dr. Sandaruwan
  and record the decision).
- Alternative (only if a forced reset is operationally impossible):
  the one-way bridge in §2.3, where the first server login hashes the
  existing password in place. This avoids re-issuing passwords but leaves
  every existing password in place — including any that were already
  harvested. Record which option was chosen and why; do not do both
  silently.

### 2.9 Cohort and paper access — server-side

- Rules (§3) key cohort access on `request.auth.token.cohort` /
  `request.auth.token.studentId`, not on `sessionStorage.alYear`.
  A student may read only documents whose cohort matches their verified
  profile. The dashboard card-hiding (Nov 22 work) stays as UX only.
- The three unguarded A/L 2028 pages (`theory-examination.html`,
  `smart-book.html`, `school-paper-answers.html`) get the same
  authenticated + cohort gate as `model-papers.js` in Phase 1 — but note
  honestly: **the PDFs themselves are in the public repo**, so Rules
  cannot protect a PDF file that anyone can download from GitHub.
  Real paper protection needs one of: (a) move papers to Firebase Storage
  behind Rules / signed URLs, or (b) serve them through a Function that
  checks the token and streams the file. That is a separate, larger piece
  of work — do not claim the Phase 2 Rules alone protect the PDFs.
  Decide (a) vs (b) vs “accept public PDFs” with Dr. Sandaruwan before
  promising students that papers are cohort-restricted.
- Results: serve per-student results from Firestore behind the Rules in
  §3 (`studentResults/{studentId}` readable only by that student and by
  admins). Remove the bundled results files from the repo (see §2.10).

### 2.10 Removing PII and ID lists from the public repo

- Files reported by the earlier code review (re-verify the exact list
  before deleting — the rate limit stopped a fresh listing in this
  preparation): `grade11-results-data.js`, `grade11-results-exam02.js`,
  `grade11-top-ranking-2026-ol-data.js` (student names, IDs and marks,
  readable without login) and the ~100 numeric A/L 2028 IDs in `app.js`,
  `dashboard-grade-routing.js`, `students.js`, `import-students.js`,
  `dashboard-enhancements.js`, `al2027-answer-release-popup.js` and
  `.github/workflows/fix-al-login.yml`.
- The ID lists move into Firestore (admin-managed cohort mapping), never
  back into public code. Delete `.github/workflows/fix-al-login.yml` — it
  rewrites `app.js` on every push to `main` and publishes the ID list.
- **Do not rewrite git history in this branch.** Removing the files from
  `main` stops future exposure but leaves them in history. A history
  rewrite (`git filter-repo` or equivalent) is a separate decision that
  needs Dr. Sandaruwan’s explicit approval, because it rewrites every
  clone and every open PR branch (including PR #5’s
  `security-auth-migration` branch and the two design-preview PRs).
  Record the decision in the cutover checklist (§5).

---

## 3. Draft Firestore Rules (in this branch — DO NOT DEPLOY YET)

File: `firestore.rules` (draft, in this branch only).
Companion: `firebase.json` (draft, in this branch only).

Read the comments at the top of `firestore.rules` before using it. In short:

- **Default deny everything.** Anonymous (`request.auth == null`) reads and
  writes are denied for every collection, including `students` and `admins`.
- A signed-in student may **read only their own** `students/{ownId}` doc
  (`request.auth.uid == studentId`), and may **write only** their own
  `recoveryCodeHash` / `recoveryCodeSetupComplete` fields — nothing else,
  and never another student’s doc.
- A signed-in admin may read `students` docs (for the admin UI) only if
  their token carries `role == "admin"`; only a `superadmin` token may
  read `admins` docs. No client may write `admins` at all.
- `studentResults/{studentId}`: readable only by that student and by admins.
- Public content collections (`dashboardStudyContent`, `announcements`,
  `popNotices`, `monthlyTopRankingPapers`, `monthlyTopRankingAccess`):
  readable only by a signed-in user in the draft — tighten per-cohort in
  the implementation step, once the cohort claim is populated.
- `_loginRateLimits` and `adminAudit`: **no client access at all**
  (Functions only, via the Admin SDK, which bypasses Rules).
- **Why this must not be deployed yet:** the current login, password
  change, recovery reset, dashboard, registration, import and admin pages
  all read/write Firestore as anonymous clients. Deploying these Rules
  today would break login for every student. Deploy them only after §4
  steps 1–6 are complete and tested in the emulator, in that order.

---

## 4. Implementation order (do not do this in pieces)

1. **Phase 0 containment (today, no code):** remove `student-deletion.html`
   from the public site; rotate/retire the hardcoded delete passwords;
   read and export the live Firestore Rules from the Firebase console;
   do not send any password in plain text while the plaintext store is open.
2. **Extend PR #5’s Function** (`functions/index.js`) with §2.3–§2.7:
   hash verification, `adminLogin`, `changePassword`,
   `resetPasswordWithRecoveryCode`, `deleteStudent`, server-side rate
   limits. Add `functions/package.json` dependencies only if needed
   (scrypt needs none — it is Node built-in).
3. **App Check** (§2.5): enable and initialise it, test in the emulator.
4. **Wire the clients:** `app.js` (already started by PR #5),
   `admin-login.js`, `change-password.js`, `student-recovery-reset.js`,
   `profile.js` (recovery-code regeneration), dashboard/profile/
   registration reads — all to `request.auth.uid` / custom claims, never
   to `sessionStorage` flags. Delete every client-side password comparison
   and every plaintext password write/display in the same change.
5. **Emulator end-to-end test** (see §5): all four cohorts, first login,
   forced password change, recovery-code setup, password reset with the
   recovery code (including the 2-per-month limit), admin login (both
   roles), student deletion (super-admin only, and a limited admin being
   refused), and a forged `sessionStorage` session opening nothing.
6. **Deploy the Function to `answersheet2026`** (staging host first if
   one exists, then production), then — only then — **deploy the draft
   Rules** from this branch (`firebase deploy --only firestore:rules`).
7. **Forced reset** (§2.8) and student notice, in the quiet window (§5).
8. **Remove PII / ID lists** from the repo (§2.10); decide the history
   rewrite separately.
9. **Re-test the Flutter app** end-to-end (login + one cohort each +
   admin) before its next release — it is a WebView of the live site, so
   the login change reaches it automatically, and a changed login screen
   may need an app-side update.

---

## 5. Cutover checklist — inputs still needed (nothing here is assumed)

- [ ] **Firebase console access** — project `answersheet2026`: read the live
      Rules, enable Auth / App Check, deploy the Function, deploy Rules,
      configure the `_loginRateLimits` TTL. Without this, steps 3 and 6
      cannot happen.
- [ ] **Dr. Sandaruwan’s approval** — for the migration itself, for the
      forced password reset, and separately for any git-history rewrite.
- [ ] **Password-reset decision + student notice** — forced reset for all
      (§2.8, recommended) vs. the one-way hash-on-first-login bridge;
      the exact message to students, in Sinhala, telling them how and when
      to log in again, and what to do if they lose their recovery code.
- [ ] **Recovery-code decision** — re-create recovery codes on next login
      after migration, or keep existing hashes (see §2.8).
- [ ] **Paper-protection decision** — accept public PDFs, or move papers to
      Storage / a Function (§2.9). Do not promise cohort-restricted papers
      until this is decided.
- [ ] **Test accounts** — one student per cohort (Grade 10, Grade 11,
      A/L 2027, A/L 2028) plus one admin account per role
      (`superadmin` and `limited`), with known temporary passwords, for
      emulator and staging tests. These are the same accounts still needed
      for the Flutter app’s live login tests.
- [ ] **Quiet cutover window** — a time when no student is mid-exam or
      mid-paper; login will change, and a failed cutover must be rollable
      back (keep the old login code path disabled, not deleted, until the
      new path is verified in production).
- [ ] **Flutter app re-test plan** — WebView of the live site: after the
      auth migration, re-test login + one cohort each + admin in the app
      before the next release; update the app if the login screen changes.
- [ ] **Rollback plan** — how to restore the previous Function version and
      the previous (open) Rules if the new login fails in production, and
      who can do it at that hour.

### Acceptance test for Phase 2 (all must pass before the cutover is declared done)

- With no login, no `students` / `admins` doc can be read.
- A logged-in Grade 10 student cannot read another student’s doc, an
  admin doc, or an A/L 2028 paper record.
- An admin session forged in DevTools (`sessionStorage.adminLoggedIn =
  "true"`, `adminRole = "superadmin"`) opens nothing.
- Changing a password requires the signed-in student’s own token; a
  `?id=` URL for another student is ignored.
- A recovery-code reset for one student cannot be triggered for another,
  and the 2-per-month limit cannot be bypassed from the browser.
- Deleting a student requires a server-verified super-admin; a limited
  admin is refused server-side.
- Two wrong passwords do **not** lock an account from the browser; the
  server rate limit applies instead.

---

## 6. Blockers (as of this preparation)

1. **GitHub MCP rate-limited (HTTP 429) during preparation** while reading the repo.
   The last three `search_code` calls in this preparation all returned
   `MCP request failed with HTTP 429: too many requests`. Per the
   task’s hard-stop rule, no further GitHub API calls were made at that
   time. This is now resolved: write access was granted, the rate limit
   cleared, and branch `draft/phase2-auth-migration` was created
   2026-11-25 with the three draft files in one commit.
2. **Final verification of `student-deletion.js` / the tail of
   `student-deletion.html` was stopped by the same rate limit** (see §1.5).
   Re-verify before relying on the “no gate at all” wording; the Phase 0
   removal does not depend on it.
3. **Live Firestore Rules not verified** — they live only in the Firebase
   console, and this preparation did not (and must not) change live Firebase.
   Reading them is a Phase 0 action for whoever holds console access.
4. **No test accounts, no cutover window, no password-reset decision yet**
   — see §5. Nothing in §4 steps 5–7 can be executed without them.
5. **PR #5’s branch is based on an older `main`** (base `6a6a9c6`, while
   `main` is now `fed2445`). Rebasing / merging PR #5 into the new branch
   will need a conflict check — do not assume it applies cleanly.

---

## 7. Sources read for this document

- PR #5 (`get` + `get_files` + `get_diff` + `get_commits`): title, body,
  5 files, transitional callable, rate limit, App Check requirement.
- `main` HEAD `fed2445`: `firebase.js`, `session.js`,
  `student-recovery-setup.js`, `admin-login.js`, `change-password.js`,
  `student-recovery-reset.js` (partial), `student-deletion.html` (head),
  `cloudflare/push-worker.js` (head) — read via the GitHub MCP API.
- Absence verified on `main`: `firestore.rules`, `firebase.json`,
  `functions/index.js`, `functions/package.json`, `SECURITY-MIGRATION.md`.
- `search_code` for `DELETE_PASSWORD`: 4 files (values not quoted here).
- Earlier code review (2026-11-25) for the files not re-read in this
  preparation (`app.js` login, `students.js`, `import-students.js`,
  results PII files, cohort pages) — marked as such where relied on.
