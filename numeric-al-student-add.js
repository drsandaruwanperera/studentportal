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

    if (!/^\d{1,5}$/.test(id)) return false;

    const number = Number(id);

    // 26000-26999 = Grade 11, 27000-27999 = Grade 10.
    // Numeric IDs outside those ranges can be treated as numeric A/L IDs.
    return !(number >= 26000 && number <= 27999);
}

function getSelectedCategory() {
    return document.querySelector(
        "#addModal .category-btn.selected, #addModal .category-btn.active"
    )?.dataset.type || "";
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

    if (help) {
        help.textContent =
            "Enter A/L Student ID. Numeric A/L IDs (e.g. 17284) are supported.";
    }
}

function setup() {
    const saveButton = document.getElementById("saveNewStudent");
    const idInput = document.getElementById("newStudentId");
    const passwordInput = document.getElementById("newStudentPassword");

    if (!saveButton || !idInput || !passwordInput) return;

    // A/L does not require an admission-series selection.
    // Hide the legacy series UI immediately so it cannot remain visible
    // when the modal opens with A/L already selected.
    if (getSelectedCategory() === "al") {
        showALMode();
    }

    document
        .querySelectorAll("#addModal .category-btn")
        .forEach(button => {
            button.addEventListener("click", () => {
                if (button.dataset.type === "al") {
                    showALMode();
                }
            });
        });

    saveButton.addEventListener(
        "click",
        async event => {
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
                alert(
                    "Invalid A/L Student ID. Use A27000–A29999 or a numeric A/L ID. Numeric Grade 10/11 ranges 26000–27999 are not allowed here."
                );
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

                alert(
                    "A/L Student created successfully.\n\n" +
                    "Student ID: " + id +
                    "\n\nThe student will complete A/L registration on first login."
                );

                window.location.reload();
            } catch (error) {
                console.error("A/L add error:", error);
                alert(
                    "Failed to create student.\n\n" +
                    (error?.message || error)
                );
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = "💾 Save Student";
            }
        },
        true
    );
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
} else {
    setup();
}
