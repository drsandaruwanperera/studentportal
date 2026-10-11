// STAGING PREVIEW LOGIN — read-only; never routes into production dashboard.
import { db } from "./firebase-staging.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const idInput = document.getElementById("studentId");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");
const form = document.getElementById("portalLogin");

function showMessage(text, kind = "error") {
  msg.textContent = text;
  msg.style.color = kind === "success" ? "#6ff636" : "#ffbf69";
}

async function testStagingLogin() {
  const studentId = String(idInput.value || "").trim().replace(/\s+/g, "").toUpperCase();
  const password = String(passwordInput.value || "").trim();
  if (!studentId || !password) {
    showMessage("Enter the staging test Student ID and password.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Checking staging…";
  showMessage("Checking the staging database…");
  try {
    const snap = await getDoc(doc(db, "students", studentId));
    if (!snap.exists() || String(snap.data()?.password ?? "") !== password) {
      showMessage("Staging test failed: student record or password did not match.");
      return;
    }
    showMessage("Staging database login check passed. This is a safe preview only; production dashboard has not been opened.", "success");
  } catch (error) {
    console.error("Staging-only login check failed:", error);
    showMessage("Could not read staging Firestore. Check staging Firestore rules and browser console.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In →";
  }
}

loginBtn.addEventListener("click", testStagingLogin);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  testStagingLogin();
});
[idInput, passwordInput].forEach((input) => input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    testStagingLogin();
  }
}));
