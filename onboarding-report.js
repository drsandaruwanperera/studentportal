// =====================================================
// 1ST ONBOARDING REPORT
// =====================================================

import {
    db,
    collection,
    getDocs
} from "./firebase.js";

import { isStudentOnboardingComplete } from "./student-onboarding.js";


// =====================================================
// ELEMENTS
// =====================================================

const table =
    document.getElementById(
        "reportTable"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


const exportBtn =
    document.getElementById(
        "exportBtn"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const totalStudents =
    document.getElementById(
        "totalStudents"
    );


const completedStudents =
    document.getElementById(
        "completedStudents"
    );


const pendingStudents =
    document.getElementById(
        "pendingStudents"
    );


const completionRate =
    document.getElementById(
        "completionRate"
    );


const resultCount =
    document.getElementById(
        "resultCount"
    );


const sidebarAdminName =
    document.getElementById(
        "sidebarAdminName"
    );


// =====================================================
// DATA
// =====================================================

let allStudents = [];


// =====================================================
// ADMIN SESSION
// =====================================================

function getSessionValue(
    ...keys
) {

    for (
        const key of keys
    ) {

        const value =
            sessionStorage.getItem(
                key
            );

        if (
            value !== null &&
            value !== ""
        ) {

            return value;

        }

    }


    return "";

}


// =====================================================
// SUPER ADMIN CHECK
// =====================================================

function isSuperAdmin() {

    const role =
        getSessionValue(
            "adminRole",
            "userRole",
            "role"
        )
            .trim()
            .toLowerCase()
            .replace(
                /[\s_-]/g,
                ""
            );


    return (
        role === "superadmin" ||
        role === "superadministrator"
    );

}


// =====================================================
// LOGIN CHECK
// =====================================================

function isAdminLoggedIn() {

    const possibleValues = [

        sessionStorage.getItem(
            "adminLoggedIn"
        ),

        sessionStorage.getItem(
            "loggedIn"
        ),

        sessionStorage.getItem(
            "adminAuthenticated"
        ),

        sessionStorage.getItem(
            "isAdminLoggedIn"
        )

    ];


    return possibleValues.some(
        value =>
            value === "true"
    );

}


// =====================================================
// ACCESS
// =====================================================

if (
    !isAdminLoggedIn() ||
    !isSuperAdmin()
) {

    document.body.innerHTML = `

        <div
            style="
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#f4f6fb;
                font-family:Arial,sans-serif;
                padding:20px;
            "
        >

            <div
                style="
                    background:white;
                    max-width:450px;
                    width:100%;
                    padding:45px 30px;
                    border-radius:20px;
                    text-align:center;
                    box-shadow:
                        0 20px 60px
                        rgba(15,23,42,.12);
                "
            >

                <div
                    style="
                        font-size:48px;
                        margin-bottom:15px;
                    "
                >
                    🔒
                </div>


                <h2>
                    Access Restricted
                </h2>


                <p
                    style="
                        color:#64748b;
                        line-height:1.6;
                    "
                >
                    The 1st Onboarding Report
                    is available only to the
                    Super Administrator.
                </p>


                <button
                    onclick="
                        window.location.href='admin.html'
                    "
                    style="
                        margin-top:15px;
                        border:0;
                        padding:12px 20px;
                        border-radius:9px;
                        background:#7c3aed;
                        color:white;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    ← Back to Dashboard
                </button>

            </div>

        </div>

    `;

}
else {

    startReport();

}


// =====================================================
// START
// =====================================================

async function startReport() {

    const adminName =
        getSessionValue(
            "adminName",
            "username",
            "adminUsername"
        );


    if (
        adminName &&
        sidebarAdminName
    ) {

        sidebarAdminName.textContent =
            adminName;

    }


    await loadStudents();

}


// =====================================================
// LOAD STUDENTS
// =====================================================

async function loadStudents() {

    if (
        table
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="loading"
                >
                    Loading students...
                </td>

            </tr>

        `;

    }


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
                        numeric:
                            true
                    }
                );

            }
        );


        updateSummary();

        renderStudents();

    }

    catch (
        error
    ) {

        console.error(
            "Failed to load students:",
            error
        );


        if (
            table
        ) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        class="loading"
                    >
                        ❌ Failed to load student data.
                    </td>

                </tr>

            `;

        }

    }

}


// =====================================================
// STUDENT TYPE
// =====================================================

function getStudentType(
    student
) {

    const data =
        student.data;


    const id =
        String(
            student.id
        )
            .trim()
            .toUpperCase();


    const firebaseType =
        String(
            data?.studentType ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        firebaseType ===
        "grade10" ||
        firebaseType ===
        "grade 10"
    ) {

        return "grade10";

    }


    if (
        firebaseType ===
        "grade11" ||
        firebaseType ===
        "grade 11"
    ) {

        return "grade11";

    }


    if (
        firebaseType ===
        "al" ||
        firebaseType ===
        "a/l" ||
        firebaseType ===
        "a level" ||
        firebaseType ===
        "advanced" ||
        firebaseType ===
        "advanced level"
    ) {

        return "al";

    }


    const grade =
        String(
            data?.grade ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        grade === "10"
    ) {

        return "grade10";

    }


    if (
        grade === "11"
    ) {

        return "grade11";

    }


    if (
        /^A\d{5}$/.test(
            id
        )
    ) {

        return "al";

    }


    if (
        /^\d{5}$/.test(
            id
        )
    ) {

        const number =
            Number(
                id
            );


        if (
            number >= 26000 &&
            number <= 26999
        ) {

            return "grade11";

        }


        if (
            number >= 27000 &&
            number <= 27999
        ) {

            return "grade10";

        }

    }


    return "al";

}


// =====================================================
// CATEGORY NAME
// =====================================================

function getCategoryName(
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


    return "A/L";

}


// =====================================================
// ONBOARDING COMPLETE
// =====================================================
//
// Supports several possible field names so the report
// remains compatible with existing registration code.
//

function isOnboardingComplete(data) {
    return isStudentOnboardingComplete(data);
}


// =====================================================
// REGISTRATION DATE
// =====================================================

function getRegistrationDate(
    data
) {

    return (
        data?.registrationCompletedAt ||
        data?.onboardingCompletedAt ||
        data?.registeredAt ||
        data?.createdAt ||
        null
    );

}


// =====================================================
// LAST ACTIVE
// =====================================================

function getLastActive(
    data
) {

    return (
        data?.lastActiveAt ||
        data?.lastLoginAt ||
        null
    );

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === 0
    ) {

        return "-";

    }


    let date;


    if (
        typeof value ===
        "object" &&
        value?.toDate
    ) {

        date =
            value.toDate();

    }
    else if (
        typeof value ===
        "number"
    ) {

        date =
            new Date(
                value
            );

    }
    else {

        date =
            new Date(
                value
            );

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleString(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

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
// SUMMARY
// =====================================================

function updateSummary() {

    const total =
        allStudents.length;


    const completed =
        allStudents.filter(
            student =>
                isOnboardingComplete(
                    student.data
                )
        ).length;


    const pending =
        total -
        completed;


    const rate =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) *
                100
            )
            : 0;


    if (
        totalStudents
    ) {

        totalStudents.textContent =
            total;

    }


    if (
        completedStudents
    ) {

        completedStudents.textContent =
            completed;

    }


    if (
        pendingStudents
    ) {

        pendingStudents.textContent =
            pending;

    }


    if (
        completionRate
    ) {

        completionRate.textContent =
            rate +
            "%";

    }

}


// =====================================================
// FILTER
// =====================================================

function getFilteredStudents() {

    const search =
        String(
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const category =
        categoryFilter?.value ||
        "all";


    const status =
        statusFilter?.value ||
        "all";


    return allStudents.filter(
        student => {

            const data =
                student.data;


            const id =
                String(
                    student.id
                );


            const name =
                String(
                    data?.fullName ||
                    data?.name ||
                    data?.studentName ||
                    data?.displayName ||
                    ""
                );


            const nic =
                String(
                    data?.nicNumber ||
                    data?.nic ||
                    ""
                );


            const type =
                getStudentType(
                    student
                );


            const completed =
                isOnboardingComplete(
                    data
                );


            const searchable =
                (
                    id +
                    " " +
                    name +
                    " " +
                    nic
                )
                    .toLowerCase();


            if (
                search &&
                !searchable.includes(
                    search
                )
            ) {

                return false;

            }


            if (
                category !==
                "all" &&
                category !==
                type
            ) {

                return false;

            }


            if (
                status ===
                "completed" &&
                !completed
            ) {

                return false;

            }


            if (
                status ===
                "pending" &&
                completed
            ) {

                return false;

            }


            return true;

        }
    );

}


// =====================================================
// RENDER
// =====================================================

function renderStudents() {

    const filtered =
        getFilteredStudents();


    if (
        resultCount
    ) {

        resultCount.textContent =
            filtered.length +
            (
                filtered.length ===
                1
                    ? " student"
                    : " students"
            );

    }


    if (
        !table
    ) {

        return;

    }


    if (
        filtered.length ===
        0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="loading"
                >
                    No students found.
                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        filtered
            .map(
                (
                    student,
                    index
                ) => {

                    const data =
                        student.data;


                    const type =
                        getStudentType(
                            student
                        );


                    const category =
                        getCategoryName(
                            type
                        );


                    const completed =
                        isOnboardingComplete(
                            data
                        );


                    const name =
                        data?.fullName ||
                        data?.name ||
                        data?.studentName ||
                        data?.displayName ||
                        "-";


                    const nic =
                        data?.nicNumber ||
                        data?.nic ||
                        "-";


                    const registrationDate =
                        getRegistrationDate(
                            data
                        );


                    const lastActive =
                        getLastActive(
                            data
                        );


                    return `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>


                            <td>

                                <span
                                    class="student-id"
                                >
                                    ${escapeHTML(
                                        student.id
                                    )}
                                </span>

                            </td>


                            <td>
                                ${escapeHTML(
                                    name
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    nic
                                )}
                            </td>


                            <td>

                                <span
                                    class="
                                        badge
                                        badge-${type}
                                    "
                                >
                                    ${category}
                                </span>

                            </td>


                            <td>

                                <span
                                    class="
                                        badge
                                        ${
                                            completed
                                                ? "badge-completed"
                                                : "badge-pending"
                                        }
                                    "
                                >

                                    ${
                                        completed
                                            ? "✓ Completed"
                                            : "⏳ Pending"
                                    }

                                </span>

                            </td>


                            <td>

                                ${
                                    completed
                                        ? "Completed"
                                        : "Not Completed"
                                }

                            </td>


                            <td>

                                ${
                                    completed
                                        ? escapeHTML(
                                            formatDate(
                                                registrationDate
                                            )
                                        )
                                        : "-"
                                }

                            </td>


                            <td>

                                ${escapeHTML(
                                    formatDate(
                                        lastActive
                                    )
                                )}

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

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
    categoryFilter
) {

    categoryFilter.addEventListener(
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
// REFRESH
// =====================================================

if (
    refreshBtn
) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled =
                true;


            refreshBtn.textContent =
                "⏳ Loading...";


            await loadStudents();


            refreshBtn.disabled =
                false;


            refreshBtn.textContent =
                "🔄 Refresh";

        }
    );

}


// =====================================================
// EXCEL EXPORT
// =====================================================

if (
    exportBtn
) {

    exportBtn.addEventListener(
        "click",
        () => {

            const filtered =
                getFilteredStudents();


            if (
                filtered.length ===
                0
            ) {

                alert(
                    "No student data available to export."
                );


                return;

            }


            if (
                typeof XLSX ===
                "undefined"
            ) {

                alert(
                    "Excel export library is not loaded."
                );


                return;

            }


            const exportData =
                filtered.map(
                    student => {

                        const data =
                            student.data;


                        const type =
                            getStudentType(
                                student
                            );


                        const completed =
                            isOnboardingComplete(
                                data
                            );


                        return {

                            "Student ID":
                                student.id,

                            "Full Name":
                                data?.fullName ||
                                data?.name ||
                                data?.studentName ||
                                data?.displayName ||
                                "",

                            "NIC Number":
                                data?.nicNumber ||
                                data?.nic ||
                                "",

                            "Category":
                                getCategoryName(
                                    type
                                ),

                            "Onboarding Status":
                                completed
                                    ? "Completed"
                                    : "Pending",

                            "Registration":
                                completed
                                    ? "Completed"
                                    : "Not Completed",

                            "Registration Date":
                                completed
                                    ? formatDate(
                                        getRegistrationDate(
                                            data
                                        )
                                    )
                                    : "",

                            "Last Active":
                                formatDate(
                                    getLastActive(
                                        data
                                    )
                                )

                        };

                    }
                );


            const worksheet =
                XLSX.utils.json_to_sheet(
                    exportData
                );


            worksheet["!cols"] = [

                {
                    wch:
                        16
                },

                {
                    wch:
                        28
                },

                {
                    wch:
                        18
                },

                {
                    wch:
                        15
                },

                {
                    wch:
                        20
                },

                {
                    wch:
                        20
                },

                {
                    wch:
                        22
                },

                {
                    wch:
                        22
                }

            ];


            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Onboarding Report"
            );


            const date =
                new Date()
                    .toISOString()
                    .slice(
                        0,
                        10
                    );


            XLSX.writeFile(
                workbook,
                "1st-Onboarding-Report-" +
                date +
                ".xlsx"
            );

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
        () => {

            sessionStorage.clear();


            window.location.href =
                "admin-login.html";

        }
    );

}


// =====================================================
// CONSOLE
// =====================================================

console.log(
    "======================================"
);

console.log(
    "1st Onboarding Report Loaded"
);

console.log(
    "Super Administrator Only"
);

console.log(
    "Search: ACTIVE"
);

console.log(
    "Filters: ACTIVE"
);

console.log(
    "Excel Export: ACTIVE"
);

console.log(
    "======================================"
);
