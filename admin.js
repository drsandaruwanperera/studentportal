// =====================================================
// ADMIN DASHBOARD
// Student Assessment Portal
// =====================================================


// =====================================================
// FIREBASE
// =====================================================

import * as firebase from "./firebase.js";


const db =
    firebase.db;

const collection =
    firebase.collection;

const getDocs =
    firebase.getDocs;

const onSnapshot =
    firebase.onSnapshot;

const deleteDoc =
    firebase.deleteDoc;

const doc =
    firebase.doc;


// =====================================================
// SUPER ADMIN DELETE PASSWORD
// =====================================================
//
// Student removal password:
// Nimeth
//
// =====================================================

const SUPER_ADMIN_DELETE_PASSWORD =
    "Nimeth";


// =====================================================
// SESSION
// =====================================================

const adminLoggedIn =
    sessionStorage.getItem(
        "adminLoggedIn"
    ) === "true";


const adminUsername =
    sessionStorage.getItem(
        "adminUsername"
    ) || "Admin";


const storedRole =
    (
        sessionStorage.getItem(
            "adminRole"
        ) || "limited"
    )
    .trim()
    .toLowerCase()
    .replace(
        /[\s_-]+/g,
        ""
    );


// =====================================================
// ROLE
// =====================================================
//
// full / superadmin = SUPER ADMIN
// limited / admin   = NORMAL ADMIN
//
// =====================================================

const isSuperAdmin =
    storedRole === "superadmin" ||
    storedRole === "full";


// =====================================================
// ADMIN PROTECTION
// =====================================================

if (!adminLoggedIn) {

    window.location.replace(
        "admin-login.html"
    );

}


// Limited administrators are intentionally routed to the only area they can manage.
if (adminLoggedIn && !isSuperAdmin) {
    window.location.replace("students.html");
}

// =====================================================
// ELEMENTS
// =====================================================


// -----------------------------------------------------
// ADMIN INFORMATION
// -----------------------------------------------------

const adminUsernameElement =
    document.getElementById(
        "adminUsername"
    );


const adminRoleElement =
    document.getElementById(
        "adminRole"
    );


// -----------------------------------------------------
// LOGOUT
// -----------------------------------------------------

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// -----------------------------------------------------
// SUMMARY
// -----------------------------------------------------

const totalStudentsElement =
    document.getElementById(
        "totalStudents"
    );


const totalViewedElement =
    document.getElementById(
        "totalViewed"
    );


const activeStudentsElement =
    document.getElementById(
        "activeStudents"
    );


// -----------------------------------------------------
// MANAGEMENT LINKS
// -----------------------------------------------------

const studentManagementLink =
    document.getElementById(
        "studentManagementLink"
    );


const paperManagementLink =
    document.getElementById(
        "paperManagementLink"
    );


const importStudentsLink =
    document.getElementById(
        "importStudentsLink"
    );


const statisticsLink =
    document.getElementById(
        "statisticsLink"
    );


const websiteManagementLink =
    document.getElementById(
        "websiteManagementLink"
    );


// =====================================================
// STUDENT REMOVAL ELEMENTS
// =====================================================

const studentRemovalSection =
    document.getElementById(
        "studentRemovalSection"
    );


const controlTotalCount =
    document.getElementById(
        "controlTotalCount"
    );


const controlGrade10Count =
    document.getElementById(
        "controlGrade10Count"
    );


const controlGrade11Count =
    document.getElementById(
        "controlGrade11Count"
    );


const controlALCount =
    document.getElementById(
        "controlALCount"
    );


const removeGrade10Btn =
    document.getElementById(
        "removeGrade10Btn"
    );


const removeGrade11Btn =
    document.getElementById(
        "removeGrade11Btn"
    );


const removeALBtn =
    document.getElementById(
        "removeALBtn"
    );


// =====================================================
// DELETE PASSWORD MODAL
// =====================================================

