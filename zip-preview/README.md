# ZIP-inspired LMS preview (test branch only)

This preview is isolated from the live site and is deployed from this feature branch to the separate Firebase Hosting staging project.

## Preview routes

- Student login / Firebase Auth smoke test: `/portal.html`
- Dashboard visual-only mockup: `/dashboard-preview.html` (also available at `/dashboard.html`)
- The visual mockup does not load real student records, marks, papers, or production Firebase data.
- Website preview is maintained in the website repository under `design-preview/` and `zip-preview/`.

## Safety decisions

- The ZIP's sample-data dashboard is not used for real student accounts.
- The staging login uses Firebase Authentication from the staging project only. It does not call Firestore, import production `app.js`, or route to the production dashboard. Use only a dedicated staging test account; never enter real student credentials.
- The existing dashboard on the feature branch keeps its HTML, Firestore loading, dashboard scripts and grade-routing logic; a theme CSS layer is linked as an isolated design change.
- The Firebase Hosting workflow publishes only the `zip-preview/` directory from the feature branch to `drsandaruwan-lms-staging`. It does not deploy the root production portal files.
- Production `main` branch dashboard and Firebase configuration have not been modified by these preview changes.

## Before real dashboard integration

1. Review the themed existing dashboard in a browser against the current dashboard, including desktop/mobile and console errors.
2. Create a staging-only student data/auth mapping or a secure backend for dashboard reads. The current student login implementation uses a Firestore-stored password comparison and must not be reused as the new staging authentication method.
3. Define restrictive staging Firestore rules and populate only synthetic test records.
4. Verify grade routing, first-login registration/password-change flow, papers, marks, refresh, and logout against staging data.
5. Only after those checks pass should the theme integration be proposed for production review. Do not merge this draft PR or deploy it to production before review.

## Staging setup

- Firebase project: `drsandaruwan-lms-staging`
- GitHub Actions secret: `FIREBASE_SERVICE_ACCOUNT_STAGING`
- Workflow: `.github/workflows/deploy-staging-hosting.yml` (manual dispatch only)
- Never commit a service-account JSON key or add public Firestore read/write rules.


## Dashboard integration QA checklist

Run this checklist against the real dashboard only in an isolated staging environment with synthetic test data.

### Visual regression
- [ ] Desktop: sidebar, header, dashboard cards and text remain readable.
- [ ] Mobile (320px, 375px, 768px): navigation, cards and tables do not overflow horizontally.
- [ ] Keyboard focus indicators are visible; reduced-motion preference is respected.
- [ ] Browser console has no CSS/JavaScript errors or missing assets.

### Functional regression (staging synthetic account only)
- [ ] Login/logout and refresh/session expiry.
- [ ] Student grade routing, including A/L route and registration-required route.
- [ ] First-login password-change route.
- [ ] Papers list/open/download and marks/results display.
- [ ] Empty states, loading states and network errors.
- [ ] Unauthorized student cannot read another student's records.
- [ ] Firestore rules deny unauthenticated reads and writes.

### Gate before real dashboard connection
The current preview login proves Firebase Authentication only. It does not issue a student session, provision a student-to-Auth UID mapping, or authorize dashboard Firestore queries. Do not link this login to the production dashboard. Do not copy production student records into staging. End-to-end tests are blocked until a staging-only identity mapping, synthetic records, and restrictive Firestore rules exist.
