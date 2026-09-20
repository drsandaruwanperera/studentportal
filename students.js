// =====================================================
// STUDENT MANAGEMENT SYSTEM
// =====================================================

import {
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from "./firebase.js";


// =====================================================
// ADMIN SESSION
// =====================================================

const adminLoggedIn =
    sessionStorage.getItem(
        "adminLoggedIn"
    ) === "true";


const adminRole =
    (
        sessionStorage.getItem(
            "adminRole"
        ) || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[\s_-]+/g,
            ""
        );


const adminUsername =
    sessionStorage.getItem(
        "adminUsername"
    ) ||
    "Admin";


if (!adminLoggedIn) {

    window.location.replace(
        "admin-login.html"
    );

}


// =====================================================
// ELEMENTS
// =====================================================

const studentTable =
    document.getElementById(
        "studentTable"
    );


const searchInput =
    document.getElementById(
        "search"
    );


const typeFilter =
    document.getElementById(
        "typeFilter"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


// =====================================================
// ADD STUDENT
// =====================================================

const addStudentBtn =
    document.getElementById(
        "addStudentBtn"
    );


const addModal =
    document.getElementById(
        "addModal"
    );


const closeAdd =
    document.getElementById(
        "closeAdd"
    );


const cancelAdd =
    document.getElementById(
        "cancelAdd"
    );


const saveNewStudent =
    document.getElementById(
        "saveNewStudent"
    );


const newStudentGrade =
    document.getElementById(
        "newStudentGrade"
    );


const newStudentId =
    document.getElementById(
        "newStudentId"
    );


const newStudentPassword =
    document.getElementById(
        "newStudentPassword"
    );


const newMustChange =
    document.getElementById(
        "newMustChange"
    );


const alSeriesSection =
    document.getElementById(
        "alSeriesSection"
    );


const alSeriesButtons =
    document.querySelectorAll(
        ".al-series-btn"
    );


const studentIdHelp =
    document.getElementById(
        "studentIdHelp"
    );


// =====================================================
// EDIT STUDENT
// =====================================================

const editModal =
    document.getElementById(
        "editModal"
    );


const closeEdit =
    document.getElementById(
        "closeEdit"
    );


const closeEditBottom =
    document.getElementById(
        "closeEditBottom"
    );


const editStudentId =
    document.getElementById(
        "editStudentId"
    );


const editPassword =
    document.getElementById(
        "editPassword"
    );


const editMustChange =
    document.getElementById(
        "editMustChange"
    );


const updateStudentBtn =
    document.getElementById(
        "updateStudent"
    );


const deleteStudentBtn =
    document.getElementById(
        "deleteStudent"
    );


const resetPasswordBtn =
    document.getElementById(
        "resetPasswordBtn"
    );


// =====================================================
// PAPER CONTROLS
// =====================================================

const selectAllPapers =
    document.getElementById(
        "selectAllPapers"
    );


const removeAllPapers =
    document.getElementById(
        "removeAllPapers"
    );


const resetViewed =
    document.getElementById(
        "resetViewed"
    );


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// =====================================================
// SETTINGS
// =====================================================

const TOTAL_PAPERS = 13;


// =====================================================
// DATA
// =====================================================

let allStudents = [];

let selectedStudentId = "";

let selectedALSeries = "";


// =====================================================
// PAPER FIELD
// =====================================================

function getPaperField(
    number
) {

    return (
        "paper" +
        String(
            number
        ).padStart(
            2,
            "0"
        )
    );

}


function getPaperViewedField(
    number
) {

    return (
        getPaperField(
            number
        ) +
        "Viewed"
    );

}


function getPaperPagesField(
    number
) {

    return (
        getPaperField(
            number
        ) +
        "Pages"
    );

}


// =====================================================
// STUDENT TYPE
// =====================================================

function getStudentType(
    data,
    studentId = ""
) {

    const firebaseType =
        String(
            data?.studentType ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        firebaseType === "grade10" ||
        firebaseType === "grade 10"
    ) {

        return "grade10";

    }


    if (
        firebaseType === "grade11" ||
        firebaseType === "grade 11"
    ) {

        return "grade11";

    }


    if (
        firebaseType === "al" ||
        firebaseType === "a/l" ||
        firebaseType === "a level" ||
        firebaseType === "advanced" ||
        firebaseType === "advanced level"
    ) {

        return "al";

    }


    const firebaseGrade =
        String(
            data?.grade ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        firebaseGrade === "10" ||
        firebaseGrade === "grade10" ||
        firebaseGrade === "grade 10"
    ) {

        return "grade10";

    }


    if (
        firebaseGrade === "11" ||
        firebaseGrade === "grade11" ||
        firebaseGrade === "grade 11"
    ) {

        return "grade11";

    }


    if (
        firebaseGrade === "al" ||
        firebaseGrade === "a/l" ||
        firebaseGrade === "a level" ||
        firebaseGrade === "advanced" ||
        firebaseGrade === "advanced level"
    ) {

        return "al";

    }


    const id =
        String(
            studentId ||
            ""
        )
            .trim()
            .toUpperCase();


    // ---------------------------------------------
    // Grade 11
    // ---------------------------------------------

    if (
        /^\d{5}$/.test(id)
    ) {

        const number =
            Number(id);


        if (
            number >= 26000 &&
            number <= 26999
        ) {

            return "grade11";

        }


        // -----------------------------------------
        // Grade 10
        // -----------------------------------------

        if (
            number >= 27000 &&
            number <= 27999
        ) {

            return "grade10";

        }

    }


    // ---------------------------------------------
    // A/L
    // ---------------------------------------------

    if (
        /^A\d{5}$/.test(id)
    ) {

        return "al";

    }


    return "al";

}


// =====================================================
// TYPE LABEL
// =====================================================

function getStudentTypeLabel(
    type
) {

    if (
        type === "grade10"
    ) {

        return "Grade 10";

    }


    if (
        type === "grade11"
    ) {

        return "Grade 11";

    }


    if (
        type === "al"
    ) {

        return "A/L";

    }


    return "Student";

}


// =====================================================
// TYPE CLASS
// =====================================================

function getStudentTypeClass(
    type
) {

    if (
        type === "grade10"
    ) {

        return "grade10";

    }


    if (
        type === "grade11"
    ) {

        return "grade11";

    }


    return "al";

}


// =====================================================
// STUDENT NAME
// =====================================================

function getStudentName(
    data
) {

    return (
        data?.fullName ||
        data?.name ||
        data?.studentName ||
        data?.displayName ||
        "Not Registered"
    );

}


// =====================================================
// ACTIVE STATUS
// =====================================================

function isStudentActive(
    data
) {

    const lastActive =
        Number(
            data?.lastActiveAt ||
            0
        );


    if (!lastActive) {

        return false;

    }


    const difference =
        Date.now() -
        lastActive;


    return (
        difference >= 0 &&
        difference <= 90000
    );

}


// =====================================================
// REGISTRATION STATUS
// =====================================================

function getRegistrationStatus(
    data
) {

    if (
        data?.profileCompleted === true &&
        data?.registrationCompleted === true
    ) {

        return "Registered";

    }


    if (
        data?.mustChangePassword === true
    ) {

        return "Pending";

    }


    return "Active";

}


// =====================================================
// VIEWED COUNT
// =====================================================

function getViewedCount(
    data
) {

    let count = 0;


    for (
        let i = 1;
        i <= TOTAL_PAPERS;
        i++
    ) {

        if (
            data?.[
                getPaperViewedField(
                    i
                )
            ] === true
        ) {

            count++;

        }

    }


    return count;

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
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
// PASSWORD HTML
// =====================================================

function getPasswordHTML(
    password
) {

    const safePassword =
        escapeHTML(
            password ||
            ""
        );


    return `

        <div
            class="password-cell"
            style="
                display:flex;
                align-items:center;
                gap:6px;
            "
        >

            <span
                class="student-password"
                style="
                    min-width:75px;
                    letter-spacing:2px;
                "
            >
                ••••••••
            </span>


            <button
                type="button"
                class="password-view-btn"
                data-password="${safePassword}"
                data-visible="false"
                title="View password"
                style="
                    border:0;
                    background:transparent;
                    cursor:pointer;
                    font-size:16px;
                    padding:3px 6px;
                "
            >
                👁️
            </button>

        </div>

    `;

}


// =====================================================
// LOAD STUDENTS
// =====================================================

async function loadStudents() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "students"
                )
            );


        allStudents = [];


        snapshot.forEach(
            studentDoc => {

                allStudents.push({

                    id:
                        studentDoc.id,

                    data:
                        studentDoc.data()

                });

            }
        );


        sortStudents();

        renderStudents();

        updateCounts();

    }

    catch (error) {

        console.error(
            "Student loading error:",
            error
        );


        if (
            studentTable
        ) {

            studentTable.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#dc2626;
                        "
                    >

                        Unable to load students.

                    </td>

                </tr>

            `;

        }

    }

}


// =====================================================
// SORT STUDENTS
// =====================================================

function sortStudents() {

    allStudents.sort(
        (
            a,
            b
        ) => {

            return String(
                a.id
            ).localeCompare(
                String(
                    b.id
                ),
                undefined,
                {
                    numeric: true
                }
            );

        }
    );

}


// =====================================================
// FILTER
// =====================================================

function getFilteredStudents() {

    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const type =
        (
            typeFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    const status =
        (
            statusFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    return allStudents.filter(
        student => {

            const data =
                student.data;


            const studentType =
                getStudentType(
                    data,
                    student.id
                );


            const name =
                getStudentName(
                    data
                );


            const searchable =
                (
                    student.id +
                    " " +
                    name +
                    " " +
                    studentType
                )
                    .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(
                    search
                );


            const matchesType =
                type === "all" ||
                studentType === type;


            const active =
                isStudentActive(
                    data
                );


            const matchesStatus =
                status === "all" ||
                (
                    status === "active" &&
                    active
                ) ||
                (
                    status === "offline" &&
                    !active
                );


            return (
                matchesSearch &&
                matchesType &&
                matchesStatus
            );

        }
    );

}


// =====================================================
// RENDER STUDENTS
// =====================================================

function renderStudents() {

    if (
        !studentTable
    ) {

        return;

    }


    const students =
        getFilteredStudents();


    if (
        students.length === 0
    ) {

        studentTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#94a3b8;
                    "
                >

                    No students found.

                </td>

            </tr>

        `;


        return;

    }


    studentTable.innerHTML =
        students
            .map(
                student =>
                    renderStudentRow(
                        student
                    )
            )
            .join("");

}


