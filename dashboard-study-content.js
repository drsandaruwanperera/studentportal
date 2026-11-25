import {db,collection,onSnapshot} from "./firebase.js";

(() => {
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
  const escape = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function apply(){
    const resolved = window.__lmsProgramCohort && window.LmsCohort.STUDY_CARD_ALLOW_LIST[window.__lmsProgramCohort.key]
      ? window.__lmsProgramCohort.key
      : window.LmsCohort.resolveSessionCohort().key;
    const cohort = resolved;
    if (!cohort || cohort === "unknown") { window.LmsCohort.showUnknownCohort(); return; }
    const cohortDocs = docs.filter(x=>x.cohort===cohort);
    const settings = new Map(cohortDocs.filter(x=>x.cardId).map(x=>[x.cardId,x]));
    Object.entries(programIds).forEach(([dashboardId,programId])=>{
      // Always enforce the cohort allow-list, including cards made visible by other page scripts.
      const cohortAllowed = window.LmsCohort.STUDY_CARD_ALLOW_LIST[cohort].has(dashboardId);
      const visible = cohortAllowed && settings.get(dashboardId)?.active !== false;
      const dashboardCard = document.getElementById(dashboardId);
      if (dashboardCard) {
        if (dashboardCard.hidden !== !visible) dashboardCard.hidden = !visible;
        if (dashboardCard.getAttribute("aria-hidden") !== String(!visible)) dashboardCard.setAttribute("aria-hidden",String(!visible));
        const displayValue = visible ? "" : "none";
        if (dashboardCard.style.getPropertyValue("display") !== displayValue || dashboardCard.style.getPropertyPriority("display") !== (visible ? "" : "important")) {
          if (visible) dashboardCard.style.removeProperty("display");
          else dashboardCard.style.setProperty("display","none","important");
        }
      }
      const programCard = programGrid?.querySelector('[data-content-id="'+programId+'"]');
      if (programCard) {
        if (programCard.hidden !== !visible) programCard.hidden = !visible;
        if (programCard.getAttribute("aria-hidden") !== String(!visible)) programCard.setAttribute("aria-hidden",String(!visible));
        const displayValue = visible ? "flex" : "none";
        if (programCard.style.getPropertyValue("display") !== displayValue || programCard.style.getPropertyPriority("display") !== "important") {
          programCard.style.setProperty("display",displayValue,"important");
        }
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
  // Do not observe style/hidden changes here: apply() changes those attributes itself,
  // which would recursively retrigger this observer and freeze the page.
  setTimeout(apply,900);
})();
