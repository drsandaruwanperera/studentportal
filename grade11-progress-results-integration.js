import { db, collection, query, where, getDocs } from "./firebase.js";
import { GRADE11_RESULTS } from "./grade11-results-data.js";
import { TOP_RANKING_EXAM_02 } from "./grade11-results-exam02.js";
import { TOP_RANKING_2026_OL_RESULTS } from "./grade11-top-ranking-2026-ol-data.js";

(() => {
  "use strict";

  const studentId = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();
  const gradeValue = String(
    sessionStorage.getItem("studentGrade") || sessionStorage.getItem("studentType") || ""
  ).trim().toLowerCase().replace(/[\s_-]+/g, "");
  const isGrade11 = gradeValue === "11" || gradeValue.includes("grade11");

  if (!isGrade11 || !studentId) return;

  const student = TOP_RANKING_2026_OL_RESULTS.find(
    item => String(item.id).trim().toUpperCase() === studentId
  );
  // This collection only applies to IDs present in the supplied Grade 11 result PDF.
  // Students outside that list continue using the page's existing result renderer.
  if (!student) return;

  const grid = document.getElementById("resultGrid");
  const scoreBars = document.getElementById("scoreBars");
  if (!grid || !scoreBars) return;

  const paperNames = [
    "Pilot Paper No. 01",
    "Pilot Paper No. 02",
    "Pilot Paper No. 03",
    "Pilot Paper No. 04",
    "Pilot Paper No. 05",
    "Pilot Paper No. 06"
  ];

  const stylesheetId = "grade11-top-ranking-results-styles";
  if (!document.getElementById(stylesheetId)) {
    const link = document.createElement("link");
    link.id = stylesheetId;
    link.rel = "stylesheet";
    link.href = new URL("./grade11-results-dashboard.css?v=grade11-2026-3", import.meta.url).href;
    document.head.appendChild(link);
  }

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const marks = Array.isArray(student.marks) ? student.marks.slice(0, 6) : [];
  while (marks.length < 6) marks.push(null);

  const publishedMarks = marks
    .map((score, index) => ({ score, index, paper: paperNames[index] }))
    .filter(item => item.score !== null && item.score !== undefined && Number.isFinite(Number(item.score)))
    .map(item => ({ ...item, score: Number(item.score) }));

  const average = publishedMarks.length
    ? Math.round(publishedMarks.reduce((sum, item) => sum + item.score, 0) / publishedMarks.length)
    : null;
  const best = publishedMarks.length ? Math.max(...publishedMarks.map(item => item.score)) : null;
  const latest = publishedMarks.length ? publishedMarks[publishedMarks.length - 1].score : null;
  const change = publishedMarks.length > 1
    ? publishedMarks[publishedMarks.length - 1].score - publishedMarks[0].score
    : null;

  function renderPaperRows() {
    return marks.map((score, index) => {
      const hasMark = score !== null && score !== undefined && Number.isFinite(Number(score));
      const mark = hasMark ? Number(score) : null;
      return `
        <div class="g11-paper-result-row">
          <div class="g11-paper-num">${String(index + 1).padStart(2, "0")}</div>
          <div class="g11-paper-copy">
            <strong>${paperNames[index]}</strong>
            <small>${hasMark ? "Published mark" : "No result published yet"}</small>
          </div>
          <div class="g11-paper-score ${!hasMark ? "pending" : mark === 0 ? "zero" : ""}">
            ${hasMark ? `${mark}<small> / 100</small>` : "—"}
          </div>
        </div>`;
    }).join("");
  }

  function renderCollectionCard() {
    return `
      <article class="g11-result-collection g11-progress-result-collection" id="grade11TopRanking2026Collection">
        <div class="g11-collection-heading">
          <div>
            <span class="g11-collection-kicker">GRADE 11 · BUSINESS STUDIES &amp; ACCOUNTING</span>
            <h3>Top Ranking 2026 O/L</h3>
            <p>One common paper collection · Pilot Papers 01–06 · Marks out of 100</p>
          </div>
          <span class="g11-collection-count">${publishedMarks.length}/6 results</span>
        </div>

        <div class="g11-result-stats">
          <div><small>Average</small><strong>${average === null ? "—" : `${average}%`}</strong></div>
          <div><small>Best mark</small><strong>${best === null ? "—" : `${best}%`}</strong></div>
          <div><small>Latest paper</small><strong>${latest === null ? "—" : `${latest}%`}</strong></div>
          <div><small>Progress</small><strong class="${change === null ? "" : change >= 0 ? "positive" : "negative"}">${change === null ? "—" : `${change > 0 ? "+" : ""}${change}`}</strong></div>
        </div>

        <div class="g11-paper-list-heading">
          <strong>Paper results</strong>
          <span>${publishedMarks.length} published · 6 total</span>
        </div>
        <div class="g11-paper-results-list">${renderPaperRows()}</div>
      </article>`;
  }

  function toIndividualRows(rows) {
    return rows.map(row => {
      const score = row.score === null || row.score === undefined || row.score === ""
        ? null
        : Number(row.score);
      const maxScore = Number(row.maxScore) > 0 ? Number(row.maxScore) : 100;
      const hasScore = score !== null && Number.isFinite(score);
      const pct = hasScore ? Math.max(0, Math.min(100, Math.round(score / maxScore * 100))) : null;
      return `
        <article class="result">
          <div class="result-icon">📄</div>
          <div class="result-body">
            <div class="result-top"><span>${escapeHTML(row.exam || "Examination Paper")}</span><em>Published</em></div>
            <div class="result-main">
              <div><strong>${escapeHTML(row.studentName || student.name || "Student")}</strong><small>${escapeHTML(row.grade || "Grade 11")}</small></div>
              <div class="score">${hasScore ? score : "—"}<small>/${maxScore}</small>${pct === null ? "" : `<b>${pct}%</b>`}</div>
            </div>
            ${pct === null ? "" : `<div class="result-progress"><i style="width:${pct}%"></i></div>`}
          </div>
        </article>`;
    }).join("");
  }

  function renderBars(individualRows) {
    const chartRows = [
      ...publishedMarks.map(item => ({ label: item.paper, score: item.score, maxScore: 100 })),
      ...individualRows.map(row => ({
        label: row.exam || "Previous result",
        score: row.score === null || row.score === undefined || row.score === "" ? null : Number(row.score),
        maxScore: Number(row.maxScore) > 0 ? Number(row.maxScore) : 100
      })).filter(row => row.score !== null && Number.isFinite(row.score))
    ];

    const nextHTML = chartRows.length
      ? chartRows.map(row => {
          const pct = Math.max(0, Math.min(100, Math.round(row.score / row.maxScore * 100)));
          return `<div class="bar-item">
            <div class="bar-label"><span>${escapeHTML(row.label)}</span><b>${row.score}/${row.maxScore} · ${pct}%</b></div>
            <div class="bar-track"><i style="width:${pct}%"></i></div>
          </div>`;
        }).join("")
      : '<div class="empty">No published marks yet.</div>';

    // Idempotent rendering prevents the Results page MutationObserver from
    // repeatedly re-rendering the same chart and causing an update loop.
    if (scoreBars.innerHTML !== nextHTML) scoreBars.innerHTML = nextHTML;
  }

  function getLegacyRows() {
    const all = { ...GRADE11_RESULTS, "Top Ranking Exam 02": TOP_RANKING_EXAM_02 };
    return Object.entries(all).flatMap(([exam, list]) => {
      const match = Array.isArray(list)
        ? list.find(item => String(item.id).trim().toUpperCase() === studentId)
        : null;
      return match ? [{
        exam,
        studentName: match.name,
        grade: "Grade 11",
        score: match.score,
        maxScore: match.maxScore || 100
      }] : [];
    });
  }

  async function getPublishedRows() {
    try {
      const snapshot = await getDocs(query(
        collection(db, "studentResults"),
        where("studentId", "==", studentId)
      ));
      const rows = [];
      snapshot.forEach(docSnapshot => {
        const row = docSnapshot.data();
        if (row.published !== false) rows.push(row);
      });
      if (rows.length) return rows;
    } catch (error) {
      console.warn("Grade 11 result integration: Firestore results could not be loaded.", error);
    }
    return getLegacyRows();
  }

  function apply(individualRows) {
    const collectionHTML = renderCollectionCard();
    const otherHTML = toIndividualRows(individualRows);
    const resultHTML = collectionHTML + otherHTML;
    if (grid.innerHTML !== resultHTML) grid.innerHTML = resultHTML;

    const totalPublished = publishedMarks.length + individualRows.filter(row => {
      const score = row.score === null || row.score === undefined || row.score === "" ? null : Number(row.score);
      return score !== null && Number.isFinite(score);
    }).length;
    const allScores = [
      ...publishedMarks.map(item => item.score),
      ...individualRows.map(row => row.score === null || row.score === undefined || row.score === "" ? null : Number(row.score))
        .filter(score => score !== null && Number.isFinite(score))
    ];
    const totalAverage = allScores.length
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
      : null;

    const count = document.getElementById("resultsCount");
    const hint = document.getElementById("hint");
    const averageScore = document.getElementById("averageScore");
    const summaryResults = document.getElementById("summaryResults");
    if (count) count.textContent = `${totalPublished} Paper Result${totalPublished === 1 ? "" : "s"}`;
    if (hint) hint.textContent = "Your marks are grouped under their common examination title and matched to your Student ID.";
    if (averageScore) averageScore.textContent = totalAverage === null ? "—" : `${totalAverage}%`;
    if (summaryResults) summaryResults.textContent = String(totalPublished);

    renderBars(individualRows);
  }

  let individualRows = [];
  let ready = false;
  let scheduled = false;
  const scheduleApply = () => {
    if (!ready || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply(individualRows);
    });
  };

  // The page's original Firestore result renderer can update these containers.
  // The idempotent apply/render functions only repaint when content has changed.
  const observer = new MutationObserver(scheduleApply);
  observer.observe(grid, { childList: true, subtree: true, characterData: true });
  observer.observe(scoreBars, { childList: true, subtree: true, characterData: true });

  getPublishedRows().then(rows => {
    individualRows = rows;
    ready = true;
    apply(individualRows);
  }).catch(error => {
    console.error("Grade 11 common results could not be rendered.", error);
    individualRows = getLegacyRows();
    ready = true;
    apply(individualRows);
  });
})();
