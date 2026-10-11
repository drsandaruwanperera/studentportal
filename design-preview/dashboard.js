const samplePapers = [
  {name:"Monthly Assessment Paper 01",meta:"Practice paper · Demo content",status:"Available",pending:false},
  {name:"Monthly Assessment Paper 02",meta:"Practice paper · Demo content",status:"Available",pending:false},
  {name:"Monthly Assessment Paper 03",meta:"Submission window · Demo",status:"In progress",pending:true},
  {name:"Monthly Assessment Paper 04",meta:"Results available · Demo score 78/100",status:"Completed",pending:false}
];
const sampleScores = [
  {name:"Monthly Assessment Paper 04",meta:"Sample result · October 2026",status:"78 / 100"},
  {name:"Monthly Assessment Paper 03",meta:"Sample result · September 2026",status:"74 / 100"},
  {name:"Monthly Assessment Paper 02",meta:"Sample result · August 2026",status:"71 / 100"}
];
function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderRows(target, rows, score=false){document.getElementById(target).innerHTML=rows.map(r=>'<article class="card paper"><div class="papericon">▤</div><div class="paperinfo"><b>'+escapeText(r.name)+'</b><small>'+escapeText(r.meta)+'</small></div><span class="status '+(r.pending?'pending':'')+'">'+escapeText(score?r.status:r.status)+'</span></article>').join("");}
renderRows("papers",samplePapers);renderRows("scores",sampleScores,true);
function showView(name){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===name));document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));document.getElementById("crumb").textContent=name.replace(/([A-Z])/g," $1").toUpperCase();window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
document.getElementById("logout").addEventListener("click",()=>{if(confirm("Exit the design preview?"))location.href="portal.html";});