// =====================================================
// STUDENT DELETION SYSTEM
// =====================================================
//
// ALL STUDENTS
// INDIVIDUAL DELETE
// SERIES DELETE
// NIC DELETE
//
// =====================================================


// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {

    db,
    collection,
    getDocs,
    doc,
    deleteDoc

} from "./firebase.js";


// =====================================================
// SUPER ADMIN DELETE PASSWORD
// =====================================================

const DELETE_PASSWORD = "Nimeth";


// =====================================================
// GLOBAL DATA
// =====================================================

let allStudents = [];

let deleteInProgress = false;


// =====================================================
// DOM ELEMENTS
// =====================================================

const passwordCard =
    document.getElementById(
        "passwordCard"
    );


const reportPanel =
    document.getElementById(
        "reportPanel"
    );


const deletePassword =
    document.getElementById(
        "deletePassword"
    );


const passwordError =
    document.getElementById(
        "passwordError"
    );


const unlockBtn =
    document.getElementById(
        "unlockBtn"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


const studentTable =
    document.getElementById(
        "studentTable"
    );


const resultCount =
    document.getElementById(
        "resultCount"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// =====================================================
// PAGE INITIALIZATION
// =====================================================

console.log(
    "========================================"
);

console.log(
    "STUDENT DELETION SYSTEM"
);

console.log(
    "JavaScript loaded"
);

console.log(
    "========================================"
);


// =====================================================
// UNLOCK BUTTON
// =====================================================

if (
    unlockBtn
) {

    unlockBtn.addEventListener(
        "click",
        unlockStudentDeletion
    );

}


// =====================================================
// PASSWORD ENTER
// =====================================================

if (
    deletePassword
) {

    deletePassword.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                unlockStudentDeletion();

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


// =====================================================
// CATEGORY FILTER
// =====================================================

if (
    categoryFilter
) {

    categoryFilter.addEventListener(
        "change",
        renderStudents
    );

}


// =====================================================
// REFRESH
// =====================================================

if (
    refreshBtn
) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            await loadStudents();

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

if (
    logoutBtn
) {

    logoutBtn.addEventListener(
        "click",
        logout
    );

}


// =====================================================
// UNLOCK STUDENT DELETION
// =====================================================

async function unlockStudentDeletion() {

    const password =
        String(
            deletePassword?.value || ""
        ).trim();


    // =================================================
    // PASSWORD CHECK
    // =================================================

    if (
        password !==
        DELETE_PASSWORD
    ) {

        if (
            passwordError
        ) {

            passwordError.textContent =
                "Incorrect deletion password.";

        }


        if (
            deletePassword
        ) {

            deletePassword.value =
                "";

            deletePassword.focus();

        }


        return;

    }


    // =================================================
    // CLEAR ERROR
    // =================================================

    if (
        passwordError
    ) {

        passwordError.textContent =
            "";

    }


    // =================================================
    // BUTTON LOADING
    // =================================================

    if (
        unlockBtn
    ) {

        unlockBtn.disabled =
            true;

        unlockBtn.textContent =
            "Loading all students...";

    }


    try {

        await loadStudents();


        // =================================================
        // HIDE PASSWORD AREA
        // =================================================

        if (
            passwordCard
        ) {

            passwordCard.style.display =
                "none";

        }


        // =================================================
        // SHOW REPORT
        // =================================================

        if (
            reportPanel
        ) {

            reportPanel.style.display =
                "block";

        }

    }

    catch (
        error
    ) {

        console.error(
            "Unlock error:",
            error
        );


        if (
            passwordError
        ) {

            passwordError.textContent =
                "Unable to load students.";

        }

    }

    finally {

        if (
            unlockBtn
        ) {

            unlockBtn.disabled =
                false;

            unlockBtn.textContent =
                "🔓 Unlock Student Deletion";

        }

    }

}


// =====================================================
// LOAD ALL STUDENTS
// =====================================================

async function loadStudents() {

    console.log(
        "Loading ALL students..."
    );


    // =================================================
    // LOADING
    // =================================================

    if (
        studentTable
    ) {

        studentTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    Loading all students...

                </td>

            </tr>

        `;

    }


    // =================================================
    // GET ENTIRE COLLECTION
    // =================================================
    //
    // IMPORTANT:
    //
    // NO limit()
    // NO pagination
    // NO slice()
    //
    // This gets every document in:
    //
    // students
    //
    // =================================================

    const studentsSnapshot =
        await getDocs(
            collection(
                db,
                "students"
            )
        );


    // =================================================
    // RESET
    // =================================================

    allStudents = [];


    // =================================================
    // ADD EVERY DOCUMENT
    // =================================================

    studentsSnapshot.forEach(
        studentDoc => {

            allStudents.push({

                id:
                    studentDoc.id,

                data:
                    studentDoc.data()

            });

        }
    );


    // =================================================
    // SORT
    // =================================================

    allStudents.sort(
        (
            first,
            second
        ) => {

            return String(
                first.id
            ).localeCompare(
                String(
                    second.id
                ),
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );

        }
    );


    // =================================================
    // LOG TOTAL
    // =================================================

    console.log(
        "========================================"
    );

    console.log(
        "FIRESTORE STUDENTS:",
        studentsSnapshot.size
    );

    console.log(
        "LOADED STUDENTS:",
        allStudents.length
    );

    console.log(
        "========================================"
    );


    // =================================================
    // UPDATE TOTALS
    // =================================================

    updateTotals();


    // =================================================
    // RENDER ALL
    // =================================================

    renderStudents();

}


// =====================================================
// GET SERIES
// =====================================================
//
// A27000 - A27999 = A27000
// A28000 - A28999 = A28000
// A29000 - A29999 = A29000
//
// 26000 - 26999 = Grade 11
// 27000 - 27999 = Grade 10
//
// =====================================================

function getSeries(
    studentId
) {

    const id =
        String(
            studentId || ""
        )
            .trim()
            .toUpperCase();


    // =================================================
    // A/L SERIES
    // =================================================

    if (
        /^A\d{5}$/.test(
            id
        )
    ) {

        const number =
            Number(
                id.substring(1)
            );


        // =================================================
        // A27000 - A27999
        // =================================================

        if (
            number >= 27000 &&
            number <= 27999
        ) {

            return "A27000";

        }


        // =================================================
        // A28000 - A28999
        // =================================================

        if (
            number >= 28000 &&
            number <= 28999
        ) {

            return "A28000";

        }


        // =================================================
        // A29000 - A29999
        // =================================================

        if (
            number >= 29000 &&
            number <= 29999
        ) {

            return "A29000";

        }


        return "";

    }


    // =================================================
    // NUMERIC STUDENT ID
    // =================================================

    if (
        /^\d{5}$/.test(
            id
        )
    ) {

        const number =
            Number(
                id
            );


        // =================================================
        // 26000 - 26999
        // =================================================

        if (
            number >= 26000 &&
            number <= 26999
        ) {

            return "26000";

        }


        // =================================================
        // 27000 - 27999
        // =================================================

        if (
            number >= 27000 &&
            number <= 27999
        ) {

            return "27000";

        }

    }


    return "";

}


// =====================================================
// GET NIC FROM FIRESTORE
// =====================================================

function getNIC(
    data
) {

    if (
        !data
    ) {

        return "";

    }


    return (

        data.nicNumber ||

        data.nic ||

        data.NIC ||

        data.nicNo ||

        data.NICNumber ||

        data.nic_number ||

        data.nationalId ||

        data.nationalID ||

        data.national_id ||

        data.identityNumber ||

        data.identityNo ||

        ""

    );

}


// =====================================================
// CHECK NIC STUDENT
// =====================================================
//
// NIC can be:
//
// 9 digits
// 10 digits
// 11 digits
// 12 digits
//
// OR:
//
// 123456789V
// 123456789X
//
// Also:
// Student ID itself can be NIC.
//
// =====================================================

function hasNIC(
    data,
    studentId
) {

    // =================================================
    // CLEAN STUDENT ID
    // =================================================

    const cleanStudentId =
        String(
            studentId || ""
        )
            .trim()
            .replace(
                /\s+/g,
                ""
            )
            .toUpperCase();


    // =================================================
    // STUDENT ID ITSELF IS NIC
    // =================================================
    //
    // 9 - 12 digits
    //
    // Example:
    //
    // 2007305028
    // 2007531226
    // 20076902182
    // 20078112893
    // 200578900180
    //
    // =================================================

    if (
        /^\d{9,12}$/.test(
            cleanStudentId
        )
    ) {

        return true;

    }


    // =================================================
    // GET FIRESTORE NIC
    // =================================================

    const nic =
        getNIC(
            data
        );


    // =================================================
    // CLEAN NIC
    // =================================================

    const cleanNIC =
        String(
            nic || ""
        )
            .trim()
            .replace(
                /\s+/g,
                ""
            )
            .toUpperCase();


    // =================================================
    // NUMERIC NIC
    // =================================================

    if (
        /^\d{9,12}$/.test(
            cleanNIC
        )
    ) {

        return true;

    }


    // =================================================
    // OLD NIC
    //
    // 123456789V
    // 123456789X
    //
    // =================================================

    if (
        /^\d{9}[VX]$/.test(
            cleanNIC
        )
    ) {

        return true;

    }


    return false;

}


// =====================================================
// GET STUDENT NAME
// =====================================================

function getStudentName(
    data
) {

    if (
        !data
    ) {

        return "Student";

    }


    return (

        data.fullName ||

        data.name ||

        data.studentName ||

        data.displayName ||

        data.full_name ||

        "Student"

    );

}


// =====================================================
// GET CATEGORY
// =====================================================

function getCategory(student) {
    const data = student.data || {};
    const series = getSeries(student.id);
    const storedType = String(
        data.studentType || data.grade || data.category || data.studentCategory || ""
    ).trim().toLowerCase().replace(/[\s/_-]+/g, "");

    // Prefer the category saved on the student record.
    if (["al", "alevel", "advancedlevel"].includes(storedType) ||
        String(data.category || data.studentCategory || "").trim().toLowerCase() === "a/l") {
        return "A/L";
    }
    if (["grade11", "11", "g11"].includes(storedType)) return "Grade 11";
    if (["grade10", "10", "g10"].includes(storedType)) return "Grade 10";

    // Fall back to the existing admission-number rules for older records.
    if (["A27000", "A28000", "A29000"].includes(series)) return "A/L";
    if (series === "26000") return "Grade 11";
    if (series === "27000") return "Grade 10";

    if (hasNIC(data, student.id)) return "NIC Student";
    return "Other";
}


// =====================================================
// COUNT SERIES
// =====================================================

function countSeries(
    series
) {

    return allStudents.filter(
        student =>

            getSeries(
                student.id
            ) ===
            series

    ).length;

}


// =====================================================
// COUNT NIC
// =====================================================

function countNICStudents() {

    return allStudents.filter(
        student =>

            hasNIC(
                student.data,
                student.id
            )

    ).length;

}


// =====================================================
// UPDATE TOTALS
// =====================================================

function updateTotals() {

    const totalA27000 =
        countSeries(
            "A27000"
        );


    const totalA28000 =
        countSeries(
            "A28000"
        );


    const totalA29000 =
        countSeries(
            "A29000"
        );


    const total26000 =
        countSeries(
            "26000"
        );


    const total27000 =
        countSeries(
            "27000"
        );


    const totalNIC =
        countNICStudents();


    // =================================================
    // UPDATE CARDS
    // =================================================

    setText(
        "totalA27000",
        totalA27000
    );


    setText(
        "totalA28000",
        totalA28000
    );


    setText(
        "totalA29000",
        totalA29000
    );


    setText(
        "total26000",
        total26000
    );


    setText(
        "total27000",
        total27000
    );


    setText(
        "nicStudentTotal",
        totalNIC
    );


    // =================================================
    // SUPPORT OTHER POSSIBLE NIC IDs
    // =================================================

    setText(
        "totalNICStudents",
        totalNIC
    );


    setText(
        "totalNICStudent",
        totalNIC
    );


    // =================================================
    // DEBUG
    // =================================================

    console.log(
        "----------------------------------------"
    );

    console.log(
        "A27000:",
        totalA27000
    );

    console.log(
        "A28000:",
        totalA28000
    );

    console.log(
        "A29000:",
        totalA29000
    );

    console.log(
        "26000:",
        total26000
    );

    console.log(
        "27000:",
        total27000
    );

    console.log(
        "NIC:",
        totalNIC
    );

    console.log(
        "----------------------------------------"
    );

}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            Number(
                value || 0
            ).toLocaleString();

    }

}


// =====================================================
// RENDER STUDENTS
// =====================================================

function renderStudents() {

    if (
        !studentTable
    ) {

        console.error(
            "studentTable not found."
        );

        return;

    }


    // =================================================
    // SEARCH
    // =================================================

    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    // =================================================
    // FILTER
    // =================================================

    const filter =
        String(
            categoryFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    // =================================================
    // FILTER STUDENTS
    // =================================================

    const filteredStudents =
        allStudents.filter(
            student => {

                const id =
                    String(
                        student.id
                    )
                        .toLowerCase();


                const name =
                    String(
                        getStudentName(
                            student.data
                        )
                    )
                        .toLowerCase();


                const nic =
                    String(
                        getNIC(
                            student.data
                        )
                    )
                        .toLowerCase();


                const series =
                    String(
                        getSeries(
                            student.id
                        )
                    )
                        .toLowerCase();


                const category =
                    String(
                        getCategory(
                            student
                        )
                    )
                        .toLowerCase();


                // =================================================
                // SEARCH
                // =================================================

                const searchMatch =

                    !search ||

                    id.includes(
                        search
                    ) ||

                    name.includes(
                        search
                    ) ||

                    nic.includes(
                        search
                    );


                if (
                    !searchMatch
                ) {

                    return false;

                }


                // =================================================
                // ALL
                // =================================================

                if (
                    filter ===
                    "all"
                ) {

                    return true;

                }


                // =================================================
                // A/L
                // =================================================

                if (
                    filter ===
                    "al"
                ) {

                    return (

                        series === "a27000" ||

                        series === "a28000" ||

                        series === "a29000"

                    );

                }


                // =================================================
                // A27000
                // =================================================

                if (
                    filter ===
                    "a27000"
                ) {

                    return (
                        series ===
                        "a27000"
                    );

                }


                // =================================================
                // A28000
                // =================================================

                if (
                    filter ===
                    "a28000"
                ) {

                    return (
                        series ===
                        "a28000"
                    );

                }


                // =================================================
                // A29000
                // =================================================

                if (
                    filter ===
                    "a29000"
                ) {

                    return (
                        series ===
                        "a29000"
                    );

                }


                // =================================================
                // GRADE 11
                // =================================================

                if (
                    filter ===
                    "grade11"
                ) {

                    return (
                        series ===
                        "26000"
                    );

                }


                // =================================================
                // GRADE 10
                // =================================================

                if (
                    filter ===
                    "grade10"
                ) {

                    return (
                        series ===
                        "27000"
                    );

                }


                // =================================================
                // NIC
                // =================================================

                if (
                    filter ===
                    "nic"
                ) {

                    return hasNIC(
                        student.data,
                        student.id
                    );

                }


                // =================================================
                // OTHER
                // =================================================

                if (
                    filter ===
                    "other"
                ) {

                    return (
                        category ===
                        "other"
                    );

                }


                return true;

            }
        );


    // =================================================
    // RESULT COUNT
    // =================================================

    if (
        resultCount
    ) {

        resultCount.textContent =

            filteredStudents.length
                .toLocaleString() +

            (
                filteredStudents.length ===
                1

                    ? " student"

                    : " students"

            );

    }


    // =================================================
    // EMPTY
    // =================================================

    if (
        filteredStudents.length ===
        0
    ) {

        studentTable.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                        color:#64748b;
                    "
                >

                    No students found.

                </td>

            </tr>

        `;

        return;

    }


    // =================================================
    // IMPORTANT
    // =================================================
    //
    // NO:
    //
    // .slice(0, 5)
    //
    // .slice(0, 10)
    //
    // pagination
    //
    // ALL filtered students are rendered.
    //
    // =================================================

    studentTable.innerHTML =

        filteredStudents
            .map(
                (
                    student,
                    index
                ) => {

                    const name =
                        getStudentName(
                            student.data
                        );


                    const nic =
                        getNIC(
                            student.data
                        );


                    const category =
                        getCategory(
                            student
                        );


                    const series =
                        getSeries(
                            student.id
                        );


                    // =================================================
                    // CATEGORY CLASS
                    // =================================================

                    let badgeClass =
                        "other";


                    if (
                        category ===
                        "A/L"
                    ) {

                        badgeClass =
                            "al";

                    }

                    else if (
                        category ===
                        "Grade 10"
                    ) {

                        badgeClass =
                            "grade10";

                    }

                    else if (
                        category ===
                        "Grade 11"
                    ) {

                        badgeClass =
                            "grade11";

                    }


                    // =================================================
                    // NIC DISPLAY
                    // =================================================

                    let nicHTML =
                        "";


                    if (
                        nic
                    ) {

                        nicHTML = `

                            <div
                                style="
                                    margin-top:4px;
                                    font-size:11px;
                                    color:#94a3b8;
                                "
                            >

                                NIC:
                                ${escapeHTML(
                                    nic
                                )}

                            </div>

                        `;

                    }


                    // =================================================
                    // ROW
                    // =================================================

                    return `

                        <tr>

                            <!-- NUMBER -->

                            <td>

                                ${index + 1}

                            </td>


                            <!-- STUDENT ID -->

                            <td>

                                <strong
                                    class="student-id"
                                >

                                    ${escapeHTML(
                                        student.id
                                    )}

                                </strong>

                            </td>


                            <!-- NAME -->

                            <td>

                                <strong>

                                    ${escapeHTML(
                                        name
                                    )}

                                </strong>

                                ${nicHTML}

                            </td>


                            <!-- CATEGORY -->

                            <td>

                                <span
                                    class="
                                        badge
                                        ${badgeClass}
                                    "
                                >

                                    ${escapeHTML(
                                        category
                                    )}

                                </span>

                            </td>


                            <!-- SERIES -->

                            <td>

                                ${
                                    series
                                        ? escapeHTML(
                                            series
                                        )
                                        : "-"
                                }

                            </td>


                            <!-- DELETE -->

                            <td>

                                <button
                                    type="button"
                                    class="delete-btn individual-delete"
                                    data-id="${escapeAttribute(
                                        student.id
                                    )}"
                                >

                                    🗑 Delete

                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    // =================================================
    // INDIVIDUAL DELETE EVENTS
    // =================================================

    document
        .querySelectorAll(
            ".individual-delete"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteIndividual(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// =====================================================
// INDIVIDUAL DELETE
// =====================================================

async function deleteIndividual(
    studentId
) {

    if (
        deleteInProgress
    ) {

        return;

    }


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
            "Student not found."
        );

        return;

    }


    const name =
        getStudentName(
            student.data
        );


    const nic =
        getNIC(
            student.data
        );


    const category =
        getCategory(
            student
        );


    // =================================================
    // CONFIRM
    // =================================================

    const confirmed =
        confirm(

            "⚠️ DELETE STUDENT\n\n" +

            "Student ID: " +
            studentId +

            "\nName: " +
            name +

            "\nCategory: " +
            category +

            (
                nic
                    ? "\nNIC: " + nic
                    : ""
            ) +

            "\n\n" +

            "This account will be permanently deleted.\n\n" +

            "Continue?"

        );


    if (
        !confirmed
    ) {

        return;

    }


    // =================================================
    // PASSWORD
    // =================================================

    const password =
        prompt(
            "Enter deletion password:"
        );


    if (
        password !==
        DELETE_PASSWORD
    ) {

        alert(
            "Incorrect deletion password."
        );

        return;

    }


    // =================================================
    // DELETE
    // =================================================

    await deleteStudentList(
        [student]
    );

}


// =====================================================
// DELETE SERIES
// =====================================================

async function deleteSeries(
    series
) {

    if (
        deleteInProgress
    ) {

        return;

    }


    const students =
        allStudents.filter(
            student =>

                getSeries(
                    student.id
                ) ===
                series

        );


    if (
        students.length ===
        0
    ) {

        alert(

            "No students found in " +
            series +
            "."

        );

        return;

    }


    // =================================================
    // CONFIRM
    // =================================================

    const confirmed =
        confirm(

            "⚠️ DELETE ALL " +
            series +
            " STUDENTS\n\n" +

            "Total: " +
            students.length +

            "\n\n" +

            "ALL students in this series " +
            "will be permanently deleted.\n\n" +

            "This action cannot be undone.\n\n" +

            "Continue?"

        );


    if (
        !confirmed
    ) {

        return;

    }


    // =================================================
    // PASSWORD
    // =================================================

    const password =
        prompt(
            "Enter deletion password:"
        );


    if (
        password !==
        DELETE_PASSWORD
    ) {

        alert(
            "Incorrect deletion password."
        );

        return;

    }


    await deleteStudentList(
        students
    );

}


// =====================================================
// DELETE ALL NIC STUDENTS
// =====================================================

async function deleteAllNICStudents() {

    if (
        deleteInProgress
    ) {

        return;

    }


    // =================================================
    // FIND ALL NIC STUDENTS
    // =================================================

    const nicStudents =
        allStudents.filter(
            student =>

                hasNIC(
                    student.data,
                    student.id
                )

        );


    // =================================================
    // NONE
    // =================================================

    if (
        nicStudents.length ===
        0
    ) {

        alert(
            "No NIC students found."
        );

        return;

    }


    // =================================================
    // CONFIRM
    // =================================================

    const confirmed =
        confirm(

            "⚠️ DELETE ALL NIC STUDENTS\n\n" +

            "Total: " +
            nicStudents.length +

            "\n\n" +

            "This includes students whose " +
            "Student ID or NIC field contains " +
            "a 9-12 digit NIC number.\n\n" +

            "All matching accounts will be " +
            "permanently deleted.\n\n" +

            "This action cannot be undone.\n\n" +

            "Continue?"

        );


    if (
        !confirmed
    ) {

        return;

    }


    // =================================================
    // PASSWORD
    // =================================================

    const password =
        prompt(
            "Enter deletion password:"
        );


    if (
        password !==
        DELETE_PASSWORD
    ) {

        alert(
            "Incorrect deletion password."
        );

        return;

    }


    // =================================================
    // DELETE
    // =================================================

    await deleteStudentList(
        nicStudents
    );

}


// =====================================================
// DELETE STUDENT LIST
// =====================================================

async function deleteStudentList(
    students
) {

    if (
        deleteInProgress
    ) {

        return;

    }


    if (
        !students ||
        students.length ===
        0
    ) {

        return;

    }


    deleteInProgress =
        true;


    try {

        let deletedCount =
            0;


        // =================================================
        // DELETE ONE BY ONE
        // =================================================

        for (
            const student
            of students
        ) {

            console.log(
                "Deleting:",
                student.id
            );


            await deleteDoc(
                doc(
                    db,
                    "students",
                    student.id
                )
            );


            deletedCount++;

        }


        // =================================================
        // LOCAL ARRAY UPDATE
        // =================================================

        const deletedIds =
            new Set(
                students.map(
                    student =>
                        student.id
                )
            );


        allStudents =
            allStudents.filter(
                student =>

                    !deletedIds.has(
                        student.id
                    )

            );


        // =================================================
        // UPDATE TOTALS
        // =================================================

        updateTotals();


        // =================================================
        // RENDER
        // =================================================

        renderStudents();


        // =================================================
        // SUCCESS
        // =================================================

        alert(

            "Successfully deleted " +
            deletedCount +
            " student(s)."

        );

    }

    catch (
        error
    ) {

        console.error(
            "Delete error:",
            error
        );


        alert(

            "Delete failed.\n\n" +
            error.message

        );

    }

    finally {

        deleteInProgress =
            false;

    }

}


// =====================================================
// GLOBAL BUTTON HANDLER
// =====================================================
//
// This supports existing HTML buttons:
//
// id="deleteAllNIC"
//
// class="delete-series-btn"
// data-series="A27000"
//
// =====================================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button"
            );


        if (
            !button
        ) {

            return;

        }


        // =================================================
        // DELETE ALL NIC
        // =================================================

        if (
            button.id ===
            "deleteAllNIC"
        ) {

            deleteAllNICStudents();

            return;

        }


        // =================================================
        // DELETE SERIES
        // =================================================

        if (
            button.classList.contains(
                "delete-series-btn"
            )
        ) {

            const series =
                button.dataset.series;


            if (
                series
            ) {

                deleteSeries(
                    series
                );

            }

        }

    }
);


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
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(
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
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    const confirmed =
        confirm(
            "Are you sure you want to sign out?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    sessionStorage.clear();


    window.location.href =
        "admin-login.html";

}


// =====================================================
// FINAL SYSTEM MESSAGE
// =====================================================

console.log(
    "========================================"
);

console.log(
    "✅ STUDENT DELETION SYSTEM READY"
);

console.log(
    "========================================"
);

console.log(
    "ALL STUDENTS: ENABLED"
);

console.log(
    "NO 5-STUDENT LIMIT"
);

console.log(
    "NO PAGINATION"
);

console.log(
    "A27000-A27999 = A27000"
);

console.log(
    "A28000-A28999 = A28000"
);

console.log(
    "A29000-A29999 = A29000"
);

console.log(
    "26000-26999 = Grade 11"
);

console.log(
    "27000-27999 = Grade 10"
);

console.log(
    "9-12 DIGIT = NIC"
);

console.log(
    "9 DIGIT + V/X = NIC"
);

console.log(
    "INDIVIDUAL DELETE = ON"
);

console.log(
    "SERIES DELETE = ON"
);

console.log(
    "NIC DELETE = ON"
);

console.log(
    "========================================"
);
