import {
    db,
    doc,
    getDoc
} from "./firebase.js";

if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.replace("index.html");
}

const studentId = sessionStorage.getItem("studentId");
const params = new URLSearchParams(window.location.search);
const paperNumber = String(params.get("paper") || "01").padStart(2, "0");
const monthName = String(params.get("month") || "september").toLowerCase();
const monthNames = {
    january: "January", february: "February", march: "March", april: "April",
    may: "May", june: "June", july: "July", august: "August",
    september: "September", october: "October", november: "November", december: "December"
};
const monthLabel = monthNames[monthName] || "September";
const yearLabel = monthName === "september" ? "2026" : "2026";

async function getStudentData() {
    if (!studentId) return null;
    try {
        const snapshot = await getDoc(doc(db, "students", studentId));
        return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
        console.error("Firestore error:", error);
        return null;
    }
}

function isALStudent(studentData) {
    const studentType = String(studentData?.studentType || "").trim().toLowerCase();
    const grade = String(studentData?.grade || "").trim().toLowerCase();
    return [studentType, grade].some(value =>
        ["al", "a/l", "a level", "advanced", "advanced level"].includes(value)
    );
}

function hasPaperAccess(studentData) {
    if (isALStudent(studentData)) return true;
    if (!studentData) return false;
    if (!Object.prototype.hasOwnProperty.call(studentData, "paper01")) return true;
    const value = studentData.paper01;
    return value === true || value === "true" || value === 1 || value === "1";
}

async function checkPaperResource(linkId, statusId, type) {
    const link = document.getElementById(linkId);
    const status = document.getElementById(statusId);
    if (!link || !status) return;

    const viewerUrl = `al-paper-viewer.html?paper=${paperNumber}&type=${type}&month=${monthName}`;
    const monthTitle = monthLabel;
    const imageUrl = `papers/al-top-ranking/${monthName}/paper-${paperNumber}-${type === "second" ? "2nd-paper" : "1st-paper"}/page-01.jpg`;

    try {
        const response = await fetch(imageUrl, { method: "HEAD", cache: "no-store" });
        if (response.ok) {
            link.href = viewerUrl;
            link.target = "_self";
            link.rel = "";
            link.classList.remove("pending");
            link.textContent = "View Paper →";
            status.textContent = "Pages available";
        } else {
            status.textContent = "Paper is not uploaded yet.";
        }
    } catch (error) {
        status.textContent = "Paper is not uploaded yet.";
    }
}

function addAnswerSection() {
    if (document.getElementById("answerSection")) return;

    const section = document.createElement("section");
    section.id = "answerSection";
    section.innerHTML = `
        <div class="paper-header answer-header">
            <div class="kicker">ANSWER SCHEMES</div>
            <h2>Paper ${paperNumber} Answers</h2>
            <p>Official answer schemes for the ${monthLabel} ${yearLabel} Top Ranking Model.</p>
        </div>
        <div class="papers answer-papers">
            <article class="pdf-card answer-card">
                <div class="pdf-icon">📘</div>
                <h3>1st Paper Answer</h3>
                <p>Complete ${monthLabel} ${yearLabel} answer scheme for the 1st Paper.</p>
                <a class="pdf-link" href="al-top-ranking-answer.html?paper=${paperNumber}&type=first&month=${monthName}">View Answer →</a>
                <div class="status">Protected online viewer</div>
            </article>
            <article class="pdf-card answer-card">
                <div class="pdf-icon">📗</div>
                <h3>2nd Paper Answer</h3>
                <p>Complete ${monthLabel} ${yearLabel} answer scheme for the 2nd Paper.</p>
                <a class="pdf-link" href="al-top-ranking-answer.html?paper=${paperNumber}&type=second&month=${monthName}">View Answer →</a>
                <div class="status">Protected online viewer</div>
            </article>
        </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
        #answerSection { margin-top: 22px; }
        #answerSection .answer-header { border-radius: 22px 22px 0 0; }
        #answerSection .answer-papers { border-top: 0; border-radius: 0 0 22px 22px; }
        #answerSection .answer-card { position: relative; }
        #answerSection .answer-card::after {
            content: "OFFICIAL ANSWER";
            position: absolute;
            top: 18px;
            right: 18px;
            padding: 5px 8px;
            border-radius: 999px;
            background: rgba(166,255,46,.09);
            border: 1px solid rgba(166,255,46,.18);
            color: #a6ff2e;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .7px;
        }
        @media(max-width:650px){#answerSection .answer-papers{grid-template-columns:1fr;padding:15px}}
    `;
    document.head.appendChild(style);
    document.querySelector(".wrap")?.appendChild(section);
}

async function initialize() {
    const studentData = await getStudentData();
    if (!studentData || !hasPaperAccess(studentData)) {
        alert(`Paper ${paperNumber} is not available for your account yet.`);
        window.location.replace("model-papers.html");
        return;
    }

    const pageTitle = document.getElementById("pageTitle");
    const pageKicker = document.getElementById("pageKicker");
    const paperKicker = document.getElementById("paperKicker");
    const firstDescription = document.getElementById("firstDescription");
    const secondDescription = document.getElementById("secondDescription");

    if (pageTitle) pageTitle.textContent = `Paper ${paperNumber}`;
    if (pageKicker) pageKicker.textContent = `${monthLabel.toUpperCase()} ${yearLabel} • A/L TOP RANKING MODEL`;
    if (paperKicker) paperKicker.textContent = `PAPER ${paperNumber}`;
    const paperHeaderTitle = document.getElementById("paperHeaderTitle");
    if (paperHeaderTitle) paperHeaderTitle.textContent = `${monthLabel} Model Paper`;
    if (firstDescription) firstDescription.textContent = `Open the ${monthLabel} ${yearLabel} Top Ranking Model — Paper ${paperNumber} 1st Paper.`;
    if (secondDescription) secondDescription.textContent = `Open the ${monthLabel} ${yearLabel} Top Ranking Model — Paper ${paperNumber} 2nd Paper.`;

    await Promise.all([
        checkPaperResource("firstPaper", "firstStatus", "first"),
        checkPaperResource("secondPaper", "secondStatus", "second")
    ]);

    if (isALStudent(studentData) && monthName === "september") addAnswerSection();
}

document.addEventListener("DOMContentLoaded", initialize);
