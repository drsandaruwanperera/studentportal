// =====================================================
// FIREBASE
// =====================================================

import {
    db,
    doc,
    getDoc,
    updateDoc,
    onSnapshot
} from "./firebase.js";


// =====================================================
// LOGIN CHECK
// =====================================================

if (
    sessionStorage.getItem("loggedIn") !== "true"
) {
    window.location.replace("index.html");
}


// =====================================================
// STUDENT INFORMATION
// =====================================================

const studentId =
    sessionStorage.getItem("studentId");

const storedGrade =
    sessionStorage.getItem("studentGrade");


// =====================================================
// ELEMENTS
// =====================================================

const studentIdElement = document.getElementById("studentId");
const studentGradeElement = document.getElementById("studentGrade");
const studentNameElement = document.getElementById("studentName");
const greetingElement = document.getElementById("greeting");
const gradeLabelElement = document.getElementById("gradeLabel");
const statusElement = document.getElementById("onlineStatus");
const totalPapersElement = document.getElementById("totalPapers");
const viewedPapersElement = document.getElementById("viewedPapers");
const progressElement = document.getElementById("progressValue");
const modelPapersCard = document.getElementById("modelPapersCard");
const pastPapersCard = document.getElementById("pastPapersCard");
const modelPapersTitle = document.getElementById("modelPapersTitle");
const modelPapersDescription = document.getElementById("modelPapersDescription");
const pastPapersTitle = document.getElementById("pastPapersTitle");
const pastPapersDescription = document.getElementById("pastPapersDescription");


// =====================================================
// STUDENT REFERENCE
// =====================================================

let studentRef = null;

if (studentId) {
    studentRef = doc(db, "students", studentId);
}


// =====================================================
// GRADE HELPER
// =====================================================

function getGradeType(value) {
    const grade = String(value || "").toLowerCase().trim();

    if (
        grade === "10" ||
        grade === "grade10" ||
        grade === "grade 10"
    ) {
        return "grade10";
    }

    if (
        grade === "11" ||
        grade === "grade11" ||
        grade === "grade 11"
    ) {
        return "grade11";
    }

    if (
        grade === "al" ||
        grade === "a/l" ||
        grade === "advanced" ||
        grade === "advancedlevel" ||
        grade === "advanced level"
    ) {
        return "al";
    }

    return "grade11";
}


// =====================================================
// GRADE DISPLAY
// =====================================================

function getGradeDisplay(type) {
    if (type === "grade10") {
        return "Grade 10";
    }

    if (type === "grade11") {
        return "Grade 11";
    }

    return "Advanced Level";
}


// =====================================================
// GRADE DASHBOARD DATA
// =====================================================

function getDashboardData(type) {
    if (type === "grade10") {
        return {
            grade: "Grade 10",
            model: "grade10-model-papers.html",
            past: "grade10-past-papers.html"
        };
    }

    if (type === "al") {
        return {
            grade: "Advanced Level",
            model: "model-papers.html",
            past: "province-paper1.html"
        };
    }

    return {
        grade: "Grade 11",
        model: "grade11-model-papers.html",
        past: "grade11-past-paper.html"
    };
}


// =====================================================
// GREETING
// =====================================================

function updateGreeting(studentName) {
    const hour = new Date().getHours();
    let greeting = "Good evening";

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good afternoon";
    }

    if (greetingElement) {
        greetingElement.textContent = `${greeting}, ${studentName} 👋`;
    }
}


// =====================================================
// UPDATE MATERIAL TEXT
// =====================================================

function updateMaterialText(type) {
    if (type === "grade10") {
        if (modelPapersTitle) modelPapersTitle.textContent = "Model Papers";
        if (modelPapersDescription) modelPapersDescription.textContent = "Grade 10 Model Papers";

        const modelLink = document.querySelector("#modelPapersCard .material-link");
        if (modelLink) {
            modelLink.innerHTML = `Explore Model Papers <span>→</span>`;
        }

        if (pastPapersTitle) pastPapersTitle.textContent = "Past Papers";
        if (pastPapersDescription) pastPapersDescription.textContent = "Grade 10 Past Papers";
    } else if (type === "grade11") {
        if (modelPapersTitle) modelPapersTitle.textContent = "TOP Ranking";
        if (modelPapersDescription) modelPapersDescription.textContent = "Grade 11 TOP Ranking Papers";

        const modelLink = document.querySelector("#modelPapersCard .material-link");
        if (modelLink) {
            modelLink.innerHTML = `Explore TOP Ranking <span>→</span>`;
        }

        if (pastPapersTitle) pastPapersTitle.textContent = "Past Papers";
        if (pastPapersDescription) pastPapersDescription.textContent = "Past Papers • 2016 – 2025";
    } else if (type === "al") {
        if (modelPapersTitle) modelPapersTitle.textContent = "Model Papers";
        if (modelPapersDescription) modelPapersDescription.textContent = "Advanced Level Model Papers";

        const modelLink = document.querySelector("#modelPapersCard .material-link");
        if (modelLink) {
            modelLink.innerHTML = `Explore Model Papers <span>→</span>`;
        }

        if (pastPapersTitle) pastPapersTitle.textContent = "Province Papers";
        if (pastPapersDescription) pastPapersDescription.textContent = "Provincial Examination Papers";

        const pastLink = document.querySelector("#pastPapersCard .material-link");
        if (pastLink) {
            pastLink.innerHTML = `Explore Province Papers <span>→</span>`;
        }
    }
}


