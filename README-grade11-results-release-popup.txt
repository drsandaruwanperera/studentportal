GRADE 11 RESULTS RELEASE POPUP — OPTION 1 (MODERN CARD / CLEAN & MINIMAL)

Files in this patch:
1) grade11-results-release-popup.js
2) grade11-results-release-popup.css

Required existing file (already in studentportal root):
- grade11-top-ranking-2026-ol-data.js

INSTALL
1. Open the drsandaruwanperera/studentportal GitHub repository.
2. Upload grade11-results-release-popup.js and grade11-results-release-popup.css to the repository ROOT (same folder as dashboard.html and firebase.js).
3. Open dashboard.html and add this line just before the closing </body> tag:

   <script type="module" src="grade11-results-release-popup.js?v=1"></script>

4. Commit the two new files and dashboard.html change to the main branch.
5. Wait for the GitHub Pages deployment to succeed, then hard-refresh the site (Ctrl+F5).

BEHAVIOUR
- Only signed-in Grade 11 students whose ID exists in the published Top Ranking 2026 O/L result data are eligible.
- The popup shows only when at least one paper mark is published for that student.
- View Results navigates to progress.html.
- Maybe Later and the close button dismiss the popup for that student and this release version.
- To show a new popup for a future result release, change RELEASE_ID in grade11-results-release-popup.js (for example, change v1 to v2).
- Students in other grades and students with no published marks do not see this popup.

This patch does not edit Firebase records or change marks.
