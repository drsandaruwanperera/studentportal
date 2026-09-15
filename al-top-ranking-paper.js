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

async function checkPageImage(linkId, statusId, type) {
    const link = document.getElementById(linkId);
    const status = document.getElementById(statusId);
    if (!link || !status) return;

    const viewerUrl = `al-paper-viewer.html?paper=${paperNumber}&type=${type}`;
    const firstPageUrl = `papers/al-top-ranking/september/paper-${paperNumber}-${type === "second" ? "2nd-paper" : "1st-paper"}/page-01.jpg`;

    try {
        const response = await fetch(firstPageUrl, { method: "HEAD", cache: "no-store" });
        if (response.ok) {
            link.href = viewerUrl;
            link.classList.remove("pending");
            link.textContent = "Open Paper →";
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
            <p>Official answer schemes for the September 2026 Top Ranking Model.</p>
        </div>
        <div class="papers answer-papers">
            <article class="pdf-card answer-card">
                <div class="pdf-icon">📘</div>
                <h3>1st Paper Answer</h3>
                <p>Complete September 2026 answer scheme for the 1st Paper.</p>
                <a class="pdf-link" href="al-top-ranking-answer.html?paper=${paperNumber}&type=first">View Answer →</a>
                <div class="status">Protected online viewer</div>
            </article>
            <article class="pdf-card answer-card">
                <div class="pdf-icon">📗</div>
                <h3>2nd Paper Answer</h3>
                <p>Complete September 2026 answer scheme for the 2nd Paper.</p>
                <a class="pdf-link" href="al-top-ranking-answer.html?paper=${paperNumber}&type=second">View Answer →</a>
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
    const paperKicker = document.getElementById("paperKicker");
    const firstDescription = document.getElementById("firstDescription");
    const secondDescription = document.getElementById("secondDescription");

    if (pageTitle) pageTitle.textContent = `Paper ${paperNumber}`;
    if (paperKicker) paperKicker.textContent = `PAPER ${paperNumber}`;
    if (firstDescription) firstDescription.textContent = `Open the September 2026 Top Ranking Model — Paper ${paperNumber} 1st Paper.`;
    if (secondDescription) secondDescription.textContent = `Open the September 2026 Top Ranking Model — Paper ${paperNumber} 2nd Paper.`;

    await Promise.all([
        checkPageImage("firstPaper", "firstStatus", "first"),
        checkPageImage("secondPaper", "secondStatus", "second")
    ]);

    if (isALStudent(studentData)) addAnswerSection();
}

document.addEventListener("DOMContentLoaded", initialize);
