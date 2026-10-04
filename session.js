// ==========================
// Admin Session Protection
// ==========================

const adminLoggedIn =
    sessionStorage.getItem("adminLoggedIn") === "true";

const adminRole =
    String(sessionStorage.getItem("adminRole") || "limited")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

const isSuperAdmin =
    adminRole === "superadmin" || adminRole === "full";


// ==========================
// Check Login
// ==========================

if (!adminLoggedIn) {
    window.location.replace("admin-login.html");
}


// ==========================
// SUPER ADMIN PAGE PROTECTION
// ==========================
// Limited admins are intentionally restricted to Student Management.
// This protects direct URL access as well as sidebar visibility.

const superAdminPages = [
    "admin.html",
    "admin-program-control.html",
    "admin-results.html",
    "admin-announcements.html",
    "paper-management.html",
    "paper-settings.html",
    "import-students.html",
    "onboarding-report.html",
    "student-deletion.html",
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

const currentAdminPage =
    window.location.pathname.split("/").pop().toLowerCase();

if (
    adminLoggedIn &&
    !isSuperAdmin &&
    superAdminPages.includes(currentAdminPage)
) {
    window.location.replace("students.html");
}

// ==========================
// Hide Full Admin Features
// ==========================

document.addEventListener("DOMContentLoaded", () => {
    if (!isSuperAdmin) {
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
