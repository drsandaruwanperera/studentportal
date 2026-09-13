// =====================================================
// IMPORT STUDENTS
// Grade 10 / Grade 11 / A/L
// =====================================================

import {
    db,
    doc,
    getDoc,
    getDocs,
    collection,
    setDoc
} from "./firebase.js";

const fileInput = document.getElementById("excelFile");
const importBtn = document.getElementById("importBtn");
const result = document.getElementById("result");
const selectedType = document.getElementById("selectedType");
const categoryButtons = document.querySelectorAll(".category-btn");
const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
const fileName = document.getElementById("fileName");
const previewSection = document.getElementById("previewSection");
const previewBody = document.getElementById("previewBody");
const previewCount = document.getElementById("previewCount");
const importStatus = document.getElementById("importStatus");
const importStatusTitle = document.getElementById("importStatusTitle");
const importStatusText = document.getElementById("importStatusText");

let selectedRows = [];

// These are the existing numeric A/L student IDs. They must remain numeric
// when saved to Firestore so the students can log in with the same ID.
const AL_NUMERIC_STUDENT_IDS = new Set([
    "5118", "9928", "10008", "10077", "10093", "12596", "12651",
    "12704", "12705", "12721", "12758", "13272", "13821", "14042",
    "14043", "14230", "15130", "15290", "15324", "15831", "15995",
    "16008", "16010", "16012", "16013", "16014", "16016", "16021",
    "16022", "16025", "16030", "16031", "16044", "16045", "16046",
    "16048", "16049", "16050", "16052", "16054", "16059", "16067",
    "16068", "16074", "16081", "16084", "16106", "16118", "16124",
    "16147", "16157", "16251", "16294", "16299", "16335", "16341",
    "16343", "16354", "16356", "16365", "16370", "16373", "16375",
    "16389", "16390", "16398", "16399", "16400", "16418", "16464",
    "16501", "16505", "16529", "16584", "16585", "16586", "16737",
    "16867", "16938", "16954", "17065", "17284", "17415", "17416"
]);

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedType.value = button.dataset.type;
        categoryButtons.forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
    });
});

if (fileInput) {
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        fileName.textContent = file ? "📄 " + file.name : "No file selected";
    });
}

if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener("click", downloadTemplate);
}

