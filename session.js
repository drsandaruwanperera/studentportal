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
    window.location.replace("admin-login.html");
}


// ==========================
// Hide Full Admin Features
// ==========================

document.addEventListener("DOMContentLoaded", () => {
    if (adminRole !== "full") {
        document.querySelectorAll(".full-admin-only").forEach(element => {
            element.style.display = "none";
        });
    }
});


// ==========================
// Numeric A/L Add Support
// ==========================

if (
    window.location.pathname.endsWith("/students.html") ||
    window.location.pathname.endsWith("/students")
) {
    import("./numeric-al-student-add.js?v=2")
        .catch(error => {
            console.error("Numeric A/L add support failed to load:", error);
        });
}


// ==========================
// Alphanumeric A/L Import Support
// ==========================

if (
    window.location.pathname.endsWith("/import-students.html") ||
    window.location.pathname.endsWith("/import-students")
) {
    import("./al-import-compat.js?v=1")
        .catch(error => {
            console.error("A/L import compatibility failed to load:", error);
        });
}
