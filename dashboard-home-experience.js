(() => {
  const cohorts = {
    grade10: {
      label: "Grade 10", eyebrow: "YOUR GRADE 10 LEARNING JOURNEY",
      title: "Build confidence.<br><b>Make every lesson count.</b>",
      description: "Your Grade 10 papers, learning resources and progress — organized in one place to help you keep moving forward.",
      badge: "GRADE 10 PATHWAY", model: "grade10-model-papers.html", modelTitle: "Model Papers",
      modelDescription: "Structured practice for Grade 10.", past: null, exam: null,
      hub: true, hubTitle: "Learning Resources", hubDescription: "Study notes and materials selected for Grade 10.",
      progress: true, smartBook: false, schoolPapers: false
    },
    grade11: {
      label: "Grade 11", eyebrow: "YOUR GRADE 11 LEARNING JOURNEY",
      title: "Prepare with purpose.<br><b>Build exam confidence.</b>",
      description: "Your Grade 11 papers, learning resources and progress — organized in one place to help you keep moving forward.",
      badge: "GRADE 11 PATHWAY", model: "grade11-model-papers.html", modelTitle: "TOP Ranking Papers",
      modelDescription: "Focused practice for Grade 11 exams.", past: "grade11-past-paper.html", pastTitle: "Past Papers",
      pastDescription: "Build confidence with examination practice.", hub: false, progress: true,
      smartBook: false, schoolPapers: false,
      exam: { kicker: "YOUR NEXT BIG MILESTONE", title: "Your O/L exams are getting closer.",
        copy: "Official examination window: 07–17 December 2027 · Countdown to the first exam day.",
        startsAt: "2027-12-07T00:00:00+05:30", endsAt: "2027-12-18T00:00:00+05:30" }
    },
    al2027: {
      label: "A/L 2027", eyebrow: "YOUR LEARNING JOURNEY",
      title: "One paper at a time.<br><b>Move closer to your goal.</b>",
      description: "Prepare for your exams with structured Advanced Level practice and resources for your year.",
      badge: "A/L 2027 PATHWAY", model: "model-papers.html", modelTitle: "A/L Model Papers",
      modelDescription: "Structured practice for A/L 2027.", past: "province-paper1.html", pastTitle: "Province Papers",
      pastDescription: "Practice with provincial examination papers.", hub: false, progress: false,
      smartBook: false, schoolPapers: false,
      exam: { kicker: "YOUR NEXT BIG MILESTONE", title: "A/L 2027 is on the horizon.",
        copy: "Official examination window: 03–28 August 2027 · Countdown to the first exam day.",
        startsAt: "2027-08-03T00:00:00+05:30", endsAt: "2027-08-29T00:00:00+05:30" }
    },
    al2028: {
      label: "A/L 2028", eyebrow: "YOUR LEARNING JOURNEY",
      title: "Build strong foundations.<br><b>Be ready for what is next.</b>",
      description: "Explore the A/L 2028 program, build your subject knowledge and make steady progress.",
      badge: "A/L 2028 PATHWAY", model: "theory-examination.html", modelTitle: "Theory Examination",
      modelDescription: "A/L 2028 theory and examination preparation.", past: null, exam: null,
      hub: false, progress: false, smartBook: true, schoolPapers: true
    }
  };

  const byId = id => document.getElementById(id);
  let examInterval;

  function renderExam(exam) {
    const panel = byId("examFocus");
    if (!panel) return;
    clearInterval(examInterval);
    if (!exam) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    byId("examKicker").textContent = exam.kicker;
    byId("examTitle").textContent = exam.title;
    byId("examCopy").textContent = exam.copy;
    const start = new Date(exam.startsAt).getTime();
    const end = new Date(exam.endsAt).getTime();
    const tick = () => {
      const left = start - Date.now();
      if (left <= 0) {
        ["countDays", "countHours", "countMinutes"].forEach(id => { byId(id).textContent = "00"; });
        if (Date.now() < end) byId("examTitle").textContent = "The examination window is now underway.";
        else byId("examTitle").textContent = "The examination window has ended.";
        clearInterval(examInterval);
        return;
      }
      const minutes = Math.floor(left / 60000);
      byId("countDays").textContent = String(Math.floor(minutes / 1440)).padStart(3, "0");
      byId("countHours").textContent = String(Math.floor(minutes % 1440 / 60)).padStart(2, "0");
      byId("countMinutes").textContent = String(minutes % 60).padStart(2, "0");
    };
    tick();
    examInterval = setInterval(tick, 60000);
  }

  window.renderDashboardHome = function (key, year) {
    const cohort = cohorts[key];
    if (!cohort) return;
    const label = key === "al2027" || key === "al2028" ? "A/L " + (year || key.slice(-4)) : cohort.label;
    const title = document.querySelector(".learning-banner-copy h2");
    const eyebrow = document.querySelector(".learning-banner-copy>span");
    const description = document.querySelector(".learning-banner-copy p");
    if (title) title.innerHTML = cohort.title;
    if (eyebrow) eyebrow.textContent = cohort.eyebrow;
    if (description) description.textContent = cohort.description;
    const topType = byId("topStudentType"), sideGrade = byId("sidebarStudentGrade");
    if (topType) topType.textContent = label + " Student";
    if (sideGrade) sideGrade.textContent = label + " Student";
    const journeyCohort = byId("journeyCohortLabel"), journeyProgram = byId("journeyProgramName");
    if (journeyCohort) journeyCohort.textContent = label;
    if (journeyProgram) journeyProgram.textContent = "Continue your " + label + " program";
    const badge = byId("programBadge"), subtitle = byId("programSubtitle");
    if (badge) badge.textContent = cohort.badge;
    if (subtitle) subtitle.textContent = "Resources selected for your " + label + " learning program.";

    const hub = byId("portalProgramHub"), model = byId("modelPapersCard"), past = byId("pastPapersCard");
    const programProgress = byId("programProgressCard"), smartBook = byId("smartBookAnswersCard"), schoolPapers = byId("schoolPaperAnswersCard");
    if (hub) {
      hub.hidden = !cohort.hub;
      byId("portalProgramHubTitle").textContent = cohort.hubTitle || "Learning Resources";
      byId("portalProgramHubDescription").textContent = cohort.hubDescription || "Open the notes and materials selected for your grade.";
    }
    if (model) {
      model.hidden = key === "al2028";
      model.href = cohort.model;
      byId("modelPapersTitle").textContent = cohort.modelTitle;
      byId("modelPapersDescription").textContent = cohort.modelDescription;
      const action = model.querySelector(".material-link");
      if (action) action.firstChild.textContent = key === "al2028" ? "Open Theory Examination " : "Explore papers ";
    }
    if (past) {
      past.hidden = !cohort.past;
      if (cohort.past) {
        past.href = cohort.past;
        byId("pastPapersTitle").textContent = cohort.pastTitle;
        byId("pastPapersDescription").textContent = cohort.pastDescription;
      }
    }
    if (programProgress) programProgress.hidden = !cohort.progress;
    if (smartBook) smartBook.hidden = !cohort.smartBook;
    if (schoolPapers) schoolPapers.hidden = !cohort.schoolPapers;
    renderExam(cohort.exam);
  };
})();