// =====================================================
// RENDER ROW
// =====================================================

function renderStudentRow(
    student
) {

    const data =
        student.data;


    const type =
        getStudentType(
            data,
            student.id
        );


    const typeLabel =
        getStudentTypeLabel(
            type
        );


    const typeClass =
        getStudentTypeClass(
            type
        );


    const viewed =
        getViewedCount(
            data
        );


    const active =
        isStudentActive(
            data
        );


    const status =
        getRegistrationStatus(
            data
        );


    const statusClass =
        status
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    return `

        <tr>

            <td>

                <strong>
                    ${escapeHTML(
                        student.id
                    )}
                </strong>

            </td>


            <td>

                ${escapeHTML(
                    getStudentName(
                        data
                    )
                )}

            </td>


            <td>

                <span
                    class="student-type-badge ${typeClass}"
                >

                    ${escapeHTML(
                        typeLabel
                    )}

                </span>

            </td>


            <td>

                <strong>
                    ${viewed}
                </strong>

                / ${TOTAL_PAPERS}

            </td>


            <td>

                <span
                    class="registration-badge ${statusClass}"
                >

                    ${escapeHTML(
                        status
                    )}

                </span>


                <br>


                <small>

                    ${
                        active
                            ? "● Online"
                            : "● Offline"
                    }

                </small>

            </td>


            <td>

                ${getPasswordHTML(
                    data?.password
                )}

            </td>


            <td>

                <div
                    class="student-actions"
                >

                    <button
                        type="button"
                        class="action-btn edit-btn"
                        data-action="edit"
                        data-id="${escapeHTML(
                            student.id
                        )}"
                    >

                        ✏️ Edit

                    </button>


                    <button
                        type="button"
                        class="action-btn delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(
                            student.id
                        )}"
                    >

                        🗑️ Delete

                    </button>

                </div>

            </td>

        </tr>

    `;

}