const studentDeleteModal =
    document.getElementById(
        "studentDeleteModal"
    );


const deletePasswordInput =
    document.getElementById(
        "deletePasswordInput"
    );


const deletePasswordError =
    document.getElementById(
        "deletePasswordError"
    );


const deleteModalTitle =
    document.getElementById(
        "deleteModalTitle"
    );


const deleteModalDescription =
    document.getElementById(
        "deleteModalDescription"
    );


const deleteCancelBtn =
    document.getElementById(
        "deleteCancelBtn"
    );


const deleteConfirmBtn =
    document.getElementById(
        "deleteConfirmBtn"
    );


// =====================================================
// DELETE PROGRESS
// =====================================================

const deleteProgressModal =
    document.getElementById(
        "deleteProgressModal"
    );


const deleteProgressFill =
    document.getElementById(
        "deleteProgressFill"
    );


const deleteProgressText =
    document.getElementById(
        "deleteProgressText"
    );


const deleteProgressDescription =
    document.getElementById(
        "deleteProgressDescription"
    );


// =====================================================
// SETTINGS
// =====================================================

const ACTIVE_LIMIT =
    90 * 1000;


// =====================================================
// DATA
// =====================================================

let allStudents = [];

let pendingDeleteType = null;


// =====================================================
// ADMIN INFORMATION
// =====================================================

function loadAdminInfo() {

    if (adminUsernameElement) {

        adminUsernameElement.textContent =
            adminUsername;

    }


    if (adminRoleElement) {

        adminRoleElement.textContent =
            isSuperAdmin
                ? "Super Administrator"
                : "Administrator";

    }

}


loadAdminInfo();


// =====================================================
// ACCESS DENIED
// =====================================================

