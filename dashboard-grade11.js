// ==========================
// Firebase
// ==========================

import {
    db,
    doc,
    getDoc,
    updateDoc,
    onSnapshot
} from "./firebase.js";


// ==========================
// Check Login
// ==========================

if (
    sessionStorage.getItem("loggedIn") !== "true"
) {

    window.location.replace("index.html");

}


// ==========================
// Student Information
// ==========================

const studentId =
    sessionStorage.getItem("studentId");

const storedGrade =
    sessionStorage.getItem("studentGrade");


// ==========================
// Elements
// ==========================

const studentIdElement =
    document.getElementById("studentId");

const studentGradeElement =
    document.getElementById("studentGrade");

const studentNameElement =
    document.getElementById("studentName");

const greetingElement =
    document.getElementById("greeting");

const gradeLabelElement =
    document.getElementById("gradeLabel");

const statusElement =
    document.getElementById("onlineStatus");

const totalPapersElement =
    document.getElementById("totalPapers");

const viewedPapersElement =
    document.getElementById("viewedPapers");

const progressElement =
    document.getElementById("progressValue");

const modelPapersCard =
    document.getElementById("modelPapersCard");

const pastPapersCard =
    document.getElementById("pastPapersCard");

// Keep Grade 11 dashboard cards synced with the admin's live paper settings.
const grade11PaperSettingsRef = doc(db, "paperSettings", "grade11");
const grade11ModelFields = [
    "grade11_term1_01", "grade11_term1_02", "grade11_term1_03", "grade11_term1_04", "grade11_term1_05",
    "grade11_term2_01", "grade11_term2_02", "grade11_term2_03", "grade11_term2_04", "grade11_term2_05",
    "grade11_term3_01", "grade11_term3_02", "grade11_term3_03", "grade11_term3_04", "grade11_term3_05"
];
const grade11PastFields = [
    "grade11_past_01", "grade11_past_02", "grade11_past_03", "grade11_past_04", "grade11_past_05",
    "grade11_past_06", "grade11_past_07", "grade11_past_08", "grade11_past_09", "grade11_past_10"
];
onSnapshot(grade11PaperSettingsRef, (snapshot) => {
    if (!snapshot.exists()) {
        if (modelPapersCard) modelPapersCard.style.display = "none";
        if (pastPapersCard) pastPapersCard.style.display = "none";
        return;
    }
    const settings = snapshot.data();
    const modelEnabled = settings.modelPapersEnabled === true || grade11ModelFields.some((field) => settings[field] === true);
    const pastEnabled = settings.pastPapersEnabled === true || grade11PastFields.some((field) => settings[field] === true);
    if (modelPapersCard) modelPapersCard.style.display = modelEnabled ? "" : "none";
    if (pastPapersCard) pastPapersCard.style.display = pastEnabled ? "" : "none";
}, (error) => console.error("Failed to watch Grade 11 paper settings:", error));



// ==========================
// Student Reference
// ==========================

let studentRef = null;

if (studentId) {

    studentRef =
        doc(
            db,
            "students",
            studentId
        );

}


// ==========================
// Grade Helper
// ==========================

function getGradeType(value) {

    const grade =
        String(value || "")
            .toLowerCase()
            .trim();


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
        grade === "advancedlevel"
    ) {

        return "al";

    }


    return "grade11";

}


// ==========================
// Grade Display
// ==========================

function getGradeDisplay(
    type
) {

    if (type === "grade10") {

        return "Grade 10";

    }

    if (type === "grade11") {

        return "Grade 11";

    }

    return "Advanced Level";

}


// ==========================
// Grade Paths
// ==========================

function getDashboardData(
    type
) {

    if (type === "grade10") {

        return {

            grade:
                "Grade 10",

            model:
                "grade10-model-papers.html",

            past:
                "grade10-past-papers.html"

        };

    }


    if (type === "al") {

        return {

            grade:
                "Advanced Level",

            model:
                "al-model-papers.html",

            past:
                "al-past-papers.html"

        };

    }


    return {

        grade:
            "Grade 11",

        model:
            "grade11-model-papers.html",

        past:
            "grade11-past-paper.html"

    };

}


// ==========================
// Greeting
// ==========================

function updateGreeting(
    studentName
) {

    const hour =
        new Date().getHours();


    let greeting = "Good evening";


    if (hour >= 5 && hour < 12) {

        greeting =
            "Good morning";

    }

    else if (
        hour >= 12 &&
        hour < 17
    ) {

        greeting =
            "Good afternoon";

    }


    if (greetingElement) {

        greetingElement.textContent =
            `${greeting}, ${studentName} 👋`;

    }

}


// ==========================
// Load Student
// ==========================

