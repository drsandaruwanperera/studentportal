import {db,doc,getDoc} from "./firebase.js";

(() => {
  const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const id = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();
  const typeFromValue = value => {
    const v = normalize(value);
    if (["grade10","10","g10"].includes(v) || v.includes("grade10")) return "grade10";
    if (["grade11","11","g11"].includes(v) || v.includes("grade11")) return "grade11";
    if (["al","a/l","alevel","advancedlevel","advanced"].includes(v) || v.includes("advancedlevel")) return "al";
    return "";
  };
  const inferFromId = () => {
    // A/L admission IDs: A27000/A28000/A29000 and 27C/28C/29C or 27N/28N/29N series.
    if (/^A2[789]\d{3}$/.test(id) || /^(?:27|28|29)[CN]/.test(id)) return "al";
    if (/^\d{5}$/.test(id)) {
      const n = Number(id);
      if (n >= 26000 && n <= 26999) return "grade11";
      if (n >= 27000 && n <= 27999) return "grade10";
    }
    return "";
  };

  const getAlYear = () => {
    const match = id.match(/^(?:A)?(27|28|29)/) || id.match(/^(27|28|29)[CN]/);
    if (!match) return "2027";
    return "20" + match[1];
  };
  const routes = {
    grade10: {
      label: "Grade 10",
      model: "grade10-model-papers.html",
      past: null,
      modelTitle: "Model Papers",
      pastTitle: "Past Papers",
      modelDescription: "Grade 10 model papers and practice resources",
      pastDescription: "Grade 10 past papers"
    },
    grade11: {
      label: "Grade 11",
      model: "grade11-model-papers.html",
      past: "grade11-past-paper.html",
      modelTitle: "TOP Ranking Papers",
      pastTitle: "Past Papers",
      modelDescription: "Grade 11 TOP Ranking papers",
      pastDescription: "Past papers for exam practice"
    },
    al: {
      label: "Advanced Level",
      model: "model-papers.html",
      past: "province-paper1.html",
      modelTitle: "A/L Model Papers",
      pastTitle: "Province Papers",
      modelDescription: "Advanced Level model papers",
      pastDescription: "Provincial examination papers"
    }
  };

  function applyGrade(type, data = {}) {
    const config = routes[type];
    document.documentElement.dataset.studentType = type || "unknown";
    if (!config) {
      const title = document.querySelector(".learning-banner-copy h2");
      if (title) title.innerHTML = "Your Learning Journey<br><b>Starts Here</b>";
      return;
    }
    sessionStorage.setItem("studentType", type);
    sessionStorage.setItem("studentGrade", config.label);

    const title = document.querySelector(".learning-banner-copy h2");
    const eyebrow = document.querySelector(".learning-banner-copy>span");
    const description = document.querySelector(".learning-banner-copy p");
    const alYear = type === "al" ? getAlYear() : "";
    const topType = document.getElementById("topStudentType");
    const sideGrade = document.getElementById("sidebarStudentGrade");
    const topGrade = document.getElementById("studentGrade");
    const gradeLabel = document.getElementById("gradeLabel");
    if (title) title.innerHTML = type === "al"
      ? "A/L <b>" + alYear + "</b><br>TOP Ranking Papers"
      : config.label + " Learning Journey<br><b>Achieve Excellence</b>";
    if (eyebrow) eyebrow.textContent = type === "al" ? "YOUR LEARNING JOURNEY" : "YOUR " + config.label.toUpperCase() + " LEARNING JOURNEY";
    if (description) description.textContent = type === "al"
      ? "Prepare for your exams with monthly practice papers, one paper at a time."
      : "Welcome back. Your " + config.label + " papers, learning resources, announcements and progress are organized here for you.";
    if (topType) topType.textContent = config.label + " Student";
    if (sideGrade) sideGrade.textContent = config.label + " Student";
    if (topGrade) topGrade.textContent = config.label;
    if (gradeLabel) gradeLabel.textContent = config.label;

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
  }

  async function init() {
    if (sessionStorage.getItem("loggedIn") !== "true") return;
    let type = "";
    let studentData = {};
    if (id) {
      try {
        const snap = await getDoc(doc(db, "students", id));
        if (snap.exists()) {
          studentData = snap.data() || {};
          type = typeFromValue(studentData.studentType) || typeFromValue(studentData.grade);
        }
      } catch (error) {
        console.warn("Could not refresh student grade from profile; using saved login grade.", error);
      }
    }
    // The Firebase profile is authoritative; if its category is missing,
    // infer from the admission ID before falling back to potentially stale session values.
    type = type || inferFromId() ||
      typeFromValue(sessionStorage.getItem("studentType")) ||
      typeFromValue(sessionStorage.getItem("studentGrade"));
    applyGrade(type, studentData);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
})();
