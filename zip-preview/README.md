# ZIP-inspired LMS preview (test branch only)

This preview is intentionally isolated from the live site.

- `portal.html` is a ZIP-inspired sign-in design wired to the existing `app.js` login flow.
- Successful login is routed through a bridge to the existing `dashboard.html`, preserving the current dashboard's Firestore loading and grade-specific navigation while dashboard UI integration is still pending.
- The sample-data dashboard from the ZIP is deliberately not used as a real dashboard.
- Do not deploy or merge this preview into the production branch until all three surfaces (main website, login, dashboard) have been reviewed and tested.

Use only an authorized test account. This branch does not change the production website.
