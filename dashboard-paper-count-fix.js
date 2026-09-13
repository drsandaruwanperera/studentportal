import { db, doc, getDoc, onSnapshot } from "./firebase.js";

const studentId = sessionStorage.getItem("studentId");
const studentRef = studentId ? doc(db, "students", studentId) : null;

const PAPER_COUNTS = {
    al: 2,
    grade10: 15,
    grade11: 15
};

function getStudentType(data) {
    const type = String(data?.studentType || data?.grade || sessionStorage.getItem("studentGrade") || "")
        .trim()
        .toLowerCase();

    if (["al", "a/l", "a level", "advanced", "advanced level", "advancedlevel"].includes(type)) {
        return "al";
    }

    if (["10", "grade10", "grade 10"].includes(type)) {
        return "grade10";
    }

    if (["11", "grade11", "grade 11"].includes(type)) {
        return "grade11";
    }

    return "grade11";
}

function isTrue(value) {
    return value === true || value === "true" || value === 1 || value === "1";
}

function getViewedCount(data, type) {
    if (type === "al") {
        const modelViews = data?.paperViews?.al?.model || {};
        let viewed = 0;

        for (let i = 1; i <= PAPER_COUNTS.al; i++) {
            if (isTrue(modelViews[`paper${String(i).padStart(2, "0")}`])) {
                viewed++;
            }
        }

        return viewed;
    }

    let viewed = 0;
    for (let i = 1; i <= PAPER_COUNTS[type]; i++) {
        const field = `paper${String(i).padStart(2, "0")}Viewed`;
        if (isTrue(data?.[field])) viewed++;
    }

    return viewed;
}

function renderCategoryPaperStats(data) {
    const type = getStudentType(data);
    const total = PAPER_COUNTS[type] || PAPER_COUNTS.grade11;
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
