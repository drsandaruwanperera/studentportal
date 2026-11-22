import {db,collection,onSnapshot} from "./firebase.js";

(() => {
  const allowed = {
    grade10: new Set(["modelPapersCard","modelPaperAnswersCard"]),
    grade11: new Set(["modelPapersCard","modelPaperAnswersCard"]),
    al2027: new Set(["modelPapersCard"]),
    al2028: new Set(["theoryExaminationCard","smartBookAnswersCard","schoolPaperAnswersCard"])
  };
  const labels = {grade10:"Grade 10",grade11:"Grade 11",al2027:"A/L 2027",al2028:"A/L 2028"};
  const grid = document.querySelector("#learningProgram .portal-program-grid");
  if (!grid) return;
  let docs = [];
  const cohortKey = () => {
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
    grid.querySelectorAll(".portal-program-card[id]").forEach(card=>{
      const id=card.id;
      if (!allowed[cohort].has(id)) return;
      const setting=settings.get(id);
      const visible=setting?.active!==false;
      card.hidden=!visible;
      card.setAttribute("aria-hidden",String(!visible));
      card.style.display=visible?"":"none";
    });
    grid.querySelectorAll("[data-custom-study-card]").forEach(card=>card.remove());
    cohortDocs.filter(x=>x.custom===true && x.active!==false).forEach(item=>{
      const card=document.createElement("a");
      card.className="portal-program-card";
      card.dataset.customStudyCard=item.id;
      card.href=item.url || "#";
      card.innerHTML='<span class="portal-program-icon blue" aria-hidden="true">📘</span><span class="portal-program-copy"><small>STUDY MATERIALS · '+escape(labels[cohort])+'</small><strong>'+escape(item.title)+'</strong><span>'+escape(item.description)+'</span><span class="material-link">Open resource <b aria-hidden="true">→</b></span></span><span class="portal-card-arrow" aria-hidden="true">↗</span>';
      grid.appendChild(card);
    });
  }
  onSnapshot(collection(db,"dashboardStudyContent"),snapshot=>{
    docs=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    apply();
  },error=>console.error("Dashboard study controls unavailable:",error));
  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-student-type"]});
  window.addEventListener("pageshow",apply);
  setTimeout(apply,900);
})();