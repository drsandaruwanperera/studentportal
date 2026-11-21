// =====================================================
// GRADE 10 TERM PAGE
// FIREBASE CONTROLLED PAPER VISIBILITY
// =====================================================


// =====================================================
// URL PARAMETER
// =====================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const term =
    params.get("term");


// =====================================================
// ELEMENTS
// =====================================================

const termTitle =
    document.getElementById(
        "termTitle"
    );


const paperContainer =
    document.getElementById(
        "paperContainer"
    );


// =====================================================
// TERM NAMES
// =====================================================

const termNames = {

    "1": "1st Term",

    "2": "2nd Term",

    "3": "3rd Term"

};


// =====================================================
// VALIDATE TERM
// =====================================================

if (
    !["1", "2", "3"].includes(term)
) {

    alert(
        "Invalid term."
    );


    window.location.replace(
        "grade10-model-papers.html"
    );


    throw new Error(
        "Invalid term: " + term
    );

}


// =====================================================
// TITLE
// =====================================================

if (termTitle) {

    termTitle.textContent =
        `📚 Grade 10 - ${termNames[term]}`;

}


// =====================================================
// PAPER DATA
// =====================================================

const PAPERS = [

    {
        number: "01",
        title: "Model Paper - 01"
    },

    {
        number: "02",
        title: "Model Paper - 02"
    },

    {
        number: "03",
        title: "Model Paper - 03"
    },

    {
        number: "04",
        title: "Model Paper - 04"
    },

    {
        number: "05",
        title: "Model Paper - 05"
    }

];


// =====================================================
// FIREBASE
// =====================================================

let db;
let doc;
let getDoc;


// =====================================================
// LOAD FIREBASE MODULE
// =====================================================

async function loadFirebase() {

    try {

        const firebase =
            await import(
                "./firebase.js"
            );


        db =
            firebase.db;


        doc =
            firebase.doc;


        getDoc =
            firebase.getDoc;


        if (
            !db ||
            !doc ||
            !getDoc
        ) {

            throw new Error(
                "Firebase functions are missing from firebase.js"
            );

        }

    }
    catch (error) {

        console.error(
            "Firebase import error:",
            error
        );


        throw error;

    }

}


// =====================================================
// GET GRADE 10 SETTINGS
// =====================================================
//
// IMPORTANT:
// Admin saves:
//
// paperSettings / grade10
//
// NOT:
//
// paperSettings / settings
//
// =====================================================

async function getGrade10Settings() {

    const settingsRef =
        doc(
            db,
            "paperSettings",
            "grade10"
        );


    const snapshot =
        await getDoc(
            settingsRef
        );


    if (
        !snapshot.exists()
    ) {

        console.warn(
            "paperSettings/grade10 does not exist."
        );


        return {};

    }


    const settings =
        snapshot.data() || {};


    console.log(
        "Grade 10 Firebase settings:",
        settings
    );


    return settings;

}


// =====================================================
// CHECK PAPER ENABLED
// =====================================================
//
// Admin field example:
//
// grade10_term1_01
// grade10_term1_02
// grade10_term1_03
//
// =====================================================

function isPaperEnabled(
    settings,
    paperNumber
) {

    const fieldName =
        `grade10_term${term}_${paperNumber}`;


    console.log(
        "Checking:",
        fieldName,
        "=>",
        settings[fieldName]
    );


    // -------------------------------------------------
    // FIELD DOES NOT EXIST
    // -------------------------------------------------
    //
    // For safety, existing papers remain visible
    // until a setting has actually been saved.
    //

    if (
        !Object.prototype.hasOwnProperty.call(
            settings,
            fieldName
        )
    ) {

        return true;

    }


    // -------------------------------------------------
    // BOOLEAN
    // -------------------------------------------------

    return (
        settings[fieldName] === true
    );

}


// =====================================================
// CREATE PAPER CARD
// =====================================================

