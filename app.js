// =====================================================
// STUDENT LOGIN SYSTEM
// =====================================================

import {
    db,
    doc,
    getDoc,
    updateDoc
} from "./firebase.js";


// =====================================================
// ELEMENTS
// =====================================================

const studentIdInput =
    document.getElementById("studentId");

const passwordInput =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const msg =
    document.getElementById("msg");


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(message, type = "error") {

    if (!msg) {
        return;
    }

    msg.textContent = message;

    msg.style.color =
        type === "success"
            ? "#16a34a"
            : "#dc2626";
}


// =====================================================
// NORMALIZE STUDENT ID
// =====================================================

function normalizeStudentId(studentId) {

    return String(studentId || "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}


// =====================================================
// A/L STUDENT CHECK
// =====================================================
//
// A27000 - A27999
// A28000 - A28999
// A29000 - A29999
//
// =====================================================

function isALStudentId(studentId) {

    const cleanId =
        normalizeStudentId(studentId);

    return /^A2[789]\d{3}$/.test(
        cleanId
    );
}


// =====================================================
// DETECT STUDENT TYPE
// =====================================================


// =====================================================
// Explicit numeric cohort for students following the A/L 2028 programme.
const AL_2028_NUMERIC_STUDENT_IDS = new Set(
    "11074 11094 12705 13959 14069 14319 14334 14368 14369 14421 14723 14800 15189 15483 15508 15585 15690 15854 15960 16365 16889 16890 16891 16892 16895 16896 16898 16899 16900 16902 16903 16906 16907 16908 16909 16910 16913 16914 16915 16920 16923 16924 16941 16947 16966 16967 16975 16978 16979 16980 16986 16987 16988 16991 16995 17038 17039 17052 17054 17064 17071 17080 17093 17125 17172 17187 17188 17190 17191 17197 17205 17206 17207 17208 17209 17210 17212 17213 17218 17220 17225 17226 17240 17241 17242 17243 17244 17246 17247 17249 17254 17256 17269 17279 17280 17287 17288 17296 17306 17307 17317 17326 17327 17364 17366 17368 17386 17387 17427 17450".split(/\s+/)
);

// =====================================================
// Existing numeric A/L IDs from the earlier cohort.
// =====================================================
const AL_NUMERIC_STUDENT_IDS = new Set([
    "5118",
    "9928",
    "10008",
    "10077",
    "10093",
    "12596",
    "12651",
    "12704",
    "12705",
    "12721",
    "12758",
    "13272",
    "13821",
    "14042",
    "14043",
    "14230",
    "15130",
    "15290",
    "15324",
    "15831",
    "15995",
    "16008",
    "16010",
    "16012",
    "16013",
    "16014",
    "16016",
    "16021",
    "16022",
    "16025",
    "16030",
    "16031",
    "16044",
    "16045",
    "16046",
    "16048",
    "16049",
    "16050",
    "16052",
    "16054",
    "16059",
    "16067",
    "16068",
    "16074",
    "16081",
    "16084",
    "16106",
    "16118",
    "16124",
    "16147",
    "16157",
    "16251",
    "16294",
    "16299",
    "16335",
    "16341",
    "16343",
    "16354",
    "16356",
    "16365",
    "16370",
    "16373",
    "16375",
    "16389",
    "16390",
    "16398",
    "16399",
    "16400",
    "16418",
    "16464",
    "16501",
    "16505",
    "16529",
    "16584",
    "16585",
    "16586",
    "16737",
    "16867",
    "16954",
    "17065",
    "17415",
    "17416",
]);

function detectStudentType(
    studentId,
    data = {}
) {

    const cleanId =
        normalizeStudentId(studentId);


    // =================================================
    // A/L 2028 numeric cohort takes precedence over older numeric cohorts.
    if (AL_2028_NUMERIC_STUDENT_IDS.has(cleanId)) {
        return "al";
    }

    // =================================================
    // NUMERIC A/L STUDENT OVERRIDE
    // =================================================

    if (AL_NUMERIC_STUDENT_IDS.has(cleanId)) {

        return "al";

    }


    // =================================================
    // FIREBASE STUDENT TYPE
    // =================================================

    const firebaseType =
        String(
            data?.studentType || ""
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


    // =================================================
    // FIREBASE GRADE
    // =================================================

    const firebaseGrade =
        String(
            data?.grade || ""
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


    // =================================================
    // A/L ADMISSION NUMBER
    // =================================================

    if (
        isALStudentId(cleanId)
    ) {

        return "al";

    }


    // =================================================
    // NUMERIC STUDENT IDs
    // =================================================

    if (
        /^\d{5}$/.test(cleanId)
    ) {

        const number =
            Number(cleanId);


        // =============================================
        // GRADE 11
        // 26000 - 26999
        // =============================================

        if (
            number >= 26000 &&
            number <= 26999
        ) {

            return "grade11";

        }


        // =============================================
        // GRADE 10
        // 27000 - 27999
        // =============================================

        if (
            number >= 27000 &&
            number <= 27999
        ) {

            return "grade10";

        }

    }


    return "unknown";
}


// =====================================================
// GET GRADE NAME
// =====================================================

function getGradeName(type) {

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

        return "Advanced Level";

    }


    return "Student";
}


// =====================================================
// SAVE SESSION
// =====================================================

function saveStudentSession(
    studentId,
    studentType,
    gradeName,
    data
) {

    sessionStorage.setItem(
        "loggedIn",
        "true"
    );


    sessionStorage.setItem(
        "studentId",
        studentId
    );


    sessionStorage.setItem(
        "studentType",
        studentType
    );


    sessionStorage.setItem(
        "studentGrade",
        gradeName
    );

    // Keep the programme year with the login session so every LMS page uses
    // the correct A/L cohort, including numeric admission IDs.
    const normalizedSessionId = normalizeStudentId(studentId);
    const explicitAlYear = Number(data?.alYear);
    const idAlYearMatch = String(studentId || "").trim().toUpperCase().match(/^(?:A)?(27|28|29)\d{3}$/)
        || String(studentId || "").trim().toUpperCase().match(/^(27|28|29)[CN]/);
    let sessionAlYear = "";
    if (AL_2028_NUMERIC_STUDENT_IDS.has(normalizedSessionId)) {
        sessionAlYear = "2028";
    } else if (studentType === "al") {
        if ([2027, 2028, 2029].includes(explicitAlYear)) {
            sessionAlYear = String(explicitAlYear);
        } else if (idAlYearMatch) {
            sessionAlYear = "20" + idAlYearMatch[1];
        }
    }
    if (sessionAlYear) {
        sessionStorage.setItem("alYear", sessionAlYear);
    } else {
        sessionStorage.removeItem("alYear");
    }

    const studentName =
        data?.fullName ||
        data?.name ||
        data?.studentName ||
        data?.displayName ||
        "Student";


    sessionStorage.setItem(
        "studentName",
        studentName
    );


    if (
        data?.nicNumber
    ) {

        sessionStorage.setItem(
            "studentNIC",
            String(data.nicNumber)
        );

    }

}


// =====================================================
// CLEAR PASSWORD CHANGE SESSION
// =====================================================

function clearPasswordChangeSession() {

    sessionStorage.removeItem(
        "mustChangePassword"
    );

    sessionStorage.removeItem(
        "passwordChangeRequired"
    );

}


// =====================================================
// LOGIN
// =====================================================

async function loginStudent() {

    const studentId =
        normalizeStudentId(
            studentIdInput?.value
        );


    const password =
        String(
            passwordInput?.value || ""
        ).trim();


    // =================================================
    // VALIDATION
    // =================================================

    if (!studentId) {

        showMessage(
            "Please enter your Student ID."
        );

        studentIdInput?.focus();

        return;
    }


    if (!password) {

        showMessage(
            "Please enter your password."
        );

        passwordInput?.focus();

        return;
    }


    // =================================================
    // BUTTON LOADING
    // =================================================

    if (loginBtn) {

        loginBtn.disabled = true;

        loginBtn.innerHTML = `
            <span>Signing In...</span>
        `;

    }


    showMessage("");


    try {

        // =============================================
        // FIRESTORE STUDENT DOCUMENT
        // =============================================

        const studentRef =
            doc(
                db,
                "students",
                studentId
            );


        const studentSnap =
            await getDoc(
                studentRef
            );


        // =============================================
        // STUDENT NOT FOUND
        // =============================================

        if (
            !studentSnap.exists()
        ) {

            showMessage(
                "Invalid Student ID or password."
            );

            return;

        }


        const data =
            studentSnap.data();


        // =============================================
        // PASSWORD CHECK
        // =============================================

        const storedPassword =
            String(
                data?.password ?? ""
            );


        if (
            storedPassword !== password
        ) {

            showMessage(
                "Invalid Student ID or password."
            );

            return;

        }


        // =============================================
        // DETECT CATEGORY
        // =============================================

        const studentType =
            detectStudentType(
                studentId,
                data
            );


        const gradeName =
            getGradeName(
                studentType
            );


        // =============================================
        // UNKNOWN CATEGORY
        // =============================================

        if (
            studentType === "unknown"
        ) {

            showMessage(
                "Unable to determine your student category. Please contact the System Administrator."
            );

            return;

        }


        // =============================================
        // SAVE SESSION
        // =============================================

        saveStudentSession(
            studentId,
            studentType,
            gradeName,
            data
        );


        // =============================================
        // UPDATE LAST ACTIVE
        // =============================================

        try {

            await updateDoc(
                studentRef,
                {
                    lastActiveAt:
                        Date.now()
                }
            );

        }
        catch (activeError) {

            console.warn(
                "Last active update failed:",
                activeError
            );

        }


        // =================================================
        // CONSOLE DEBUG
        // =================================================

        console.log(
            "================================"
        );

        console.log(
            "LOGIN SUCCESS"
        );

        console.log(
            "Student ID:",
            studentId
        );

        console.log(
            "Student Type:",
            studentType
        );

        console.log(
            "Grade:",
            gradeName
        );

        console.log(
            "Must Change Password:",
            data?.mustChangePassword
        );

        console.log(
            "Profile Completed:",
            data?.profileCompleted
        );

        console.log(
            "Registration Completed:",
            data?.registrationCompleted
        );

        console.log(
            "================================"
        );


        // =================================================
        // A/L STUDENT
        // =================================================

        if (
            studentType === "al"
        ) {

            /*
                A/L students use the A/L registration page
                when first registration is incomplete.
            */

            const needsALRegistration =
                data?.mustChangePassword === true ||
                data?.registrationCompleted !== true ||
                data?.profileCompleted !== true;


            if (
                needsALRegistration
            ) {

                clearPasswordChangeSession();


                showMessage(
                    "A/L registration required. Redirecting...",
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.replace(
                            "student-registration.html"
                        );

                    },
                    500
                );


                return;

            }


            // =========================================
            // A/L COMPLETED
            // =========================================

            clearPasswordChangeSession();


            showMessage(
                "Login successful. Redirecting...",
                "success"
            );


            setTimeout(
                () => {

                    window.location.replace(
                        "dashboard.html"
                    );

                },
                500
            );


            return;

        }


        // =================================================
        // GRADE 10 / GRADE 11
        // MUST CHANGE PASSWORD
        // =================================================

        if (
            (
                studentType === "grade10" ||
                studentType === "grade11"
            ) &&
            data?.mustChangePassword === true
        ) {

            sessionStorage.setItem(
                "mustChangePassword",
                "true"
            );


            sessionStorage.setItem(
                "passwordChangeRequired",
                "true"
            );


            showMessage(
                `${gradeName} first login. Password change required.`,
                "success"
            );


            setTimeout(
                () => {

                    window.location.replace(
                        "change-password.html?id=" +
                        encodeURIComponent(
                            studentId
                        )
                    );

                },
                500
            );


            return;

        }


        // =================================================
        // GRADE 10 / GRADE 11 NORMAL LOGIN
        // =================================================

        if (
            studentType === "grade10" ||
            studentType === "grade11"
        ) {

            clearPasswordChangeSession();


            showMessage(
                "Login successful. Redirecting...",
                "success"
            );


            setTimeout(
                () => {

                    window.location.replace(
                        "dashboard.html"
                    );

                },
                500
            );


            return;

        }


        // =================================================
        // FALLBACK
        // =================================================

        clearPasswordChangeSession();


        showMessage(
            "Login successful. Redirecting...",
            "success"
        );


        setTimeout(
            () => {

                window.location.replace(
                    "dashboard.html"
                );

            },
            500
        );

    }
    catch (error) {

        console.error(
            "Student login error:",
            error
        );


        showMessage(
            "Unable to sign in. Please try again."
        );

    }
    finally {

        if (loginBtn) {

            loginBtn.disabled =
                false;


            loginBtn.innerHTML = `
                <span>
                    Sign In
                </span>

                <span class="login-arrow">
                    →
                </span>
            `;

        }

    }

}


// =====================================================
// SIGN IN BUTTON
// =====================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        loginStudent
    );

}


// =====================================================
// ENTER KEY LOGIN
// =====================================================

if (studentIdInput) {

    studentIdInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                loginStudent();

            }

        }
    );

}


if (passwordInput) {

    passwordInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                loginStudent();

            }

        }
    );

}


// =====================================================
// CLEAR MESSAGE
// =====================================================

if (studentIdInput) {

    studentIdInput.addEventListener(
        "input",
        () => {

            if (msg) {
                msg.textContent = "";
            }

        }
    );

}


if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        () => {

            if (msg) {
                msg.textContent = "";
            }

        }
    );

}


// =====================================================
// STARTUP LOG
// =====================================================

console.log(
    "========================================"
);

console.log(
    "Student Assessment Portal Login"
);

console.log(
    "Grade 11: 26000 - 26999"
);

console.log(
    "Grade 10: 27000 - 27999"
);

console.log(
    "A/L: A27000 - A29999"
);

console.log(
    "A/L Registration: ENABLED"
);

console.log(
    "Grade 10/11 Password Change: ENABLED"
);

console.log(
    "========================================"
);