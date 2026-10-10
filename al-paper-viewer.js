import { db, doc, getDoc } from "./firebase.js";

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
const paperYear = Number(params.get("year") || 2026);

const pages = document.getElementById("pages");
const empty = document.getElementById("empty");
const title = document.getElementById("viewerTitle");
const kicker = document.getElementById("viewerKicker");
const printPaperBtn = document.getElementById("printPaperBtn");

if (title) {
    title.textContent = `Paper ${paperNumber} • ${paperType} Paper`;
}

if (kicker) {
    kicker.textContent = `${monthLabel.toUpperCase()} ${paperYear} • A/L TOP RANKING MODEL • ${paperType.toUpperCase()} PAPER`;
}

if (printPaperBtn) {
    printPaperBtn.addEventListener("click", () => {
        window.print();
    });
}

// Protected viewer: block common browser actions used to copy, save or print.
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

    if (
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))
    ) {
        blockAction(event);
    }

    if (event.key === "PrintScreen") {
        document.body.style.visibility = "hidden";
        setTimeout(() => {
            document.body.style.visibility = "visible";
        }, 900);
    }
});

function loadImage(src) {
    return new Promise(resolve => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);

        image.addEventListener("contextmenu", blockAction);
        image.addEventListener("dragstart", blockAction);
        image.src = src;
    });
}

async function verifyMonthlyAccess() {
  const year = Number(params.get('year') || new Date().getFullYear());
  const month = monthName;
  try {
    const snap = await getDoc(doc(db, 'monthlyTopRankingAccess', `${year}-${month}`));
    if (snap.exists() && typeof snap.data().override === 'boolean') return snap.data().override;
    const now = new Date();
    return year === now.getFullYear() && month === Object.keys(monthNames)[now.getMonth()];
  } catch (error) { console.error('Monthly access check failed:', error); return false; }
}
async function initializeViewer() {
    if (!(await verifyMonthlyAccess())) {
        if (empty) { empty.hidden = false; empty.textContent = "This monthly paper is locked. It is available only during its month unless the administrator unlocks it."; }
        if (pages) pages.replaceChildren();
        return;
    }

    const folderType = paperType === "2nd" ? "2nd-paper" : "1st-paper";
    const basePath = `papers/al-top-ranking/${monthName}/paper-${paperNumber}-${folderType}`;

    let pageNumber = 1;
    let loaded = 0;

    while (pageNumber <= 100) {
        const fileName = `page-${String(pageNumber).padStart(2, "0")}.jpg`;
        const src = `${basePath}/${fileName}?v=octjpg1`;
        const image = await loadImage(src);

        if (!image) {
            break;
        }

        const card = document.createElement("article");
        card.className = "page-card";

        const img = document.createElement("img");
        img.src = src;
        img.alt = `Paper ${paperNumber} ${paperType} Paper — page ${pageNumber}`;
        img.loading = "eager";
        img.decoding = "sync";
        img.draggable = false;

        img.addEventListener("contextmenu", blockAction);
        img.addEventListener("dragstart", blockAction);
        img.addEventListener("selectstart", blockAction);

        const label = document.createElement("div");
        label.className = "page-number";
        label.textContent = `Page ${pageNumber}`;

        card.appendChild(img);
        card.appendChild(label);
        pages.appendChild(card);

        loaded += 1;
        pageNumber += 1;
    }

    if (!loaded) {
        empty.hidden = false;
    }
}

document.addEventListener("DOMContentLoaded", initializeViewer);