// =====================================================
// SETUP MODEL CARD
// =====================================================

function setupModelCard(type) {
    if (!modelPapersCard) {
        console.error("modelPapersCard not found.");
        return;
    }

    let modelUrl = null;

    if (type === "grade10") {
        modelUrl = "grade10-model-papers.html";
    } else if (type === "grade11") {
        modelUrl = "grade11-model-papers.html";
    } else if (type === "al") {
        modelUrl = "model-papers.html";
    }

    modelPapersCard.onclick = null;
    modelPapersCard.onkeydown = null;

    modelPapersCard.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (modelUrl) window.location.href = modelUrl;
    };

    modelPapersCard.onkeydown = function(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (modelUrl) window.location.href = modelUrl;
        }
    };

    const modelLink = modelPapersCard.querySelector(".material-link");
    if (modelLink) {
        modelLink.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (modelUrl) window.location.href = modelUrl;
        };
    }
}


// =====================================================
// SETUP PAST CARD
// =====================================================

function setupPastCard(type) {
    if (!pastPapersCard) {
        console.error("pastPapersCard not found.");
        return;
    }

    let pastUrl = null;

    if (type === "grade10") {
        pastUrl = "grade10-past-papers.html";
    } else if (type === "grade11") {
        pastUrl = "grade11-past-paper.html";
    } else if (type === "al") {
        pastUrl = "province-paper1.html";
    }

    pastPapersCard.onclick = null;
    pastPapersCard.onkeydown = null;

    pastPapersCard.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (pastUrl) window.location.href = pastUrl;
    };

    pastPapersCard.onkeydown = function(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (pastUrl) window.location.href = pastUrl;
        }
    };

    const pastLink = pastPapersCard.querySelector(".material-link");
    if (pastLink) {
        pastLink.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (pastUrl) window.location.href = pastUrl;
        };
    }
}


// =====================================================
// CHECK IF ANY FIELD IS ENABLED
// =====================================================

function isAnyEnabled(settings, fields) {
    return fields.some(function(field) {
        return settings[field] === true;
    });
}


// =====================================================
// LOAD PAPER VISIBILITY SETTINGS
// =====================================================

function applyPaperVisibility(type, settings) {
    if (type === "grade10") {
        const modelFields = [
            "grade10_term1_01", "grade10_term1_02", "grade10_term1_03", "grade10_term1_04", "grade10_term1_05",
            "grade10_term2_01", "grade10_term2_02", "grade10_term2_03", "grade10_term2_04", "grade10_term2_05",
            "grade10_term3_01", "grade10_term3_02", "grade10_term3_03", "grade10_term3_04", "grade10_term3_05"
        ];
        if (modelPapersCard) modelPapersCard.style.display = isAnyEnabled(settings, modelFields) || settings.modelPapersEnabled === true ? "" : "none";
        if (pastPapersCard) pastPapersCard.style.display = settings.pastPapersEnabled === true ? "" : "none";
        return;
    }

    if (type === "grade11") {
        const topRankingFields = [
            "grade11_term1_01", "grade11_term1_02", "grade11_term1_03", "grade11_term1_04", "grade11_term1_05",
            "grade11_term2_01", "grade11_term2_02", "grade11_term2_03", "grade11_term2_04", "grade11_term2_05",
            "grade11_term3_01", "grade11_term3_02", "grade11_term3_03", "grade11_term3_04", "grade11_term3_05"
        ];
        const pastFields = [
            "grade11_past_01", "grade11_past_02", "grade11_past_03", "grade11_past_04", "grade11_past_05",
            "grade11_past_06", "grade11_past_07", "grade11_past_08", "grade11_past_09", "grade11_past_10"
        ];
        if (modelPapersCard) modelPapersCard.style.display = isAnyEnabled(settings, topRankingFields) || settings.modelPapersEnabled === true ? "" : "none";
        if (pastPapersCard) pastPapersCard.style.display = isAnyEnabled(settings, pastFields) || settings.pastPapersEnabled === true ? "" : "none";
        return;
    }

    if (type === "al") {
        if (modelPapersCard) modelPapersCard.style.display = settings.modelPapersEnabled === true ? "" : "none";
        if (pastPapersCard) pastPapersCard.style.display = settings.pastPapersEnabled === true ? "" : "none";
    }
}