// =====================================================
// TABLE ACTIONS
// =====================================================

if (
    studentTable
) {

    studentTable.addEventListener(
        "click",
        event => {

            // =========================================
            // PASSWORD VIEW
            // =========================================

            const passwordButton =
                event.target.closest(
                    ".password-view-btn"
                );


            if (
                passwordButton
            ) {

                const row =
                    passwordButton.closest(
                        "tr"
                    );


                const passwordSpan =
                    row?.querySelector(
                        ".student-password"
                    );


                const password =
                    passwordButton.dataset.password ||
                    "";


                const visible =
                    passwordButton.dataset.visible ===
                    "true";


                if (
                    passwordSpan
                ) {

                    if (
                        visible
                    ) {

                        passwordSpan.textContent =
                            "••••••••";

                        passwordButton.textContent =
                            "👁️";

                        passwordButton.dataset.visible =
                            "false";

                    }
                    else {

                        passwordSpan.textContent =
                            password ||
                            "(empty)";

                        passwordButton.textContent =
                            "🙈";

                        passwordButton.dataset.visible =
                            "true";

                    }

                }


                return;

            }


            // =========================================
            // ACTION BUTTON
            // =========================================

            const actionButton =
                event.target.closest(
                    "button[data-action]"
                );


            if (
                !actionButton
            ) {

                return;

            }


            const id =
                actionButton.dataset.id;


            const action =
                actionButton.dataset.action;


            if (
                action === "edit"
            ) {

                openEditModal(
                    id
                );

            }


            if (
                action === "delete"
            ) {

                deleteStudent(
                    id
                );

            }

        }
    );

}


// =====================================================
// SEARCH
// =====================================================

if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        renderStudents
    );

}


if (
    typeFilter
) {

    typeFilter.addEventListener(
        "change",
        renderStudents
    );

}


if (
    statusFilter
) {

    statusFilter.addEventListener(
        "change",
        renderStudents
    );

}


// =====================================================
// OPEN ADD MODAL
// =====================================================

function openAddModal() {

    clearAddForm();


    if (
        addModal
    ) {

        addModal.classList.add(
            "show"
        );


        addModal.style.display =
            "flex";

    }

}


if (
    addStudentBtn
) {

    addStudentBtn.addEventListener(
        "click",
        openAddModal
    );

}


// =====================================================
// CLOSE ADD MODAL
// =====================================================

function closeAddModal() {

    if (
        addModal
    ) {

        addModal.classList.remove(
            "show"
        );


        addModal.style.display =
            "none";

    }


    clearAddForm();

}


if (
    closeAdd
) {

    closeAdd.addEventListener(
        "click",
        closeAddModal
    );

}


