import { db, doc, getDoc } from "./firebase.js";

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
const yearLabel = String(Number(params.get("year") || 2026));
document.title = `${monthLabel} ${yearLabel} • Top Ranking Paper`;

async function getStudentData() {
    if (!studentId) return null;
    try {
        const snapshot = await getDoc(doc(db, "students", studentId));
        return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
        console.error("Student access check failed:", error);
        return null;
    }
}

function isALStudent(studentData) {
    const values = [studentData?.studentType, studentData?.grade, studentData?.stream, studentData?.studentLevel]
        .map(value => String(value || "").trim().toLowerCase());
    return values.some(value =>
        ["al", "a/l", "a level", "advanced", "advanced level"].includes(value) ||
        /(^|[^a-z])a\s*\/?\s*l([^a-z]|$)/i.test(value) ||
        /advanced\s+level|a\s+level/i.test(value)
    );
}

function hasPaperAccess(studentData) {
    if (!studentData) return false;
    if (isALStudent(studentData)) return true;
    if (!Object.prototype.hasOwnProperty.call(studentData, "paper01")) return true;
    const value = studentData.paper01;
    return value === true || value === "true" || value === 1 || value === "1";
}

function setLinkUnavailable(link, status, message) {
    link.removeAttribute("href");
    link.removeAttribute("target");
    link.classList.add("pending");
    link.setAttribute("aria-disabled", "true");
    link.textContent = "Not available yet";
    status.textContent = message;
}

async function checkPaperResource(linkId, statusId, type) {
    const link = document.getElementById(linkId);
    const status = document.getElementById(statusId);
    if (!link || !status) return;

    const folderName = type === "second" ? "2nd-paper" : "1st-paper";
    const isNovemberPdf = monthName === "november" && yearLabel === "2026";
    const resourcePath = isNovemberPdf
        ? `papers/al-top-ranking/${monthName}/paper-${paperNumber}-${folderName}.pdf`
        : `papers/al-top-ranking/${monthName}/paper-${paperNumber}-${folderName}/page-01.jpg`;

    try {
        const response = await fetch(resourcePath, { method: "HEAD", cache: "no-store" });
        if (!response.ok) {
            setLinkUnavailable(link, status, isNovemberPdf ? "Paper PDF has not been uploaded." : "Paper pages have not been uploaded.");
            return;
        }

        if (isNovemberPdf) {
            const viewerUrl = `al-top-ranking-answer.html?resource=paper&paper=${paperNumber}&type=${type}&month=${monthName}&year=${yearLabel}`;
            link.href = viewerUrl;
            link.target = "_self";
            link.textContent = "View Paper →";
            status.textContent = "Protected online viewer · PDF available";
        } else {
            link.href = `al-paper-viewer.html?paper=${paperNumber}&type=${type}&month=${monthName}&year=${yearLabel}`;
            link.target = "_self";
            link.textContent = "View Paper →";
            status.textContent = "Online page viewer available";
        }
        link.rel = "";
        link.classList.remove("pending");
        link.removeAttribute("aria-disabled");
    } catch (error) {
        console.error(`Could not check ${type} paper resource:`, error);
        setLinkUnavailable(link, status, "Could not check the paper file. Refresh and try again.");
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
            <p>Choose an answer sheet to view inside the student portal.</p>
        </div>
        <div class="papers answer-papers">
            <article class="pdf-card answer-card">
                <div class="pdf-icon">📘</div>
                <h3>1st Paper Answer</h3>
                <p>${monthLabel} ${yearLabel} · First answer sheet</p>
                <a class="pdf-link pending" id="firstAnswerLink" aria-disabled="true">Checking answer PDF…</a>
                <div class="status" id="firstAnswerStatus">Checking uploaded answer sheet…</div>
            </article>
            <article class="pdf-card answer-card">
                <div class="pdf-icon">📗</div>
                <h3>2nd Paper Answer</h3>
                <p>${monthLabel} ${yearLabel} · Second answer sheet</p>
                <a class="pdf-link pending" id="secondAnswerLink" aria-disabled="true">Checking answer PDF…</a>
                <div class="status" id="secondAnswerStatus">Checking uploaded answer sheet…</div>
            </article>
        </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
        #answerSection { margin-top: 24px; }
        #answerSection .answer-header { border-radius: 20px 20px 0 0; }
        #answerSection .answer-papers { border-top: 0; border-radius: 0 0 20px 20px; }
        #answerSection .answer-card { position: relative; }
        #answerSection .answer-card::after {
            content: "ANSWER SHEET"; position: absolute; top: 18px; right: 18px;
            padding: 5px 8px; border-radius: 999px;
            background: rgba(166,255,46,.09); border: 1px solid rgba(166,255,46,.18);
            color: #a6ff2e; font-size: 9px; font-weight: 900; letter-spacing: .7px;
        }
        #answerSection .pdf-link.pending { opacity: .58; pointer-events: none; }
        @media(max-width:650px){#answerSection .answer-papers{grid-template-columns:1fr;padding:15px}}
    `;
    document.head.appendChild(style);
    document.querySelector(".wrap")?.appendChild(section);
}

async function checkAnswerResource(linkId, statusId, type) {
    const link = document.getElementById(linkId);
    const status = document.getElementById(statusId);
    if (!link || !status) return;

    const part = type === "second" ? "2nd" : "1st";
    const pdfPath = `answers/al-top-ranking/${monthName}/paper-${paperNumber}-${part}-answer.pdf`;
    try {
        const response = await fetch(pdfPath, { method: "HEAD", cache: "no-store" });
        if (!response.ok) {
            setLinkUnavailable(link, status, "This answer sheet has not been uploaded for this month.");
            return;
        }
        link.href = `al-top-ranking-answer.html?resource=answer&paper=${paperNumber}&type=${type}&month=${monthName}&year=${yearLabel}`;
        link.target = "_self";
        link.textContent = "View Answer →";
        link.classList.remove("pending");
        link.removeAttribute("aria-disabled");
        status.textContent = "Protected in-system PDF viewer · Available";
    } catch (error) {
        console.error(`Could not check ${type} answer resource:`, error);
        setLinkUnavailable(link, status, "Could not check the answer file. Refresh and try again.");
    }
}

async function initialize() {
    try {
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

        addAnswerSection();
        await Promise.all([
            checkPaperResource("firstPaper", "firstStatus", "first"),
            checkPaperResource("secondPaper", "secondStatus", "second"),
            checkAnswerResource("firstAnswerLink", "firstAnswerStatus", "first"),
            checkAnswerResource("secondAnswerLink", "secondAnswerStatus", "second")
        ]);

        if (params.get("focus") === "answers") {
            requestAnimationFrame(() => {
                document.getElementById("answerSection")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
        }
    } catch (error) {
        console.error("Top Ranking paper page initialization failed:", error);
        const statuses = ["firstStatus", "secondStatus", "firstAnswerStatus", "secondAnswerStatus"];
        statuses.forEach(id => {
            const node = document.getElementById(id);
            if (node) node.textContent = "Page could not load correctly. Refresh and try again.";
        });
    }
}

document.addEventListener("DOMContentLoaded", initialize, { once: true });