function startPaperVisibilityRealtime(type) {
    const settingsRef = doc(db, "paperSettings", type);
    return onSnapshot(settingsRef, (snapshot) => {
        if (!snapshot.exists()) {
            console.warn("Paper settings not found:", type);
            if (modelPapersCard) modelPapersCard.style.display = "none";
            if (pastPapersCard) pastPapersCard.style.display = "none";
            return;
        }
        applyPaperVisibility(type, snapshot.data());
        console.log("🔄 Dashboard paper visibility updated in real time:", type);
    }, (error) => {
        console.error("❌ Failed to watch paper visibility:", error);
    });
}


// =====================================================
// PAPER STATISTICS
// =====================================================

function getPaperStatistics(data) {
    let totalPapers = 0;
    let viewedPapers = 0;

    for (let i = 1; i <= 50; i++) {
        const field = "paper" + String(i).padStart(2, "0") + "Viewed";

        if (Object.prototype.hasOwnProperty.call(data, field)) {
            totalPapers++;

            if (data[field] === true) {
                viewedPapers++;
            }
        }
    }

    const progress = totalPapers > 0
        ? Math.round((viewedPapers / totalPapers) * 100)
        : 0;

    return {
        totalPapers,
        viewedPapers,
        progress
    };
}


function renderPaperStatistics(data, animate = false) {
    const stats = getPaperStatistics(data);

    if (totalPapersElement) {
        totalPapersElement.textContent = String(stats.totalPapers);
    }

    if (viewedPapersElement) {
        viewedPapersElement.textContent = String(stats.viewedPapers);
    }

    if (progressElement) {
        progressElement.textContent = `${stats.progress}%`;
    }

    const summaryProgress = document.getElementById("summaryProgress");
    if (summaryProgress) {
        summaryProgress.textContent = `${stats.progress}%`;
    }

    const progressFill = document.getElementById("progressFill");
    if (progressFill) {
        progressFill.style.width = `${stats.progress}%`;
    }

    if (animate) {
        [totalPapersElement, viewedPapersElement, summaryProgress, progressElement]
            .filter(Boolean)
            .forEach((element) => {
                element.classList.remove("realtime-stat-update");
                void element.offsetWidth;
                element.classList.add("realtime-stat-update");
            });
    }
}


// =====================================================
// REAL-TIME STUDENT STATISTICS
// =====================================================

let stopStudentRealtime = null;

function startStudentRealtime() {
    if (!studentRef) return;

    if (stopStudentRealtime) {
        stopStudentRealtime();
    }

    stopStudentRealtime = onSnapshot(
        studentRef,
        (snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();
            renderPaperStatistics(data, true);

            console.log("🔄 Student dashboard statistics updated in real time.");
        },
        (error) => {
            console.error("❌ Real-time student dashboard listener failed:", error);
        }
    );
}


// =====================================================
// LOAD STUDENT
// =====================================================