if (
    cancelAdd
) {

    cancelAdd.addEventListener(
        "click",
        closeAddModal
    );

}


if (
    addModal
) {

    addModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                addModal
            ) {

                closeAddModal();

            }

        }
    );

}


// =====================================================
// CLEAR ADD FORM
// =====================================================

function clearAddForm() {

    selectedALSeries =
        "";


    if (
        newStudentGrade
    ) {

        newStudentGrade.textContent =
            "";

    }


    if (
        newStudentId
    ) {

        newStudentId.value =
            "";


        // IMPORTANT:
        // Student ID must ALWAYS be editable

        newStudentId.readOnly =
            false;


        newStudentId.disabled =
            false;


        newStudentId.removeAttribute(
            "readonly"
        );


        newStudentId.removeAttribute(
            "disabled"
        );


        newStudentId.placeholder =
            "Select category first";


        newStudentId.style.background =
            "";


        newStudentId.style.fontWeight =
            "";

    }


    if (
        newStudentPassword
    ) {

        newStudentPassword.value =
            "";

    }


    if (
        newMustChange
    ) {

        newMustChange.checked =
            true;

    }


    if (
        alSeriesSection
    ) {

        alSeriesSection.style.display =
            "none";

    }


    if (
        studentIdHelp
    ) {

        studentIdHelp.textContent =
            "Select a student category first.";

    }


    alSeriesButtons.forEach(
        button => {

            button.classList.remove(
                "selected",
                "active"
            );

        }
    );


    document
        .querySelectorAll(
            "#addModal .category-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "selected",
                    "active"
                );

            }
        );

}


// =====================================================
// CATEGORY SELECTION
// =====================================================

document
    .querySelectorAll(
        "#addModal .category-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.type;


                    document
                        .querySelectorAll(
                            "#addModal .category-btn"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "selected",
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );


                    // =================================
                    // A/L
                    // =================================

                    if (
                        type === "al"
                    ) {

                        selectedALSeries =
                            "";


                        if (
                            alSeriesSection
                        ) {

                            alSeriesSection.style.display =
                                "block";

                        }


                        if (
                            newStudentId
                        ) {

                            newStudentId.value =
                                "";


                            // IMPORTANT
                            // ENABLE MANUAL TYPING

                            newStudentId.readOnly =
                                false;


                            newStudentId.disabled =
                                false;


                            newStudentId.removeAttribute(
                                "readonly"
                            );


                            newStudentId.removeAttribute(
                                "disabled"
                            );


                            newStudentId.placeholder =
                                "Enter A/L Student ID";


                            newStudentId.style.background =
                                "";


                            newStudentId.style.fontWeight =
                                "";

                        }


                        if (
                            studentIdHelp
                        ) {

                            studentIdHelp.textContent =
                                "Select A27000, A28000, A29000 or 27C series, then enter the Student ID manually.";

                        }


                        if (
                            newStudentGrade
                        ) {

                            newStudentGrade.textContent =
                                "Selected: A/L";

                        }

                    }


                    // =================================
                    // GRADE 10
                    // =================================

                    if (
                        type === "grade10"
                    ) {

                        selectedALSeries =
                            "";


                        if (
                            alSeriesSection
                        ) {

                            alSeriesSection.style.display =
                                "none";

                        }


                        if (
                            newStudentId
                        ) {

                            newStudentId.value =
                                "";


                            newStudentId.readOnly =
                                false;


                            newStudentId.disabled =
                                false;


                            newStudentId.removeAttribute(
                                "readonly"
                            );


                            newStudentId.removeAttribute(
                                "disabled"
                            );


                            newStudentId.placeholder =
                                "Enter Grade 10 Student ID";


                            newStudentId.style.background =
                                "";


                            newStudentId.style.fontWeight =
                                "";

                        }


                        if (
                            studentIdHelp
                        ) {

                            studentIdHelp.textContent =
                                "Enter Grade 10 Student ID manually. Range: 27000–27999.";

                        }


                        if (
                            newStudentGrade
                        ) {

                            newStudentGrade.textContent =
                                "Selected: Grade 10";

                        }

                    }


                    // =================================
                    // GRADE 11
                    // =================================

                    if (
                        type === "grade11"
                    ) {

                        selectedALSeries =
                            "";


                        if (
                            alSeriesSection
                        ) {

                            alSeriesSection.style.display =
                                "none";

                        }


                        if (
                            newStudentId
                        ) {

                            newStudentId.value =
                                "";


                            newStudentId.readOnly =
                                false;


                            newStudentId.disabled =
                                false;


                            newStudentId.removeAttribute(
                                "readonly"
                            );


                            newStudentId.removeAttribute(
                                "disabled"
                            );


                            newStudentId.placeholder =
                                "Enter Grade 11 Student ID";


                            newStudentId.style.background =
                                "";


                            newStudentId.style.fontWeight =
                                "";

                        }


                        if (
                            studentIdHelp
                        ) {

                            studentIdHelp.textContent =
                                "Enter Grade 11 Student ID manually. Range: 26000–26999.";

                        }


                        if (
                            newStudentGrade
                        ) {

                            newStudentGrade.textContent =
                                "Selected: Grade 11";

                        }

                    }

                }
            );

        }
    );


