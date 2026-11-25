/* lms-cohort.js — single shared cohort resolver for the LMS.
 * Phase 1, patch 1.3. HEAD fed2445.
 * Classic script: exposes window.LmsCohort. No imports, no Firebase
 * dependency. Callers pass a Firestore profile object (or null) and/or
 * rely on sessionStorage, exactly as the old per-file resolvers did.
 * Login flow is unchanged: this module only classifies a cohort. It
 * does not check passwords, change passwords, or handle the recovery
 * key (recovery key = password reset only, never direct login).
 */
(function () {
  "use strict";

  var COHORT_KEYS = ["grade10", "grade11", "al2027", "al2028"];

  // Dashboard card IDs (dashboard.html) per cohort. These sets were
  // identical in dashboard-grade-routing.js enforceCohortStudyCards,
  // dashboard-study-content.js `allowed`, and my-program.html
  // cohortAllowList at HEAD fed2445. portalProgramHub /
  // programProgressCard are NOT in this table: they are driven by
  // cohorts.hub / cohorts.progress in dashboard-home-experience.js
  // (patch 1.1). pastPapersCard is false for every cohort.
  var STUDY_CARD_ALLOW_LIST = {
    grade10: ["modelPapersCard", "modelPaperAnswersCard"],
    grade11: ["modelPapersCard", "modelPaperAnswersCard"],
    al2027: ["modelPapersCard"],
    al2028: ["theoryExaminationCard", "modelPaperAnswersCard", "smartBookAnswersCard", "schoolPaperAnswersCard"]
  };

  var PROGRAM_CARD_ALLOW_LIST = {
    grade10: ["modelPapers", "modelPaperAnswers"],
    grade11: ["modelPapers", "modelPaperAnswers"],
    al2027: ["modelPapers"],
    al2028: ["theoryExamination", "modelPaperAnswers", "smartBookAnswers", "schoolPaperAnswers"]
  };

  var STUDY_CARD_IDS = [
    "portalProgramHub", "modelPapersCard", "theoryExaminationCard",
    "modelPaperAnswersCard", "pastPapersCard", "programProgressCard",
    "smartBookAnswersCard", "schoolPaperAnswersCard"
  ];

  // Single copy of the A/L 2028 numeric-ID set. Previously copied in
  // app.js (AL_2028_NUMERIC_STUDENT_IDS), dashboard-grade-routing.js
  // (al2028NumericIds) and further files. TODO (Phase 2): move this
  // list into Firestore (admin-managed) and delete it from public code.
  // Values copied verbatim from app.js AL_2028_NUMERIC_STUDENT_IDS.
  var AL_2028_NUMERIC_IDS = new Set(
    "11074 11094 12705 13959 14069 14319 14334 14368 14369 14421 14723 14800 15189 15483 15508 15585 15690 15854 15960 16365 16889 16890 16891 16892 16895 16896 16898 16899 16900 16902 16903 16906 16907 16908 16909 16910 16913 16914 16915 16920 16923 16924 16941 16947 16966 16967 16975 16978 16979 16980 16986 16987 16988 16991 16995 17038 17039 17052 17054 17064 17071 17080 17093 17125 17172 17187 17188 17190 17191 17197 17205 17206 17207 17208 17209 17210 17212 17213 17218 17220 17225 17226 17240 17241 17242 17243 17244 17246 17247 17249 17254 17256 17269 17279 17280 17287 17288 17296 17306 17307 17317 17326 17327 17364 17366 17368 17386 17387 17427 17450".split(/\s+/)
  );

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  }

  // Same normalisation as dashboard-grade-routing.js typeFromValue()
  // at HEAD fed2445. Returns "grade10" | "grade11" | "al" | "".
  function typeFromValue(value) {
    var v = normalize(value);
    if (["grade10", "10", "g10"].indexOf(v) !== -1 || v.indexOf("grade10") !== -1 || v.indexOf("g10") !== -1) return "grade10";
    if (["grade11", "11", "g11"].indexOf(v) !== -1 || v.indexOf("grade11") !== -1 || v.indexOf("g11") !== -1) return "grade11";
    if (["al", "alevel", "advancedlevel", "advanced"].indexOf(v) !== -1 ||
        v.indexOf("advancedlevel") !== -1 ||
        /^a\/?l(?:20)?(?:2027|2028|2029|27|28|29)$/.test(v) ||
        /^advanced(?:level)?(?:20)?(?:2027|2028|2029|27|28|29)$/.test(v)) return "al";
    return "";
  }

  function yearFromValue(value) {
    var m = String(value == null ? "" : value).match(/20(27|28|29)/);
    return m ? "20" + m[1] : "";
  }

  // Year resolution, in the router's getAlYear() preference order
  // (dashboard-grade-routing.js) — except the old final fallback
  // `return "2027"` is REMOVED. Unknown year is "".
  function resolveYear(profile, session) {
    // Mirror the router's getAlYear() first line: membership in the
    // A/L 2028 numeric set itself pins the year to 2028, even when no
    // profile/session year is stored. (Without this, those students
    // would resolve to "unknown" and lose all cards.)
    var numericId = String(session.studentId || "").trim().toUpperCase();
    if (AL_2028_NUMERIC_IDS.has(numericId)) return "2028";
    var fields = profile ? [
      profile.alYear, profile.academicYear, profile.examYear, profile.year,
      profile.batch, profile.cohort, profile.studentGrade, profile.grade,
      profile.studentType
    ] : [];
    for (var i = 0; i < fields.length; i++) {
      var y = yearFromValue(fields[i]);
      if (y) return y;
    }
    var saved = yearFromValue(session.alYear);
    if (saved) return saved;
    var fromSession = yearFromValue((session.studentGrade || "") + " " + (session.studentType || ""));
    if (fromSession) return fromSession;
    var id = String(session.studentId || "").trim().toUpperCase();
    var match = id.match(/^(?:A)?(27|28|29)/) || id.match(/^(27|28|29)[CN]/);
    if (match) return "20" + match[1];
    return "";
  }

  function inferTypeFromId(id) {
    id = String(id || "").trim().toUpperCase();
    if (AL_2028_NUMERIC_IDS.has(id)) return "al";
    if (/^A2[789]\d{3}$/.test(id) || /^(?:27|28|29)[CN]/.test(id)) return "al";
    if (/^\d{5}$/.test(id)) {
      var n = Number(id);
      if (n >= 26000 && n <= 26999) return "grade11";
      if (n >= 27000 && n <= 27999) return "grade10";
    }
    return "";
  }

  // profile: Firestore student doc data (or null). session: an object
  // with studentId / studentType / studentGrade / alYear, normally
  // read from sessionStorage by the caller.
  // Returns { key, type, year } — key is "unknown" and year is ""
  // when nothing matches. Never defaults to 2027 or grade11.
  function resolveCohort(profile, session) {
    session = session || {};
    var type = "";
    if (profile) {
      type = typeFromValue(profile.studentType) || typeFromValue(profile.grade);
    }
    if (!type) type = inferTypeFromId(session.studentId);
    if (!type) type = typeFromValue(session.studentType) || typeFromValue(session.studentGrade);
    if (!type) return { key: "unknown", type: "", year: "" };
    if (type === "grade10" || type === "grade11") {
      return { key: type, type: type, year: "" };
    }
    var year = resolveYear(profile, session);
    if (!year) return { key: "unknown", type: "", year: "" };
    return { key: "al" + year, type: "al", year: year };
  }

  function resolveSessionCohort() {
    return resolveCohort(null, {
      studentId: sessionStorage.getItem("studentId"),
      studentType: sessionStorage.getItem("studentType"),
      studentGrade: sessionStorage.getItem("studentGrade"),
      alYear: sessionStorage.getItem("alYear")
    });
  }

  // Hide every study card and show the "cohort not set" notice.
  // Call this for "unknown" — do NOT return early without hiding.
  function showUnknownCohort() {
    STUDY_CARD_IDS.forEach(function (id) {
      var card = document.getElementById(id);
      if (!card) return;
      card.hidden = true;
      card.setAttribute("aria-hidden", "true");
      card.style.setProperty("display", "none", "important");
    });
    var notice = document.getElementById("cohortNotSet");
    if (notice) {
      notice.hidden = false;
      notice.removeAttribute("aria-hidden");
    }
    document.body.classList.add("dashboard-cohort-pending");
    document.documentElement.dataset.studentType = "unknown";
  }

  // Reveal exactly the allowed cards for a resolved cohort; hide the
  // rest. Unknown → showUnknownCohort(). Returns the cohort key.
  function applyCohortVisibility(cohort) {
    var key = typeof cohort === "string" ? cohort : cohort.key;
    if (!key || key === "unknown" || STUDY_CARD_ALLOW_LIST[key] === undefined) {
      showUnknownCohort();
      return "unknown";
    }
    var visible = {};
    STUDY_CARD_ALLOW_LIST[key].forEach(function (id) { visible[id] = true; });
    STUDY_CARD_IDS.forEach(function (id) {
      // portalProgramHub / programProgressCard are owned by
      // dashboard-home-experience.js (patch 1.1); do not touch them here.
      if (id === "portalProgramHub" || id === "programProgressCard") return;
      var card = document.getElementById(id);
      if (!card) return;
      var show = !!visible[id];
      card.hidden = !show;
      card.setAttribute("aria-hidden", String(!show));
      if (show) card.style.removeProperty("display");
      else card.style.setProperty("display", "none", "important");
    });
    var notice = document.getElementById("cohortNotSet");
    if (notice) notice.hidden = true;
    document.body.classList.remove("dashboard-cohort-pending");
    document.documentElement.dataset.studentType = key === "al2027" || key === "al2028" ? "al" : key;
    return key;
  }

  window.LmsCohort = {
    COHORT_KEYS: COHORT_KEYS,
    STUDY_CARD_ALLOW_LIST: STUDY_CARD_ALLOW_LIST,
    PROGRAM_CARD_ALLOW_LIST: PROGRAM_CARD_ALLOW_LIST,
    STUDY_CARD_IDS: STUDY_CARD_IDS,
    normalize: normalize,
    typeFromValue: typeFromValue,
    resolveYear: resolveYear,
    resolveCohort: resolveCohort,
    resolveSessionCohort: resolveSessionCohort,
    applyCohortVisibility: applyCohortVisibility,
    showUnknownCohort: showUnknownCohort
  };
})();
