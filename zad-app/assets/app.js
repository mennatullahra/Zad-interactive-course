/* ================= shared helpers ================= */
const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = n => String(n).replace(/\d/g, d => AR[d]);
const qs = k => new URLSearchParams(location.search).get(k);
async function loadJSON(path){ const r = await fetch(path); if(!r.ok) throw new Error(path); return r.json(); }

/* ================= HOME PAGE ================= */
async function renderHome(){
  const data = await loadJSON('data/subjects.json');
  const grid = document.getElementById('grid');
  grid.innerHTML = data.subjects.map(s=>{
    const count = (s.years||[]).reduce((a,y)=>a+(y.lectures?y.lectures.length:0),0);
    const soon = count===0;
    const inner = `
      <div class="ico">${s.icon||'📘'}</div>
      <div class="name">${s.name}</div>
      <div class="desc">${s.desc||''}</div>
      <div class="meta">${soon?'قريبًا':(ar(count)+' محاضرة')}</div>`;
    return soon
      ? `<div class="subject-card soon">${inner}</div>`
      : `<a class="subject-card" href="subject.html?s=${s.key}">${inner}</a>`;
  }).join('');
}

/* ================= SUBJECT PAGE ================= */
async function renderSubject(){
  const key = qs('s');
  const data = await loadJSON('data/subjects.json');
  const s = data.subjects.find(x=>x.key===key);
  if(!s){ document.getElementById('body').innerHTML='<p class="empty-note">المادة غير موجودة.</p>'; return; }
  document.getElementById('subjName').textContent = s.name;
  document.getElementById('subjDesc').textContent = s.desc||'';
  document.title = s.name;
  const body = document.getElementById('body');
  const years = (s.years||[]).filter(y=>y.lectures&&y.lectures.length);
  if(!years.length){ body.innerHTML = '<div class="empty-note">لسه مفيش محاضرات هنا — قريبًا إن شاء الله ✦</div>'; return; }
  body.innerHTML = years.map(y=>`
    <div class="year-group">
      <div class="year-title">السنة ${ar(y.year)}</div>
      ${y.lectures.map(l=>`
        <a class="lec-item" href="lecture.html?s=${s.key}&l=${l.id}">
          <div class="n">${ar(l.no)}</div>
          <div class="txt"><div class="t">${l.title}</div>${l.subtitle?`<div class="st">${l.subtitle}</div>`:''}</div>
          <div class="go">‹</div>
        </a>`).join('')}
    </div>`).join('');
}

/* ================= LECTURE PAGE ================= */
async function renderLecture(){
  const s = qs('s'), l = qs('l');
  let data;
  try{ data = await loadJSON(`data/${s}/${l}.json`); }
  catch(e){ document.getElementById('app').innerHTML='<p class="empty-note">تعذّر تحميل المحاضرة.</p>'; return; }

  document.title = (data.subjectName?data.subjectName+' — ':'') + (data.title||'محاضرة');
  document.getElementById('eyebrow').textContent = `أكاديمية زاد · ${data.subjectName||''}`;
  document.getElementById('title').textContent = data.title||'';
  document.getElementById('subtitle').textContent = data.subtitle||'';
  document.getElementById('backLink').href = `subject.html?s=${s}`;
  document.getElementById('backLink').textContent = '‹ ' + (data.subjectName||'رجوع');

  buildSummary(data);
  buildCards(data);
  buildQuiz(data);
  buildHard(data);
  setupTabs();
}

function buildSummary(data){
  const box = document.getElementById('summaryBox');
  let html = '';
  if(data.lead){ html += `<div class="lead"><h2>فكرة المحاضرة في سطر</h2>${data.lead}</div>`; }
  (data.summary||[]).forEach(sec=>{
    html += `<div class="block"><h3><span class="num">${sec.num||''}</span> ${sec.heading||''}</h3>${sec.html||''}</div>`;
  });
  box.innerHTML = html;
}

