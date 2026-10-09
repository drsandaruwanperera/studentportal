// =====================================================
// GRADE 10 STUDENT DASHBOARD
// =====================================================


// =====================================================
// LOGIN CHECK
// =====================================================

if (
    sessionStorage.getItem("loggedIn") !== "true"
) {

    window.location.replace(
        "index.html"
    );

}


// =====================================================
// STUDENT INFORMATION
// =====================================================

const studentId =
    sessionStorage.getItem(
        "studentId"
    );


const studentGrade =
    sessionStorage.getItem(
        "studentGrade"
    );


// =====================================================
// SHOW STUDENT ID
// =====================================================

const studentIdElement =
    document.getElementById(
        "studentId"
    );


if (studentIdElement) {

    studentIdElement.textContent =
        studentId || "Unknown";

}


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
// STUDENT REFERENCE
// =====================================================

let studentRef = null;


if (studentId) {

    studentRef =
        doc(
            db,
            "students",
            studentId
        );

}


// =====================================================
// PAPER SETTINGS
// =====================================================

const paperSettingsRef =
    doc(
        db,
        "paperSettings",
        "grade10"
    );


// =====================================================
// DASHBOARD CARDS
// =====================================================

const modelPapersCard =
    document.getElementById(
        "modelPapersCard"
    );


const pastPapersCard =
    document.getElementById(
        "pastPapersCard"
    );


// =====================================================
// HIDE ELEMENT
// =====================================================

function hideElement(element) {

    if (!element) {
        return;
    }

    element.style.display =
        "none";

}


// =====================================================
// SHOW ELEMENT
// =====================================================

function showElement(element) {

    if (!element) {
        return;
    }

    element.style.display =
        "";

}


// =====================================================
// LOAD PAPER VISIBILITY
// =====================================================

function loadPaperVisibility() {
    onSnapshot(paperSettingsRef, (snapshot) => {
        if (!snapshot.exists()) {
            console.warn("⚠️ Grade 10 paperSettings document not found.");
            hideElement(modelPapersCard);
            hideElement(pastPapersCard);
            return;
        }

        const settings = snapshot.data();
        const modelFields = [
            "grade10_term1_01", "grade10_term1_02", "grade10_term1_03", "grade10_term1_04", "grade10_term1_05",
            "grade10_term2_01", "grade10_term2_02", "grade10_term2_03", "grade10_term2_04", "grade10_term2_05",
            "grade10_term3_01", "grade10_term3_02", "grade10_term3_03", "grade10_term3_04", "grade10_term3_05"
        ];
        const modelEnabled = settings.modelPapersEnabled === true || modelFields.some((field) => settings[field] === true);
        const pastEnabled = settings.pastPapersEnabled === true;

        modelEnabled ? showElement(modelPapersCard) : hideElement(modelPapersCard);
        pastEnabled ? showElement(pastPapersCard) : hideElement(pastPapersCard);
        console.log("🔄 Grade 10 dashboard paper visibility updated in real time.");
    }, (error) => {
        console.error("❌ Failed to watch Grade 10 paper settings:", error);
    });
}


// =====================================================
// LOAD SETTINGS
// =====================================================

loadPaperVisibility();


// =====================================================
// FIREBASE LIVE TRACKING
// =====================================================

async function updateLastActive() {

    if (!studentRef) {
        return;
    }


    try {

        await updateDoc(
            studentRef,
            {
                lastActiveAt:
                    Date.now()
            }
        );

    }
    catch (error) {

        console.error(
            "Failed to update active status:",
            error
        );

    }

}


// =====================================================
// INITIAL ACTIVE STATUS
// =====================================================

updateLastActive();


// =====================================================
// HEARTBEAT
// =====================================================

const heartbeat =
    setInterval(
        updateLastActive,
        30000
    );


// =====================================================
// ACTIVITY TRACKING
// =====================================================

let lastActivity =
    Date.now();


function markActivity() {

    lastActivity =
        Date.now();

    updateLastActive();

}


[
    "click",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart"
].forEach(
    function (eventName) {

        document.addEventListener(
            eventName,
            markActivity,
            {
                passive: true
            }
        );

    }
);


// =====================================================
// AUTO LOGOUT
// =====================================================

const IDLE_LIMIT =
    5 * 60 * 1000;


const idleChecker =
    setInterval(
        function () {

            const idleTime =
                Date.now() -
                lastActivity;


            if (
                idleTime >=
                IDLE_LIMIT
            ) {

                clearInterval(
                    heartbeat
                );

                clearInterval(
                    idleChecker
                );


                sessionStorage.removeItem(
                    "loggedIn"
                );

                sessionStorage.removeItem(
                    "studentId"
                );

                sessionStorage.removeItem(
                    "studentGrade"
                );


                alert(
                    "You have been logged out because you were inactive for 5 minutes."
                );


                window.location.replace(
                    "index.html"
                );

            }

        },
        10000
    );


// =====================================================
// TAB VISIBILITY
// =====================================================

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            lastActivity =
                Date.now();

            updateLastActive();

            // Reload paper visibility
            // when student returns to tab

            loadPaperVisibility();

        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            clearInterval(
                heartbeat
            );


            clearInterval(
                idleChecker
            );


            // ---------------------------------------------
            // MARK STUDENT OFFLINE
            // ---------------------------------------------

            if (studentRef) {

                try {

                    await updateDoc(
                        studentRef,
                        {
                            lastActiveAt: 0
                        }
                    );

                }
                catch (error) {

                    console.error(
                        "Logout status update failed:",
                        error
                    );

                }

            }


            // ---------------------------------------------
            // CLEAR SESSION
            // ---------------------------------------------

            sessionStorage.removeItem(
                "loggedIn"
            );

            sessionStorage.removeItem(
                "studentId"
            );

            sessionStorage.removeItem(
                "studentGrade"
            );


            // ---------------------------------------------
            // REDIRECT
            // ---------------------------------------------

            window.location.replace(
                "index.html"
            );

        }
    );

}


// =====================================================
// CONSOLE
// =====================================================

console.log(
    "===================================="
);

console.log(
    "📘 GRADE 10 STUDENT DASHBOARD"
);

console.log(
    "Student ID:",
    studentId
);

console.log(
    "Grade:",
    studentGrade
);

console.log(
    "Paper visibility system: ACTIVE"
);

console.log(
    "===================================="
);
