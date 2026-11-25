import { db, doc, runTransaction } from "./firebase.js";

const MAX_MONTHLY_RECOVERY_RESETS = 2;
const RECOVERY_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{20}$/;

function normalizeStudentId(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeRecoveryCode(value) {
  return String(value || "").toUpperCase().replace(/[\s-]/g, "");
}

async function hashRecoveryCode(code) {
  if (!window.crypto?.subtle || typeof TextEncoder === "undefined") {
    throw new Error("Secure code verification is not available in this browser.");
  }

  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizeRecoveryCode(code))
  );

  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function getSriLankaMonthKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;
  return year + "-" + month;
}

function setStatus(element, message, type = "info") {
  element.textContent = message;
  element.classList.remove("is-error", "is-success");
  if (type === "error") element.classList.add("is-error");
  if (type === "success") element.classList.add("is-success");
}

export function initRecoveryPasswordReset() {
  const openButton = document.getElementById("recoveryResetOpen");
  const studentIdInput = document.getElementById("studentId");
  const loginPasswordInput = document.getElementById("password");
  const loginMessage = document.getElementById("msg");

  if (!openButton || openButton.dataset.recoveryResetBound === "true") return;
  openButton.dataset.recoveryResetBound = "true";

  const overlay = document.createElement("div");
  overlay.className = "recovery-reset-overlay";
  overlay.hidden = true;
  overlay.innerHTML = [
    '<section class="recovery-reset-dialog" role="dialog" aria-modal="true" aria-labelledby="rrTitle" aria-describedby="rrDescription">',
    '  <button type="button" class="recovery-reset-close" id="rrClose" aria-label="Close">×</button>',
    '  <div class="rr-brand"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span><strong>DR. SANDARUWAN LMS</strong></div>',
    '  <div class="rr-eyebrow">ACCOUNT RECOVERY</div>',
    '  <h2 id="rrTitle">Reset your password</h2>',
    '  <p class="rr-description" id="rrDescription">Enter your Student ID and the Recovery Code you saved during setup. You can reset your password up to 2 times per month.</p>',
    '  <form id="rrForm" novalidate>',
    '    <label for="rrStudentId">Student ID</label>',
    '    <input id="rrStudentId" name="studentId" type="text" autocomplete="username" required placeholder="Enter your Student ID">',
    '    <label for="rrCode">Recovery Code</label>',
    '    <input id="rrCode" name="recoveryCode" type="text" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" required placeholder="ABCD-EFGH-JKLM-NPQR-STUV">',
    '    <div class="rr-field-pair">',
    '      <div class="rr-field"><label for="rrNewPassword">New Password</label>',
    '      <input id="rrNewPassword" name="newPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="At least 8 characters"></div>',
    '      <div class="rr-field"><label for="rrConfirmPassword">Confirm New Password</label>',
    '      <input id="rrConfirmPassword" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" placeholder="Enter the new password again"></div>',
    '    </div>',
    '    <p class="rr-status" id="rrStatus" role="status" aria-live="polite">Your Recovery Code is private. Never share it with anyone.</p>',
    '    <button type="submit" class="rr-submit" id="rrSubmit">Verify Code &amp; Reset Password <span aria-hidden="true">→</span></button>',
    '  </form>',
    '  <p class="rr-footnote">After a successful reset, your login lock (if active) will also be cleared. More than 2 resets in one month require an administrator release.</p>',
    '</section>'
  ].join("");

  document.body.appendChild(overlay);

  const form = overlay.querySelector("#rrForm");
  const studentField = overlay.querySelector("#rrStudentId");
  const codeField = overlay.querySelector("#rrCode");
  const newPasswordField = overlay.querySelector("#rrNewPassword");
  const confirmPasswordField = overlay.querySelector("#rrConfirmPassword");
  const status = overlay.querySelector("#rrStatus");
  const submitButton = overlay.querySelector("#rrSubmit");
  const closeButton = overlay.querySelector("#rrClose");

  let submitting = false;

  function closeDialog() {
    if (submitting) return;
    overlay.hidden = true;
    document.body.classList.remove("recovery-reset-open");
    codeField.value = "";
    newPasswordField.value = "";
    confirmPasswordField.value = "";
  }

  function openDialog() {
    studentField.value = normalizeStudentId(studentIdInput?.value);
    setStatus(status, "Your Recovery Code is private. Never share it with anyone.");
    overlay.hidden = false;
    document.body.classList.add("recovery-reset-open");
    window.setTimeout(() => studentField.focus(), 30);
  }

  function setSubmitting(value) {
    submitting = value;
    submitButton.disabled = value;
    submitButton.textContent = value ? "Verifying and updating…" : "Verify Code & Reset Password →";
    closeButton.disabled = value;
  }

  openButton.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeDialog();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) closeDialog();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting) return;

    const studentId = normalizeStudentId(studentField.value);
    const recoveryCode = normalizeRecoveryCode(codeField.value);
    const newPassword = String(newPasswordField.value || "").trim();
    const confirmPassword = String(confirmPasswordField.value || "").trim();

    if (!studentId) {
      setStatus(status, "Please enter your Student ID.", "error");
      studentField.focus();
      return;
    }
    if (!RECOVERY_CODE_PATTERN.test(recoveryCode)) {
      setStatus(status, "Enter the complete 20-character Recovery Code from your saved copy.", "error");
      codeField.focus();
      return;
    }
    if (newPassword.length < 8) {
      setStatus(status, "Your new password must contain at least 8 characters.", "error");
      newPasswordField.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus(status, "The new passwords do not match.", "error");
      confirmPasswordField.focus();
      return;
    }

    setSubmitting(true);
    setStatus(status, "Verifying your Recovery Code…");

    try {
      const enteredHash = await hashRecoveryCode(recoveryCode);
      const studentRef = doc(db, "students", studentId);
      const monthKey = getSriLankaMonthKey();

      const result = await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(studentRef);
        if (!snapshot.exists()) return { status: "invalid" };

        const data = snapshot.data() || {};
        const savedHash = String(data.recoveryCodeHash || "").trim().toLowerCase();
        const setupComplete = data.recoveryCodeSetupComplete === true &&
          /^[a-f0-9]{64}$/.test(savedHash);

        if (!setupComplete) return { status: "not-setup" };
        if (savedHash !== enteredHash.toLowerCase()) return { status: "invalid" };
        if (String(data.password ?? "").trim() === newPassword) {
          return { status: "same-password" };
        }

        const previousMonth = String(data.recoveryPasswordResetMonth || "");
        const usedThisMonth = previousMonth === monthKey
          ? Math.max(0, Number(data.recoveryPasswordResetCount || 0))
          : 0;

        if (usedThisMonth >= MAX_MONTHLY_RECOVERY_RESETS) {
          return { status: "limit" };
        }

        const nextCount = usedThisMonth + 1;
        const resetAt = Date.now();

        transaction.update(studentRef, {
          password: newPassword,
          failedLoginAttempts: 0,
          accountLocked: false,
          accountLockedAt: null,
          recoveryPasswordResetMonth: monthKey,
          recoveryPasswordResetCount: nextCount,
          recoveryPasswordLastResetAt: resetAt,
          recoveryPasswordLastResetMethod: "recovery-code"
        });

        return { status: "success", count: nextCount };
      });

      if (result.status === "not-setup") {
        setStatus(status, "A Recovery Code has not been set up for this account. Please contact the administrator.", "error");
        setSubmitting(false);
        return;
      }
      if (result.status === "same-password") {
        setStatus(status, "Choose a new password that is different from your current password.", "error");
        setSubmitting(false);
        return;
      }
      if (result.status === "limit") {
        setStatus(status, "You have already used 2 Recovery Code password resets this month. Contact an administrator to release your reset limit.", "error");
        setSubmitting(false);
        return;
      }
      if (result.status !== "success") {
        setStatus(status, "We could not verify those details. Check your Student ID and Recovery Code, then try again.", "error");
        setSubmitting(false);
        return;
      }

      if (studentIdInput) studentIdInput.value = studentId;
      if (loginPasswordInput) loginPasswordInput.value = newPassword;
      if (loginMessage) {
        loginMessage.textContent = "Password reset successfully. Sign in using your new password.";
        loginMessage.style.color = "#16a34a";
        loginMessage.style.display = "block";
      }

      setStatus(status, "Password reset successfully.", "success");
      overlay.hidden = true;
      document.body.classList.remove("recovery-reset-open");
      codeField.value = "";
      newPasswordField.value = "";
      confirmPasswordField.value = "";
      window.setTimeout(() => loginPasswordInput?.focus(), 30);
    } catch (error) {
      console.error("Recovery password reset failed:", error);
      setStatus(status, "Password reset failed. Check your connection and try again, or contact the administrator.", "error");
      setSubmitting(false);
    }
  });
}