function downloadTemplate() {
    const type = selectedType?.value || "";
    const sampleData = type === "al"
        ? [
            { "Admission Number": "A27001", "Temporary Password": "Temp1234" },
            { "Admission Number": "A28001", "Temporary Password": "Temp5678" },
            { "Admission Number": "A29001", "Temporary Password": "Temp9012" }
        ]
        : [
            { "Student ID": "27001", "Password": "1234" },
            { "Student ID": "27002", "Password": "5678" }
        ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(
        workbook,
        type === "al" ? "AL-Student-Import-Template.xlsx" : "Student-Import-Template.xlsx"
    );
}

if (importBtn) {
    importBtn.addEventListener("click", importStudents);
}

function normalizeStudentId(studentId) {
    return String(studentId ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

function detectStudentType(studentId) {
    const value = normalizeStudentId(studentId);

    if (AL_NUMERIC_STUDENT_IDS.has(value)) {
        return { studentType: "al", grade: null };
    }

    if (/^A2[7-9]\d{3}$/.test(value)) {
        return { studentType: "al", grade: null };
    }

    if (/^\d+$/.test(value)) {
        const number = Number(value);
        if (Number.isInteger(number) && number >= 26000 && number <= 26999) {
            return { studentType: "grade11", grade: 11 };
        }
        if (Number.isInteger(number) && number >= 27000 && number <= 27999) {
            return { studentType: "grade10", grade: 10 };
        }
    }

    return null;
}

function isValidALAdmissionNumber(admissionNumber) {
    const value = normalizeStudentId(admissionNumber);
    return AL_NUMERIC_STUDENT_IDS.has(value) || /^A2[7-9]\d{3}$/.test(value);
}

function validatePassword(password) {
    const value = String(password || "").trim();
    if (!value) return "Password is empty.";
    if (value.length < 4) return "Password must contain at least 4 characters.";
    return null;
}

function setImportStatus(title, text) {
    importStatus?.classList.add("show");
    if (importStatusTitle) importStatusTitle.textContent = title;
    if (importStatusText) importStatusText.textContent = text;
}

function normalizeKey(value) {
    return String(value).trim().toLowerCase().replace(/[\s_\-\/]+/g, "");
}

function showPreview(rows) {
    if (!previewSection || !previewBody) return;

    previewBody.innerHTML = "";
    rows.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><span class="admission-badge">${escapeHTML(item.studentId)}</span></td>
            <td><span class="password-badge">${escapeHTML(item.password)}</span></td>
            <td>${item.typeLabel}</td>
            <td class="ready">✓ Ready</td>
        `;
        previewBody.appendChild(tr);
    });

    previewSection.classList.add("show");
    if (previewCount) {
        previewCount.textContent = rows.length + (rows.length === 1 ? " Student" : " Students");
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function importStudents() {
    const file = fileInput?.files?.[0];
    if (!file) {
        alert("Please select an Excel file.");
        return;
    }

    const selected = selectedType?.value;
    if (!["al", "grade10", "grade11"].includes(selected)) {
        alert("Please select a student category first.");
        return;
    }

    importBtn.disabled = true;
    importBtn.textContent = "⏳ Reading Excel...";
    result.innerHTML = "";
    selectedRows = [];
    previewSection?.classList.remove("show");
    setImportStatus("Reading Excel file...", "Please wait while the student records are prepared.");

    const reader = new FileReader();

    reader.onload = async event => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            if (!workbook.SheetNames.length) throw new Error("Excel file does not contain a worksheet.");

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            if (!rows.length) throw new Error("Excel file is empty.");

            const preparedRows = [];
            const duplicateIds = new Set();

            for (let index = 0; index < rows.length; index++) {
                const row = rows[index];
                const keys = Object.keys(row);

                let studentIdKey;
                if (selected === "al") {
                    studentIdKey = keys.find(key => normalizeKey(key) === "admissionnumber")
                        || keys.find(key => normalizeKey(key) === "studentid");
                } else {
                    studentIdKey = keys.find(key => normalizeKey(key) === "studentid")
                        || keys.find(key => normalizeKey(key) === "admissionnumber");
                }

                let passwordKey;
                if (selected === "al") {
                    passwordKey = keys.find(key => normalizeKey(key) === "temporarypassword")
                        || keys.find(key => normalizeKey(key) === "password");
                } else {
                    passwordKey = keys.find(key => normalizeKey(key) === "password");
                }

                if (!studentIdKey || !passwordKey) {
                    throw new Error(
                        selected === "al"
                            ? "A/L Excel must contain 'Admission Number' and 'Temporary Password' columns."
                            : "Excel must contain 'Student ID' and 'Password' columns."
                    );
                }

                const studentId = normalizeStudentId(row[studentIdKey]);
                const password = String(row[passwordKey] ?? "").trim();

                if (!studentId) throw new Error(`Row ${index + 2}: Student ID / Admission Number is empty.`);
                if (!password) throw new Error(`Row ${index + 2}: Password is empty.`);

                const passwordError = validatePassword(password);
                if (passwordError) throw new Error(`Row ${index + 2}: ${passwordError}`);

                if (selected === "al" && !isValidALAdmissionNumber(studentId)) {
                    throw new Error(`Row ${index + 2}: Invalid A/L Admission Number "${studentId}". Use A27000–A29999 or a registered numeric A/L ID.`);
                }

                const detected = detectStudentType(studentId);
                if (!detected) {
                    throw new Error(`Row ${index + 2}: Unable to identify student category from "${studentId}".`);
                }

                if (detected.studentType !== selected) {
                    throw new Error(`Row ${index + 2}: ${studentId} does not belong to the selected category.`);
                }

                if (duplicateIds.has(studentId)) {
                    throw new Error(`Row ${index + 2}: Duplicate student ID "${studentId}" found in Excel.`);
                }
                duplicateIds.add(studentId);

                const typeLabel = detected.studentType === "al"
                    ? "A/L"
                    : detected.studentType === "grade10" ? "Grade 10" : "Grade 11";

                preparedRows.push({ studentId, password, detected, typeLabel });
            }

            selectedRows = preparedRows;
            showPreview(preparedRows);
            setImportStatus("Excel validated", `${preparedRows.length} student records are ready to import.`);
            importBtn.textContent = "⏳ Importing Students...";
            await saveStudents(preparedRows);
        } catch (error) {
            console.error("Import error:", error);
            showError(error.message);
        } finally {
            importBtn.disabled = false;
            importBtn.textContent = "📥 Import Students";
        }
    };

    reader.onerror = () => {
        showError("Failed to read the Excel file.");
        importBtn.disabled = false;
        importBtn.textContent = "📥 Import Students";
    };

    reader.readAsArrayBuffer(file);
}

async function saveStudents(students) {
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let grade10Count = 0;
    let grade11Count = 0;
    let alCount = 0;
    const skippedIds = [];
    const failedRows = [];

    let paperSettings = {};
    try {
        const paperSnapshot = await getDocs(collection(db, "papers"));
        paperSnapshot.forEach(paperDoc => {
            paperSettings[paperDoc.id] = paperDoc.data();
        });
    } catch (error) {
        console.warn("Paper settings could not be loaded:", error);
    }

    for (let index = 0; index < students.length; index++) {
        const item = students[index];
        try {
            setImportStatus("Importing students...", `Processing ${index + 1} of ${students.length}: ${item.studentId}`);

            const studentRef = doc(db, "students", item.studentId);
            const existingSnapshot = await getDoc(studentRef);

            if (existingSnapshot.exists()) {
                skipped++;
                skippedIds.push(item.studentId);
                continue;
            }

            const studentData = {
                admissionNumber: item.studentId,
                password: item.password,
                studentType: item.detected.studentType,
                mustChangePassword: true,
                profileCompleted: false,
                lastActiveAt: 0,
                createdAt: Date.now(),
                fullName: "",
                nicNumber: ""
            };

            if (item.detected.grade !== null) {
                studentData.grade = item.detected.grade;
            }

            if (item.detected.studentType === "al") {
                studentData.grade = "AL";
                studentData.studentType = "al";
                studentData.registrationCompleted = false;

                for (let i = 1; i <= 10; i++) {
                    const paper = "paper" + String(i).padStart(2, "0");
                    const settings = paperSettings[paper];
                    studentData[paper] = settings?.defaultAvailable === true;
                    studentData[paper + "Viewed"] = false;
                    studentData[paper + "Pages"] = settings?.pages || 10;
                }
            }

            await setDoc(studentRef, studentData);
            imported++;

            if (item.detected.studentType === "grade10") grade10Count++;
            else if (item.detected.studentType === "grade11") grade11Count++;
            else alCount++;
        } catch (error) {
            console.error("Student import failed:", item.studentId, error);
            failed++;
            failedRows.push({ id: item.studentId, error: error.message });
        }
    }

    showImportResult({ imported, skipped, failed, grade10Count, grade11Count, alCount, skippedIds, failedRows });
    setImportStatus("Import completed", `${imported} new student accounts created.`);
}

function showImportResult(stats) {
    const skippedPreview = stats.skippedIds.slice(0, 10);
    const failedPreview = stats.failedRows.slice(0, 10);

    const skippedHTML = skippedPreview.length ? `
        <div style="margin-top:15px;padding:12px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:12px;">
            <strong>Existing records skipped:</strong><br>
            ${skippedPreview.map(id => escapeHTML(id)).join(", ")}${stats.skippedIds.length > 10 ? " ..." : ""}
        </div>` : "";

    const failedHTML = failedPreview.length ? `
        <div style="margin-top:15px;padding:12px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-size:12px;">
            <strong>Failed records:</strong><br><br>
            ${failedPreview.map(item => `${escapeHTML(item.id)}: ${escapeHTML(item.error)}`).join("<br>")}
        </div>` : "";

    result.innerHTML = `
        <div class="success-result" style="margin-top:20px;padding:20px;border-radius:14px;background:#ffffff;border:1px solid #e2e8f0;">
            <h3>${stats.failed === 0 ? "✅ Import Completed" : "⚠️ Import Completed with Issues"}</h3>
            <div class="import-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:15px;">
                <div><strong>${stats.imported}</strong><span>New Students</span></div>
                <div><strong>${stats.skipped}</strong><span>Existing / Skipped</span></div>
                <div><strong>${stats.grade10Count}</strong><span>Grade 10</span></div>
                <div><strong>${stats.grade11Count}</strong><span>Grade 11</span></div>
                <div><strong>${stats.alCount}</strong><span>A/L</span></div>
                <div><strong>${stats.failed}</strong><span>Failed</span></div>
            </div>
            ${stats.alCount > 0 ? `
                <div style="margin-top:15px;padding:13px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:12px;line-height:1.5;">
                    🔐 <strong>A/L Registration:</strong> New A/L students must complete their Full Name, NIC Number and New Password after their first login.
                </div>` : ""}
            ${skippedHTML}
            ${failedHTML}
        </div>`;
}

function showError(message) {
    result.innerHTML = `
        <div class="error-result" style="margin-top:20px;padding:18px;border-radius:12px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;">
            ❌ <strong>Import Failed</strong><br><br>${escapeHTML(message)}
        </div>`;
    setImportStatus("Import failed", message);
}