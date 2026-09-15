import * as pdfjsLib from "./pdfjs/build/pdf.mjs";

if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.replace("index.html");
}

const studentId = sessionStorage.getItem("studentId");
const params = new URLSearchParams(window.location.search);
const type = params.get("type") === "second" ? "second" : "first";
const paper = String(params.get("paper") || "01").padStart(2, "0");
const pdfName = type === "second"
    ? `paper-${paper}-2nd-answer.pdf`
    : `paper-${paper}-1st-answer.pdf`;
const pdfUrl = `answers/al-top-ranking/september/${pdfName}`;

const title = document.getElementById("title");
const kicker = document.getElementById("kicker");
const loading = document.getElementById("loading");
const pages = document.getElementById("pages");
const back = document.getElementById("back");

if (title) title.textContent = `Paper ${paper} • ${type === "second" ? "2nd" : "1st"} Paper Answer`;
if (kicker) kicker.textContent = `SEPTEMBER 2026 • A/L TOP RANKING • ${type.toUpperCase()} PAPER ANSWER`;
if (back) back.addEventListener("click", () => history.back());

function blockAccess(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
}

["contextmenu", "dragstart", "selectstart"].forEach(name => {
    document.addEventListener(name, blockAccess, true);
});

document.addEventListener("keydown", event => {
    const key = String(event.key || "").toLowerCase();
    if ((event.ctrlKey || event.metaKey) && ["p", "s", "u", "c", "a"].includes(key)) {
        blockAccess(event);
    }
    if (key === "printscreen") {
        document.body.style.visibility = "hidden";
        setTimeout(() => { document.body.style.visibility = "visible"; }, 900);
    }
    if (event.key === "F12" || (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))) {
        blockAccess(event);
    }
});

window.addEventListener("beforeprint", () => {
    document.body.style.display = "none";
});

function isALStudent(data) {
    const values = [data?.studentType, data?.grade, data?.stream, data?.studentLevel]
        .map(value => String(value || "").trim().toLowerCase());
    return values.some(value =>
        ["al", "a/l", "a level", "advanced", "advanced level", "advanced level (a/l)"].includes(value)
    );
}

async function verifyALAccess() {
    if (!studentId) return false;
    try {
        const { db, doc, getDoc } = await import("./firebase.js");
        const snap = await getDoc(doc(db, "students", studentId));
        if (!snap.exists()) return false;
        return isALStudent(snap.data() || {});
    } catch (error) {
        console.error("Answer access check failed:", error);
        return false;
    }
}

async function renderPDF() {
    if (!loading || !pages) return;

    const allowed = await verifyALAccess();
    if (!allowed) {
        loading.innerHTML = `<div class="error"><h2>Answer access unavailable</h2><p>Please log in with your authorized A/L student account and try again.</p></div>`;
        return;
    }

    try {
        const pdf = await pdfjsLib.getDocument({
            url: pdfUrl,
            disableAutoFetch: false,
            disableStream: false
        }).promise;

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
    } catch (error) {
        console.error("Answer PDF failed to load:", error);
        loading.innerHTML = `<div class="error"><h2>Answer temporarily unavailable</h2><p>Please refresh and try again.</p></div>`;
    }
}

document.addEventListener("DOMContentLoaded", renderPDF);
