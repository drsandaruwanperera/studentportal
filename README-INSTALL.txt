NOVEMBER 2026 — PAPER + ANSWER IN-SYSTEM VIEWER FIX

This patch fixes the page currently stuck on “Checking page images…” and adds the Answer Schemes cards below the two paper cards.

REPLACE THESE FOUR FILES IN THE STUDENTPORTAL REPOSITORY ROOT:
1. al-top-ranking-paper.js
2. al-top-ranking-paper.html
3. al-top-ranking-answer.js
4. al-top-ranking-answer.html

WHAT IT DOES
- Repairs a missing closing brace in al-top-ranking-paper.js. The syntax error currently stops that page script from executing.
- Detects the November 2026 Paper 01 first/second question-paper PDFs.
- Opens both question papers inside the existing PDF.js viewer (same website tab), rather than opening a raw PDF in a new browser tab.
- Adds an ANSWER SCHEMES section underneath the question-paper cards.
- Adds “1st Paper Answer” and “2nd Paper Answer” cards.
- Checks whether each answer PDF exists before enabling its View Answer button.
- Opens each answer sheet inside the same PDF.js viewer.
- Updates script cache-version strings so the browser fetches the corrected JavaScript.

FILES ALREADY PRESENT IN GITHUB (DO NOT UPLOAD THESE AGAIN):
- papers/al-top-ranking/november/paper-01-1st-paper.pdf
- papers/al-top-ranking/november/paper-01-2nd-paper.pdf
- answers/al-top-ranking/november/paper-01-1st-answer.pdf
- answers/al-top-ranking/november/paper-01-2nd-answer.pdf

INSTALL
1. Extract this ZIP.
2. In GitHub, open drsandaruwanperera/studentportal, branch main.
3. Upload/replace the four files above directly in the repository ROOT (same folder as firebase.js and al-top-ranking-paper.html).
4. Commit the four replacements to main.
5. Wait for the GitHub Pages deployment to finish successfully.
6. Open the November 2026 Paper 01 page and hard-refresh using Ctrl+F5.

Access is still checked against the logged-in student record. No student marks or Firebase result documents are changed by this patch.