async function loadStudent() {

    if (!studentRef) {

        return;

    }


    try {

        const snapshot =
            await getDoc(
                studentRef
            );


        if (!snapshot.exists()) {

            console.error(
                "Student record not found."
            );

            return;

        }


        const data =
            snapshot.data();


        // ==========================
        // Detect Grade
        // ==========================

        const type =
            getGradeType(
                data.studentType ||
                storedGrade ||
                data.grade
            );


        const gradeInfo =
            getDashboardData(
                type
            );


        // ==========================
        // Student Name
        // ==========================

        const studentName =
            data.name ||
            data.studentName ||
            data.fullName ||
            "Student";


        // ==========================
        // Display
        // ==========================

        if (studentIdElement) {

            studentIdElement.textContent =
                studentId || "";

        }


        if (studentGradeElement) {

            studentGradeElement.textContent =
                gradeInfo.grade;

        }


        if (gradeLabelElement) {

            gradeLabelElement.textContent =
                gradeInfo.grade;

        }


        if (studentNameElement) {

            studentNameElement.textContent =
                studentName;

        }


        updateGreeting(
            studentName
        );


        // ==========================
        // Resource Links
        // ==========================

        if (modelPapersCard) {

            modelPapersCard.onclick =
                () => {

                    window.location.href =
                        gradeInfo.model;

                };

        }


        if (pastPapersCard) {

            pastPapersCard.onclick =
                () => {

                    window.location.href =
                        gradeInfo.past;

                };

        }


        // ==========================
        // Paper Statistics
        // ==========================

        let totalPapers = 0;

        let viewedPapers = 0;


        for (
            let i = 1;
            i <= 50;
            i++
        ) {

            const field =
                "paper" +
                String(i).padStart(
                    2,
                    "0"
                ) +
                "Viewed";


            if (
                Object.prototype.hasOwnProperty
                    .call(data, field)
            ) {

                totalPapers++;


                if (
                    data[field] === true
                ) {

                    viewedPapers++;

                }

            }

        }


        if (totalPapersElement) {

            totalPapersElement.textContent =
                totalPapers;

        }


        if (viewedPapersElement) {

            viewedPapersElement.textContent =
                viewedPapers;

        }


        const progress =
            totalPapers > 0
                ? Math.round(
                    (
                        viewedPapers /
                        totalPapers
                    ) * 100
                )
                : 0;


        if (progressElement) {

            progressElement.textContent =
                progress + "%";

        }


        console.log(
            "✅ Student Dashboard Loaded",
            {
                studentId,
                studentName,
                type,
                grade: gradeInfo.grade
            }
        );

    }

    catch (error) {

        console.error(
            "Failed to load student:",
            error
        );

    }

}


// ==========================
// Update Last Active
// ==========================

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


        if (statusElement) {

            statusElement.textContent =
                "Online";

        }

    }

    catch (error) {

        console.error(
            "Failed to update active status:",
            error
        );

    }

}


// ==========================
// Initial Load
// ==========================

loadStudent();

updateLastActive();


// ==========================
// Heartbeat
// ==========================

const heartbeat =
    setInterval(
        updateLastActive,
        30000
    );


// ==========================
// Activity Tracking
// ==========================

let lastActivity =
    Date.now();


function markActivity() {

    lastActivity =
        Date.now();

}


[
    "click",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart"
].forEach(
    eventName => {

        document.addEventListener(
            eventName,
            markActivity,
            {
                passive: true
            }
        );

    }
);


// ==========================
// Automatic Logout
// ==========================

const IDLE_LIMIT =
    5 * 60 * 1000;


const idleChecker =
    setInterval(
        async () => {

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
                            "Failed to mark offline:",
                            error
                        );

                    }

                }


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


// ==========================
// Tab Visibility
// ==========================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            lastActivity =
                Date.now();

            updateLastActive();

        }

    }
);


// ==========================
// Logout
// ==========================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Are you sure you want to sign out?"
                );


            if (!confirmed) {

                return;

            }


            clearInterval(
                heartbeat
            );

            clearInterval(
                idleChecker
            );


            // ==========================
            // Mark Offline
            // ==========================

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
                        "Failed to update logout status:",
                        error
                    );

                }

            }


            // ==========================
            // Clear Session
            // ==========================

            sessionStorage.removeItem(
                "loggedIn"
            );

            sessionStorage.removeItem(
                "studentId"
            );

            sessionStorage.removeItem(
                "studentGrade"
            );


            // ==========================
            // Redirect
            // ==========================

            window.location.replace(
                "index.html"
            );

        }
    );

}


// ==========================
// Console
// ==========================

console.log(
    "🟢 Dynamic Student Dashboard Active:",
    studentId
);