function createPaperCard(
    paper
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "paper-card";


    const settingId =
        `grade10_term${term}_${paper.number}`;


    card.dataset.settingId =
        settingId;


    card.innerHTML = `

        <div class="paper-icon">
            📘
        </div>

        <h2>
            ${escapeHTML(
                paper.title
            )}
        </h2>

        <p>
            Part A & Part B
        </p>

    `;


    card.addEventListener(
        "click",
        function () {

            window.location.href =
                `grade10-model-paper.html` +
                `?term=${encodeURIComponent(term)}` +
                `&paper=${encodeURIComponent(
                    paper.number
                )}`;

        }
    );


    return card;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// SHOW LOADING
// =====================================================

function showLoading() {

    if (!paperContainer) {
        return;
    }


    paperContainer.innerHTML = `

        <div
            style="
                grid-column:1/-1;
                background:#ffffff;
                padding:50px 25px;
                border-radius:20px;
                text-align:center;
                box-shadow:0 10px 30px rgba(0,0,0,.08);
            "
        >

            <div
                style="
                    font-size:40px;
                    margin-bottom:12px;
                "
            >
                ⏳
            </div>

            <h2>
                Loading Papers...
            </h2>

        </div>

    `;

}


// =====================================================
// SHOW NO PAPERS
// =====================================================

function showNoPapers() {

    if (!paperContainer) {
        return;
    }


    paperContainer.innerHTML = `

        <div
            style="
                grid-column:1/-1;
                background:#ffffff;
                padding:50px 25px;
                border-radius:20px;
                text-align:center;
                box-shadow:0 10px 30px rgba(0,0,0,.08);
            "
        >

            <div
                style="
                    font-size:50px;
                    margin-bottom:15px;
                "
            >
                🔒
            </div>

            <h2>
                No Papers Available
            </h2>

            <p
                style="
                    color:#64748b;
                    margin-bottom:20px;
                "
            >
                No model papers are currently
                available for this term.
            </p>

            <button
                type="button"
                id="backToTermsBtn"
                style="
                    border:0;
                    padding:12px 24px;
                    border-radius:10px;
                    background:#6d35f2;
                    color:white;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                ← Back
            </button>

        </div>

    `;


    const backButton =
        document.getElementById(
            "backToTermsBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "grade10-model-papers.html";

            }
        );

    }

}


// =====================================================
// SHOW ERROR
// =====================================================

function showError(
    error
) {

    console.error(
        "Grade 10 Term Error:",
        error
    );


    if (!paperContainer) {
        return;
    }


    paperContainer.innerHTML = `

        <div
            style="
                grid-column:1/-1;
                background:#ffffff;
                padding:45px 25px;
                border-radius:20px;
                text-align:center;
                box-shadow:0 10px 30px rgba(0,0,0,.08);
            "
        >

            <div
                style="
                    font-size:45px;
                    margin-bottom:15px;
                "
            >
                ⚠️
            </div>

            <h2>
                Unable to Load Papers
            </h2>

            <p
                style="
                    color:#64748b;
                    line-height:1.6;
                    max-width:650px;
                    margin:10px auto 20px;
                    word-break:break-word;
                "
            >
                ${escapeHTML(
                    error?.message ||
                    String(error)
                )}
            </p>

            <button
                type="button"
                id="retryPaperBtn"
                style="
                    border:0;
                    padding:12px 24px;
                    border-radius:10px;
                    background:#6d35f2;
                    color:white;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                🔄 Try Again
            </button>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "retryPaperBtn"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            function () {

                window.location.reload();

            }
        );

    }

}


// =====================================================
// RENDER PAPERS
// =====================================================

async function renderPapers() {

    try {

        if (!paperContainer) {

            throw new Error(
                "paperContainer was not found."
            );

        }


        showLoading();


        // -------------------------------------------------
        // LOAD FIREBASE
        // -------------------------------------------------

        await loadFirebase();


        // -------------------------------------------------
        // LOAD SETTINGS
        // -------------------------------------------------

        const settings =
            await getGrade10Settings();


        // -------------------------------------------------
        // CLEAR
        // -------------------------------------------------

        paperContainer.innerHTML =
            "";


        let visibleCount =
            0;


        // -------------------------------------------------
        // CREATE ONLY ENABLED PAPERS
        // -------------------------------------------------

        PAPERS.forEach(
            paper => {

                const enabled =
                    isPaperEnabled(
                        settings,
                        paper.number
                    );


                console.log(
                    `${paper.title}:`,
                    enabled
                        ? "VISIBLE"
                        : "HIDDEN"
                );


                if (!enabled) {

                    return;

                }


                const card =
                    createPaperCard(
                        paper
                    );


                paperContainer.appendChild(
                    card
                );


                visibleCount++;

            }
        );


        // -------------------------------------------------
        // NO PAPERS
        // -------------------------------------------------

        if (
            visibleCount === 0
        ) {

            showNoPapers();

        }


        console.log(
            "================================"
        );

        console.log(
            "GRADE 10 TERM:",
            termNames[term]
        );

        console.log(
            "VISIBLE PAPERS:",
            visibleCount
        );

        console.log(
            "================================"
        );

    }
    catch (error) {

        showError(
            error
        );

    }

}


// =====================================================
// START
// =====================================================

renderPapers();
