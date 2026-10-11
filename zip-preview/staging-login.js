// STAGING-ONLY Firebase Authentication check.
// This verifies a dedicated staging test account and does not access Firestore
// or route to the production dashboard.
import { auth } from "./firebase-staging.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const emailInput = document.getElementById("studentId");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");
const form = document.getElementById("portalLogin");

function showMessage(text, success = false) {
  msg.textContent = text;
  msg.style.color = success ? "#6ff636" : "#ffbf69";
}

async function checkStagingAccount(event) {
  event?.preventDefault();
  const email = String(emailInput?.value || "").trim();
  const password = String(passwordInput?.value || "");
  if (!email || !password) {
    showMessage("Enter the staging test email and password.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Checking staging…";
  showMessage("Authenticating with the staging Firebase project…");
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    showMessage("Staging Firebase Authentication passed. No production dashboard or student data was opened.", true);
    await signOut(auth);
  } catch (error) {
    console.error("Staging authentication check failed:", error);
    const message = error?.code === "auth/invalid-credential" || error?.code === "auth/invalid-login-credentials"
      ? "Staging test account or password is incorrect."
      : "Staging sign-in failed. Check the staging API key, Email/Password provider and test account.";
    showMessage(message);
  } finally {
    passwordInput.value = "";
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In →";
  }
}

loginBtn?.addEventListener("click", checkStagingAccount);
form?.addEventListener("submit", checkStagingAccount);
[emailInput, passwordInput].forEach((input) => input?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") checkStagingAccount(event);
}));
