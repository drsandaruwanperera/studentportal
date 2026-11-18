import { db, doc, getDoc } from "./firebase.js";

(() => {
  "use strict";

  const RELEASE_ID = "al2027-november-top-ranking-paper-answer-v1";
  const POPUP_ID = "al2027-answer-release-popup";
  const STYLE_ID = "al2027-answer-release-popup-styles";
  const DESTINATION = "al-top-ranking-paper.html?paper=01&month=november&year=2026&focus=answers";
  const ANSWER_FILES = [
    "answers/al-top-ranking/november/paper-01-1st-answer.pdf",
    "answers/al-top-ranking/november/paper-01-2nd-answer.pdf"
  ];

  const al2028NumericIds = new Set(
    "11074 11094 12705 13959 14069 14319 14334 14368 14369 14421 14723 14800 15189 15483 15508 15585 15690 15854 15960 16365 16889 16890 16891 16892 16895 16896 16898 16899 16900 16902 16903 16906 16907 16908 16909 16910 16913 16914 16915 16920 16923 16924 16941 16947 16966 16967 16975 16978 16979 16980 16986 16987 16988 16991 16995 17038 17039 17052 17054 17064 17071 17080 17093 17125 17172 17187 17188 17190 17191 17197 17205 17206 17207 17208 17209 17210 17212 17213 17218 17220 17225 17226 17240 17241 17242 17243 17244 17246 17247 17249 17254 17256 17269 17279 17280 17287 17288 17296 17306 17307 17317 17326 17327 17364 17366 17368 17386 17387 17427 17450".split(/\s+/)
  );

  if (window.__al2027AnswerReleasePopupLoaded) return;
  window.__al2027AnswerReleasePopupLoaded = true;

  const normalize = value => String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const isAlValue = value => {
    const v = normalize(value);
    return ["al", "a/l", "alevel", "advanced", "advancedlevel"].includes(v) ||
      v.includes("advancedlevel") || /^al20(?:27|28|29)$/.test(v);
  };

  function getAlYear(profile, studentId) {
    if (al2028NumericIds.has(studentId)) return "2028";

    const explicitYear = Number(profile?.alYear);
    if ([2027, 2028, 2029].includes(explicitYear)) return String(explicitYear);

    const storedYear = String(sessionStorage.getItem("alYear") || "").match(/^20(27|28|29)$/);
    if (storedYear) return storedYear[0];

    const contextYear = (
      String(sessionStorage.getItem("studentGrade") || "") + " " +
      String(sessionStorage.getItem("studentType") || "") + " " +
      String(profile?.studentType || "") + " " +
      String(profile?.grade || "")
    ).match(/20(27|28|29)/);
    if (contextYear) return "20" + contextYear[1];

    const match = studentId.match(/^(?:A)?(27|28|29)/) || studentId.match(/^(27|28|29)[CN]/);
    if (match) return "20" + match[1];

    // Match the dashboard router's fallback for A/L accounts without an explicit cohort year.
    return "2027";
  }

  function wasDismissed(studentId) {
    try {
      return localStorage.getItem("drsp:al-answer-release:" + RELEASE_ID + ":" + studentId) === "dismissed";
    } catch (error) {
      console.warn("Could not read A/L answer announcement preference.", error);
      return false;
    }
  }

  function rememberDismissal(studentId) {
    try {
      localStorage.setItem("drsp:al-answer-release:" + RELEASE_ID + ":" + studentId, "dismissed");
    } catch (error) {
      console.warn("Could not save A/L answer announcement preference.", error);
    }
  }

  async function verifyAnswerFiles() {
    const results = await Promise.all(ANSWER_FILES.map(async path => {
      try {
        const response = await fetch(path, { method: "HEAD", cache: "no-store" });
        return response.ok;
      } catch (error) {
        console.warn("Could not verify answer file:", path, error);
        return false;
      }
    }));
    return results.every(Boolean);
  }

  function loadStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("./al2027-answer-release-popup.css?v=1", import.meta.url).href;
    document.head.appendChild(link);
  }

  function showPopup(studentId) {
    if (document.getElementById(POPUP_ID)) return;
    loadStyles();

    const overlay = document.createElement("div");
    overlay.id = POPUP_ID;
    overlay.className = "al27-release-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <section class="al27-release-card" role="dialog" aria-modal="true"
        aria-labelledby="al27-release-title" aria-describedby="al27-release-description">
        <button class="al27-release-close" type="button" aria-label="Close announcement">&times;</button>

        <div class="al27-release-visual" aria-hidden="true">
          <div class="al27-release-visual-glow"></div>
          <svg class="al27-release-clipboard" viewBox="0 0 190 210" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M49 33h91a12 12 0 0 1 12 12v132a12 12 0 0 1-12 12H49a12 12 0 0 1-12-12V45a12 12 0 0 1 12-12Z" fill="#F8F7FF" stroke="#D7D1FF" stroke-width="4"/>
            <path d="M69 31v-7a10 10 0 0 1 10-10h31a10 10 0 0 1 10 10v7" stroke="#7B61E8" stroke-width="9" stroke-linecap="round"/>
            <path d="M69 72h57M69 108h57M69 144h43" stroke="#C7C2E9" stroke-width="7" stroke-linecap="round"/>
            <circle cx="53" cy="72" r="10" fill="#27B879"/><path d="m48 72 4 4 7-8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="53" cy="108" r="10" fill="#27B879"/><path d="m48 108 4 4 7-8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="53" cy="144" r="10" fill="#27B879"/><path d="m48 144 4 4 7-8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26 55 17 45M27 84l-13 1M156 61l12-10M158 91l15 4" stroke="#F1B84B" stroke-width="5" stroke-linecap="round"/>
          </svg>
          <span class="al27-release-check">&#10003;</span>
        </div>

        <div class="al27-release-content">
          <span class="al27-release-badge"><span aria-hidden="true">&#128276;</span> New Answer Release</span>
          <p class="al27-release-grade">A/L 2027 STUDENT ANNOUNCEMENT</p>
          <h2 id="al27-release-title">A/L 2027 <span>November</span></h2>
          <h3>TOP Ranking Paper Answer Out!</h3>
          <p id="al27-release-description">
            November Top Ranking Paper 01 answer sheets are now available.
            View both the 1st Paper and 2nd Paper answers inside your student portal.
          </p>
          <p class="al27-release-count">1st Paper Answer · 2nd Paper Answer · Online Viewer</p>
          <div class="al27-release-actions">
            <button class="al27-release-view" type="button">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 16V9h3v7H3Zm5 0V5h3v11H8Zm5 0V2h3v14h-3Z" fill="currentColor"/><path d="M2 18h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              View Answer <span aria-hidden="true">&#8594;</span>
            </button>
            <button class="al27-release-later" type="button">Maybe Later</button>
          </div>
        </div>
      </section>`;

    const dismiss = () => {
      rememberDismissal(studentId);
      overlay.classList.remove("is-visible");
      document.body.classList.remove("al27-release-modal-open");
      window.setTimeout(() => overlay.remove(), 240);
    };

    overlay.querySelector(".al27-release-close").addEventListener("click", dismiss);
    overlay.querySelector(".al27-release-later").addEventListener("click", dismiss);
    overlay.querySelector(".al27-release-view").addEventListener("click", () => {
      rememberDismissal(studentId);
      window.location.assign(DESTINATION);
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
    document.body.classList.add("al27-release-modal-open");
    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      overlay.querySelector(".al27-release-close")?.focus();
    });
  }

  async function init() {
    if (sessionStorage.getItem("loggedIn") !== "true") return;

    const studentId = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();
    if (!studentId || wasDismissed(studentId)) return;

    try {
      const snapshot = await getDoc(doc(db, "students", studentId));
      if (!snapshot.exists()) return;

      const profile = snapshot.data() || {};
      const profileType = [
        profile.studentType,
        profile.grade,
        profile.stream,
        profile.studentLevel,
        sessionStorage.getItem("studentType"),
        sessionStorage.getItem("studentGrade")
      ].find(value => value !== null && value !== undefined && String(value).trim() !== "");

      if (!isAlValue(profileType)) return;
      if (getAlYear(profile, studentId) !== "2027") return;
      if (!(await verifyAnswerFiles())) return;

      window.setTimeout(() => showPopup(studentId), 550);
    } catch (error) {
      console.error("A/L 2027 answer announcement could not be checked:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();