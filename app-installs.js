import {
    db,
    collection,
    getDocs
} from "./firebase.js";

const adminLoggedIn =
    sessionStorage.getItem("adminLoggedIn") === "true";

const adminRole = String(
    sessionStorage.getItem("adminRole") || ""
).trim().toLowerCase().replace(/[\\s_-]+/g, "");

const isSuperAdmin =
    adminRole === "superadmin" || adminRole === "full";

if (!adminLoggedIn) {
    window.location.replace("admin-login.html");
} else if (!isSuperAdmin) {
    window.location.replace("students.html");
} else {
    initializeAppInstallReport();
}

function initializeAppInstallReport() {
    const adminName = document.getElementById("adminUsername");
    if (adminName) {
        adminName.textContent =
            sessionStorage.getItem("adminUsername") || "Admin";
    }

    const searchInput = document.getElementById("appInstallSearch");
    const categoryFilter = document.getElementById("appInstallCategory");
    const platformFilter = document.getElementById("appInstallPlatform");
    const refreshButton = document.getElementById("refreshAppInstalls");
    const exportButton = document.getElementById("exportAppInstalls");
    const tableBody = document.getElementById("appInstallRows");
    const status = document.getElementById("appInstallStatus");

    let records = [];

    const escapeHtml = (value) =>
        String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);

    const toMillis = (value) => {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (value && typeof value.toMillis === "function") {
            return value.toMillis();
        }
        if (value instanceof Date) {
            return value.getTime();
        }
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatDate = (value) => {
        const millis = toMillis(value);
        if (!millis) return "—";
        return new Intl.DateTimeFormat("en-LK", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Colombo"
        }).format(new Date(millis));
    };

    const getCategory = (data, studentId) => {
        const saved = String(data?.lmsAppCategory || data?.studentType || "")
            .trim().toLowerCase().replace(/[\\s_-]+/g, "");

        const grade = String(data?.grade || "").trim().toLowerCase();
        const id = String(studentId || "").trim().toUpperCase();

        if (saved.includes("grade10") || grade === "10" ||
            grade === "grade10" || grade === "grade 10") {
            return "grade10";
        }
        if (saved.includes("grade11") || grade === "11" ||
            grade === "grade11" || grade === "grade 11") {
            return "grade11";
        }
        if (saved === "al" || saved.includes("advanced") ||
            /^A?2[789]\\d{3}$/.test(id) || /^(27|28|29)[CN]/.test(id)) {
            return "al";
        }

        const numericId = Number(id);
        if (/^\\d{5}$/.test(id) && numericId >= 26000 && numericId <= 26999) {
            return "grade11";
        }
        if (/^\\d{5}$/.test(id) && numericId >= 27000 && numericId <= 27999) {
            return "grade10";
        }
        return "other";
    };

    const categoryLabel = (category) => ({
        grade10: "Grade 10",
        grade11: "Grade 11",
        al: "Advanced Level",
        other: "Other"
    })[category] || "Other";

    const platformLabel = (platform) => ({
        android: "Android",
        "apple-mobile": "iPhone / iPad",
        mac: "Mac",
        other: "Other"
    })[platform] || "Other";

    const getFilteredRecords = () => {
        const search = String(searchInput?.value || "").trim().toLowerCase();
        const category = categoryFilter?.value || "all";
        const platform = platformFilter?.value || "all";

        return records.filter((record) => {
            const matchesSearch =
                !search ||
                record.id.toLowerCase().includes(search) ||
                record.name.toLowerCase().includes(search);

            const matchesCategory =
                category === "all" || record.category === category;

            const matchesPlatform =
                platform === "all" ||
                record.firstPlatform === platform ||
                record.lastPlatform === platform;

            return matchesSearch && matchesCategory && matchesPlatform;
        });
    };

    const renderStats = () => {
        const count = records.length;
        const countCategory = (category) =>
            records.filter((record) => record.category === category).length;

        document.getElementById("totalAppStudents").textContent = count;
        document.getElementById("grade10AppStudents").textContent =
            countCategory("grade10");
        document.getElementById("grade11AppStudents").textContent =
            countCategory("grade11");
        document.getElementById("alAppStudents").textContent =
            countCategory("al");
    };

    const renderRows = () => {
        if (!tableBody) return;

        const filtered = getFilteredRecords();

        if (!filtered.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="app-install-empty">
                        No matching app users found.
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = filtered.map((record) => `
                <tr>
                    <td><strong class="student-id-cell">${escapeHtml(record.id)}</strong></td>
                    <td>${escapeHtml(record.name)}</td>
                    <td><span class="app-category-pill">${escapeHtml(categoryLabel(record.category))}</span></td>
                    <td>${escapeHtml(formatDate(record.firstOpenedAt))}</td>
                    <td>${escapeHtml(formatDate(record.lastOpenedAt))}</td>
                    <td>${escapeHtml(platformLabel(record.firstPlatform))}</td>
                </tr>
            `).join("");
        }

        const resultCount = document.getElementById("appInstallResultCount");
        if (resultCount) {
            resultCount.textContent =
                `Showing ${filtered.length} of ${records.length} students`;
        }
    };

    const loadRecords = async () => {
        if (refreshButton) {
            refreshButton.disabled = true;
            refreshButton.textContent = "Loading…";
        }
        if (status) status.textContent = "Loading app usage records…";

        try {
            const snapshot = await getDocs(collection(db, "students"));
            const loaded = [];

            snapshot.forEach((studentDocument) => {
                const data = studentDocument.data() || {};
                const firstOpenedAt = toMillis(data.lmsAppFirstLoginAt);

                if (!firstOpenedAt) return;

                loaded.push({
                    id: studentDocument.id,
                    name: String(
                        data.fullName ||
                        data.name ||
                        data.studentName ||
                        data.displayName ||
                        "Not registered"
                    ),
                    category: getCategory(data, studentDocument.id),
                    firstOpenedAt,
                    lastOpenedAt:
                        toMillis(data.lmsAppLastLoginAt) || firstOpenedAt,
                    firstPlatform: String(
                        data.lmsAppFirstPlatform || "other"
                    ),
                    lastPlatform: String(
                        data.lmsAppLastPlatform ||
                        data.lmsAppFirstPlatform ||
                        "other"
                    )
                });
            });

            records = loaded.sort(
                (a, b) => b.lastOpenedAt - a.lastOpenedAt
            );

            renderStats();
            renderRows();

            if (status) {
                status.textContent =
                    `Updated ${formatDate(Date.now())} · Records are based on successful logins from the installed app.`;
            }
        } catch (error) {
            console.error("Unable to load installed app usage records:", error);
            if (status) {
                status.textContent =
                    "Unable to load app usage records. Check your admin access and database connection.";
            }
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="app-install-empty app-install-error">
                            Unable to load records. Please refresh and try again.
                        </td>
                    </tr>
                `;
            }
        } finally {
            if (refreshButton) {
                refreshButton.disabled = false;
                refreshButton.textContent = "↻ Refresh";
            }
        }
    };

    const csvCell = (value) => {
        let text = String(value ?? "");
        if (/^[=+@\\-]/.test(text)) text = "'" + text;
        return '"' + text.replace(/"/g, '""') + '"';
    };

    const exportCsv = () => {
        const filtered = getFilteredRecords();
        if (!filtered.length) {
            if (status) status.textContent = "There are no rows to export.";
            return;
        }

        const rows = [
            [
                "Student ID",
                "Student Name",
                "Category",
                "First App Login",
                "Last App Login",
                "First Platform",
                "Last Platform"
            ],
            ...filtered.map((record) => [
                record.id,
                record.name,
                categoryLabel(record.category),
                formatDate(record.firstOpenedAt),
                formatDate(record.lastOpenedAt),
                platformLabel(record.firstPlatform),
                platformLabel(record.lastPlatform)
            ])
        ];

        const csv = "\\uFEFF" + rows
            .map((row) => row.map(csvCell).join(","))
            .join("\\r\\n");

        const url = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8;" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "dr-sandaruwan-lms-app-users.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    searchInput?.addEventListener("input", renderRows);
    categoryFilter?.addEventListener("change", renderRows);
    platformFilter?.addEventListener("change", renderRows);
    refreshButton?.addEventListener("click", loadRecords);
    exportButton?.addEventListener("click", exportCsv);

    loadRecords();
}
