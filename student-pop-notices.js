import { db, collection, doc, getDoc, getDocs } from "./firebase.js";

(() => {
  "use strict";

  const POPUP_ID = "student-exam-pop-notice";
  const STYLE_ID = "student-exam-pop-notice-css";
  const DISMISS_PREFIX = "drsp:student-pop-notice:dismissed:";
  const BLOCKING_POPUPS = ["grade11-results-release-popup", "al2027-answer-release-popup"];

  if (window.__studentPopNoticesLoaded) return;
  window.__studentPopNoticesLoaded = true;

  const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const studentId = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();
  if (sessionStorage.getItem("loggedIn") !== "true" || !studentId) return;

  const toMillis = value => {
    if (value && typeof value.toMillis === "function") return value.toMillis();
    if (value instanceof Date) return value.getTime();
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  async function resolveAudience() {
    let profile = {};
    try {
      const snapshot = await getDoc(doc(db, "students", studentId));
      if (snapshot.exists()) profile = snapshot.data() || {};
    } catch (error) {
      console.warn("Pop notice profile check failed; using signed-in student context.", error);
    }

    const values = [
      profile.studentType, profile.grade, profile.studentGrade, profile.stream,
      sessionStorage.getItem("studentType"), sessionStorage.getItem("studentGrade")
    ].map(normalize).filter(Boolean);

    if (values.some(value => value === "grade11" || value === "g11" || value === "11" || value.includes("grade11"))) {
      return "grade11";
    }

    const idGradeNumber = /^\d{5}$/.test(studentId) ? Number(studentId) : 0;
    if (idGradeNumber >= 26000 && idGradeNumber <= 26999) return "grade11";

    const isAL = values.some(value =>
      value === "al" || value.startsWith("al") || value.includes("alevel") || value.includes("advancedlevel") || value.includes("advanced")
    ) || /^A2[789]\d{3}$/.test(studentId) || /^(?:27|28|29)[CN]/.test(studentId);

    if (!isAL) return "";

    let year = Number(profile.alYear) || Number(sessionStorage.getItem("alYear")) || 0;
    const idMatch = studentId.match(/^(?:A)?(27|28|29)\d{3}$/) || studentId.match(/^(27|28|29)[CN]/);
    if (!year && idMatch) year = Number("20" + idMatch[1]);

    if (!year) {
      const context = values.join(" ") + " " + normalize(profile.grade) + " " + normalize(profile.studentType);
      const match = context.match(/20(27|28|29)/);
      if (match) year = Number("20" + match[1]);
    }

    // Match the existing dashboard router fallback for A/L accounts with no explicit year.
    if (!year) year = 2027;
    return year === 2027 ? "al2027" : "";
  }

  function dismissalKey(notice) {
    const version = toMillis(notice.updatedAt) || toMillis(notice.createdAt) || 1;
    return DISMISS_PREFIX + encodeURIComponent(notice.id) + ":" + studentId + ":" + version;
  }

  function wasDismissed(notice) {
    try {
      return localStorage.getItem(dismissalKey(notice)) === "yes";
    } catch (error) {
      console.warn("Could not read pop notice dismissal state.", error);
      return false;
    }
  }

  function rememberDismissal(notice) {
    try {
      localStorage.setItem(dismissalKey(notice), "yes");
    } catch (error) {
      console.warn("Could not save pop notice dismissal state.", error);
    }
  }

  function loadStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = new URL("./student-pop-notices.css?v=1", import.meta.url).href;
    document.head.appendChild(link);
  }

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  function formatTargetDate(targetAt) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo", day: "numeric", month: "long", year: "numeric"
    }).format(new Date(targetAt));
  }

  function getDestination(url) {
    const fallback = "my-program.html";
    try {
      const destination = new URL(String(url || fallback), window.location.href);
      return destination.origin === window.location.origin ? destination.href : new URL(fallback, window.location.href).href;
    } catch {
      return new URL(fallback, window.location.href).href;
    }
  }

  function countdownMarkup(targetAt) {
    return `
      <div class="spn-countdown" data-countdown-target="${targetAt}" aria-label="Time remaining until the examination">
        <div class="spn-time-box"><strong data-unit="days">000</strong><span>Days</span></div>
        <div class="spn-time-box"><strong data-unit="hours">00</strong><span>Hours</span></div>
        <div class="spn-time-box"><strong data-unit="minutes">00</strong><span>Minutes</span></div>
        <div class="spn-time-box"><strong data-unit="seconds">00</strong><span>Seconds</span></div>
      </div>
    `;
  }

  function updateCountdown(root, targetAt) {
    const remaining = Math.max(0, targetAt - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const values = { days: String(days).padStart(2, "0"), hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"), seconds: String(seconds).padStart(2, "0") };
    Object.entries(values).forEach(([unit, value]) => {
      const element = root.querySelector('[data-unit="' + unit + '"]');
      if (element) element.textContent = value;
    });

    const state = root.querySelector(".spn-countdown-state");
    if (state) state.textContent = remaining > 0 ? "Countdown to " + formatTargetDate(targetAt) : "The examination has started";
  }

  function showNotice(notice, onDismiss, onNavigate) {
    if (document.getElementById(POPUP_ID)) return;
    loadStyles();

    const targetAt = toMillis(notice.targetAt);
    if (!targetAt) {
      onDismiss();
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = POPUP_ID;
    overlay.className = "spn-overlay";
    overlay.setAttribute("role", "presentation");

    overlay.innerHTML = `
      <section class="spn-card" role="dialog" aria-modal="true" aria-labelledby="spn-title" aria-describedby="spn-message">
        <button class="spn-close" type="button" aria-label="Close notice">&times;</button>
        <div class="spn-snow spn-snow-one" aria-hidden="true">❄</div>
        <div class="spn-snow spn-snow-two" aria-hidden="true">❄</div>
        <div class="spn-calendar-art" aria-hidden="true">
          <div class="spn-calendar-rings"><i></i><i></i></div>
          <div class="spn-calendar-head"></div>
          <div class="spn-calendar-month">EXAM<br>DAY</div>
          <div class="spn-calendar-dots"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="spn-content">
          <span class="spn-badge"><span aria-hidden="true">▦</span> Exam Countdown</span>
          <p class="spn-audience">${escapeHTML((notice.audiences || []).map(x => x === "grade11" ? "GRADE 11" : x === "al2027" ? "A/L 2027" : x).join(" · "))} STUDENT NOTICE</p>
          <h2 id="spn-title">${escapeHTML(notice.title || "Exam Countdown")}</h2>
          <h3>${escapeHTML(notice.subtitle || "Your examination is getting closer")}</h3>
          <p class="spn-message" id="spn-message">${escapeHTML(notice.message || "Your examination countdown is now available.")}</p>
          <p class="spn-countdown-label">${escapeHTML(notice.countdownLabel || "Time remaining")}</p>
          ${countdownMarkup(targetAt)}
          <p class="spn-countdown-state"></p>
          <div class="spn-actions">
            <button class="spn-view-btn" type="button">${escapeHTML(notice.buttonLabel || "View Exam Details")} <span aria-hidden="true">→</span></button>
            <button class="spn-later-btn" type="button">Maybe Later</button>
          </div>
        </div>
      </section>`;

    const close = () => {
      rememberDismissal(notice);
      clearInterval(timer);
      overlay.classList.remove("is-visible");
      document.body.classList.remove("spn-modal-open");
      window.setTimeout(() => {
        overlay.remove();
        onDismiss();
      }, 220);
    };

    overlay.querySelector(".spn-close").addEventListener("click", close);
    overlay.querySelector(".spn-later-btn").addEventListener("click", close);
    overlay.querySelector(".spn-view-btn").addEventListener("click", () => {
      rememberDismissal(notice);
      clearInterval(timer);
      onNavigate();
      window.location.assign(getDestination(notice.buttonUrl));
    });
    overlay.addEventListener("click", event => {
      if (event.target === overlay) close();
    });
    overlay.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });

    document.body.appendChild(overlay);
    document.body.classList.add("spn-modal-open");
    updateCountdown(overlay, targetAt);
    const timer = setInterval(() => updateCountdown(overlay, targetAt), 1000);
    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
      overlay.querySelector(".spn-close")?.focus();
    });
  }

  function waitForExistingNotices(callback) {
    const isAnotherPopupOpen = () => BLOCKING_POPUPS.some(id => document.getElementById(id));
    if (!isAnotherPopupOpen()) {
      window.setTimeout(callback, 850);
      return;
    }
    const observer = new MutationObserver(() => {
      if (!isAnotherPopupOpen()) {
        observer.disconnect();
        window.setTimeout(callback, 500);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function init() {
    try {
      const audience = await resolveAudience();
      if (!audience) return;

      const snapshot = await getDocs(collection(db, "popNotices"));
      const now = Date.now();
      const matching = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .filter(item => {
          if (item.id.startsWith("__")) return false;
          if (item.enabled === false) return false;
          if (!(item.audiences || []).includes(audience)) return false;
          const start = toMillis(item.startsAt);
          const end = toMillis(item.endsAt);
          return start > 0 && end > 0 && start <= now && now < end && toMillis(item.targetAt) > 0;
        })
        .sort((a, b) => {
          const priority = Number(b.priority || 0) - Number(a.priority || 0);
          return priority || (toMillis(b.updatedAt) - toMillis(a.updatedAt));
        })
        .filter(item => !wasDismissed(item));

      if (!matching.length) return;

      let index = 0;
      let navigating = false;
      const showNext = () => {
        if (navigating || index >= matching.length || !document.body) return;
        const notice = matching[index++];
        if (document.visibilityState !== "visible") return;
        showNotice(notice, () => {
          if (!navigating && index < matching.length) window.setTimeout(showNext, 450);
        }, () => { navigating = true; });
      };

      waitForExistingNotices(showNext);
    } catch (error) {
      console.warn("Student pop notices could not be loaded:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();