// =====================================================
// A/L SERIES SELECTION
// =====================================================

alSeriesButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const series =
                    String(
                        button.dataset.series ||
                        ""
                    )
                        .trim();


                selectedALSeries =
                    series;


                alSeriesButtons.forEach(
                    item => {

                        item.classList.remove(
                            "selected",
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "selected"
                );


                // =====================================
                // IMPORTANT:
                // STUDENT ID IS MANUAL
                // =====================================

                if (
                    newStudentId
                ) {

                    newStudentId.readOnly =
                        false;


                    newStudentId.disabled =
                        false;


                    newStudentId.removeAttribute(
                        "readonly"
                    );


                    newStudentId.removeAttribute(
                        "disabled"
                    );


                    newStudentId.placeholder =
                        "Enter A/L Student ID";


                    // Do NOT automatically insert ID

                    newStudentId.focus();

                }


                // =====================================
                // HELP TEXT
                // =====================================

                if (
                    studentIdHelp
                ) {

                    const seriesName =
                        series === "27000"
                            ? "A27000"
                            : series === "28000"
                                ? "A28000"
                                : series === "29000"
                                    ? "A29000"
                                    : "27C";


                    studentIdHelp.textContent =
                        "Selected " +
                        seriesName +
                        " series. Enter the Student ID manually.";

                }

            }
        );

    }
);


// =====================================================
// VALIDATE A/L SERIES
// =====================================================

function validateALSeries(
    studentId,
    selectedSeries
) {

    const id =
        String(
            studentId ||
            ""
        )
            .trim()
            .toUpperCase();


    if (
        selectedSeries === "27C"
    ) {

        return /^27C\d{5}$/.test(id);

    }


    if (
        !/^A\d{5}$/.test(id)
    ) {

        return false;

    }


    const number =
        Number(
            id.substring(
                1
            )
        );


    if (
        selectedSeries === "27000"
    ) {

        return (
            number >= 27000 &&
            number <= 27999
        );

    }


    if (
        selectedSeries === "28000"
    ) {

        return (
            number >= 28000 &&
            number <= 28999
        );

    }


    if (
        selectedSeries === "29000"
    ) {

        return (
            number >= 29000 &&
            number <= 29999
        );

    }


    return false;

}


// =====================================================
// SAVE NEW STUDENT
// =====================================================

