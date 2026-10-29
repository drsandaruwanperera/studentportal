import {db,doc,getDoc} from "./firebase.js";

(() => {
  const normalize = value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const id = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();
  const al2028NumericIds = new Set("11074 11094 12705 13959 14069 14319 14334 14368 14369 14421 14723 14800 15189 15483 15508 15585 15690 15854 15960 16365 16889 16890 16891 16892 16895 16896 16898 16899 16900 16902 16903 16906 16907 16908 16909 16910 16913 16914 16915 16920 16923 16924 16941 16947 16966 16967 16975 16978 16979 16980 16986 16987 16988 16991 16995 17038 17039 17052 17054 17064 17071 17080 17093 17125 17172 17187 17188 17190 17191 17197 17205 17206 17207 17208 17209 17210 17212 17213 17218 17220 17225 17226 17240 17241 17242 17243 17244 17246 17247 17249 17254 17256 17269 17279 17280 17287 17288 17296 17306 17307 17317 17326 17327 17364 17366 17368 17386 17387 17427 17450".split(/\\s+/));
  const typeFromValue = value => {
    const v = normalize(value);
    if (["grade10","10","g10"].includes(v) || v.includes("grade10")) return "grade10";
    if (["grade11","11","g11"].includes(v) || v.includes("grade11")) return "grade11";
    if (["al","a/l","alevel","advancedlevel","advanced"].includes(v) || v.includes("advancedlevel")) return "al";
    return "";
  };
  const inferFromId = () => {
    if (al2028NumericIds.has(id)) return "al";
    // A/L admission IDs: A27000/A28000/A29000 and 27C/28C/29C or 27N/28N/29N series.
    if (/^A2[789]\d{3}$/.test(id) || /^(?:27|28|29)[CN]/.test(id)) return "al";
    if (/^\d{5}$/.test(id)) {
      const n = Number(id);
      if (n >= 26000 && n <= 26999) return "grade11";
      if (n >= 27000 && n <= 27999) return "grade10";
    }
    return "";
  };

  const getAlYear = data => {
    if (al2028NumericIds.has(id)) return "2028";
    if ([2027, 2028, 2029].includes(Number(data?.alYear))) return String(data.alYear);
    const savedYear = String(sessionStorage.getItem("alYear") || "").match(/^20(27|28|29)$/);
    if (savedYear) return savedYear[0];
    const contextYear = (String(sessionStorage.getItem("studentGrade") || "") + " " + String(sessionStorage.getItem("studentType") || ""))
      .match(/20(27|28|29)/);
    if (contextYear) return "20" + contextYear[1];
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
    const alYear = type === "al" ? getAlYear(data) : "";
    if (type === "al") sessionStorage.setItem("alYear", alYear);
    else sessionStorage.removeItem("alYear");
    const config = type === "al" && alYear === "2028"
      ? {
          ...routes.al,
          model: "theory-examination.html",
          past: null,
          modelTitle: "Theory Examination",
          pastTitle: "Past Papers",
          modelDescription: "A/L 2028 theory and examination preparation",
          pastDescription: ""
        }
      : routes[type];
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
    const topType = document.getElementById("topStudentType");
    const sideGrade = document.getElementById("sidebarStudentGrade");
    const topGrade = document.getElementById("studentGrade");
    const gradeLabel = document.getElementById("gradeLabel");
    if (title) title.innerHTML = type === "al"
      ? "Advanced Level<br><b>A/L " + alYear + "</b>"
      : config.label + " Learning Journey<br><b>Achieve Excellence</b>";
    if (eyebrow) eyebrow.textContent = type === "al" ? "YOUR LEARNING JOURNEY" : "YOUR " + config.label.toUpperCase() + " LEARNING JOURNEY";
    if (description) description.textContent = type === "al"
      ? "Prepare for your exams with monthly practice papers, one paper at a time."
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
    if (answersCard) answersCard.style.display = type === "al" && alYear === "2027" ? "none" : "";
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
  }

  async function init() {
    if (sessionStorage.getItem("loggedIn") !== "true") return;
    let type = al2028NumericIds.has(id) ? "al" : "";
    let studentData = {};
    if (id) {
      try {
        const snap = await getDoc(doc(db, "students", id));
        if (snap.exists()) {
          studentData = snap.data() || {};
          if (!al2028NumericIds.has(id)) {
            type = typeFromValue(studentData.studentType) || typeFromValue(studentData.grade);
          }
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
