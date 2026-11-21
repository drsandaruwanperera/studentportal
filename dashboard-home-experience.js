(() => {
  const cohorts = {
    grade10: {
      label: "Grade 10", eyebrow: "YOUR GRADE 10 LEARNING JOURNEY",
      title: "Build confidence.<br><b>Make every lesson count.</b>",
      description: "Your Grade 10 papers, learning resources and progress — organized in one place to help you keep moving forward.",
      badge: "GRADE 10 PATHWAY", model: "grade10-model-papers.html", modelTitle: "Term Test Model Papers",
      modelDescription: "Grade 10 term test papers and model answers for practice.", past: null,
      exam: { kicker: "YOUR NEXT BIG MILESTONE", title: "Your O/L exams are getting closer.",
        copy: "Official examination window: 07–17 December 2027 · Countdown to the first exam day.",
        startsAt: "2027-12-07T00:00:00+05:30", endsAt: "2027-12-18T00:00:00+05:30" },
      hub: true, hubTitle: "Learning Resources", hubDescription: "Study notes and materials selected for Grade 10.",
      progress: true, smartBook: false, schoolPapers: false
    },
    grade11: {
      label: "Grade 11", eyebrow: "YOUR GRADE 11 LEARNING JOURNEY",
      title: "Prepare with purpose.<br><b>Build exam confidence.</b>",
      description: "Your Grade 11 papers, learning resources and progress — organized in one place to help you keep moving forward.",
      badge: "GRADE 11 PATHWAY", model: "grade11-model-papers.html", modelTitle: "TOP Ranking Papers",
      modelDescription: "Grade 11 TOP Ranking papers and model paper answers.", past: null, hub: false, progress: true,
      smartBook: false, schoolPapers: false,
      exam: { kicker: "YOUR NEXT BIG MILESTONE", title: "Your O/L exams are getting closer.",
        copy: "Official examination window: 08–17 December 2026 · Countdown to the first exam day.",
        startsAt: "2026-12-08T00:00:00+05:30", endsAt: "2026-12-18T00:00:00+05:30" }
    },
    al2027: {
      label: "A/L 2027", eyebrow: "YOUR LEARNING JOURNEY",
      title: "One paper at a time.<br><b>Move closer to your goal.</b>",
      description: "Prepare for your exams with structured Advanced Level practice and resources for your year.",
      badge: "A/L 2027 PATHWAY", model: "model-papers.html", modelTitle: "Monthly TOP Ranking Papers",
      modelDescription: "Month-wise TOP Ranking papers with their matching answers.", past: null, hub: false, progress: false,
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
  let activeCohortKey = "al2028";
  let studyBuddyReady = false;
  let scrollRevealStarted = false;

  function initDashboardSectionMotion() {
    if (scrollRevealStarted || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    scrollRevealStarted = true;
    const sections = document.querySelectorAll(".lms-stat-grid, #learningProgram, .lms-dashboard-grid, .portal-support-section");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    sections.forEach(section => { section.classList.add("dashboard-scroll-reveal"); observer.observe(section); });
  }

  const studyPrompts = {
    grade10: ["Build a weekly study plan", "Find my term test papers", "Explain an Accounting topic", "How can I improve my marks?"],
    grade11: ["Plan my O/L revision", "Find TOP Ranking papers", "Explain an Accounting topic", "How can I improve my marks?"],
    al2027: ["Plan my A/L revision", "Find Province Papers", "Explain an Accounting topic", "Help me practise for an exam"],
    al2028: ["Build my A/L foundation", "Find my study resources", "Explain an Accounting topic", "How can I improve my marks?"]
  };

  function setStudyBuddyOpen(open) {
    const panel = byId("studyBuddyPanel"), launcher = byId("studyBuddyLauncher");
    if (!panel || !launcher) return;
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    if (open) byId("studyBuddyInput")?.focus();
    else launcher.focus();
  }

  function addStudyBuddyMessage(message, kind) {
    const thread = byId("studyBuddyThread");
    if (!thread) return;
    const item = document.createElement("div");
    item.className = "study-buddy-message " + kind;
    item.textContent = message;
    if (kind === "bot") {
      const label = document.createElement("small");
      label.textContent = "STUDY GUIDANCE · " + (cohorts[activeCohortKey]?.label || "STUDENT").toUpperCase();
      item.appendChild(label);
    }
    thread.appendChild(item);
    byId("studyBuddyBody").scrollTop = byId("studyBuddyBody").scrollHeight;
  }

  function studyBuddyReply(question) {
    const cohort = cohorts[activeCohortKey] || cohorts.al2028;
    const q = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/.test(q)) {
      return "Hello! I am your " + cohort.label + " study guide. I can help you plan revision, find the right papers, practise Accounting concepts and improve exam technique. What would you like to work on?";
    }
    if (/exam|date|countdown|when is|timetable/.test(q)) {
      return cohort.exam
        ? cohort.exam.copy + " Use the official Department of Examinations calendar for any later timetable updates."
        : "An official A/L 2028 examination date has not been published in this dashboard yet. Please check the Department of Examinations calendar for official updates.";
    }
    if (/paper|resource|note|model|past paper|province|find|smart book|school paper/.test(q)) {
      const resources = activeCohortKey === "grade10" ? "Grade 10 Term Test Model Papers and Model Paper Answers"
        : activeCohortKey === "grade11" ? "Grade 11 TOP Ranking Papers and Model Paper Answers"
        : activeCohortKey === "al2027" ? "A/L 2027 month-wise TOP Ranking Papers and their answers"
        : "A/L 2028 Theory Examination, Smart Book Answers and School Paper Answers";
      return "For " + cohort.label + ", start here: " + resources + ". Open the matching resource card in Your Learning Program. Try one paper under timed conditions, then review every mistake before moving to the next paper.";
    }
    if (/plan|routine|revision|revise|week|study|prepare|schedule|timetable/.test(q)) {
      if (activeCohortKey === "grade10") return "Your 7-day starter plan:\n1. Days 1–2: revise one Accounting concept and write a short summary.\n2. Days 3–4: answer 5–10 related questions.\n3. Day 5: attempt one timed section.\n4. Day 6: mark it and list your mistakes.\n5. Day 7: repeat the weakest topic.\nKeep each session focused and take short breaks.";
      if (activeCohortKey === "grade11") return "Your O/L revision plan:\n1. Choose one topic for each session.\n2. Review the key rules for 15 minutes.\n3. Attempt a timed past-paper section.\n4. Mark your answers and write down why each mistake happened.\n5. Reattempt the incorrect questions two days later.";
      if (activeCohortKey === "al2027") return "Your A/L revision plan:\n1. Choose one syllabus area and revise the theory.\n2. Attempt a TOP Ranking or Province Paper question on that area.\n3. Mark the attempt and keep a mistake log.\n4. Revisit weak concepts at the end of the week.\n5. Complete one timed paper section to practise exam pace.";
      return "Your A/L 2028 foundation plan:\n1. Choose two small topics for this week.\n2. Learn the key definitions and rules.\n3. Practise a few questions without looking at the answers.\n4. Check your work and write down what you need to ask your teacher.\n5. Review both topics again at the weekend.";
    }
    if (/improv|weak|marks|score|mistake|result|performance/.test(q)) {
      return "To improve your marks, use this repeatable cycle:\n1. Attempt a question without notes.\n2. Mark it honestly.\n3. Group each mistake: knowledge, calculation, presentation or time management.\n4. Revise the exact weak area.\n5. Reattempt a similar question within 48 hours.\nTrack the mistake types each week so you can see what is improving.";
    }
    if (/accounting equation|assets.*capital|capital.*liabilit/.test(q)) {
      return "The basic Accounting equation is:\nAssets = Capital + Liabilities\nIt shows that the resources of a business are financed by the owner's claim and amounts owed to others. Example: if the owner invests Rs. 100,000 and the business borrows Rs. 40,000, assets total Rs. 140,000. Try changing one amount and check that both sides still agree.";
    }
    if (/double entry|debit|credit/.test(q)) {
      return "The double-entry system records every transaction in at least two accounts, with equal debit and credit totals. To practise: identify the two accounts affected, decide whether each increases or decreases, then apply the debit/credit rules for those account types. Send me a specific transaction and I can guide you through the steps.";
    }
    if (/trial balance/.test(q)) {
      return "A trial balance lists ledger account balances in debit and credit columns. Its main check is whether total debits equal total credits. Remember: agreement does not prove that every entry is correct; some errors do not affect the equality. Practise by balancing each ledger first, then transferring its balance to the correct column.";
    }
    if (/ledger|journal|cash book/.test(q)) {
      return "For this Accounting topic, use a three-step method: identify the source transaction, identify the accounts affected, and then record the debit and credit entries in the correct book or ledger. Tell me the exact transaction or question and I will help you work through the entry step by step.";
    }
    if (/depreciation/.test(q)) {
      return "Depreciation is the systematic allocation of a non-current asset's depreciable amount over its useful life. First identify the cost, residual value and useful life. Then apply the method given in your question, such as straight-line or reducing-balance. Share the figures and method and I can show the calculation steps.";
    }
    if (/explain|topic|accounting|concept|understand|question|solve|help/.test(q)) {
      return "Let's work through it step by step. Send the exact Accounting topic, transaction or question (including the figures), and tell me which part is confusing. I can guide you through the key rule, the working steps and a short practice question.";
    }
    return "I can help with your " + cohort.label + " study plan, the correct programme papers, exam preparation, common Accounting concepts and ways to improve marks. Try one of the quick prompts, or send me the exact question you are working on.";
  }

  function sendStudyBuddyMessage(value) {
    const input = byId("studyBuddyInput");
    const question = String(value || input?.value || "").trim();
    if (!question) return;
    addStudyBuddyMessage(question, "user");
    if (input) input.value = "";
    addStudyBuddyMessage(studyBuddyReply(question), "bot");
  }

  function initStudyBuddy() {
    if (studyBuddyReady || !byId("studyBuddyLauncher")) return;
    studyBuddyReady = true;
    byId("studyBuddyLauncher").addEventListener("click", () => {
      setStudyBuddyOpen(byId("studyBuddyPanel").getAttribute("aria-hidden") === "true");
    });
    byId("studyBuddyClose").addEventListener("click", () => setStudyBuddyOpen(false));
    byId("studyBuddyForm").addEventListener("submit", event => {
      event.preventDefault();
      sendStudyBuddyMessage();
    });
    byId("studyBuddyPrompts").addEventListener("click", event => {
      const button = event.target.closest("[data-study-prompt]");
      if (button) sendStudyBuddyMessage(button.dataset.studyPrompt);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && byId("studyBuddyPanel").getAttribute("aria-hidden") === "false") setStudyBuddyOpen(false);
    });
  }

  window.openStudentStudyAssistant = function () {
    initStudyBuddy();
    setStudyBuddyOpen(true);
  };

  function renderStudyBuddy(key, label) {
    initStudyBuddy();
    activeCohortKey = key;
    const fullLabel = label || cohorts[key]?.label || "Student";
    const context = byId("studyBuddyContext"), launcher = byId("studyBuddyLauncherCohort");
    const title = byId("studyBuddyWelcomeTitle"), text = byId("studyBuddyWelcomeText"), prompts = byId("studyBuddyPrompts");
    if (context) context.textContent = fullLabel + " study mode";
    if (launcher) launcher.textContent = fullLabel;
    if (title) title.textContent = "What are we working on today, " + fullLabel + "?";
    if (text) text.textContent = "Choose a prompt or ask for a quick tip for your current learning program.";
    if (prompts) {
      prompts.replaceChildren(...(studyPrompts[key] || studyPrompts.al2028).map(prompt => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "study-buddy-prompt";
        button.dataset.studyPrompt = prompt;
        button.textContent = prompt;
        return button;
      }));
    }
  }

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
    document.body.classList.toggle("al2028-dashboard", key === "al2028");
    initDashboardSectionMotion();
    const label = key === "al2027" || key === "al2028" ? "A/L " + (year || key.slice(-4)) : cohort.label;
    renderStudyBuddy(key, label);
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

  // The centre portrait can open the assistant from any student page via this hash.
  const openAssistantFromHash = () => {
    if (window.location.hash === "#study-buddy") {
      window.openStudentStudyAssistant();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };
  window.addEventListener("load", () => window.setTimeout(openAssistantFromHash, 120), { once: true });
})();
