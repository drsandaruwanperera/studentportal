import { db, doc, getDoc } from "./firebase.js";
import { TOP_RANKING_2026_OL_RESULTS } from "./grade11-top-ranking-2026-ol-data.js";

(() => {
  "use strict";

  // Increment this value when a new Grade 11 result batch is released.
  // Students who dismissed the previous release will then see the new notice.
  const RELEASE_ID = "top-ranking-2026-ol-pilot-01-06-v1";
  const STYLE_ID = "grade11-results-release-popup-styles";
  const POPUP_ID = "grade11-results-release-popup";
  const RESULTS_URL = "progress.html";
  const PAPER_NAMES = [
    "Pilot Paper No. 01",
    "Pilot Paper No. 02",
    "Pilot Paper No. 03",
    "Pilot Paper No. 04",
    "Pilot Paper No. 05",
    "Pilot Paper No. 06"
  ];

  if (window.__grade11ResultsReleasePopupLoaded) return;
  window.__grade11ResultsReleasePopupLoaded = true;

  const normalize = value => String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const isGrade11Value = value => {
    const valueNormalized = normalize(value);
    return valueNormalized === "11" || valueNormalized === "g11" || valueNormalized.includes("grade11");
  };

  function wasDismissed(studentId) {
    try {
      return localStorage.getItem(`drsp:results-release:${RELEASE_ID}:${studentId}`) === "dismissed";
    } catch (error) {
      console.warn("Could not read results notice preference.", error);
      return false;
    }
  }

  function rememberDismissal(studentId) {
    try {
      localStorage.setItem(`drsp:results-release:${RELEASE_ID}:${studentId}`, "dismissed");
    } catch (error) {
      console.warn("Could not save results notice preference.", error);
    }
  }

  function loadStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("./grade11-results-release-popup.css?v=1", import.meta.url).href;
    document.head.appendChild(link);
  }

  function getPublishedCount(student) {
    const marks = Array.isArray(student?.marks) ? student.marks : [];
    return marks.slice(0, PAPER_NAMES.length).filter(mark =>
      mark !== null && mark !== undefined && mark !== "" && Number.isFinite(Number(mark))
    ).length;
  }

  function showPopup(studentId, student) {
    if (document.getElementById(POPUP_ID)) return;
    loadStyles();

    const publishedCount = getPublishedCount(student);
    const overlay = document.createElement("div");
    overlay.id = POPUP_ID;
    overlay.className = "g11-release-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <section class="g11-release-card" role="dialog" aria-modal="true" aria-labelledby="g11-release-title" aria-describedby="g11-release-description">
        <button class="g11-release-close" type="button" aria-label="Close results announcement">&times;</button>
        <div class="g11-release-visual" aria-hidden="true">
          <div class="g11-release-visual-glow"></div>
          <svg class="g11-release-clipboard" viewBox="0 0 190 210" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M49 33h91a12 12 0 0 1 12 12v132a12 12 0 0 1-12 12H49a12 12 0 0 1-12-12V45a12 12 0 0 1 12-12Z" fill="#F8F7FF" stroke="#D7D1FF" stroke-width="4"/>
            <path d="M69 31v-7a10 10 0 0 1 10-10h31a10 10 0 0 1 10 10v7" stroke="#7B61E8" stroke-width="9" stroke-linecap="round"/>
            <path d="M69 72h57M69 108h57M69 144h43" stroke="#C7C2E9" stroke-width="7" stroke-linecap="round"/>
            <circle cx="53" cy="72" r="10" fill="#27B879"/><path d="m48 72 4 4 7-8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="53" cy="108" r="10" fill="#27B879"/><path d="m48 108 4 4 7-8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="53" cy="144" r="10" fill="#27B879"/><path d="m48 144 4 4 7-8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26 55 17 45M27 84l-13 1M156 61l12-10M158 91l15 4" stroke="#F1B84B" stroke-width="5" stroke-linecap="round"/>
            <path d="M39 180 29 188M151 164l13 7" stroke="#8A75ED" stroke-width="5" stroke-linecap="round"/>
          </svg>
          <span class="g11-release-check">&#10003;</span>
        </div>

        <div class="g11-release-content">
          <span class="g11-release-badge"><span aria-hidden="true">&#128276;</span> New Update</span>
          <p class="g11-release-grade">GRADE 11 STUDENT ANNOUNCEMENT</p>
          <h2 id="g11-release-title">Grade 11 <span>Results Out!</span></h2>
          <h3>Top Ranking 2026 O/L – Business Studies &amp; Accounting</h3>
          <p id="g11-release-description">Your Pilot Paper 01–06 results are now available in your Results section.</p>
          <p class="g11-release-count">${publishedCount} of 6 paper results published</p>
          <div class="g11-release-actions">
            <button class="g11-release-view" type="button">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 16V9h3v7H3Zm5 0V5h3v11H8Zm5 0V2h3v14h-3Z" fill="currentColor"/><path d="M2 18h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              View Results <span aria-hidden="true">&#8594;</span>
            </button>
            <button class="g11-release-later" type="button">Maybe Later</button>
          </div>
        </div>
      </section>`;

    const dismiss = () => {
      rememberDismissal(studentId);
      overlay.classList.remove("is-visible");
      document.body.classList.remove("g11-release-modal-open");
      window.setTimeout(() => overlay.remove(), 240);
    };

    overlay.querySelector(".g11-release-close").addEventListener("click", dismiss);
    overlay.querySelector(".g11-release-later").addEventListener("click", dismiss);
    overlay.querySelector(".g11-release-view").addEventListener("click", () => {
      rememberDismissal(studentId);
      window.location.assign(RESULTS_URL);
    });
    overlay.addEventListener("click", event => {
      if (event.target === overlay) dismiss();
    });
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    });

    document.body.appendChild(overlay);
    document.body.classList.add("g11-release-modal-open");
    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      overlay.querySelector(".g11-release-close")?.focus();
    });
  }

  async function isGrade11Student(studentId) {
    // Prefer the student profile, because the profile is the authoritative grade.
    try {
      const snapshot = await getDoc(doc(db, "students", studentId));
      if (snapshot.exists()) {
        const profile = snapshot.data() || {};
        const profileGrade = [profile.studentType, profile.grade, profile.studentGrade]
          .find(value => value !== null && value !== undefined && String(value).trim() !== "");
        if (profileGrade !== undefined) return isGrade11Value(profileGrade);
      }
    } catch (error) {
      console.warn("Could not verify Grade 11 profile; checking the signed-in grade.", error);
    }

    const sessionGrade = sessionStorage.getItem("studentType") || sessionStorage.getItem("studentGrade");
    if (sessionGrade) return isGrade11Value(sessionGrade);

    // Grade 11 numeric IDs are 26000–26999 in the current dashboard routing.
    const numericId = Number(studentId);
    return Number.isInteger(numericId) && numericId >= 26000 && numericId <= 26999;
  }

  async function init() {
    if (sessionStorage.getItem("loggedIn") !== "true") return;
    const studentId = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();
    if (!studentId || wasDismissed(studentId)) return;

    const student = TOP_RANKING_2026_OL_RESULTS.find(item =>
      String(item.id || "").trim().toUpperCase() === studentId
    );
    if (!student || getPublishedCount(student) === 0) return;
    if (!(await isGrade11Student(studentId))) return;

    // Wait until the dashboard has painted before opening the announcement.
    window.setTimeout(() => showPopup(studentId, student), 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