if (
    saveNewStudent
) {

    saveNewStudent.addEventListener(
        "click",
        async () => {

            // =========================================
            // CATEGORY
            // =========================================

            const selectedCategory =
                document.querySelector(
                    "#addModal .category-btn.selected"
                );


            const type =
                selectedCategory?.dataset.type ||
                "";


            // =========================================
            // MANUAL STUDENT ID
            // =========================================

            const id =
                newStudentId?.value
                    ?.trim()
                    .toUpperCase() ||
                "";


            // =========================================
            // PASSWORD
            // =========================================

            const password =
                newStudentPassword?.value
                    ?.trim() ||
                "";


            const mustChange =
                newMustChange?.checked ||
                true;


            // =========================================
            // CATEGORY
            // =========================================

            if (
                !type
            ) {

                alert(
                    "Please select a student category."
                );

                return;

            }


            // =========================================
            // ID
            // =========================================

            if (
                !id
            ) {

                alert(
                    "Please enter Student ID."
                );


                newStudentId?.focus();


                return;

            }


            // =========================================
            // PASSWORD
            // =========================================

            if (
                !password
            ) {

                alert(
                    "Please enter Password."
                );


                newStudentPassword?.focus();


                return;

            }


            if (
                password.length < 4
            ) {

                alert(
                    "Password must contain at least 4 characters."
                );


                return;

            }


            // =========================================
            // A/L
            // =========================================

            if (
                type === "al"
            ) {

                if (
                    !selectedALSeries
                ) {

                    alert(
                        "Please select A27000, A28000, A29000 or 27C series."
                    );


                    return;

                }


                if (
                    !validateALSeries(
                        id,
                        selectedALSeries
                    )
                ) {

                    const seriesName =
                        selectedALSeries === "27000"
                            ? "A27000"
                            : selectedALSeries === "28000"
                                ? "A28000"
                                : selectedALSeries === "29000"
                                    ? "A29000"
                                    : "27C";


                    alert(

                        "Invalid Student ID.\n\n" +

                        "Selected series: " +
                        seriesName +

                        "\n\n" +

                        "Please enter a valid Student ID in the selected series."

                    );


                    newStudentId?.focus();


                    return;

                }

            }


            // =========================================
            // GRADE 10
            // =========================================

            if (
                type === "grade10"
            ) {

                if (
                    !/^\d{5}$/.test(id)
                ) {

                    alert(
                        "Grade 10 Student ID must contain 5 digits."
                    );


                    return;

                }


                const number =
                    Number(id);


                if (
                    number < 27000 ||
                    number > 27999
                ) {

                    alert(
                        "Grade 10 Student ID must be between 27000 and 27999."
                    );


                    return;

                }

            }


            // =========================================
            // GRADE 11
            // =========================================

            if (
                type === "grade11"
            ) {

                if (
                    !/^\d{5}$/.test(id)
                ) {

                    alert(
                        "Grade 11 Student ID must contain 5 digits."
                    );


                    return;

                }


                const number =
                    Number(id);


                if (
                    number < 26000 ||
                    number > 26999
                ) {

                    alert(
                        "Grade 11 Student ID must be between 26000 and 26999."
                    );


                    return;

                }

            }


            // =========================================
            // DISABLE SAVE
            // =========================================

            saveNewStudent.disabled =
                true;


            saveNewStudent.textContent =
                "Saving...";


            try {

                // =====================================
                // FIRESTORE REFERENCE
                // =====================================

                const studentRef =
                    doc(
                        db,
                        "students",
                        id
                    );


                const existing =
                    await getDoc(
                        studentRef
                    );


                if (
                    existing.exists()
                ) {

                    alert(
                        "This Student ID already exists."
                    );


                    return;

                }


                // =====================================
                // BASE DATA
                // =====================================

                const studentData = {

                    admissionNumber:
                        id,

                    password:
                        password,

                    // IMPORTANT
                    // New students must go
                    // through onboarding

                    mustChangePassword:
                        true,

                    profileCompleted:
                        false,

                    registrationCompleted:
                        false,

                    studentType:
                        type,

                    fullName:
                        "",

                    name:
                        "",

                    studentName:
                        "",

                    nicNumber:
                        "",

                    createdAt:
                        Date.now(),

                    lastActiveAt:
                        0

                };


                // =====================================
                // GRADE
                // =====================================

                if (
                    type === "grade10"
                ) {

                    studentData.grade =
                        10;

                }
                else if (
                    type === "grade11"
                ) {

                    studentData.grade =
                        11;

                }
                else {

                    studentData.grade =
                        null;

                }


                // =====================================
                // PAPERS
                // =====================================

                for (
                    let i = 1;
                    i <= TOTAL_PAPERS;
                    i++
                ) {

                    const paper =
                        getPaperField(
                            i
                        );


                    studentData[
                        paper
                    ] =
                        false;


                    studentData[
                        getPaperViewedField(
                            i
                        )
                    ] =
                        false;


                    studentData[
                        getPaperPagesField(
                            i
                        )
                    ] =
                        10;

                }


                // =====================================
                // SAVE
                // =====================================

                await setDoc(
                    studentRef,
                    studentData
                );


                // =====================================
                // SUCCESS
                // =====================================

                alert(

                    "Student created successfully.\n\n" +

                    "Student ID: " +
                    id +

                    "\n\n" +

                    "The student must complete registration on first login."

                );


                closeAddModal();


                await loadStudents();

            }

            catch (
                error
            ) {

                console.error(
                    "Add student error:",
                    error
                );


                alert(

                    "Failed to create student.\n\n" +

                    error.message

                );

            }

            finally {

                saveNewStudent.disabled =
                    false;


                saveNewStudent.textContent =
                    "💾 Save Student";

            }

        }
    );

}


// =====================================================
// EDIT MODAL
// =====================================================

function openEditModal(
    studentId
) {

    const student =
        allStudents.find(
            item =>
                item.id ===
                studentId
        );


    if (
        !student
    ) {

        return;

    }


    selectedStudentId =
        studentId;


    const data =
        student.data;


    if (
        editStudentId
    ) {

        if (
            "value" in editStudentId
        ) {

            editStudentId.value =
                studentId;

        }
        else {

            editStudentId.textContent =
                studentId;

        }

    }


    if (
        editPassword
    ) {

        editPassword.value =
            "";

    }


    if (
        editMustChange
    ) {

        editMustChange.checked =
            data?.mustChangePassword ===
            true;

    }


    // =============================================
    // PAPER ACCESS
    // =============================================

    for (
        let i = 1;
        i <= TOTAL_PAPERS;
        i++
    ) {

        const checkbox =
            document.getElementById(
                getPaperField(
                    i
                )
            );


        if (
            checkbox
        ) {

            checkbox.checked =
                data?.[
                    getPaperField(
                        i
                    )
                ] === true;

        }

    }


    if (
        resetViewed
    ) {

        resetViewed.dataset.pendingReset =
            "false";

    }


    if (
        editModal
    ) {

        editModal.classList.add(
            "show"
        );


        editModal.style.display =
            "flex";

    }

}


// =====================================================
// CLOSE EDIT
// =====================================================

function closeEditModal() {

    if (
        editModal
    ) {

        editModal.classList.remove(
            "show"
        );


        editModal.style.display =
            "none";

    }


    selectedStudentId =
        "";

}


if (
    closeEdit
) {

    closeEdit.addEventListener(
        "click",
        closeEditModal
    );

}


if (
    closeEditBottom
) {

    closeEditBottom.addEventListener(
        "click",
        closeEditModal
    );

}


if (
    editModal
) {

    editModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                editModal
            ) {

                closeEditModal();

            }

        }
    );

}


