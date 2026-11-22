import {db,collection,onSnapshot} from "./firebase.js";

(() => {
  const allowed = {
    grade10: new Set(["modelPapersCard","modelPaperAnswersCard"]),
    grade11: new Set(["modelPapersCard","modelPaperAnswersCard"]),
    al2027: new Set(["modelPapersCard"]),
    al2028: new Set(["theoryExaminationCard","smartBookAnswersCard","schoolPaperAnswersCard"])
  };
  const labels = {grade10:"Grade 10",grade11:"Grade 11",al2027:"A/L 2027",al2028:"A/L 2028"};
  const dashboardGrid = document.querySelector("#learningProgram .portal-program-grid");
  const programGrid = document.querySelector("main .grid");
  if (!dashboardGrid && !programGrid) return;

  const programIds = {
    modelPapersCard:"modelPapers",
    modelPaperAnswersCard:"modelPaperAnswers",
    theoryExaminationCard:"theoryExamination",
    smartBookAnswersCard:"smartBookAnswers",
    schoolPaperAnswersCard:"schoolPaperAnswers"
  };
  let docs = [];
  const cohortKey = () => {
    const program = window.__lmsProgramCohort;
    if (program?.key && allowed[program.key]) return program.key;
    const type = String(sessionStorage.getItem("studentType") || "").toLowerCase();
    const grade = String(sessionStorage.getItem("studentGrade") || "").toLowerCase();
    const year = String(sessionStorage.getItem("alYear") || "").match(/2027|2028/)?.[0] || (grade+type).match(/2027|2028/)?.[0] || "2027";
    if (type.includes("grade10") || grade.includes("grade10")) return "grade10";
    if (type.includes("grade11") || grade.includes("grade11")) return "grade11";
    if (type === "al" || type.includes("advanced") || grade.includes("advanced") || grade.includes("a/l")) return "al"+year;
    return "";
  };
  const escape = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function apply(){
    const cohort = cohortKey();
    if (!cohort || !allowed[cohort]) return;
    const cohortDocs = docs.filter(x=>x.cohort===cohort);
    const settings = new Map(cohortDocs.filter(x=>x.cardId).map(x=>[x.cardId,x]));
    Object.entries(programIds).forEach(([dashboardId,programId])=>{
      if (!allowed[cohort].has(dashboardId)) return;
      const visible = settings.get(dashboardId)?.active !== false;
      const dashboardCard = document.getElementById(dashboardId);
      if (dashboardCard) {
        dashboardCard.hidden = !visible;
        dashboardCard.setAttribute("aria-hidden",String(!visible));
        dashboardCard.style.display = visible ? "" : "none";
      }
      const programCard = programGrid?.querySelector('[data-content-id="'+programId+'"]');
      if (programCard) {
        programCard.hidden = !visible;
        programCard.setAttribute("aria-hidden",String(!visible));
        programCard.style.display = visible ? "flex" : "none";
      }
    });

    document.querySelectorAll("[data-custom-study-card]").forEach(card=>card.remove());
    cohortDocs.filter(x=>x.custom===true && x.active!==false).forEach(item=>{
      const title=escape(item.title), description=escape(item.description);
      if (dashboardGrid) {
        const card=document.createElement("a");
        card.className="portal-program-card";
        card.dataset.customStudyCard=item.id;
        card.href=item.url || "#";
        card.innerHTML='<span class="portal-program-icon blue" aria-hidden="true">📘</span><span class="portal-program-copy"><small>STUDY MATERIALS · '+escape(labels[cohort])+'</small><strong>'+title+'</strong><span>'+description+'</span><span class="material-link">Open resource <b aria-hidden="true">→</b></span></span><span class="portal-card-arrow" aria-hidden="true">↗</span>';
        dashboardGrid.appendChild(card);
      }
      if (programGrid) {
        const card=document.createElement("article");
        card.className="card";
        card.dataset.customStudyCard=item.id;
        card.innerHTML='<div class="ico">📘</div><div><h3>'+title+'</h3><p>'+description+'</p><a href="'+escape(item.url || "#")+'">Open resource →</a></div>';
        programGrid.appendChild(card);
      }
    });
  }
  onSnapshot(collection(db,"dashboardStudyContent"),snapshot=>{
    docs=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    apply();
  },error=>console.error("Dashboard study controls unavailable:",error));
  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-student-type"]});
  window.addEventListener("pageshow",apply);
  window.addEventListener("storage",apply);
  setTimeout(apply,900);
})();
