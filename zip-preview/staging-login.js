// SAFE PREVIEW GATE.
// Do not read student documents or compare stored passwords in the browser.
// Enable sign-in only after Firebase Authentication + restrictive staging rules
// are configured for dedicated test accounts.

const loginBtn = document.getElementById("loginBtn");
const msg = document.getElementById("msg");
const form = document.getElementById("portalLogin");
const idInput = document.getElementById("studentId");
const passwordInput = document.getElementById("password");

function showMessage(text) {
  msg.textContent = text;
  msg.style.color = "#ffbf69";
}

function blockUnsafeLogin(event) {
  event?.preventDefault();
  showMessage("Staging sign-in is not enabled yet. Secure test authentication must be configured first. Do not enter real student credentials.");
  passwordInput.value = "";
}

loginBtn?.addEventListener("click", blockUnsafeLogin);
form?.addEventListener("submit", blockUnsafeLogin);
[idInput, passwordInput].forEach((input) => input?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") blockUnsafeLogin(event);
}));
