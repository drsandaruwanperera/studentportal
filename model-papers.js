// ============================================================
// A/L TOP RANKING MODEL PAPERS
// ============================================================

import {
    db,
    doc,
    getDoc,
    collection,
    onSnapshot
} from "./firebase.js";


if (
    sessionStorage.getItem("loggedIn") !== "true"
) {
    window.location.replace("index.html");
}


const studentId =
    sessionStorage.getItem("studentId");

const paperCards = [
    {
        number: "01",
        card: document.getElementById("paper01Card"),
        button: document.getElementById("paper01Open")
    },
    {
        number: "02",
        card: document.getElementById("paper02Card"),
        button: document.getElementById("paper02Open")
    }
];


// ============================================================
// GET STUDENT DATA
// ============================================================

async function getStudentData() {

    if (!studentId) {
        return null;
    }

    try {
        const studentRef =
            doc(db, "students", studentId);

        const snapshot =
            await getDoc(studentRef);

        return snapshot.exists()
            ? snapshot.data()
            : null;

    } catch (error) {
        console.error("Firestore error:", error);
        return null;
    }
}


// ============================================================
// A/L STUDENT CHECK
// ============================================================

function isALStudent(studentData) {

    const studentType =
        String(
            studentData?.studentType || ""
        )
            .trim()
            .toLowerCase();

    const grade =
        String(
            studentData?.grade || ""
        )
            .trim()
            .toLowerCase();

    return (
        studentType === "al" ||
        studentType === "a/l" ||
        studentType === "a level" ||
        studentType === "advanced" ||
        studentType === "advanced level" ||
        grade === "al" ||
        grade === "a/l" ||
        grade === "a level" ||
        grade === "advanced" ||
        grade === "advanced level"
    );
}


// ============================================================
// ACCESS CHECK
// ============================================================

function hasPaperAccess(studentData) {

    if (isALStudent(studentData)) {
        return true;
    }

    if (!studentData) {
        return true;
    }

    if (!Object.prototype.hasOwnProperty.call(studentData, "paper01")) {
        return true;
    }

    const value = studentData.paper01;

    return (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    );
}


function hasViewedPaper(studentData, paperNumber) {

    const key =
        `paper${paperNumber}`;

    return (
        studentData?.paperViews?.al?.model?.[key] === true
    );
}


// ============================================================
// OPEN PAPER
// ============================================================

async function openPaper(paperNumber, paperButton, paperCard) {

    if (!paperButton) {
        return;
    }

    const studentData =
        await getStudentData();

    if (!studentData) {
        alert(
            "Unable to verify your account. Please refresh the page and try again."
        );
        return;
    }

    if (!hasPaperAccess(studentData)) {
        paperCard?.classList.add("locked");
        alert(`Paper ${paperNumber} is not available for your account yet.`);
        return;
    }

    if (hasViewedPaper(studentData, paperNumber)) {
        paperCard?.classList.add("viewed");
        alert(
            `Paper ${paperNumber} has already been viewed and cannot be opened again.`
        );
        return;
    }

    window.location.href =
        `al-top-ranking-paper.html?paper=${paperNumber}&month=september`;
}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        const studentData =
            await getStudentData();

        paperCards.forEach(
            function(item) {

                if (!item.button) {
                    return;
                }

                item.button.addEventListener(
                    "click",
                    function() {
                        openPaper(
                            item.number,
                            item.button,
                            item.card
                        );
                    }
                );

                if (!studentData) {
                    return;
                }

                if (!hasPaperAccess(studentData)) {
                    item.card?.classList.add("locked");
                    item.button.textContent = "🔒 Locked";
                    return;
                }

                if (hasViewedPaper(studentData, item.number)) {
                    item.card?.classList.add("viewed");
                    item.button.textContent = "🔵 Already Viewed";
                }
            }
        );
    }
);


const monthNames = {
    january:"January", february:"February", march:"March", april:"April",
    may:"May", june:"June", july:"July", august:"August",
    september:"September", october:"October", november:"November", december:"December"
};

function renderMonthlyPaperSections(items) {
    const main = document.querySelector("main");
    const coming = document.querySelector(".coming-section");
    if (!main) return;

    document.querySelectorAll("[data-monthly-paper-section]").forEach(el => el.remove());

    const groups = {};
    items.filter(x => x.published !== false).forEach(x => {
        const key = `${x.year}-${x.month}`;
        (groups[key] ||= []).push(x);
    });

    const sortedGroups = Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
    sortedGroups.forEach(([key, papers]) => {
        const [year, month] = key.split("-");
        const section = document.createElement("section");
        section.className = "month-section monthly-dynamic-section";
        section.dataset.monthlyPaperSection = key;

        papers.sort((a,b) => Number(a.paperNumber)-Number(b.paperNumber));
        section.innerHTML = `
            <div class="section-heading">
                <div>
                    <span class="section-kicker">MONTHLY COLLECTION</span>
                    <h2>${monthNames[month] || month} ${year}</h2>
                    <p>Top Ranking Model Papers for ${monthNames[month] || month}</p>
                </div>
                <span class="month-badge">${(monthNames[month] || month).toUpperCase()}</span>
            </div>
            <div class="paper-list">
                ${papers.map(p => {
                    const n=String(p.paperNumber).padStart(2,"0");
                    return `
                    <article class="paper-card">
                        <div class="paper-number">${n}</div>
                        <div class="paper-info">
                            <span class="paper-kicker">TOP RANKING MODEL</span>
                            <h3>${p.title || `Paper ${n}`}</h3>
                            <p>1st Paper and 2nd Paper PDF resources</p>
                        </div>
                        <button type="button" class="paper-open" data-month="${month}" data-paper="${n}">
                            Open Paper ${n} <span>→</span>
                        </button>
                    </article>`;
                }).join("")}
            </div>`;

        if (coming) main.insertBefore(section, coming);
        else main.appendChild(section);
    });

    main.querySelectorAll("[data-month][data-paper]").forEach(btn => {
        btn.addEventListener("click", () => {
            window.location.href = `al-top-ranking-paper.html?paper=${btn.dataset.paper}&month=${btn.dataset.month}`;
        });
    });
}

function loadMonthlyTopRankingPapers() {
    try {
        onSnapshot(collection(db, "monthlyTopRankingPapers"), snapshot => {
            renderMonthlyPaperSections(snapshot.docs.map(d => ({id:d.id, ...d.data()})));
        }, error => {
            console.info("Monthly top ranking papers are not available yet.", error);
        });
    } catch (error) {
        console.info("Monthly paper listener could not start.", error);
    }
}

loadMonthlyTopRankingPapers();
