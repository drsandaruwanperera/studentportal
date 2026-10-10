import { db, doc, getDoc } from "./firebase.js";
if (sessionStorage.getItem("loggedIn") !== "true") window.location.replace("index.html");
const studentId = sessionStorage.getItem("studentId");
async function hasAccess() {
 if (!studentId) return false;
 try {
  const snap = await getDoc(doc(db, "students", studentId));
  if (!snap.exists()) return false;
  const d = snap.data() || {};
  const t = String(d.studentType || d.grade || "").trim().toLowerCase();
  if (["al","a/l","a level","advanced","advanced level"].includes(t)) return true;
  if (!Object.prototype.hasOwnProperty.call(d,"paper01")) return true;
  return [true,"true",1,"1"].includes(d.paper01);
 } catch(e) { console.error(e); return false; }
}
document.addEventListener("DOMContentLoaded", () => {
 document.querySelectorAll("#paper01Open,#paper02Open").forEach(btn => btn.addEventListener("click", async () => {
  btn.disabled = true;
  const ok = await hasAccess();
  btn.disabled = false;
  if (!ok) { alert("Could not verify paper access. Please sign in again or contact the administrator."); return; }
  const paper = btn.id === "paper02Open" ? "02" : "01";
  location.href = `al-top-ranking-paper.html?paper=${paper}&month=october&year=2026`;
 }));
});