// =====================================================
// UPDATE STUDENT
// =====================================================

if (
    updateStudentBtn
) {

    updateStudentBtn.addEventListener(
        "click",
        async () => {

            if (
                !selectedStudentId
            ) {

                alert(
                    "No student selected."
                );


                return;

            }


            const password =
                editPassword
                    ?.value
                    ?.trim() ||
                "";


            const mustChange =
                editMustChange
                    ?.checked ||
                false;


            updateStudentBtn.disabled =
                true;


            updateStudentBtn.textContent =
                "Saving...";


            try {

                const studentRef =
                    doc(
                        db,
                        "students",
                        selectedStudentId
                    );


                const snapshot =
                    await getDoc(
                        studentRef
                    );


                if (
                    !snapshot.exists()
                ) {

                    alert(
                        "Student account was not found."
                    );


                    return;

                }


                const updateData = {

                    mustChangePassword:
                        mustChange

                };


                if (
                    password
                ) {

                    if (
                        password.length < 4
                    ) {

                        alert(
                            "Password must contain at least 4 characters."
                        );


                        return;

                    }


                    updateData.password =
                        password;

                }


                // =====================================
                // PAPER ACCESS
                // =====================================

                for (
                    let i = 1;
                    i <= TOTAL_PAPERS;
                    i++
                ) {

                    const paper =
                        getPaperField(
                            i
                        );


                    const checkbox =
                        document.getElementById(
                            paper
                        );


                    if (
                        checkbox
                    ) {

                        updateData[
                            paper
                        ] =
                            checkbox.checked;

                    }

                }


                // =====================================
                // RESET VIEWED
                // =====================================

                if (
                    resetViewed &&
                    resetViewed.dataset.pendingReset ===
                    "true"
                ) {

                    for (
                        let i = 1;
                        i <= TOTAL_PAPERS;
                        i++
                    ) {

                        updateData[
                            getPaperViewedField(
                                i
                            )
                        ] =
                            false;

                    }


                    resetViewed.dataset.pendingReset =
                        "false";

                }


                await updateDoc(
                    studentRef,
                    updateData
                );


                alert(
                    "Student updated successfully."
                );


                closeEditModal();


                await loadStudents();

            }

            catch (
                error
            ) {

                console.error(
                    "Update student error:",
                    error
                );


                alert(

                    "Failed to update student.\n\n" +

                    error.message

                );

            }

            finally {

                updateStudentBtn.disabled =
                    false;


                updateStudentBtn.textContent =
                    "💾 Save Changes";

            }

        }
    );

}


// =====================================================
// DELETE STUDENT
// =====================================================

async function deleteStudent(
    studentId
) {

    // ================================================
    // DELETE PASSWORD
    // ================================================

    const DELETE_PASSWORD =
        "Nimeth";


    const student =
        allStudents.find(
            item =>
                item.id ===
                studentId
        );


    if (
        !student
    ) {

        alert(
            "Student account was not found."
        );


        return;

    }


    // ================================================
    // ASK PASSWORD
    // ================================================

    const enteredPassword =
        prompt(
            "Enter delete password:"
        );


    if (
        enteredPassword ===
        null
    ) {

        return;

    }


    if (
        enteredPassword !==
        DELETE_PASSWORD
    ) {

        alert(
            "Incorrect delete password."
        );


        return;

    }


    // ================================================
    // CONFIRM
    // ================================================

    const studentName =
        getStudentName(
            student.data
        );


    const displayName =
        studentName ===
        "Not Registered"

            ? studentId

            : studentName +
              " (" +
              studentId +
              ")";


    const confirmed =
        confirm(

            "Are you sure you want to delete this student?\n\n" +

            displayName +

            "\n\n" +

            "This action cannot be undone."

        );


    if (
        !confirmed
    ) {

        return;

    }


    // ================================================
    // DELETE
    // ================================================

    try {

        const studentRef =
            doc(
                db,
                "students",
                studentId
            );


        await deleteDoc(
            studentRef
        );


        alert(
            "Student deleted successfully."
        );


        closeEditModal();


        await loadStudents();

    }

    catch (
        error
    ) {

        console.error(
            "Delete student error:",
            error
        );


        alert(

            "Failed to delete student.\n\n" +

            error.message

        );

    }

}


// =====================================================
// DELETE FROM EDIT
// =====================================================

if (
    deleteStudentBtn
) {

    deleteStudentBtn.addEventListener(
        "click",
        async () => {

            if (
                selectedStudentId
            ) {

                await deleteStudent(
                    selectedStudentId
                );

            }

        }
    );

}


// =====================================================
// RANDOM PASSWORD
// =====================================================

function generatePassword() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";


    let password =
        "";


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        password +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

    }


    return password;

}


// =====================================================
// RESET PASSWORD
// =====================================================

if (
    resetPasswordBtn
) {

    resetPasswordBtn.addEventListener(
        "click",
        () => {

            if (
                editPassword
            ) {

                editPassword.value =
                    generatePassword();

            }


            if (
                editMustChange
            ) {

                editMustChange.checked =
                    true;

            }

        }
    );

}