/* ---- flashcards ---- */
let FC=[], fcFilter='all', fcIdx=0, fcList=[];
function buildCards(data){
  FC = data.cards||[];
  const filters = data.cardFilters||[];
  const chips = document.getElementById('fcChips');
  chips.innerHTML = `<button class="chip active" data-c="all">الكل</button>` +
    filters.map(f=>`<button class="chip" data-c="${f.key}">${f.label}</button>`).join('');
  chips.querySelectorAll('.chip').forEach(ch=>{
    ch.onclick=()=>{ chips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active')); ch.classList.add('active'); fcFilter=ch.dataset.c; fcBuild(); };
  });
  fcBuild();
  document.getElementById('prevBtn').onclick=()=>fcNav(-1);
  document.getElementById('nextBtn').onclick=()=>fcNav(1);
  document.getElementById('flipBtn').onclick=fcFlip;
  document.getElementById('flashcard').onclick=fcFlip;
}
function fcBuild(){ fcList = fcFilter==='all'?[...FC]:FC.filter(c=>c.c===fcFilter); fcIdx=0; fcRender(); }
function fcRender(){
  if(!fcList.length) return;
  const c = fcList[fcIdx];
  document.getElementById('flashcard').classList.remove('flipped');
  document.getElementById('fcCat').textContent=c.cat||'';
  document.getElementById('fcQ').innerHTML=c.q||'';
  document.getElementById('fcBack').innerHTML=c.back||'';
  document.getElementById('fcCounter').textContent=ar(fcIdx+1)+' / '+ar(fcList.length);
  document.getElementById('prevBtn').disabled=fcIdx===0;
  document.getElementById('nextBtn').disabled=fcIdx===fcList.length-1;
}
function fcFlip(){ document.getElementById('flashcard').classList.toggle('flipped'); }
function fcNav(d){ const n=fcIdx+d; if(n<0||n>=fcList.length) return; fcIdx=n; fcRender(); }

/* ---- quiz ---- */
function buildQuiz(data){
  const QUIZ = data.quiz||[];
  const box = document.getElementById('quizBox');
  let answered=0, correct=0;
  document.getElementById('total').textContent=ar(QUIZ.length);
  document.getElementById('score').textContent=ar(0);
  box.innerHTML='';
  QUIZ.forEach((item,i)=>{
    const card=document.createElement('div'); card.className='qcard';
    const opts=item.o.map((o,j)=>`<button class="opt" data-o="${j}">${o}</button>`).join('');
    card.innerHTML=`<div class="qnum">سؤال ${ar(i+1)}</div><div class="qtext">${item.q}</div>${opts}<div class="explain"><b>الشرح:</b> ${item.e||''}</div>`;
    card.querySelectorAll('.opt').forEach(btn=>{
      btn.onclick=()=>{
        if(card.dataset.done) return; card.dataset.done='1';
        const right=item.a;
        card.querySelectorAll('.opt').forEach(o=>{o.classList.add('locked'); if(+o.dataset.o===right)o.classList.add('correct');});
        if(+btn.dataset.o===right){correct++;} else {btn.classList.add('wrong');}
        card.querySelector('.explain').classList.add('show');
        answered++; document.getElementById('score').textContent=ar(correct);
        if(answered===QUIZ.length){
          const pct=Math.round(correct/QUIZ.length*100);
          const msg=pct>=90?'ممتاز! 🌟':pct>=70?'جيد جدًا — راجع ما أخطأت فيه.':'راجع الملخص ثم أعد الاختبار.';
          document.querySelector('.scorebar').innerHTML=`<span>${msg}</span><span><span class="n">${ar(correct)}</span> / ${ar(QUIZ.length)}</span>`;
        }
      };
    });
    box.appendChild(card);
  });
}

/* ---- hard ---- */
function buildHard(data){
  const HARD=data.hard||[];
  const box=document.getElementById('hardBox'); box.innerHTML='';
  HARD.forEach((item,i)=>{
    const d=document.createElement('div'); d.className='hq';
    d.innerHTML=`<div class="hq-q"><span class="badge">${ar(i+1)}</span><span>${item.q}</span><span class="arrow">‹</span></div><div class="hq-a"><div class="hq-a-inner">${item.a}</div></div>`;
    d.querySelector('.hq-q').onclick=()=>d.classList.toggle('open');
    box.appendChild(d);
  });
}

/* ---- tabs ---- */
function setupTabs(){
  document.querySelectorAll('.tab').forEach(t=>{
    t.onclick=()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById(t.dataset.t).classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
    };
  });
}

/* ---- router: run the right function per page ---- */
document.addEventListener('DOMContentLoaded',()=>{
  const page=document.body.dataset.page;
  const run={home:renderHome,subject:renderSubject,lecture:renderLecture}[page];
  if(run) run().catch(e=>console.error(e));
});
