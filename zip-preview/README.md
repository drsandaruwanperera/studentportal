# ZIP-inspired LMS preview (test branch only)

This preview is intentionally isolated from the live site.

## Preview routes

- Website: `/zip-preview/index.html` in the website repository.
- Student login: `/zip-preview/portal.html` in the studentportal repository.
- Dashboard: the preview login forwards successful authentication to the existing production dashboard through `/zip-preview/dashboard.html`.
- First-login password change: `/zip-preview/change-password.html` forwards to the existing password-change page, preserving the `?id=` query parameter.
- Registration: `/zip-preview/student-registration.html` forwards to the existing registration page, preserving query parameters.

## Safety decisions

- The ZIP's sample-data dashboard is not used for real student accounts.
- The login preview is currently a visual-only safe stub; it does not import `app.js` or send credentials to production Firebase. Do not enter real student credentials.
- The real dashboard's HTML, Firestore loading, dashboard scripts and grade-routing script are preserved; the preview branch adds a theme CSS layer.
- The supplied teacher photo is referenced from the existing `assets/sir-photo.png` asset.
- Production `main` branches have not been modified by these preview changes.

## Required before publishing

1. Review homepage content against the current live homepage to ensure no important information, contact links, photos or results are lost.
2. Add the real `drsandaruwan-lms-staging` Firebase web-app config in a dedicated staging module, wire a staging-only login flow to it, and confirm Firestore rules permit only the intended test operations. Never point the preview at production `firebase.js`.
3. After staging config and rules are confirmed, check desktop/mobile layout, console errors, asset loading and navigation; then use authorized staging test accounts to verify correct/incorrect credentials, grade routing, first-login flow, refresh, logout and dashboard data.
4. Confirm real marks, papers and result links; do not treat CSS/static checks as a successful Firebase test.
5. Review the diffs for both repositories and get explicit final production approval before merging.

No browser/Firebase end-to-end test or production deployment is claimed by this README.
