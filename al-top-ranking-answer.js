import * as pdfjsLib from "./pdfjs/build/pdf.mjs";

if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.replace("index.html");
}

const studentId = sessionStorage.getItem("studentId");
const params = new URLSearchParams(window.location.search);
const resourceKind = params.get("resource") === "paper" ? "paper" : "answer";
const type = params.get("type") === "second" ? "second" : "first";
const paper = String(params.get("paper") || "01").padStart(2, "0");
const monthName = String(params.get("month") || "september").toLowerCase();
const monthNames = {
    january: "January", february: "February", march: "March", april: "April",
    may: "May", june: "June", july: "July", august: "August",
    september: "September", october: "October", november: "November", december: "December"
};
const monthLabel = monthNames[monthName] || "September";
const yearLabel = String(Number(params.get("year") || 2026));
const partLabel = type === "second" ? "2nd" : "1st";
const pdfName = resourceKind === "paper"
    ? `paper-${paper}-${partLabel}-paper.pdf`
    : `paper-${paper}-${partLabel}-answer.pdf`;
const pdfUrl = resourceKind === "paper"
    ? `papers/al-top-ranking/${monthName}/${pdfName}`
    : `answers/al-top-ranking/${monthName}/${pdfName}`;

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/build/pdf.worker.mjs";

const title = document.getElementById("title");
const kicker = document.getElementById("kicker");
const loading = document.getElementById("loading");
const pages = document.getElementById("pages");
const back = document.getElementById("back");
const resourceLabel = resourceKind === "paper" ? "Paper" : "Answer";

if (title) title.textContent = `Paper ${paper} • ${partLabel} ${resourceLabel}`;
if (kicker) kicker.textContent = `${monthLabel.toUpperCase()} ${yearLabel} • A/L TOP RANKING • ${partLabel.toUpperCase()} ${resourceLabel.toUpperCase()}`;
if (back) back.addEventListener("click", () => history.back());

function blockAccess(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
}
["contextmenu", "dragstart", "selectstart"].forEach(name => document.addEventListener(name, blockAccess, true));
document.addEventListener("keydown", event => {
    const key = String(event.key || "").toLowerCase();
    if ((event.ctrlKey || event.metaKey) && ["p", "s", "u", "c", "a"].includes(key)) blockAccess(event);
    if (key === "printscreen") {
        document.body.style.visibility = "hidden";
        setTimeout(() => { document.body.style.visibility = "visible"; }, 900);
    }
    if (event.key === "F12" || (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))) blockAccess(event);
});
window.addEventListener("beforeprint", () => { document.body.style.display = "none"; });

function isALStudent(data) {
    const values = [data?.studentType, data?.grade, data?.stream, data?.studentLevel]
        .map(value => String(value || "").trim().toLowerCase());
    return values.some(value =>
        ["al", "a/l", "a level", "advanced", "advanced level"].includes(value) ||
        /(^|[^a-z])a\s*\/?\s*l([^a-z]|$)/i.test(value) ||
        /advanced\s+level|a\s+level/i.test(value)
    );
}

async function verifyALAccess() {
    if (!studentId) return false;
    try {
        const { db, doc, getDoc } = await import("./firebase.js");
        const snap = await getDoc(doc(db, "students", studentId));
        return snap.exists() && isALStudent(snap.data() || {});
    } catch (error) {
        console.error("PDF viewer access check failed:", error);
        return false;
    }
}

async function renderPDF() {
    try {
        const allowed = await verifyALAccess();
        if (!allowed) {
            loading.textContent = "This paper or answer sheet is available only to authorized A/L students.";
            return;
        }

        const pdf = await pdfjsLib.getDocument({ url: pdfUrl, disableAutoFetch: false }).promise;
        loading.remove();

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const pdfPage = await pdf.getPage(pageNumber);
            const baseViewport = pdfPage.getViewport({ scale: 1 });
            const maxWidth = Math.min(window.innerWidth - 28, 900);
            const scale = Math.min(maxWidth / baseViewport.width, 1.65);
            const viewport = pdfPage.getViewport({ scale });

            const card = document.createElement("article");
            card.className = "page";
            card.style.width = `${viewport.width}px`;

            const canvas = document.createElement("canvas");
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(viewport.width * ratio);
            canvas.height = Math.floor(viewport.height * ratio);
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            const context = canvas.getContext("2d", { alpha: false });
            await pdfPage.render({
                canvasContext: context,
                viewport,
                transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0]
            }).promise;

            card.appendChild(canvas);
            pages.appendChild(card);
        }
        document.title = `${monthLabel} ${yearLabel} • Paper ${paper} ${partLabel} ${resourceLabel}`;
    } catch (error) {
        console.error(`${resourceLabel} PDF failed to load:`, error);
        loading.innerHTML = `<div class="error"><h2>${resourceLabel} temporarily unavailable</h2><p>The viewer could not load this file. Refresh and try again, or contact the administrator if the file remains unavailable.</p></div>`;
    }
}

document.title = `${monthLabel} ${yearLabel} • Paper ${paper} ${partLabel} ${resourceLabel}`;
document.addEventListener("DOMContentLoaded", renderPDF, { once: true });
