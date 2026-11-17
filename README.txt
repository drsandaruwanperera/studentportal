GRADE 11 RESULTS — PROFESSIONAL CARD LAYOUT PATCH

Replace these two existing files in the ROOT of:
drsandaruwanperera/studentportal

1. grade11-results-dashboard.css
2. grade11-progress-results-integration.js

Do NOT change progress.html. It already loads:
grade11-progress-results-integration.js?v=1

The updated JS loads the replacement CSS using:
grade11-results-dashboard.css?v=grade11-2026-3

After replacing both files:
- Commit the changes to main.
- Wait for the GitHub Pages deployment to complete.
- Open https://drsandaruwanperera.lk/studentportal/progress.html
- Hard refresh (Ctrl+F5).

This changes presentation and makes chart rendering idempotent. It does not change
the student marks dataset or Firestore published results.
