import * as pdfjsLib from "./pdfjs/build/pdf.mjs";

if (sessionStorage.getItem("loggedIn") !== "true") {
    window.location.replace("index.html");
}

const params = new URLSearchParams(window.location.search);
const paperNumber = String(params.get("paper") || "01").padStart(2, "0");
const paperType = params.get("type") === "second" ? "2nd" : "1st";
const monthName = String(params.get("month") || "september").toLowerCase();

const monthNames = {
    january: "January", february: "February", march: "March", april: "April",
    may: "May", june: "June", july: "July", august: "August",
    september: "September", october: "October", november: "November", december: "December"
};

const monthLabel = monthNames[monthName] || "September";
const pages = document.getElementById("pages");
const empty = document.getElementById("empty");
const title = document.getElementById("viewerTitle");
const kicker = document.getElementById("viewerKicker");

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/build/pdf.worker.mjs";

if (title) {
    title.textContent = `Paper ${paperNumber} • ${paperType} Paper`;
}

if (kicker) {
    kicker.textContent = `${monthLabel.toUpperCase()} 2026 • A/L TOP RANKING MODEL • ${paperType.toUpperCase()} PAPER`;
}

// Block normal browser actions used for copying, saving and printing.
function blockAction(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
}

["contextmenu", "dragstart", "selectstart"].forEach(name => {
    document.addEventListener(name, blockAction, true);
});

document.addEventListener("keydown", event => {
    const key = String(event.key || "").toLowerCase();

    if (
        (event.ctrlKey || event.metaKey) &&
        ["p", "s", "u", "c", "a"].includes(key)
    ) {
        blockAction(event);
    }

    if (event.key === "F12" || (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))) {
        blockAction(event);
    }
});

function loadImage(src) {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.oncontextmenu = blockAction;
    });
}

async function renderPdf(pdfUrl) {
    try {
        const pdf = await pdfjsLib.getDocument({
            url: pdfUrl,
            disableAutoFetch: false,
            disableStream: false
        }).promise;

        let loaded = 0;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const pdfPage = await pdf.getPage(pageNumber);
            const baseViewport = pdfPage.getViewport({ scale: 1 });
            const maxWidth = Math.min(window.innerWidth - 28, 900);
            const scale = Math.min(maxWidth / baseViewport.width, 1.55);
            const viewport = pdfPage.getViewport({ scale });

            const card = document.createElement("article");
            card.className = "page-card";

            const canvas = document.createElement("canvas");
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(viewport.width * ratio);
            canvas.height = Math.floor(viewport.height * ratio);
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;
            canvas.setAttribute("aria-label", `Paper ${paperNumber} ${paperType} Paper — page ${pageNumber}`);

            const context = canvas.getContext("2d", { alpha: false });
            await pdfPage.render({
                canvasContext: context,
                viewport,
                transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0]
            }).promise;

            canvas.addEventListener("contextmenu", blockAction);
            canvas.addEventListener("dragstart", blockAction);
            canvas.addEventListener("selectstart", blockAction);

            const label = document.createElement("div");
            label.className = "page-number";
            label.textContent = `Page ${pageNumber}`;

            card.appendChild(canvas);
            card.appendChild(label);
            pages.appendChild(card);

            loaded += 1;
        }

        if (!loaded) {
            empty.hidden = false;
        }
    } catch (error) {
        console.error("PDF viewer failed:", error);
        empty.hidden = false;
        empty.querySelector("h2").textContent = "Paper is temporarily unavailable";
        empty.querySelector("p").textContent = "Please refresh and try again.";
    }
}

async function renderSeptemberImages() {
    const folderType = paperType === "2nd" ? "2nd-paper" : "1st-paper";
    const basePath = `papers/al-top-ranking/september/paper-${paperNumber}-${folderType}`;
    let pageNumber = 1;
    let loaded = 0;

    while (pageNumber <= 100) {
        const fileName = `page-${String(pageNumber).padStart(2, "0")}.jpg`;
        const src = `${basePath}/${fileName}?v=750c5998`;
        const image = await loadImage(src);

        if (!image) break;

        const card = document.createElement("article");
        card.className = "page-card";

        const img = document.createElement("img");
        img.src = src;
        img.alt = `Paper ${paperNumber} ${paperType} Paper — page ${pageNumber}`;
        img.loading = "eager";
        img.decoding = "sync";
        img.addEventListener("contextmenu", blockAction);
        img.addEventListener("dragstart", blockAction);

        const label = document.createElement("div");
        label.className = "page-number";
        label.textContent = `Page ${pageNumber}`;

        card.appendChild(img);
        card.appendChild(label);
        pages.appendChild(card);

        loaded += 1;
        pageNumber += 1;
    }

    if (!loaded) empty.hidden = false;
}

async function initializeViewer() {
    // October 2026 uses the two PDFs supplied in the monthly paper collection.
    if (monthName === "october") {
        const pdfNumber = paperType === "2nd"
            ? "02"
            : "01";

        const pdfUrl = `papers/al-top-ranking/october/October-Paper-${pdfNumber}.pdf`;
        await renderPdf(pdfUrl);
        return;
    }

    await renderSeptemberImages();
}

document.addEventListener("DOMContentLoaded", initializeViewer);
