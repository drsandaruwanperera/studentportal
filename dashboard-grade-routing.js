import {db,doc,getDoc} from "./firebase.js";

(() => {
  const routes = {
    grade10: {
      label: "Grade 10",
      model: "grade10-model-papers.html",
      past: null,
      modelTitle: "Term Test Model Papers",
      pastTitle: "Past Papers",
      modelDescription: "Grade 10 term test model papers",
      modelAnswers: "student-model-answers.html",
      pastDescription: "Grade 10 past papers"
    },
    grade11: {
      label: "Grade 11",
      model: "grade11-model-papers.html",
      past: null,
      modelTitle: "TOP Ranking Papers",
      pastTitle: "Past Papers",
      modelDescription: "Grade 11 TOP Ranking papers",
      modelAnswers: "student-model-answers.html",
      pastDescription: ""
    },
    al: {
      label: "Advanced Level",
      model: "model-papers.html",
      past: null,
      modelTitle: "Monthly TOP Ranking Papers",
      pastTitle: "Province Papers",
      modelDescription: "Month-wise A/L 2027 TOP Ranking papers with their matching answers",
      pastDescription: ""
    }
  };

  function applyGrade(type, data = {}) {
    // Resolve the year through the shared module — no "2027" default.
    // An A/L student with no year anywhere is "unknown" and fails closed.
    const session = {
      studentId: sessionStorage.getItem("studentId"),
      studentType: sessionStorage.getItem("studentType"),
      studentGrade: sessionStorage.getItem("studentGrade"),
      alYear: sessionStorage.getItem("alYear")
    };
    const alYear = type === "al" ? window.LmsCohort.resolveYear(data, session) : "";
    if (type === "al" && !alYear) {
      window.LmsCohort.showUnknownCohort();
      const title = document.querySelector(".learning-banner-copy h2");
      if (title) title.innerHTML = "Your Learning Journey<br><b>Starts Here</b>";
      return;
    }
    if (type === "al") sessionStorage.setItem("alYear", alYear);
    else sessionStorage.removeItem("alYear");
    const config = type === "al" && alYear === "2028"
      ? {
          ...routes.al,
          model: "model-papers.html",
          past: null,
          modelTitle: "Theory Examination",
          pastTitle: "Past Papers",
          modelDescription: "A/L 2028 theory and examination preparation",
          pastDescription: ""
        }
      : routes[type];
    if (!config) {
      // Fail closed: hide every study card and show "cohort not set —
      // contact admin" instead of returning with the default-visible
      // cards still on screen.
      window.LmsCohort.showUnknownCohort();
      const title = document.querySelector(".learning-banner-copy h2");
      if (title) title.innerHTML = "Your Learning Journey<br><b>Starts Here</b>";
      return;
    }
    document.documentElement.dataset.studentType = type || "unknown";
    sessionStorage.setItem("studentType", type);
    sessionStorage.setItem("studentGrade", config.label);

    const title = document.querySelector(".learning-banner-copy h2");
    const eyebrow = document.querySelector(".learning-banner-copy>span");
    const description = document.querySelector(".learning-banner-copy p");
    const topType = document.getElementById("topStudentType");
    const sideGrade = document.getElementById("sidebarStudentGrade");
    const topGrade = document.getElementById("studentGrade");
    const gradeLabel = document.getElementById("gradeLabel");
    if (title) title.innerHTML = type === "al"
      ? "Advanced Level<br><b>A/L " + alYear + "</b>"
      : config.label + " Learning Journey<br><b>Achieve Excellence</b>";
    if (eyebrow) eyebrow.textContent = type === "al" ? "YOUR LEARNING JOURNEY" : "YOUR " + config.label.toUpperCase() + " LEARNING JOURNEY";
    if (description) description.textContent = type === "al"
      ? (alYear === "2028"
          ? "Access your A/L 2028 Theory Examination, Smart Book answers and School Paper answers."
          : "Prepare for your exams with monthly practice papers, one paper at a time.")
      : "Welcome back. Your " + config.label + " papers, learning resources, announcements and progress are organized here for you.";
    if (topType) topType.textContent = type === "al" ? "A/L " + alYear + " Student" : config.label + " Student";
    if (sideGrade) sideGrade.textContent = type === "al" ? "A/L " + alYear + " Student" : config.label + " Student";
    if (topGrade) topGrade.textContent = type === "al" ? "A/L " + alYear : config.label;
    if (gradeLabel) gradeLabel.textContent = type === "al" ? "A/L " + alYear : config.label;

    const model = document.getElementById("modelPapersCard");
    const past = document.getElementById("pastPapersCard");
    if (model) {
      model.href = config.model;
      model.setAttribute("aria-label", config.modelTitle);
      const h = document.getElementById("modelPapersTitle");
      const d = document.getElementById("modelPapersDescription");
      if (h) h.textContent = config.modelTitle;
      if (d) d.textContent = config.modelDescription;
    }
    if (past) {
      if (!config.past) {
        past.style.display = "none";
      } else {
        past.style.display = "";
        past.href = config.past;
      past.setAttribute("aria-label", config.pastTitle);
      const h = document.getElementById("pastPapersTitle");
      const d = document.getElementById("pastPapersDescription");
      if (h) h.textContent = config.pastTitle;
      if (d) d.textContent = config.pastDescription;
      }
    }
    if (config.past) {
      document.querySelectorAll('a[href="past-papers.html"]').forEach(a => a.href = config.past);
    }
    document.querySelectorAll('a[href="model-papers.html"]').forEach(a => a.href = config.model);
    const answersCard = document.getElementById("modelPaperAnswersCard");
    if (answersCard) {
      const showModelAnswers = type === "grade10" || type === "grade11" || (type === "al" && alYear === "2028");
      answersCard.hidden = !showModelAnswers;
      answersCard.setAttribute("aria-hidden", String(!showModelAnswers));
      if (showModelAnswers) {
        answersCard.href = config.modelAnswers || "student-model-answers.html";
      }
    }
    const quickPapers = [...document.querySelectorAll(".quick-nav-card")].find(a => /past papers/i.test(a.textContent));
    if (quickPapers) {
      if (!config.past) {
        quickPapers.style.display = "none";
      } else {
        quickPapers.style.display = "";
        quickPapers.href = config.past;
        const label = quickPapers.querySelector("strong");
        const sub = quickPapers.querySelector("small");
        if (label) label.textContent = config.pastTitle;
        if (sub) sub.textContent = config.pastDescription;
      }
    }
    const quickProgram = [...document.querySelectorAll(".quick-nav-card")].find(a => /my program/i.test(a.textContent));
    if (quickProgram) {
      const sub = quickProgram.querySelector("small");
      if (sub) sub.textContent = config.label + " learning resources";
    }
    window.renderDashboardHome?.(type === "al" ? "al" + alYear : type, alYear);
    window.LmsCohort.applyCohortVisibility(type === "al" ? "al" + alYear : type);
  }

  async function init() {
    if (sessionStorage.getItem("loggedIn") !== "true") return;
    const session = {
      studentId: sessionStorage.getItem("studentId"),
      studentType: sessionStorage.getItem("studentType"),
      studentGrade: sessionStorage.getItem("studentGrade"),
      alYear: sessionStorage.getItem("alYear")
    };
    let studentData = {};
    if (session.studentId) {
      try {
        const snap = await getDoc(doc(db, "students", session.studentId));
        if (snap.exists()) {
          studentData = snap.data() || {};
        }
      } catch (error) {
        console.warn("Could not refresh student grade from profile; using saved login grade.", error);
      }
    }
    // The Firebase profile is authoritative; resolve the cohort once
    // via the shared module (no year/cohort defaults — unknown fails
    // closed in applyGrade).
    const resolved = window.LmsCohort.resolveCohort(studentData, session);
    applyGrade(resolved.type, studentData);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
})();