// =====================================================
// SELECT ALL PAPERS
// =====================================================

if (
    selectAllPapers
) {

    selectAllPapers.addEventListener(
        "click",
        () => {

            for (
                let i = 1;
                i <= TOTAL_PAPERS;
                i++
            ) {

                const checkbox =
                    document.getElementById(
                        getPaperField(
                            i
                        )
                    );


                if (
                    checkbox
                ) {

                    checkbox.checked =
                        true;

                }

            }

        }
    );

}


// =====================================================
// REMOVE ALL PAPERS
// =====================================================

if (
    removeAllPapers
) {

    removeAllPapers.addEventListener(
        "click",
        () => {

            for (
                let i = 1;
                i <= TOTAL_PAPERS;
                i++
            ) {

                const checkbox =
                    document.getElementById(
                        getPaperField(
                            i
                        )
                    );


                if (
                    checkbox
                ) {

                    checkbox.checked =
                        false;

                }

            }

        }
    );

}


// =====================================================
// RESET VIEWED
// =====================================================

if (
    resetViewed
) {

    resetViewed.addEventListener(
        "click",
        () => {

            if (
                !selectedStudentId
            ) {

                alert(
                    "Please select a student first."
                );


                return;

            }


            const confirmed =
                confirm(
                    "Reset all paper viewed status for this student?"
                );


            if (
                !confirmed
            ) {

                return;

            }


            resetViewed.dataset.pendingReset =
                "true";


            alert(
                "Viewed status will be reset when you save."
            );

        }
    );

}


// =====================================================
// COUNTS
// =====================================================

function updateCounts() {

    let grade10 =
        0;

    let grade11 =
        0;

    let al =
        0;

    let active =
        0;


    allStudents.forEach(
        student => {

            const type =
                getStudentType(
                    student.data,
                    student.id
                );


            if (
                type === "grade10"
            ) {

                grade10++;

            }
            else if (
                type === "grade11"
            ) {

                grade11++;

            }
            else {

                al++;

            }


            if (
                isStudentActive(
                    student.data
                )
            ) {

                active++;

            }

        }
    );


    const totalElement =
        document.getElementById(
            "totalStudents"
        );


    const grade10Element =
        document.getElementById(
            "grade10Students"
        );


    const grade11Element =
        document.getElementById(
            "grade11Students"
        );


    const alElement =
        document.getElementById(
            "alStudents"
        );


    const activeElement =
        document.getElementById(
            "activeStudents"
        );


    if (
        totalElement
    ) {

        totalElement.textContent =
            allStudents.length;

    }


    if (
        grade10Element
    ) {

        grade10Element.textContent =
            grade10;

    }


    if (
        grade11Element
    ) {

        grade11Element.textContent =
            grade11;

    }


    if (
        alElement
    ) {

        alElement.textContent =
            al;

    }


    if (
        activeElement
    ) {

        activeElement.textContent =
            active;

    }

}


// =====================================================
// LOGOUT
// =====================================================

if (
    logoutBtn
) {

    logoutBtn.addEventListener(
        "click",
        () => {

            sessionStorage.removeItem(
                "adminLoggedIn"
            );


            sessionStorage.removeItem(
                "adminRole"
            );


            sessionStorage.removeItem(
                "adminUsername"
            );


            window.location.replace(
                "admin-login.html"
            );

        }
    );

}


// =====================================================
// REALTIME FIRESTORE
// =====================================================

function startRealtimeUpdates() {

    try {

        onSnapshot(

            collection(
                db,
                "students"
            ),

            snapshot => {

                allStudents = [];


                snapshot.forEach(
                    studentDoc => {

                        allStudents.push({

                            id:
                                studentDoc.id,

                            data:
                                studentDoc.data()

                        });

                    }
                );


                sortStudents();

                renderStudents();

                updateCounts();

            },

            error => {

                console.error(
                    "Realtime update error:",
                    error
                );

            }

        );

    }

    catch (
        error
    ) {

        console.error(
            "Realtime listener error:",
            error
        );

    }

}


// =====================================================
// REFRESH STATUS
// =====================================================

setInterval(
    () => {

        renderStudents();

        updateCounts();

    },
    30000
);


// =====================================================
// START
// =====================================================

console.log(
    "========================================"
);

console.log(
    "STUDENT MANAGEMENT SYSTEM"
);

console.log(
    "========================================"
);

console.log(
    "A/L Student ID: MANUAL"
);

console.log(
    "A/L Series: A27000"
);

console.log(
    "A/L Series: A28000"
);

console.log(
    "A/L Series: A29000"
);

console.log(
    "Grade 10 ID: MANUAL"
);

console.log(
    "Grade 11 ID: MANUAL"
);

console.log(
    "Password View: ACTIVE"
);

console.log(
    "Edit: ACTIVE"
);

console.log(
    "Delete Password: ACTIVE"
);

console.log(
    "First Login Onboarding: ACTIVE"
);

console.log(
    "Realtime Firestore: ACTIVE"
);

console.log(
    "========================================"
);


loadStudents();

startRealtimeUpdates();
