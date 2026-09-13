// ==========================
// Admin Session Protection
// ==========================

const adminLoggedIn =
    sessionStorage.getItem("adminLoggedIn") === "true";

const adminRole =
    sessionStorage.getItem("adminRole") || "limited";


// ==========================
// Check Login
// ==========================

if (!adminLoggedIn) {

    window.location.replace(
        "admin-login.html"
    );

}


// ==========================
// Hide Full Admin Features
// ==========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (adminRole !== "full") {

            document
                .querySelectorAll(
                    ".full-admin-only"
                )
                .forEach(element => {

                    element.style.display =
                        "none";

                });

        }

    }
);


// ==========================
// Numeric A/L Add Support
// ==========================
// students.html already loads this session file before students.js.
// Load the small A/L override only on the student-management page so
// numeric A/L IDs can be added without changing other admin pages.

if (
    window.location.pathname.endsWith("/students.html") ||
    window.location.pathname.endsWith("/students")
) {

    import("./numeric-al-student-add.js?v=1")
        .catch(error => {
            console.error(
                "Numeric A/L add support failed to load:",
                error
            );
        });

}


// ==========================
// Alphanumeric A/L Import Support
// ==========================
// The bulk importer originally accepted only A27000/A28000/A29000
// admission numbers plus a fixed set of numeric A/L IDs. Some valid
// A/L admission IDs use formats such as 27C13017 and 27N71072.

if (
    window.location.pathname.endsWith("/import-students.html") ||
    window.location.pathname.endsWith("/import-students")
) {

    import("./al-import-compat.js?v=1")
        .catch(error => {
            console.error(
                "A/L import compatibility failed to load:",
                error
            );
        });

}