function showAccessDenied() {

    const container =
        document.getElementById(
            "accessDeniedMessage"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="access-denied-box">

            <div class="access-denied-icon">
                🔒
            </div>

            <div class="access-denied-content">

                <strong>
                    Access Restricted
                </strong>

                <p>
                    This feature is available only
                    to the Super Administrator.
                </p>

            </div>

            <button
                type="button"
                class="access-denied-close"
                aria-label="Close"
            >
                ×
            </button>

        </div>

    `;


    container.classList.add(
        "show"
    );


    const closeButton =
        container.querySelector(
            ".access-denied-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            hideAccessDenied
        );

    }


    clearTimeout(
        window.accessDeniedTimer
    );


    window.accessDeniedTimer =
        setTimeout(
            hideAccessDenied,
            3500
        );

}


// =====================================================
// HIDE ACCESS DENIED
// =====================================================

function hideAccessDenied() {

    const container =
        document.getElementById(
            "accessDeniedMessage"
        );


    if (!container) {
        return;
    }


    container.classList.remove(
        "show"
    );

}


// =====================================================
// ROLE ACCESS
// =====================================================

function setupRoleAccess() {

    const superAdminNavItems =
        document.querySelectorAll(
            ".superadmin-only"
        );


    const superAdminLinks =
        document.querySelectorAll(
            ".superadmin-link"
        );


    const superAdminCards =
        document.querySelectorAll(
            ".superadmin-card"
        );


    // =================================================
    // SUPER ADMIN
    // =================================================

    if (isSuperAdmin) {

        superAdminNavItems.forEach(
            item => {

                item.classList.remove(
                    "locked-menu"
                );


                item.removeAttribute(
                    "aria-disabled"
                );


                item.removeAttribute(
                    "title"
                );

            }
        );


        superAdminLinks.forEach(
            link => {

                link.classList.remove(
                    "access-locked"
                );


                link.removeAttribute(
                    "aria-disabled"
                );


                link.removeAttribute(
                    "title"
                );

            }
        );


        superAdminCards.forEach(
            card => {

                card.classList.remove(
                    "access-locked"
                );

            }
        );


        return;

    }


    // =================================================
    // NORMAL ADMIN
    // =================================================

    superAdminNavItems.forEach(
        item => {

            item.classList.add(
                "locked-menu"
            );


            item.setAttribute(
                "aria-disabled",
                "true"
            );


            item.setAttribute(
                "title",
                "Super Administrator only"
            );


            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    showAccessDenied();

                }
            );

        }
    );


    superAdminLinks.forEach(
        link => {

            link.classList.add(
                "access-locked"
            );


            link.setAttribute(
                "aria-disabled",
                "true"
            );


            link.setAttribute(
                "title",
                "Super Administrator only"
            );


            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    showAccessDenied();

                }
            );

        }
    );


    superAdminCards.forEach(
        card => {

            card.classList.add(
                "access-locked"
            );

        }
    );

}


setupRoleAccess();


// =====================================================
// STUDENT REMOVAL ACCESS
// =====================================================

function setupStudentRemovalAccess() {

    if (!studentRemovalSection) {
        return;
    }


    if (isSuperAdmin) {

        studentRemovalSection.style.display =
            "";

    }

    else {

        studentRemovalSection.style.display =
            "none";

    }

}


setupStudentRemovalAccess();


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Logout from Admin Panel?"
                );


            if (!confirmed) {
                return;
            }


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
// STUDENT TYPE
// =====================================================

function getStudentType(data) {

    const studentType =
        String(
            data?.studentType || ""
        )
        .trim()
        .toLowerCase();


    if (
        studentType === "grade10" ||
        studentType === "grade 10"
    ) {

        return "grade10";

    }


    if (
        studentType === "grade11" ||
        studentType === "grade 11"
    ) {

        return "grade11";

    }


    const grade =
        String(
            data?.grade || ""
        )
        .trim()
        .toLowerCase();


    if (
        grade === "10" ||
        grade === "grade10" ||
        grade === "grade 10"
    ) {

        return "grade10";

    }


    if (
        grade === "11" ||
        grade === "grade11" ||
        grade === "grade 11"
    ) {

        return "grade11";

    }


    return "al";

}


// =====================================================
// ACTIVE STUDENT
// =====================================================

function isStudentActive(data) {

    const lastActive =
        Number(
            data?.lastActiveAt || 0
        );


    if (!lastActive) {
        return false;
    }


    const difference =
        Date.now() -
        lastActive;


    return (
        difference >= 0 &&
        difference <= ACTIVE_LIMIT
    );

}


// =====================================================
// PAPER VIEW COUNT
// =====================================================

function getViewedCount(data) {

    let count = 0;


    for (
        let i = 1;
        i <= 13;
        i++
    ) {

        const field =
            "paper" +
            String(i)
                .padStart(
                    2,
                    "0"
                ) +
            "Viewed";


        if (
            data?.[field] === true
        ) {

            count++;

        }

    }


    return count;

}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        String(value);

}


// =====================================================
// UPDATE STUDENT REMOVAL COUNTS
// =====================================================

function updateRemovalCounts() {

    let grade10Count = 0;

    let grade11Count = 0;

    let alCount = 0;


    allStudents.forEach(
        student => {

            const type =
                getStudentType(
                    student.data
                );


            if (
                type === "grade10"
            ) {

                grade10Count++;

            }

            else if (
                type === "grade11"
            ) {

                grade11Count++;

            }

            else {

                alCount++;

            }

        }
    );


    setText(
        controlTotalCount,
        allStudents.length
    );


    setText(
        controlGrade10Count,
        grade10Count
    );


    setText(
        controlGrade11Count,
        grade11Count
    );


    setText(
        controlALCount,
        alCount
    );

}


// =====================================================
// UPDATE DASHBOARD
// =====================================================

function updateDashboard() {

    const total =
        allStudents.length;


    let totalViewed = 0;

    let totalOnline = 0;


    const categories = {

        grade10: {
            total: 0,
            online: 0,
            views: 0
        },

        grade11: {
            total: 0,
            online: 0,
            views: 0
        },

        al: {
            total: 0,
            online: 0,
            views: 0
        }

    };


    allStudents.forEach(
        student => {

            const data =
                student.data;


            const type =
                getStudentType(
                    data
                );


            const active =
                isStudentActive(
                    data
                );


            const viewed =
                getViewedCount(
                    data
                );


            totalViewed +=
                viewed;


            if (active) {

                totalOnline++;

            }


            if (
                categories[type]
            ) {

                categories[type].total++;

                categories[type].views +=
                    viewed;


                if (active) {

                    categories[type].online++;

                }

            }

        }
    );


    // =================================================
    // SUMMARY
    // =================================================

    setText(
        totalStudentsElement,
        total
    );


    setText(
        totalViewedElement,
        totalViewed
    );


    setText(
        activeStudentsElement,
        totalOnline
    );


    // =================================================
    // ALL STUDENTS
    // =================================================

    setText(
        document.getElementById(
            "reportAllTotal"
        ),
        total
    );


    setText(
        document.getElementById(
            "reportAllOnline"
        ),
        totalOnline
    );


    setText(
        document.getElementById(
            "reportAllOffline"
        ),
        total -
        totalOnline
    );


    setText(
        document.getElementById(
            "reportAllViews"
        ),
        totalViewed
    );


    // =================================================
    // GRADE 10
    // =================================================

    setText(
        document.getElementById(
            "reportGrade10Total"
        ),
        categories.grade10.total
    );


    setText(
        document.getElementById(
            "reportGrade10Online"
        ),
        categories.grade10.online
    );


    setText(
        document.getElementById(
            "reportGrade10Offline"
        ),
        categories.grade10.total -
        categories.grade10.online
    );


    setText(
        document.getElementById(
            "reportGrade10Views"
        ),
        categories.grade10.views
    );


    // =================================================
    // GRADE 11
    // =================================================

    setText(
        document.getElementById(
            "reportGrade11Total"
        ),
        categories.grade11.total
    );


    setText(
        document.getElementById(
            "reportGrade11Online"
        ),
        categories.grade11.online
    );


    setText(
        document.getElementById(
            "reportGrade11Offline"
        ),
        categories.grade11.total -
        categories.grade11.online
    );


    setText(
        document.getElementById(
            "reportGrade11Views"
        ),
        categories.grade11.views
    );


    // =================================================
    // A/L
    // =================================================

    setText(
        document.getElementById(
            "reportALTotal"
        ),
        categories.al.total
    );


    setText(
        document.getElementById(
            "reportALOnline"
        ),
        categories.al.online
    );


    setText(
        document.getElementById(
            "reportALOffline"
        ),
        categories.al.total -
        categories.al.online
    );


    setText(
        document.getElementById(
            "reportALViews"
        ),
        categories.al.views
    );


    // =================================================
    // REMOVAL COUNTS
    // =================================================

    updateRemovalCounts();

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


        const students = [];


        snapshot.forEach(
            studentDoc => {

                students.push({

                    id:
                        studentDoc.id,

                    data:
                        studentDoc.data()

                });

            }
        );


        allStudents =
            students;


        updateDashboard();


        console.log(
            "✅ Students loaded:",
            allStudents.length
        );

    }
    catch (error) {

        console.error(
            "❌ Dashboard student load error:",
            error
        );


        setText(
            totalStudentsElement,
            "—"
        );


        setText(
            totalViewedElement,
            "—"
        );


        setText(
            activeStudentsElement,
            "—"
        );

    }

}


// =====================================================
// REAL-TIME FIREBASE LISTENER
// =====================================================

function startRealtimeUpdates() {

    if (
        typeof onSnapshot !==
        "function"
    ) {

        console.warn(
            "onSnapshot is not available."
        );


        return;

    }


    try {

        const studentsRef =
            collection(
                db,
                "students"
            );


        onSnapshot(

            studentsRef,

            snapshot => {

                const students = [];


                snapshot.forEach(
                    studentDoc => {

                        students.push({

                            id:
                                studentDoc.id,

                            data:
                                studentDoc.data()

                        });

                    }
                );


                allStudents =
                    students;


                updateDashboard();


                console.log(
                    "🔄 Dashboard updated:",
                    students.length
                );

            },

            error => {

                console.error(
                    "❌ Realtime dashboard error:",
                    error
                );


                loadStudents();

            }

        );

    }
    catch (error) {

        console.error(
            "❌ Realtime listener setup error:",
            error
        );


        loadStudents();

    }

}


// =====================================================
// GET STUDENTS BY TYPE
// =====================================================

function getStudentsByType(
    type
) {

    return allStudents.filter(
        student => {

            return (
                getStudentType(
                    student.data
                ) === type
            );

        }
    );

}


// =====================================================
// OPEN DELETE MODAL
// =====================================================

function openDeleteModal(
    type
) {

    if (!isSuperAdmin) {

        showAccessDenied();

        return;

    }


    const students =
        getStudentsByType(
            type
        );


    if (
        students.length === 0
    ) {

        alert(
            "There are no students in this category."
        );

        return;

    }


    pendingDeleteType =
        type;


    let title =
        "Confirm Student Removal";


    let description =
        "Enter the Super Administrator password to continue.";


    if (
        type === "grade10"
    ) {

        title =
            "Remove All Grade 10 Students";


        description =
            "You are about to permanently remove " +
            students.length +
            " Grade 10 student records.";

    }


    if (
        type === "grade11"
    ) {

        title =
            "Remove All Grade 11 Students";


        description =
            "You are about to permanently remove " +
            students.length +
            " Grade 11 student records.";

    }


    if (
        type === "al"
    ) {

        title =
            "Remove All A/L Students";


        description =
            "You are about to permanently remove " +
            students.length +
            " A/L student records.";

    }


    if (deleteModalTitle) {

        deleteModalTitle.textContent =
            title;

    }


    if (deleteModalDescription) {

        deleteModalDescription.textContent =
            description;

    }


    if (deletePasswordInput) {

        deletePasswordInput.value =
            "";

    }


    if (deletePasswordError) {

        deletePasswordError.textContent =
            "";

    }


    if (studentDeleteModal) {

        studentDeleteModal.style.display =
            "flex";

    }


    setTimeout(
        () => {

            if (deletePasswordInput) {

                deletePasswordInput.focus();

            }

        },
        100
    );

}


// =====================================================
// CLOSE DELETE MODAL
// =====================================================

function closeDeleteModal() {

    pendingDeleteType =
        null;


    if (studentDeleteModal) {

        studentDeleteModal.style.display =
            "none";

    }


    if (deletePasswordInput) {

        deletePasswordInput.value =
            "";

    }


    if (deletePasswordError) {

        deletePasswordError.textContent =
            "";

    }

}


// =====================================================
// VERIFY PASSWORD
// =====================================================

function verifyDeletePassword() {

    if (!isSuperAdmin) {

        showAccessDenied();

        return false;

    }


    const enteredPassword =
        String(
            deletePasswordInput?.value || ""
        );


    if (
        enteredPassword === ""
    ) {

        if (deletePasswordError) {

            deletePasswordError.textContent =
                "Please enter the Super Administrator password.";

        }

        return false;

    }


    if (
        enteredPassword !==
        SUPER_ADMIN_DELETE_PASSWORD
    ) {

        if (deletePasswordError) {

            deletePasswordError.textContent =
                "Incorrect Super Administrator password.";

        }


        if (deletePasswordInput) {

            deletePasswordInput.select();

        }


        return false;

    }


    return true;

}


// =====================================================
// DELETE STUDENTS
// =====================================================

async function deleteStudentsByType(
    type
) {

    if (!isSuperAdmin) {

        showAccessDenied();

        return;

    }


    const students =
        getStudentsByType(
            type
        );


    if (
        students.length === 0
    ) {

        alert(
            "There are no students in this category."
        );

        return;

    }


    let categoryName =
        "students";


    if (
        type === "grade10"
    ) {

        categoryName =
            "Grade 10 students";

    }


    if (
        type === "grade11"
    ) {

        categoryName =
            "Grade 11 students";

    }


    if (
        type === "al"
    ) {

        categoryName =
            "A/L students";

    }


    // =================================================
    // FINAL CONFIRMATION
    // =================================================

    const confirmed =
        confirm(

            "⚠️ FINAL WARNING\n\n" +

            "You are about to permanently delete " +

            students.length +

            " " +

            categoryName +

            ".\n\n" +

            "This action CANNOT be undone.\n\n" +

            "Click OK to permanently remove them."

        );


    if (!confirmed) {

        return;

    }


    closeDeleteModal();


    showDeleteProgress(
        categoryName,
        students.length
    );


    try {

        let completed =
            0;


        // =================================================
        // DELETE EACH STUDENT
        // =================================================

        for (
            const student of students
        ) {

            await deleteDoc(

                doc(
                    db,
                    "students",
                    student.id
                )

            );


            completed++;


            updateDeleteProgress(
                completed,
                students.length
            );

        }


        // =================================================
        // UPDATE LOCAL DATA
        // =================================================

        allStudents =
            allStudents.filter(
                student => {

                    return (
                        getStudentType(
                            student.data
                        ) !==
                        type
                    );

                }
            );


        updateDashboard();


        finishDeleteProgress();


        setTimeout(
            () => {

                alert(

                    "✅ Successfully removed " +

                    students.length +

                    " " +

                    categoryName +

                    "."

                );

            },
            800
        );

    }
    catch (error) {

        console.error(
            "❌ Student deletion error:",
            error
        );


        hideDeleteProgress();


        alert(

            "❌ Student removal failed.\n\n" +

            error.message

        );

    }

}


// =====================================================
// SHOW DELETE PROGRESS
// =====================================================

function showDeleteProgress(
    categoryName,
    total
) {

    if (!deleteProgressModal) {
        return;
    }


    if (deleteProgressDescription) {

        deleteProgressDescription.textContent =
            "Removing " +
            categoryName +
            " from the system.";

    }


    if (deleteProgressFill) {

        deleteProgressFill.style.width =
            "0%";

    }


    if (deleteProgressText) {

        deleteProgressText.textContent =
            "Preparing to remove " +
            total +
            " records...";

    }


    deleteProgressModal.style.display =
        "flex";

}


// =====================================================
// UPDATE DELETE PROGRESS
// =====================================================

function updateDeleteProgress(
    completed,
    total
) {

    const percentage =
        total > 0
            ? Math.round(
                (
                    completed /
                    total
                ) * 100
            )
            : 100;


    if (deleteProgressFill) {

        deleteProgressFill.style.width =
            percentage + "%";

    }


    if (deleteProgressText) {

        deleteProgressText.textContent =
            "Removed " +
            completed +
            " of " +
            total +
            " records (" +
            percentage +
            "%)";

    }

}


// =====================================================
// FINISH DELETE PROGRESS
// =====================================================

function finishDeleteProgress() {

    if (deleteProgressFill) {

        deleteProgressFill.style.width =
            "100%";

    }


    if (deleteProgressText) {

        deleteProgressText.textContent =
            "Removal completed successfully.";

    }


    setTimeout(
        hideDeleteProgress,
        700
    );

}


// =====================================================
// HIDE DELETE PROGRESS
// =====================================================

function hideDeleteProgress() {

    if (deleteProgressModal) {

        deleteProgressModal.style.display =
            "none";

    }

}


// =====================================================
// DELETE BUTTONS
// =====================================================

if (removeGrade10Btn) {

    removeGrade10Btn.addEventListener(
        "click",
        () => {

            openDeleteModal(
                "grade10"
            );

        }
    );

}


if (removeGrade11Btn) {

    removeGrade11Btn.addEventListener(
        "click",
        () => {

            openDeleteModal(
                "grade11"
            );

        }
    );

}


if (removeALBtn) {

    removeALBtn.addEventListener(
        "click",
        () => {

            openDeleteModal(
                "al"
            );

        }
    );

}


// =====================================================
// CANCEL DELETE
// =====================================================

if (deleteCancelBtn) {

    deleteCancelBtn.addEventListener(
        "click",
        closeDeleteModal
    );

}


// =====================================================
// CONFIRM DELETE
// =====================================================

if (deleteConfirmBtn) {

    deleteConfirmBtn.addEventListener(
        "click",
        async () => {

            if (
                !verifyDeletePassword()
            ) {

                return;

            }


            if (
                !pendingDeleteType
            ) {

                return;

            }


            const type =
                pendingDeleteType;


            deleteConfirmBtn.disabled =
                true;


            deleteConfirmBtn.textContent =
                "Deleting...";


            try {

                await deleteStudentsByType(
                    type
                );

            }
            finally {

                deleteConfirmBtn.disabled =
                    false;


                deleteConfirmBtn.textContent =
                    "🗑️ Confirm Removal";

            }

        }
    );

}


// =====================================================
// PASSWORD ENTER KEY
// =====================================================

if (deletePasswordInput) {

    deletePasswordInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();


                if (deleteConfirmBtn) {

                    deleteConfirmBtn.click();

                }

            }


            if (
                event.key ===
                "Escape"
            ) {

                closeDeleteModal();

            }

        }
    );

}


// =====================================================
// CLICK OUTSIDE MODAL
// =====================================================

if (studentDeleteModal) {

    studentDeleteModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                studentDeleteModal
            ) {

                closeDeleteModal();

            }

        }
    );

}


// =====================================================
// REFRESH ACTIVE STATUS
// =====================================================

function refreshActiveStatus() {

    if (
        !allStudents.length
    ) {

        return;

    }


    updateDashboard();

}


setInterval(
    refreshActiveStatus,
    15000
);


// =====================================================
// PAGE VISIBILITY
// =====================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            refreshActiveStatus();

        }

    }
);


// =====================================================
// DIRECT PAGE PROTECTION
// =====================================================

function protectCurrentPage() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    const restrictedPages = [

        "paper-management.html",

        "paper-settings.html",

        "import-students.html",

        "reports.html",

        "statistics.html",

        "website-dashboard.html",
        "gallery.html",
        "programs.html",
        "about.html",
        "results.html",
        "testimonials.html",
        "resources.html",
        "classes.html",
        "faq.html",
        "contact.html",
        "settings.html"

    ];


    if (
        restrictedPages.includes(
            currentPage
        )
    ) {

        if (!isSuperAdmin) {

            window.location.replace(
                "admin.html"
            );

        }

    }

}


protectCurrentPage();


// =====================================================
// INITIAL LOAD
// =====================================================

loadStudents();


// =====================================================
// REAL-TIME
// =====================================================

startRealtimeUpdates();


// =====================================================
// CONSOLE
// =====================================================

console.log(
    "======================================"
);

console.log(
    "✅ ADMIN DASHBOARD LOADED"
);

console.log(
    "Admin:",
    adminUsername
);

console.log(
    "Role:",
    storedRole
);

console.log(
    "Super Admin:",
    isSuperAdmin
);

console.log(
    "Student Removal:",
    isSuperAdmin
        ? "ENABLED"
        : "HIDDEN"
);

console.log(
    "Delete Password:",
    "CONFIGURED"
);

console.log(
    "======================================"
);