async function loadStudent() {
    if (!studentRef) {
        console.error("Student reference not available.");
        return;
    }

    try {
        const snapshot = await getDoc(studentRef);

        if (!snapshot.exists()) {
            console.error("Student record not found.");
            return;
        }

        const data = snapshot.data();
        const type = getGradeType(
            sessionStorage.getItem("studentType") ||
            data.studentType ||
            storedGrade ||
            data.grade
        );

        const gradeInfo = getDashboardData(type);
        const sessionStudentName =
            sessionStorage.getItem("studentName") ||
            sessionStorage.getItem("studentId");

        // The login session is the source of truth for the displayed identity.
        // Do not overwrite a valid logged-in name with a missing/placeholder
        // name from Firestore; this was causing the profile to flash correctly
        // and then revert to "Student".
        const firebaseName =
            data.fullName ||
            data.name ||
            data.studentName ||
            data.displayName ||
            "";

        const hasValidSessionName =
            sessionStudentName &&
            String(sessionStudentName).trim() &&
            String(sessionStudentName).trim().toLowerCase() !== "student";

        const studentName =
            hasValidSessionName
                ? String(sessionStudentName).trim()
                : (String(firebaseName).trim() || studentId || "Student");

        if (!hasValidSessionName && studentName !== "Student") {
            sessionStorage.setItem("studentName", studentName);
        }

        // Keep the logged-in student's real identity visible in the dashboard sidebar.
        sessionStorage.setItem("studentGrade", gradeInfo.grade);

        const sidebarName = document.getElementById("sidebarStudentId");
        const sidebarGrade = document.getElementById("sidebarStudentGrade");
        const sidebarAvatar = document.getElementById("sidebarStudentAvatar");

        if (sidebarName) sidebarName.textContent = studentName;
        if (sidebarGrade) sidebarGrade.textContent =
            type === "grade10" ? "Grade 10 Student" :
            type === "grade11" ? "Grade 11 Student" :
            "A/L Student";
        if (sidebarAvatar) sidebarAvatar.textContent =
            String(studentName).trim().charAt(0).toUpperCase() || "S";

        const topStudentId = document.getElementById("topStudentId");
        const topStudentType = document.getElementById("topStudentType");
        const topStudentName = document.getElementById("topStudentName");
        const topUserAvatar = document.getElementById("topUserAvatar");

        if (topStudentId) topStudentId.textContent = studentName;
        if (topStudentName) topStudentName.textContent = studentName;
        if (topStudentType) topStudentType.textContent =
            type === "grade10" ? "Grade 10 Student" :
            type === "grade11" ? "Grade 11 Student" :
            "A/L Student";
        if (topUserAvatar) topUserAvatar.textContent =
            String(studentName).trim().charAt(0).toUpperCase() || "S";

        if (studentIdElement) studentIdElement.textContent = studentId || "";
        if (studentGradeElement) studentGradeElement.textContent = gradeInfo.grade;
        if (gradeLabelElement) gradeLabelElement.textContent = gradeInfo.grade;
        if (studentNameElement) studentNameElement.textContent = studentName;

        updateGreeting(studentName);
        updateMaterialText(type);
        setupModelCard(type);
        setupPastCard(type);
        startPaperVisibilityRealtime(type);
        renderPaperStatistics(data);

        console.log("====================================");
        console.log("✅ STUDENT DASHBOARD LOADED");
        console.log("Student ID:", studentId);
        console.log("Grade Type:", type);
        console.log("Grade:", gradeInfo.grade);
        console.log("Model URL:", gradeInfo.model);
        console.log("Past URL:", gradeInfo.past);
        console.log("====================================");
    } catch (error) {
        console.error("Failed to load student:", error);
    }
}


// =====================================================
// UPDATE LAST ACTIVE
// =====================================================

async function updateLastActive() {
    if (!studentRef) return;

    try {
        await updateDoc(studentRef, {
            lastActiveAt: Date.now()
        });

        if (statusElement) {
            statusElement.textContent = "Online";
        }
    } catch (error) {
        console.error("Failed to update active status:", error);
    }
}


// =====================================================
// INITIAL LOAD + REAL-TIME LISTENER
// =====================================================

loadStudent();
startStudentRealtime();
updateLastActive();


// =====================================================
// HEARTBEAT
// =====================================================

const heartbeat = setInterval(
    updateLastActive,
    30000
);


// =====================================================
// ACTIVITY TRACKING
// =====================================================

let lastActivity = Date.now();

function markActivity() {
    lastActivity = Date.now();
}

[
    "click",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart"
].forEach(function(eventName) {
    document.addEventListener(eventName, markActivity, { passive: true });
});


// =====================================================
// AUTOMATIC LOGOUT
// =====================================================

const IDLE_LIMIT = 5 * 60 * 1000;

const idleChecker = setInterval(
    async function() {
        const idleTime = Date.now() - lastActivity;

        if (idleTime >= IDLE_LIMIT) {
            clearInterval(heartbeat);
            clearInterval(idleChecker);

            if (stopStudentRealtime) {
                stopStudentRealtime();
                stopStudentRealtime = null;
            }

            if (studentRef) {
                try {
                    await updateDoc(studentRef, {
                        lastActiveAt: 0
                    });
                } catch (error) {
                    console.error("Failed to mark offline:", error);
                }
            }

            sessionStorage.removeItem("loggedIn");
            sessionStorage.removeItem("studentId");
            sessionStorage.removeItem("studentGrade");

            alert("You have been logged out because you were inactive for 5 minutes.");
            window.location.replace("index.html");
        }
    },
    30000
);
