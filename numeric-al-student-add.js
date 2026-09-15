import { db, doc, getDoc, setDoc } from "./firebase.js";

const TOTAL_PAPERS = 13;

function getPaperField(number) {
    return "paper" + String(number).padStart(2, "0");
}

function getPaperViewedField(number) {
    return getPaperField(number) + "Viewed";
}

function getPaperPagesField(number) {
    return getPaperField(number) + "Pages";
}

function normalizeId(value) {
    return String(value || "").trim().toUpperCase();
}

function isALId(value) {
    const id = normalizeId(value);
    if (/^A2[7-9]\d{3}$/.test(id)) return true;
    if (/^27[A-Z]\d{5}$/.test(id)) return true;
    if (id === "A26172") return true;
    if (!/^\d{1,5}$/.test(id)) return false;
    const number = Number(id);
    return !(number >= 26000 && number <= 27999);
}

function getSelectedCategory() {
    return document.querySelector("#addModal .category-btn.selected, #addModal .category-btn.active")?.dataset.type || "";
}

function showALMode() {
    const section = document.getElementById("alSeriesSection");
    const help = document.getElementById("studentIdHelp");
    const idInput = document.getElementById("newStudentId");
    if (section) section.style.display = "none";
    if (idInput) {
        idInput.placeholder = "Enter A/L Student ID";
        idInput.removeAttribute("readonly");
    }
    if (help) help.textContent = "Enter A/L Student ID. Numeric and alphanumeric A/L IDs are supported.";
}

function setup() {
    const saveButton = document.getElementById("saveNewStudent");
    const idInput = document.getElementById("newStudentId");
    const passwordInput = document.getElementById("newStudentPassword");
    if (!saveButton || !idInput || !passwordInput) return;

    if (getSelectedCategory() === "al") showALMode();

    document.querySelectorAll("#addModal .category-btn").forEach(button => {
        button.addEventListener("click", () => {
            if (button.dataset.type === "al") showALMode();
        });
    });

    saveButton.addEventListener("click", async event => {
        if (getSelectedCategory() !== "al") return;
        event.preventDefault();
        event.stopImmediatePropagation();

        const id = normalizeId(idInput.value);
        const password = String(passwordInput.value || "").trim();

        if (!id) {
            alert("Please enter A/L Student ID.");
            idInput.focus();
            return;
        }
        if (!isALId(id)) {
            alert("Invalid A/L Student ID. Alphanumeric IDs such as 27C01032 are supported.");
            idInput.focus();
            return;
        }
        if (!password) {
            alert("Please enter Password.");
            passwordInput.focus();
            return;
        }
        if (password.length < 4) {
            alert("Password must contain at least 4 characters.");
            passwordInput.focus();
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
        try {
            const studentRef = doc(db, "students", id);
            const existing = await getDoc(studentRef);
            if (existing.exists()) {
                alert("This Student ID already exists.");
                return;
            }

            const studentData = {
                admissionNumber: id,
                password,
                mustChangePassword: true,
                profileCompleted: false,
                registrationCompleted: false,
                studentType: "al",
                category: "A/L",
                studentCategory: "A/L",
                grade: null,
                fullName: "",
                name: "",
                studentName: "",
                nicNumber: "",
                createdAt: Date.now(),
                lastActiveAt: 0
            };

            for (let i = 1; i <= TOTAL_PAPERS; i++) {
                studentData[getPaperField(i)] = false;
                studentData[getPaperViewedField(i)] = false;
                studentData[getPaperPagesField(i)] = 10;
            }

            await setDoc(studentRef, studentData);
            alert("A/L Student created successfully.\n\nStudent ID: " + id + "\n\nThe student will complete A/L registration on first login.");
            window.location.reload();
        } catch (error) {
            console.error("A/L add error:", error);
            alert("Failed to create student.\n\n" + (error?.message || error));
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "💾 Save Student";
        }
    }, true);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
} else {
    setup();
}
