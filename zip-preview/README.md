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
- The login preview uses the existing `app.js` flow and required DOM IDs.
- The real dashboard's HTML, Firestore loading, dashboard scripts and grade-routing script are preserved; the preview branch adds a theme CSS layer.
- The supplied teacher photo is referenced from the existing `assets/sir-photo.png` asset.
- Production `main` branches have not been modified by these preview changes.

## Required before publishing

1. Review homepage content against the current live homepage to ensure no important information, contact links, photos or results are lost.
2. On a staging/browser preview, check desktop and mobile layout, console errors, asset loading, navigation and all internal links.
3. Use an authorized test account to verify correct/incorrect credentials, Grade 10, Grade 11 and A/L routing, first-login password change, registration route, refresh, logout and dashboard data.
4. Confirm real marks, papers and result links; do not treat CSS/static checks as a successful Firebase test.
5. Review the diffs for both repositories and get explicit final production approval before merging.

No browser/Firebase end-to-end test or production deployment is claimed by this README.
