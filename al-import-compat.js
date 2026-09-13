// A/L import compatibility layer for admission IDs such as 27C13017.
// Loaded from session.js before import-students.js and intercepts only A/L imports.

import {
    db,
    doc,
    getDoc,
    getDocs,
    collection,
    setDoc
} from "./firebase.js";

const SPECIAL_AL_IDS = new Set([
    "27C13017", "27C01102", "27C20135", "27C11014", "27C13007",
    "27C13027", "27C60149", "27C13011", "27C13026", "27C13025",
    "27C13013", "27C13014", "27C60187", "27C20193", "27C11153",
    "27C13018", "27C10744", "27C10743", "27C00653", "27C00720",
    "27C00229", "27C00230", "27C11152", "27C10666", "27N71072"
]);

function normalizeId(value) {
    return String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

function isALId(value) {
    const id = normalizeId(value);
    return SPECIAL_AL_IDS.has(id) || /^A2[7-9]\d{3}$/.test(id);
}

function passwordError(value) {
    const password = String(value ?? "").trim();
    if (!password) return "Password is empty.";
    if (password.length < 4) return "Password must contain at least 4 characters.";
    return null;
}

function getResultBox() {
    return document.getElementById("result");
}

function showResult(message, ok = true) {
    const box = getResultBox();
    if (!box) {
        alert(message);
        return;
    }
    box.innerHTML = `<div style="margin-top:18px;padding:14px;border-radius:12px;background:${ok ? "#ecfdf5" : "#fef2f2"};border:1px solid ${ok ? "#a7f3d0" : "#fecaca"};color:${ok ? "#065f46" : "#991b1b"};font-size:13px;line-height:1.6;">${message}</div>`;
}

function findColumn(keys, names) {
    return keys.find(key => names.includes(String(key).trim().toLowerCase().replace(/[\s_\-/]+/g, "")));
}

async function importALCompat() {
    const file = document.getElementById("excelFile")?.files?.[0];
    const result = getResultBox();
    if (!file) {
        showResult("Please select an Excel file.", false);
        return;
    }

    const button = document.getElementById("importBtn");
    if (button) {
        button.disabled = true;
        button.textContent = "⏳ Importing A/L Students...";
    }

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
        if (!workbook.SheetNames.length) throw new Error("Excel file does not contain a worksheet.");

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!rows.length) throw new Error("Excel file is empty.");

        const prepared = [];
        const seen = new Set();

        rows.forEach((row, index) => {
            const keys = Object.keys(row);
            const idKey = findColumn(keys, ["admissionnumber", "studentid"]);
            const passwordKey = findColumn(keys, ["temporarypassword", "password"]);
            if (!idKey || !passwordKey) {
                throw new Error("A/L Excel must contain 'Admission Number' and 'Temporary Password' columns (or Student ID and Password).");
            }

            const id = normalizeId(row[idKey]);
            const password = String(row[passwordKey] ?? "").trim();
            if (!id) throw new Error(`Row ${index + 2}: Admission Number is empty.`);
            if (!isALId(id)) throw new Error(`Row ${index + 2}: Invalid A/L Admission Number "${id}".`);
            const pError = passwordError(password);
            if (pError) throw new Error(`Row ${index + 2}: ${pError}`);
            if (seen.has(id)) throw new Error(`Row ${index + 2}: Duplicate student ID "${id}" found in Excel.`);
            seen.add(id);
            prepared.push({ id, password });
        });

        let paperSettings = {};
        try {
            const snapshot = await getDocs(collection(db, "papers"));
            snapshot.forEach(item => { paperSettings[item.id] = item.data(); });
        } catch (error) {
            console.warn("Paper settings could not be loaded:", error);
        }

        let imported = 0;
        let skipped = 0;
        const skippedIds = [];
        const failed = [];

        for (let index = 0; index < prepared.length; index++) {
            const item = prepared[index];
            try {
                const studentRef = doc(db, "students", item.id);
                const existing = await getDoc(studentRef);
                if (existing.exists()) {
                    skipped++;
                    skippedIds.push(item.id);
                    continue;
                }

                const studentData = {
                    admissionNumber: item.id,
                    password: item.password,
                    studentType: "al",
                    grade: "AL",
                    mustChangePassword: true,
                    profileCompleted: false,
                    registrationCompleted: false,
                    lastActiveAt: 0,
                    createdAt: Date.now(),
                    fullName: "",
                    nicNumber: ""
                };

                // Keep the same A/L paper initialization used by the existing importer.
                for (let paperNumber = 1; paperNumber <= 10; paperNumber++) {
                    const paper = "paper" + String(paperNumber).padStart(2, "0");
                    const settings = paperSettings[paper];
                    studentData[paper] = settings?.defaultAvailable === true;
                    studentData[paper + "Viewed"] = false;
                    studentData[paper + "Pages"] = settings?.pages || 10;
                }

                await setDoc(studentRef, studentData);
                imported++;
            } catch (error) {
                console.error("A/L compatibility import failed:", item.id, error);
                failed.push(`${item.id}: ${error.message}`);
            }
        }

        const skippedText = skippedIds.length ? `<br>Skipped existing: ${skippedIds.join(", ")}` : "";
        const failedText = failed.length ? `<br>Failed: ${failed.join(" | ")}` : "";
        showResult(`<strong>A/L import completed.</strong><br>${imported} new student accounts created.<br>${skipped} existing records skipped.${skippedText}${failedText}`, failed.length === 0);
    } catch (error) {
        console.error("A/L compatibility import error:", error);
        showResult(error.message || "A/L import failed.", false);
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "📥 Import Students";
        }
    }
}

function bindALImportCompatibility() {
    document.addEventListener("click", event => {
        const button = event.target.closest?.("#importBtn");
        if (!button) return;

        const selectedType = document.getElementById("selectedType")?.value;
        if (selectedType !== "al") return;

        // Capture phase runs before the existing import-students.js click handler.
        event.preventDefault();
        event.stopImmediatePropagation();
        importALCompat();
    }, true);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindALImportCompatibility, { once: true });
} else {
    bindALImportCompatibility();
}
