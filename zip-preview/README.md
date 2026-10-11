# ZIP-inspired LMS preview (test branch only)

This preview is intentionally isolated from the live site.

## Preview routes

- Website: `/zip-preview/index.html` in the website repository.
- Student login: `/zip-preview/portal.html` in the studentportal repository.
- Dashboard: `/zip-preview/dashboard.html` is a navigation bridge to the existing dashboard and must not be treated as a staging-authenticated route.
- First-login password change: `/zip-preview/change-password.html` forwards to the existing password-change page, preserving the `?id=` query parameter.
- Registration: `/zip-preview/student-registration.html` forwards to the existing registration page, preserving query parameters.

## Safety decisions

- The ZIP's sample-data dashboard is not used for real student accounts.
- The preview login imports `staging-login.js` only. It does not call Firestore, import production `app.js`, authenticate users, or route to the production dashboard. It deliberately blocks sign-in until secure staging authentication is configured. Do not enter real student credentials.
- The real dashboard's HTML, Firestore loading, dashboard scripts and grade-routing script are preserved; the preview branch adds a theme CSS layer.
- The supplied teacher photo is referenced from the existing `assets/sir-photo.png` asset.
- Production `main` branches have not been modified by these preview changes.

## Required before publishing

1. Review homepage content against the current live homepage to ensure no important information, contact links, photos or results are lost.
2. Configure Firebase Authentication for dedicated staging test users and restrictive staging Firestore rules. Do not compare passwords stored in Firestore from browser code and do not add public read/write rules. Only after auth and rules are configured should the staging login module be implemented.
3. After secure staging auth is implemented, check desktop/mobile layout, console errors, asset loading and navigation; then use authorized staging test accounts to verify login, grade routing, first-login flow, refresh, logout and dashboard data.
4. Confirm real marks, papers and result links; do not treat CSS/static checks as a successful Firebase test.
5. Review the diffs for both repositories and get explicit final production approval before merging.

No browser/Firebase end-to-end test or production deployment is claimed by this README.
