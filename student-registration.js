import { db, doc, getDoc, updateDoc } from "./firebase.js";

const registrationStudentId = document.getElementById("registrationStudentId");
const fullNameInput = document.getElementById("fullName");
const nicNumberInput = document.getElementById("nicNumber");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const registrationConfirm = document.getElementById("registrationConfirm");
const completeRegistrationBtn = document.getElementById("completeRegistrationBtn");
const registrationMessage = document.getElementById("registrationMessage");
const requirementLength = document.getElementById("requirementLength");
const requirementMatch = document.getElementById("requirementMatch");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const loggedIn = sessionStorage.getItem("loggedIn") === "true";
const studentId = (sessionStorage.getItem("studentId") || "").trim().toUpperCase();

function isALStudentData(data, id = studentId) {
    const values = [
        data?.studentType,
        data?.category,
        data?.studentCategory,
        data?.grade
    ]
        .map(value => String(value ?? "").trim().toLowerCase())
        .filter(Boolean);

    if (values.some(value => [
        "al",
        "a/l",
        "a level",
        "advanced",
        "advanced level"
    ].includes(value))) {
        return true;
    }

    // Legacy A/L accounts can still be recognised by their A-prefix.
    return /^A2[789]\d{3}$/.test(
        String(id || "").trim().toUpperCase()
    );
}

function showMessage(message, type = "error") {
    if (!registrationMessage) return;
    registrationMessage.textContent = message;
    registrationMessage.className =
        "registration-message " +
        (type === "success" ? "success" : "error");
}

function clearMessage() {
    if (registrationMessage) {
        registrationMessage.textContent = "";
        registrationMessage.className = "registration-message";
    }
}

function setupPasswordToggle(button, input) {
    if (!button || !input) return;

    button.addEventListener("click", () => {
        const visible = input.type === "password";
        input.type = visible ? "text" : "password";
        button.textContent = visible ? "🙈" : "🙊";
        button.setAttribute(
            "aria-label",
            visible ? "Hide password" : "Show password"
        );
    });
}

function updatePasswordRequirements() {
    const password = newPasswordInput?.value || "";
    const confirm = confirmPasswordInput?.value || "";
    const lengthOK = password.length >= 6;
    const matchOK = password.length > 0 && password === confirm;

    if (requirementLength) {
        requirementLength.classList.toggle("valid", lengthOK);
        const icon = requirementLength.querySelector("span");
        if (icon) icon.textContent = lengthOK ? "✓" : "○";
    }

    if (requirementMatch) {
        requirementMatch.classList.toggle("valid", matchOK);
        const icon = requirementMatch.querySelector("span");
        if (icon) icon.textContent = matchOK ? "✓" : "○";
    }
}

function validateName(value) {
    const clean = String(value || "")
        .trim()
        .replace(/\s+/g, " ");

    return clean.length >= 3
        ? { valid: true, value: clean }
        : { valid: false, message: "Please enter your full name." };
}

function validateNIC(value) {
    const clean = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

    if (!clean) {
        return {
            valid: false,
            message: "Please enter your NIC number."
        };
    }

    if (
        !/^\d{9}[VX]$/i.test(clean) &&
        !/^\d{12}$/.test(clean)
    ) {
        return {
            valid: false,
            message: "Please enter a valid NIC number."
        };
    }

    return { valid: true, value: clean };
}

function validatePassword() {
    const password = newPasswordInput?.value || "";
    const confirm = confirmPasswordInput?.value || "";

    if (password.length < 6) {
        return {
            valid: false,
            message: "Password must contain at least 6 characters."
        };
    }

    if (password !== confirm) {
        return {
            valid: false,
            message: "Passwords do not match."
        };
    }

    return { valid: true, value: password };
}

if (!loggedIn || !studentId) {
    window.location.replace("index.html");
}

if (registrationStudentId) {
    registrationStudentId.value = studentId;
}

setupPasswordToggle(toggleNewPassword, newPasswordInput);
setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);

[newPasswordInput, confirmPasswordInput].forEach(input =>
    input?.addEventListener("input", () => {
        updatePasswordRequirements();
        clearMessage();
    })
);

