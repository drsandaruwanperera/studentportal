import { updateDoc } from "./firebase.js";

const RECOVERY_OVERLAY_ID = "student-recovery-setup-overlay";
const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECOVERY_CODE_LENGTH = 20;

function createRecoveryCode() {
  if (!window.crypto?.getRandomValues) {
    throw new Error("This browser cannot generate a secure recovery code. Please update the browser or contact the administrator.");
  }

  const bytes = new Uint8Array(RECOVERY_CODE_LENGTH);
  window.crypto.getRandomValues(bytes);

  const raw = Array.from(bytes, value =>
    RECOVERY_CODE_ALPHABET[value & 31]
  ).join("");

  return raw.match(/.{1,4}/g).join("-");
}

async function hashRecoveryCode(code) {
  if (!window.crypto?.subtle || typeof TextEncoder === "undefined") {
    throw new Error("Secure code verification is not available in this browser. Please use an updated browser.");
  }

  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code.replace(/-/g, "").toUpperCase())
  );

  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

function buildPrintableRecoveryPage(studentId, code) {
  const safeStudentId = escapeHTML(studentId);
  const safeCode = escapeHTML(code);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Student Account Recovery Code</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:36px;font-family:Arial,Helvetica,sans-serif;background:#f1f6fc;color:#17243b}
  .sheet{width:min(720px,100%);margin:30px auto;padding:42px;border:1px solid #cbdff2;border-radius:22px;background:#fff;box-shadow:0 15px 45px rgba(37,75,120,.12)}
  .brand{font-size:11px;font-weight:900;letter-spacing:2px;color:#4d89d5}
  h1{margin:16px 0 8px;font-size:28px}
  p{color:#526985;font-size:14px;line-height:1.7}
  .student{margin:24px 0 8px;padding:14px;border:1px solid #d6e5f4;border-radius:12px;background:#f6faff;font-size:13px}
  .code{margin:14px 0 18px;padding:22px 12px;border:2px dashed #9ec1e6;border-radius:16px;background:#f0f7ff;color:#205b9e;text-align:center;font:900 27px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:2px;overflow-wrap:anywhere}
  .warning{margin-top:24px;padding:15px;border-left:4px solid #4d89d5;border-radius:8px;background:#eef5fc;color:#3c5573;font-size:12px;line-height:1.7}
  @media print{body{padding:0;background:#fff}.sheet{width:100%;margin:0;border:0;box-shadow:none;padding:24px}.warning{break-inside:avoid}}
  @media(max-width:520px){body{padding:12px}.sheet{padding:24px 18px}.code{font-size:20px;letter-spacing:1px}}
</style>
</head>
<body>
  <main class="sheet">
    <div class="brand">DR. SANDARUWAN LMS</div>
    <h1>Your Account Recovery Code</h1>
    <p>Keep this code in a safe place. You will need it if you forget your student portal password.</p>
    <div class="student"><strong>Student ID:</strong> ${safeStudentId}</div>
    <div class="code">${safeCode}</div>
    <div class="warning"><strong>Important:</strong> This code is shown only once. Do not share it with anyone. Keep your printed copy in a secure place, or store the downloaded file somewhere private.</div>
  </main>
<script>
  window.addEventListener("load", () => {
    window.focus();
    window.print();
  });
</script>
</body>
</html>`;
}

export async function requireRecoveryCodeSetup(studentRef, studentId, studentData = {}, options = {}) {
  const forceRegenerate = options?.forceRegenerate === true;
  const existingHash = String(studentData?.recoveryCodeHash || "").trim();
  const setupComplete = studentData?.recoveryCodeSetupComplete === true &&
    /^[a-f0-9]{64}$/i.test(existingHash);

  if (setupComplete && !forceRegenerate) return true;

  if (document.getElementById(RECOVERY_OVERLAY_ID)) {
    throw new Error("Recovery setup is already open. Please complete that step first.");
  }

  const recoveryCode = createRecoveryCode();
  const recoveryCodeHash = await hashRecoveryCode(recoveryCode);

  return new Promise(resolve => {
    let exportedMethod = "";
    let saving = false;

    const overlay = document.createElement("div");
    overlay.id = RECOVERY_OVERLAY_ID;
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <section class="src-dialog" role="dialog" aria-modal="true" aria-labelledby="src-title" aria-describedby="src-description">
        <div class="src-brand"><span class="src-brand-mark">🔐</span><span>DR. SANDARUWAN LMS</span></div>
        <div class="src-step">${forceRegenerate ? "SECURITY UPDATE" : "ONE-TIME ACCOUNT SETUP"}</div>
        <h1 id="src-title">${forceRegenerate ? "Create a new Recovery Code" : "Save your Recovery Code"}</h1>
        <p id="src-description" class="src-description">${forceRegenerate ? "Your previous Recovery Code will stop working after this update. Download or print the new code and keep it somewhere safe." : "Before entering your dashboard, save this code by printing it or downloading a copy. You will need it if you forget your password."}</p>

        <div class="src-student-id"><span>STUDENT ID</span><strong>${escapeHTML(studentId)}</strong></div>

        <div class="src-code-panel">
          <span class="src-code-label">YOUR PERSONAL RECOVERY CODE</span>
          <strong class="src-code-value" id="srcRecoveryCode">${recoveryCode}</strong>
          <small>This code is displayed only during this setup.</small>
        </div>

        <div class="src-actions">
          <button type="button" class="src-btn src-btn-print" id="srcPrintBtn">🖨️ Print / Save as PDF</button>
          <button type="button" class="src-btn src-btn-download" id="srcDownloadBtn">⬇️ Download Code</button>
        </div>

        <label class="src-confirm">
          <input type="checkbox" id="srcConfirmSaved">
          <span>I have printed or downloaded my Recovery Code and saved it somewhere safe.</span>
        </label>

        <p class="src-status" id="srcStatus" role="status">Choose Print or Download, then confirm that you have saved your code.</p>

        <button type="button" class="src-btn src-btn-continue" id="srcContinueBtn" disabled>${forceRegenerate ? "Save New Recovery Code" : "Continue to Dashboard"} <span aria-hidden="true">→</span></button>
        <p class="src-footnote">Your full recovery code is never stored in the student record. Only its SHA-256 verification hash is saved.</p>
      </section>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("src-modal-open");

    const printButton = overlay.querySelector("#srcPrintBtn");
    const downloadButton = overlay.querySelector("#srcDownloadBtn");
    const confirmCheckbox = overlay.querySelector("#srcConfirmSaved");
    const continueButton = overlay.querySelector("#srcContinueBtn");
    const status = overlay.querySelector("#srcStatus");

    const updateContinueState = () => {
      continueButton.disabled = saving || !exportedMethod || !confirmCheckbox.checked;
    };

    printButton.addEventListener("click", () => {
      let printWindow = null;
      try {
        printWindow = window.open("", "_blank", "popup,width=760,height=720");
        if (!printWindow) {
          status.textContent = "Your browser blocked the print window. Allow pop-ups for this site, or use Download Code instead.";
          status.classList.add("is-error");
          return;
        }

        printWindow.opener = null;
        printWindow.document.open();
        printWindow.document.write(buildPrintableRecoveryPage(studentId, recoveryCode));
        printWindow.document.close();

        exportedMethod = "print";
        status.classList.remove("is-error");
        status.textContent = "Print window opened. Print the page or choose “Save as PDF”, then tick the confirmation box.";
        updateContinueState();
      } catch (error) {
        console.error("Recovery code print failed:", error);
        try { printWindow?.close(); } catch (_) {}
        status.textContent = "Could not open the print window. Please use Download Code instead.";
        status.classList.add("is-error");
      }
    });

    downloadButton.addEventListener("click", () => {
      try {
        const content = [
          "DR. SANDARUWAN LMS — STUDENT ACCOUNT RECOVERY CODE",
          "Student ID: " + studentId,
          "",
          "Recovery Code: " + recoveryCode,
          "",
          "Keep this code private. Do not share it with anyone.",
          "This code is shown only once during setup."
        ].join("\n");

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const safeId = String(studentId).replace(/[^a-z0-9_-]/gi, "_");
        anchor.href = objectUrl;
        anchor.download = "Dr-Sandaruwan-Recovery-" + safeId + ".txt";
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

        exportedMethod = "download";
        status.classList.remove("is-error");
        status.textContent = "Recovery Code download started. Check your Downloads folder, then tick the confirmation box.";
        updateContinueState();
      } catch (error) {
        console.error("Recovery code download failed:", error);
        status.textContent = "Could not download the recovery code. Please use Print / Save as PDF instead.";
        status.classList.add("is-error");
      }
    });

    confirmCheckbox.addEventListener("change", updateContinueState);

    continueButton.addEventListener("click", async () => {
      if (saving || !exportedMethod || !confirmCheckbox.checked) return;

      saving = true;
      updateContinueState();
      continueButton.textContent = "Saving recovery setup…";
      status.classList.remove("is-error");
      status.textContent = "Saving your recovery setup. Please do not close this page.";

      try {
        await updateDoc(studentRef, {
          recoveryCodeHash,
          recoveryCodeAlgorithm: "SHA-256",
          recoveryCodeVersion: forceRegenerate ? Math.max(2, Number(studentData?.recoveryCodeVersion || 1) + 1) : 1,
          recoveryCodeSetupComplete: true,
          recoveryCodeSetupAt: Date.now(),
          recoveryCodeDeliveryMethod: exportedMethod,
          ...(forceRegenerate ? { recoveryCodeReplacedAt: Date.now() } : {})
        });

        document.body.classList.remove("src-modal-open");
        overlay.remove();
        resolve(true);
      } catch (error) {
        console.error("Recovery code setup save failed:", error);
        saving = false;
        continueButton.textContent = "Continue to Dashboard →";
        status.textContent = "Could not save your recovery setup. Check your connection and try again. Your code is still visible.";
        status.classList.add("is-error");
        updateContinueState();
      }
    });

    overlay.querySelector("#srcRecoveryCode")?.setAttribute("aria-label", "Your recovery code");
    confirmCheckbox.focus();
  });
}
