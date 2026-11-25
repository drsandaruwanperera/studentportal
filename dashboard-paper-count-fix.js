import { db, doc, getDoc, onSnapshot } from "./firebase.js";

const studentId = sessionStorage.getItem("studentId");
const studentRef = studentId ? doc(db, "students", studentId) : null;

const PAPER_COUNTS = {
    al: 2,
    grade10: 15,
    grade11: 15
};

function getStudentType(data) {
    // Shared resolver (lms-cohort.js): never default to Grade 11.
    // Unrecognised input is "unknown". (The PAPER_COUNTS / render
    // fallback for "unknown" is owned by patch 1.6, not this change.)
    if (window.LmsCohort) {
        return window.LmsCohort.typeFromValue(data?.studentType || data?.grade || sessionStorage.getItem("studentGrade") || "") || "unknown";
    }
    // Fallback when lms-cohort.js is not loaded on this page:
    // router-style normalisation, same "unknown" default.
    const type = String(data?.studentType || data?.grade || sessionStorage.getItem("studentGrade") || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
    if (["al", "alevel", "advancedlevel", "advanced"].includes(type) ||
        type.includes("advancedlevel") ||
        /^a\/?l(?:20)?(?:2027|2028|2029|27|28|29)$/.test(type) ||
        /^advanced(?:level)?(?:20)?(?:2027|2028|2029|27|28|29)$/.test(type)) {
        return "al";
    }
    if (["10", "grade10", "g10"].includes(type) || type.includes("grade10")) {
        return "grade10";
    }
    if (["11", "grade11", "g11"].includes(type) || type.includes("grade11")) {
        return "grade11";
    }
    return "unknown";
}

function isTrue(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

function getViewedCount(data, type) {
    // Fail closed: an unverifiable profile counts as 0 viewed.
    if (!type || !PAPER_COUNTS[type]) {
        return 0;
    }

    if (type === "al") {
        // Count the paper keys actually present in the profile
        // (paper01, paper02, ...) instead of looping to the
        // PAPER_COUNTS.al hardcode, so later monthly papers count.
        const modelViews = data?.paperViews?.al?.model || {};
        return Object.keys(modelViews).filter(
            (key) => /^paper\d+$/.test(key) && isTrue(modelViews[key])
        ).length;
    }

    // Count the paperNNViewed flags actually present in the profile
    // instead of looping to the hardcoded PAPER_COUNTS total.
    return Object.keys(data || {}).filter(
        (key) => /^paper\d{2}Viewed$/.test(key) && isTrue(data[key])
    ).length;
}

function renderCategoryPaperStats(data) {
    const type = getStudentType(data);
    // Fail closed: an unknown/unverifiable profile shows 0 papers,
    // never the old Grade 11 fallback (PAPER_COUNTS.grade11 = 15).
    // NOTE: PAPER_COUNTS.al = 2 is still a hardcode — the A/L total
    // is the live monthly paper list (Firestore
    // monthlyTopRankingPapers plus the static September 2026
    // papers), which this module does not load. Until the total is
    // wired to that list, viewed is capped at 2 and progress will
    // understate once more monthly papers publish.
    const total = PAPER_COUNTS[type] || 0;
    const viewed = Math.min(getViewedCount(data, type), total);
    const progress = total > 0 ? Math.round((viewed / total) * 100) : 0;

    const totalEl = document.getElementById("totalPapers");
    const viewedEl = document.getElementById("viewedPapers");
    const progressEl = document.getElementById("progressValue");
    const summaryProgress = document.getElementById("summaryProgress");
    const progressFill = document.getElementById("progressFill");

    if (totalEl && totalEl.textContent !== String(total)) {
        totalEl.textContent = String(total);
    }

    if (viewedEl && viewedEl.textContent !== String(viewed)) {
        viewedEl.textContent = String(viewed);
    }

    if (progressEl && progressEl.textContent !== `${progress}%`) {
        progressEl.textContent = `${progress}%`;
    }

    if (summaryProgress && summaryProgress.textContent !== `${progress}%`) {
        summaryProgress.textContent = `${progress}%`;
    }

    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
}

function observeDashboardStats(data) {
    const target = document.querySelector(".content") || document.body;
    if (!target || target.dataset.paperCountFixBound === "1") return;

    target.dataset.paperCountFixBound = "1";

    const observer = new MutationObserver(() => {
        renderCategoryPaperStats(data);
    });

    observer.observe(target, {
        subtree: true,
        childList: true,
        characterData: true
    });

    renderCategoryPaperStats(data);
}

async function init() {
    if (!studentRef) return;

    try {
        const snapshot = await getDoc(studentRef);
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        observeDashboardStats(data);

        onSnapshot(studentRef, (liveSnapshot) => {
            if (!liveSnapshot.exists()) return;
            renderCategoryPaperStats(liveSnapshot.data());
        });
    } catch (error) {
        console.error("Dashboard category paper count fix failed:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
