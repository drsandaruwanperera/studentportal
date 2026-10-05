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

if (title) {
    title.textContent = `Paper ${paperNumber} • ${paperType} Paper`;
}

if (kicker) {
    kicker.textContent = `${monthLabel.toUpperCase()} 2026 • A/L TOP RANKING MODEL • ${paperType.toUpperCase()} PAPER`;
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
    });
}

async function initializeViewer() {
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