[fullNameInput, nicNumberInput].forEach(input =>
    input?.addEventListener("input", clearMessage)
);

registrationConfirm?.addEventListener("change", clearMessage);

async function loadStudent() {
    try {
        const snap = await getDoc(doc(db, "students", studentId));

        if (!snap.exists()) {
            alert("Student account could not be found.");
            window.location.replace("index.html");
            return;
        }

        const data = snap.data();

        if (!isALStudentData(data, studentId)) {
            alert(
                "A/L Student Registration Only.\n\n" +
                "This registration page is only available for A/L students."
            );
            window.location.replace("index.html");
            return;
        }

        if (
            data?.profileCompleted === true &&
            data?.registrationCompleted === true &&
            data?.mustChangePassword !== true
        ) {
            window.location.replace("dashboard.html");
            return;
        }

        if (fullNameInput) {
            fullNameInput.value =
                data?.fullName ||
                data?.name ||
                data?.studentName ||
                "";
        }

        if (nicNumberInput && data?.nicNumber) {
            nicNumberInput.value = String(data.nicNumber);
        }
    } catch (error) {
        console.error("Load registration error:", error);
        showMessage(
            "Unable to load your registration details. Please try again."
        );
    }
}

async function completeRegistration() {
    if (!loggedIn || !studentId) {
        return window.location.replace("index.html");
    }

    try {
        const studentRef = doc(db, "students", studentId);
        const snap = await getDoc(studentRef);

        if (!snap.exists()) {
            return showMessage("A/L student account not found.");
        }

        const data = snap.data();

        if (!isALStudentData(data, studentId)) {
            return showMessage(
                "Only A/L students can complete registration."
            );
        }

        const name = validateName(fullNameInput?.value);
        if (!name.valid) {
            showMessage(name.message);
            fullNameInput?.focus();
            return;
        }

        const nic = validateNIC(nicNumberInput?.value);
        if (!nic.valid) {
            showMessage(nic.message);
            nicNumberInput?.focus();
            return;
        }

        const password = validatePassword();
        if (!password.valid) {
            showMessage(password.message);
            newPasswordInput?.focus();
            return;
        }

        if (!registrationConfirm?.checked) {
            return showMessage(
                "Please confirm that the information provided is accurate."
            );
        }

        if (completeRegistrationBtn) {
            completeRegistrationBtn.disabled = true;
            completeRegistrationBtn.innerHTML =
                "<span>Completing Registration...</span>";
        }

        showMessage("Saving your registration...", "success");

        await updateDoc(studentRef, {
            fullName: name.value,
            name: name.value,
            studentName: name.value,
            nicNumber: nic.value,
            password: password.value,
            mustChangePassword: false,
            profileCompleted: true,
            registrationCompleted: true,
            lastActiveAt: Date.now(),
            registrationCompletedAt: Date.now(),
            studentType: "al",
            category: "A/L",
            studentCategory: "A/L"
        });

        sessionStorage.setItem("studentName", name.value);
        sessionStorage.setItem("studentNIC", nic.value);
        sessionStorage.setItem("loggedIn", "true");
        sessionStorage.setItem("studentId", studentId);

        showMessage(
            "A/L registration completed successfully. Redirecting...",
            "success"
        );

        setTimeout(() => {
            window.location.replace("dashboard.html");
        }, 800);
    } catch (error) {
        console.error("Registration error:", error);
        showMessage(
            error?.message ||
            "Unable to complete registration. Please try again."
        );
    } finally {
        if (completeRegistrationBtn) {
            completeRegistrationBtn.disabled = false;
            completeRegistrationBtn.innerHTML =
                "<span>Complete Registration</span><span>→</span>";
        }
    }
}

completeRegistrationBtn?.addEventListener("click", completeRegistration);

[fullNameInput, nicNumberInput, newPasswordInput, confirmPasswordInput].forEach(
    input =>
        input?.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                completeRegistration();
            }
        })
);

if (loggedIn && studentId) {
    loadStudent();
}
