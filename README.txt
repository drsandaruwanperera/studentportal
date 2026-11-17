GRADE 11 RESULTS PROGRESS BAR FIX

Purpose
- Uses the six Pilot Paper 01-06 marks in the common Grade 11 O/L collection to drive the Progress page's top progress bar.
- Counts a published mark of 0 as a completed/published result; blank/null marks remain pending.
- Updates the top percentage, completed/pending counts, lower summary progress, and the descriptive labels.
- Keeps the Average Result score separate from result-completion progress.
- Re-applies the Grade 11 result progress if the original paper-view tracker finishes later and tries to overwrite the bar with 0/0.

Install
1. Open drsandaruwanperera/studentportal on GitHub.
2. Replace the existing root file named:
   grade11-progress-results-integration.js
   with the file in this ZIP.
3. Commit the change to the main branch.
4. Wait for GitHub Pages deployment to succeed.
5. Open the student's Progress & Results page and press Ctrl+F5 (or clear mobile browser cache and reload).

No progress.html edit is required. Keep the existing script reference:
<script type="module" src="grade11-progress-results-integration.js?v=1"></script>

Expected for a student with all six marks:
- Results progress: 100% (6 published out of 6 papers)
- Results Published: 6
- Pending Results: 0
- Average Result remains the student's actual average mark (e.g. 67%).

For students with blank marks, the progress percentage is proportional to the number of published marks. A score of 0 still counts as a published result.
