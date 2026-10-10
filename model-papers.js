import { db, doc, getDoc } from "./firebase.js";

if (sessionStorage.getItem("loggedIn") !== "true") {
  window.location.replace("index.html");
}

const studentId = sessionStorage.getItem("studentId");

async function hasAccess() {
  if (!studentId) return false;
  try {
    const snapshot = await getDoc(doc(db, "students", studentId));
    if (!snapshot.exists()) return false;
    const data = snapshot.data() || {};
    const type = String(data.studentType || data.grade || "").trim().toLowerCase();
    if (["al", "a/l", "a level", "advanced", "advanced level"].includes(type)) return true;
    if (!Object.prototype.hasOwnProperty.call(data, "paper01")) return true;
    return [true, "true", 1, "1"].includes(data.paper01);
  } catch (error) {
    console.error("Could not verify student access:", error);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#paper01Open, #paper02Open").forEach(button => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      const allowed = await hasAccess();
      button.disabled = false;
      if (!allowed) {
        alert("Unable to verify access to these papers. Please sign in again or contact the administrator.");
        return;
      }
      const paper = button.id === "paper02Open" ? "02" : "01";
      window.location.href = `al-top-ranking-paper.html?paper=${paper}&month=october&year=2026`;
    });
  });
});
