'use strict';
const ICONS = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  book:'<path d="M12 5v16M3 3h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
  flag:'<path d="M5 22V3m0 1c5-4 9 4 14 0v11c-5 4-9-4-14 0"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  left:'<path d="M20 12H4m6-6-6 6 6 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  wallet:'<path d="M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v11H6a3 3 0 0 1-3-3V6m17 6h-5v5h5"/><path d="M16 14.5h1"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  car:'<path d="m5 8 2-5h10l2 5m-16 6v5h3v-3h12v3h3v-9l-2-2H5l-2 2Z"/><path d="M6 12h2m8 0h2M5 8h14"/>',
  trophy:'<path d="M8 3h8v7a4 4 0 0 1-8 0Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8"/>',
  bulb:'<path d="M9 18h6m-6 3h6m-7-7a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2"/><path d="M12 7v5"/>',
  calculator:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h1m3 0h1m3 0h.1M8 15h1m3 0h1m3 0h.1M8 19h1m3 0h1m3 0h.1"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5m-5 0a8 8 0 0 1 14-6l2 3m0 3a8 8 0 0 1-14 6l-2-3"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.book}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY = 'finanzcoach-v1';
const freshState = () => ({completed:[],mastered:[],mistakes:[],bestTest:null,testCount:0});
let storageWorks = true;
function loadState(){
  try {
    const v=JSON.parse(localStorage.getItem(KEY)||'null');
    if(!v || typeof v!=='object')return freshState();
    const questionIds=new Set(QUESTIONS.map(q=>q.id));
    return {
      completed:[...new Set(Array.isArray(v.completed)?v.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=9):[])],
      mastered:[...new Set(Array.isArray(v.mastered)?v.mastered.filter(id=>questionIds.has(id)):[])],
      mistakes:[...new Set(Array.isArray(v.mistakes)?v.mistakes.filter(id=>questionIds.has(id)):[])],
      bestTest:Number.isInteger(v.bestTest)&&v.bestTest>=0&&v.bestTest<=100?v.bestTest:null,
      testCount:Number.isInteger(v.testCount)&&v.testCount>=0?v.testCount:0
    };
  }catch{storageWorks=false;return freshState();}
}
let progress=loadState();
let quiz=null;
let mini={lesson:0,selected:null,checked:false};
let toastTimer;
const main=document.getElementById('main');
const dialog=document.getElementById('info-dialog');
const money = n => new Intl.NumberFormat('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const compactMoney = n => new Intl.NumberFormat('de-CH',{maximumFractionDigits:2}).format(n);
const shuffle = list => {const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function saveState(){try{localStorage.setItem(KEY,JSON.stringify(progress));}catch{if(storageWorks){storageWorks=false;toast('Speichern ist in diesem Browser nicht möglich. Dein Fortschritt bleibt für diese Sitzung erhalten.');}}}
function toast(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4500);}
function updateQuestion(id,correct){
  if(correct){if(!progress.mastered.includes(id))progress.mastered.push(id);progress.mistakes=progress.mistakes.filter(x=>x!==id);}
  else {progress.mastered=progress.mastered.filter(x=>x!==id);if(!progress.mistakes.includes(id))progress.mistakes.push(id);}
}
function setNav(active){
  const links=[['home','home','Übersicht'],['learn','book','Lernen'],['practice','bolt','Üben'],['test','flag','Probetest']];
  document.getElementById('main-nav').innerHTML=links.map(([id,i,label])=>`<a class="nav-link ${id===active?'active':''}" href="#${id}" ${id===active?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${id===active?'<span class="nav-dot" aria-hidden="true"></span>':''}</a>`).join('');
  const label=links.find(x=>x[0]===active)?.[2]||'Übersicht';
  document.getElementById('breadcrumb').innerHTML=`Dein Lernraum <span>/</span> ${label}`;
}
function nextLesson(){return LESSONS.find(l=>!progress.completed.includes(l.id))||LESSONS[0];}
function heroArt(){return `<div class="hero-art" aria-hidden="true"><svg viewBox="0 0 310 260" xmlns="http://www.w3.org/2000/svg"><circle cx="163" cy="128" r="105" fill="#d9e3cb"/><ellipse cx="169" cy="233" rx="111" ry="10" fill="#b1c39d" opacity=".28"/><g transform="rotate(-9 155 125)"><rect x="78" y="32" width="159" height="195" rx="12" fill="#afbf9c" opacity=".2"/><rect x="70" y="24" width="159" height="195" rx="12" fill="#fdfdf7" stroke="#d5dfc9"/><rect x="88" y="45" width="26" height="26" rx="7" fill="#e8eedf"/><path d="M95 59h12m-6-6v12" stroke="#608143" stroke-width="2"/><text x="125" y="55" fill="#7e8e72" font-family="Arial,sans-serif" font-size="7.5" letter-spacing="1">DEIN LEHRLINGSLOHN</text><text x="125" y="68" fill="#234a34" font-family="Arial,sans-serif" font-size="13" font-weight="bold">Lohnabrechnung</text><path d="M89 86h120" stroke="#e4e9dc"/><text x="89" y="107" fill="#829076" font-family="Arial,sans-serif" font-size="9">Bruttolohn</text><text x="209" y="107" text-anchor="end" fill="#36513a" font-family="Arial,sans-serif" font-size="10" font-weight="bold">CHF 1’000</text><text x="89" y="130" fill="#829076" font-family="Arial,sans-serif" font-size="9">Abzüge*</text><text x="209" y="130" text-anchor="end" fill="#36513a" font-family="Arial,sans-serif" font-size="10">− CHF 10</text><rect x="84" y="146" width="132" height="38" rx="7" fill="#e8f0db"/><text x="94" y="169" fill="#54733e" font-family="Arial,sans-serif" font-size="9">Nettolohn</text><text x="207" y="169" text-anchor="end" fill="#234a34" font-family="Arial,sans-serif" font-size="14" font-weight="bold">CHF 990</text><text x="89" y="201" fill="#9ba58d" font-family="Arial,sans-serif" font-size="6.6">*Lernbeispiel mit 16 · nur 1 % NBU angenommen</text></g><g transform="rotate(11 246 191)"><rect x="210" y="155" width="67" height="67" rx="19" fill="#174c3b"/><path d="m229 188 12 12 20-25" fill="none" stroke="#d8f28c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g><circle cx="52" cy="171" r="25" fill="#d7dba3"/><circle cx="49" cy="167" r="25" fill="#e4e8b9" stroke="#bdc78c"/><circle cx="49" cy="167" r="18" fill="none" stroke="#c4cb93"/><text x="49" y="174" fill="#78894e" font-family="Arial,sans-serif" font-size="21" font-weight="bold" text-anchor="middle">₣</text><path d="M263 47v15m-7-7h15M43 96v10m-5-5h10" stroke="#9bb082" stroke-width="2" stroke-linecap="round"/></svg></div>`;}
function heading(kicker,title,description){return `<div class="page-intro"><div class="eyebrow">${kicker}</div><h1 class="page-title">${title}</h1>${description?`<p class="subtext">${description}</p>`:''}</div>`;}
function home(){
  const next=nextLesson();
  main.innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow">DEIN GELD. DEIN DURCHBLICK.</div><h1>Privatfinanzen?<br><em>Hast du im Griff.</em></h1><p>Lohn, Schulden und Leasing – in kleinen Schritten fit für deinen KV-Test.</p><a class="btn" href="#lesson/${next.id}">${progress.completed.length?'Weiterlernen':'Los geht’s'} ${icon('arrow')}</a></div>${heroArt()}</section>
  <section class="stats" aria-label="Dein Lernfortschritt"><div class="stat"><span class="stat-symbol">${icon('book')}</span><div><div class="stat-value">${progress.completed.length} <small>/ 9</small></div><div class="stat-label">Lernziele abgeschlossen</div></div></div><div class="stat"><span class="stat-symbol">${icon('bolt')}</span><div><div class="stat-value">${progress.mastered.length} <small>/ ${QUESTIONS.length}</small></div><div class="stat-label">Fragen richtig beantwortet</div></div></div><div class="stat"><span class="stat-symbol">${icon('trophy')}</span><div><div class="stat-value">${progress.bestTest===null?'–':progress.bestTest+' %'}</div><div class="stat-label">Dein bester Probetest</div></div></div></section>
  <section aria-labelledby="topics-title"><div class="section-heading"><div><h2 id="topics-title">Dein Lernpfad</h2><p>9 Lernziele. Drei Themen. Alles in deinem Tempo.</p></div><a href="#learn">Alle ansehen ${icon('arrow')}</a></div><div class="topic-grid">${GROUPS.map((g,index)=>{const done=g.lessons.filter(n=>progress.completed.includes(n)).length;return `<a href="#learn/${g.id}" class="topic-card ${g.color}"><div class="topic-top"><span class="topic-icon">${icon(g.icon)}</span><span class="topic-index">0${index+1}</span></div><h3>${g.title}</h3><p>${g.description}</p><div class="topic-meta">${g.lessons.length} ${g.lessons.length===1?'Lernziel':'Lernziele'} <span>·</span> ca. ${g.time}</div><div class="progress-track" role="progressbar" aria-label="${g.title}: abgeschlossene Lernziele" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${g.lessons.length}"><span style="width:${done/g.lessons.length*100}%"></span></div><div class="topic-footer"><span>${done} von ${g.lessons.length} abgeschlossen</span>${icon('arrow')}</div></a>`;}).join('')}</div></section>
  <aside class="tip-strip">${icon('bulb')}<div><strong>Lieber kurz lernen. Dafür öfter.</strong><p>Starte mit einer Lektion und teste danach dein Wissen. Fünf Minuten reichen für den Anfang.</p></div><a href="#practice">Direkt üben ${icon('arrow')}</a></aside>
  ${quiz&&!quiz.finished?`<div class="tip-strip">${icon('refresh')}<div><strong>Deine ${quiz.mode==='test'?'Testrunde':'Übungsrunde'} wartet.</strong><p>Du bist bei Frage ${quiz.index+1} von ${quiz.questions.length}.</p></div><a href="#quiz">Fortsetzen ${icon('arrow')}</a></div>`:''}`;
}
function learn(){
  main.innerHTML=heading('SCHRITT FÜR SCHRITT','Dein Lernpfad','Kurz lesen, Beispiel verstehen, eine Frage knacken. Du kannst überall einsteigen.')+`<div class="overview-line"><div class="progress-track"><span style="width:${progress.completed.length/9*100}%"></span></div><span>${progress.completed.length} von 9 Lernzielen abgeschlossen</span></div>`+GROUPS.map(g=>`<section class="lesson-group ${g.color}" id="group-${g.id}"><div class="group-title"><span class="topic-icon">${icon(g.icon)}</span><h2>${g.title}</h2><span>ca. ${g.time}</span></div><div class="lesson-list">${g.lessons.map(id=>{const l=LESSONS.find(x=>x.id===id);const done=progress.completed.includes(id);return `<a class="lesson-row ${done?'done':''}" href="#lesson/${id}"><span class="lesson-number">${done?icon('check'):String(id).padStart(2,'0')}</span><div class="lesson-row-content"><h3>${l.title}</h3><p>${done?'Abgeschlossen · gerne nochmals anschauen':l.subtitle}</p></div><span class="lesson-time">${l.time}</span>${icon('chevron')}</a>`;}).join('')}</div></section>`).join('');
}
function lesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l){location.hash='learn';return;}
  const group=GROUPS.find(g=>g.lessons.includes(id));
  if(mini.lesson!==id)mini={lesson:id,selected:null,checked:false};
  const q=QUESTIONS.find(x=>x.lesson===id&&!x.type);
  main.innerHTML=`<a href="#learn" class="back-link">${icon('left')} Zurück zum Lernpfad</a>`+heading(`LERNZIEL ${id} VON 9 · ${group.title.toUpperCase()}`,l.title,l.subtitle)+`<div class="reading-layout"><div><article class="lesson-article">${l.html}</article><section class="mini-check" aria-labelledby="mini-title"><div class="eyebrow">KURZ-CHECK</div><h3 id="mini-title">${q.q}</h3><div class="choice-list" id="mini-options"></div><div id="mini-feedback"></div><button class="btn" data-action="check-mini" id="check-mini" disabled>Antwort prüfen ${icon('check')}</button></section><div class="lesson-actions">${id>1?`<a href="#lesson/${id-1}" class="btn secondary">${icon('left')} Vorheriges Lernziel</a>`:''}<a href="${id<9?'#lesson/'+(id+1):'#practice'}" class="btn">${id<9?'Nächstes Lernziel':'Jetzt üben'} ${icon('arrow')}</a></div></div><aside class="lesson-aside"><div class="memory-card">${icon('bulb')}<h3>Dein Merksatz</h3><p>${l.memory}</p></div>${l.sources.length?`<p class="lesson-source">Grundlagen: ${l.sources.map(n=>`<a href="${SOURCES[n].url}" target="_blank" rel="noopener noreferrer">${SOURCES[n].by.split(' · ')[0]}</a>`).join(' · ')}<br>Geprüft am 27.10.2026</p>`:''}</aside></div>`;
  renderMini();
}
function renderMini(){
  const q=QUESTIONS.find(x=>x.lesson===mini.lesson&&!x.type);
  if(!q || !document.getElementById('mini-options'))return;
  document.getElementById('mini-options').innerHTML=q.options.map((o,i)=>`<button class="choice ${mini.selected===i?'selected':''} ${mini.checked&&i===q.answer?'correct':''} ${mini.checked&&mini.selected===i&&i!==q.answer?'wrong':''}" data-mini-choice="${i}" aria-pressed="${mini.selected===i}" ${mini.checked?'disabled':''}><span class="choice-letter">${mini.checked&&i===q.answer?icon('check'):String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('');
  const b=document.getElementById('check-mini');b.disabled=mini.selected===null;b.hidden=mini.checked;
  if(mini.checked){const correct=mini.selected===q.answer;document.getElementById('mini-feedback').innerHTML=`<div class="feedback ${correct?'':'wrong'}" tabindex="-1"><strong>${correct?'Richtig. Lernziel abgeschlossen!':'Noch nicht ganz. Schau dir die Erklärung an.'}</strong>${q.explain}</div>${!correct?'<button class="btn secondary" data-action="retry-mini">Nochmals versuchen</button>':''}`;}
}
function practice(){
  main.innerHTML=heading('AUS WISSEN WIRD KÖNNEN','Kurz üben. Mehr verstehen.','Hier darfst du Fehler machen. Du bekommst zu jeder Antwort eine Erklärung.')+`<div class="practice-grid"><section class="practice-start primary"><span class="topic-icon">${icon('bolt')}</span><h2>Eine kleine Übungsrunde</h2><p>8 gemischte Fragen zu Lohn, Schulden und Leasing. Ohne Zeitdruck, mit direktem Feedback.</p><button class="btn" data-action="start-practice">Runde starten ${icon('arrow')}</button></section><section class="practice-start"><span class="topic-icon">${icon('refresh')}</span><h2>Das schaue ich nochmals an</h2><p>${progress.mistakes.length?`${progress.mistakes.length} ${progress.mistakes.length===1?'Frage wartet':'Fragen warten'} auf eine zweite Runde. Wiederhole genau das, was zuletzt noch schwierig war.`:'Hier landen Fragen, die du falsch beantwortest. Aktuell gibt es nichts zu wiederholen.'}</p><button class="btn secondary" data-action="start-mistakes" ${progress.mistakes.length?'':'disabled'}>Fehler wiederholen ${icon('arrow')}</button></section></div>
  ${quiz&&!quiz.finished?`<div class="tip-strip">${icon('refresh')}<div><strong>Du hast eine laufende Runde.</strong><p>Frage ${quiz.index+1} von ${quiz.questions.length}</p></div><a href="#quiz">Fortsetzen ${icon('arrow')}</a></div>`:''}
  <h2 class="small-heading">Selbst ausprobieren</h2><div class="tools-grid"><section class="tool-card"><span class="topic-icon sage">${icon('calculator')}</span><h3>Dein Lohn im Check</h3><p>Verändere den Lohn und die NBU-Prämie. Sieh den Unterschied mit und ohne AHV-Pflicht.</p><a href="#salary">Zum Lohnrechner ${icon('arrow')}</a></section><section class="tool-card"><span class="topic-icon lavender">${icon('car')}</span><h3>Die ganze Leasing-Rechnung</h3><p>Was steckt hinter einer kleinen Monatsrate? Teste Laufzeit und zusätzliche Kosten.</p><a href="#leasing">Zum Leasingrechner ${icon('arrow')}</a></section></div>`;
}
function testIntro(){
  main.innerHTML=heading('BEREIT FÜR DEN TEST?','Zeig, was du schon kannst.','Ein Probetest zu allen neun Lernzielen – in deinem Tempo.')+`<section class="test-intro"><span class="topic-icon">${icon('flag')}</span><h2>Dein Wissens-Check</h2><p>Eine Auswahlfrage pro Lernziel und drei Rechenaufgaben. Die Lösungen siehst du am Schluss. Papier und Stift sind für die Rechnungen hilfreich.</p><div class="test-facts"><div><strong>12 Fragen</strong><span>aus allen Themen</span></div><div><strong>ca. 10 Min.</strong><span>ohne Zeitlimit</span></div><div><strong>1 Punkt</strong><span>pro richtiger Antwort</span></div></div><p>Die Prozentzahl zeigt deinen Übungsstand. Sie ist keine offizielle Schulnote.${progress.bestTest!==null?` Dein bisher bestes Ergebnis: <strong>${progress.bestTest} %</strong>.`:''}</p><div class="result-actions" style="justify-content:flex-start"><button class="btn large" data-action="start-test">Probetest starten ${icon('arrow')}</button>${quiz&&!quiz.finished&&quiz.mode==='test'?'<a class="btn secondary" href="#quiz">Laufenden Test fortsetzen</a>':''}</div></section>`;
}
function shuffledQuestion(q){
  if(q.type==='number')return {...q};
  const order=shuffle(q.options.map((_,i)=>i));
  return {...q,options:order.map(i=>q.options[i]),answer:order.indexOf(q.answer)};
}
function startQuiz(mode){
  let questions;
  if(mode==='test')questions=[...LESSONS.map(l=>shuffle(QUESTIONS.filter(q=>q.lesson===l.id&&!q.type))[0]),...QUESTIONS.filter(q=>q.type==='number')];
  else if(mode==='mistakes')questions=shuffle(QUESTIONS.filter(q=>progress.mistakes.includes(q.id)));
  else questions=shuffle(QUESTIONS).slice(0,8);
  if(!questions.length){toast('Zurzeit gibt es keine Fehler zu wiederholen.');return;}
  quiz={mode,questions:questions.map(shuffledQuestion),index:0,selected:null,number:'',checked:false,answers:[],finished:false};
  if(location.hash==='#quiz')route();else location.hash='quiz';
}
function numericValue(raw){const v=String(raw).trim().replace(/[’'\s]/g,'').replace(',','.');return /^\d+(\.\d{1,2})?$/.test(v)?Number(v):NaN;}
function answerReady(){const q=quiz.questions[quiz.index];return q.type==='number'?Number.isFinite(numericValue(quiz.number)):quiz.selected!==null;}
function isCorrect(q,value){return q.type==='number'?Number.isFinite(value)&&Math.abs(value-q.answer)<0.005:value===q.answer;}
function quizView(){
  if(!quiz){testIntro();return;}
  if(quiz.finished){results();return;}
  const q=quiz.questions[quiz.index],test=quiz.mode==='test';
  const correct=quiz.checked&&quiz.answers[quiz.index]?.correct;
  main.innerHTML=`<div class="quiz-shell"><div class="quiz-top"><a class="back-link" href="${test?'#test':'#practice'}" style="margin:0">${icon('left')} Runde pausieren</a><span>${test?'Probetest':quiz.mode==='mistakes'?'Fehler wiederholen':'Übungsrunde'} · ${quiz.index+1} / ${quiz.questions.length}</span></div><div class="progress-track quiz-progress" role="progressbar" aria-label="Beantwortete Fragen" aria-valuenow="${quiz.index}" aria-valuemin="0" aria-valuemax="${quiz.questions.length}"><span style="width:${quiz.index/quiz.questions.length*100}%"></span></div><section class="question-panel"><div class="question-context">Lernziel ${q.lesson} · ${GROUPS.find(g=>g.lessons.includes(q.lesson)).title}</div><h1 tabindex="-1" id="question-title">${esc(q.q)}</h1>
  ${q.type==='number'?`<div class="numeric-wrap"><label for="number-answer">${q.unit}</label><input type="text" inputmode="decimal" autocomplete="off" id="number-answer" placeholder="Deine Antwort" value="${esc(quiz.number)}" ${quiz.checked?'disabled':''} aria-describedby="number-hint"></div><p class="question-hint" id="number-hint">${esc(q.hint||'Zahl mit Punkt oder Komma eingeben.')}</p>`:`<div class="choice-list">${q.options.map((o,i)=>`<button class="choice ${quiz.selected===i?'selected':''} ${quiz.checked&&i===q.answer?'correct':''} ${quiz.checked&&quiz.selected===i&&i!==q.answer?'wrong':''}" data-quiz-choice="${i}" aria-pressed="${quiz.selected===i}" ${quiz.checked?'disabled':''}><span class="choice-letter">${quiz.checked&&i===q.answer?icon('check'):String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}</div>`}
  ${quiz.checked?`<div class="feedback ${correct?'':'wrong'}" tabindex="-1" id="quiz-feedback"><strong>${correct?'Richtig, gut gemacht.':'Noch nicht ganz. Das ist die Lösung:'}</strong>${q.explain}</div><button class="btn" data-action="next-question">${quiz.index===quiz.questions.length-1?'Ergebnis ansehen':'Nächste Frage'} ${icon('arrow')}</button>`:`<button class="btn" id="quiz-submit" data-action="submit-answer" ${answerReady()?'':'disabled'}>${test?(quiz.index===quiz.questions.length-1?'Test auswerten':'Antwort speichern & weiter'):'Antwort prüfen'} ${icon(test?'arrow':'check')}</button>`}
  ${test?'<p class="question-hint">Die Auswertung und alle Erklärungen bekommst du am Schluss.</p>':''}</section></div>`;
}
function submitAnswer(){
  if(!quiz||quiz.finished||quiz.checked||!answerReady())return;
  const q=quiz.questions[quiz.index];const value=q.type==='number'?numericValue(quiz.number):quiz.selected;
  const correct=isCorrect(q,value);quiz.answers[quiz.index]={value,correct};
  if(quiz.mode==='test'){advanceQuiz();}
  else {updateQuestion(q.id,correct);saveState();quiz.checked=true;quizView();document.getElementById('quiz-feedback')?.focus();}
}
function advanceQuiz(){
  if(quiz.index===quiz.questions.length-1){
    quiz.finished=true;
    if(quiz.mode==='test'){
      quiz.questions.forEach((q,i)=>updateQuestion(q.id,quiz.answers[i].correct));
      const score=Math.round(quiz.answers.filter(a=>a.correct).length/quiz.questions.length*100);
      progress.bestTest=Math.max(progress.bestTest||0,score);progress.testCount++;
      saveState();
    }
    results();main.focus();window.scrollTo(0,0);
  } else {quiz.index++;quiz.selected=null;quiz.number='';quiz.checked=false;quizView();document.getElementById('question-title')?.focus();window.scrollTo(0,0);}
}
function results(){
  if(!quiz)return;
  const count=quiz.answers.filter(a=>a.correct).length,total=quiz.questions.length,percent=Math.round(count/total*100),wrong=total-count;
  const title=percent===100?'Stark. Alles richtig!':percent>=75?'Du bist auf einem guten Weg.':percent>=50?'Die Grundlagen sitzen schon.':'Ein guter Start zum Weiterlernen.';
  main.innerHTML=`<div class="quiz-shell"><section class="result-hero"><div class="result-circle">${percent}%</div><h1>${title}</h1><p>${count} von ${total} Fragen richtig. ${wrong?`Schau dir die ${wrong===1?'eine knifflige Frage':'kniffligen Fragen'} nochmals an. Jeder Fehler zeigt dir, wo sich Üben lohnt.`:'Gönn dir eine Pause oder probiere eine neue Runde.'}</p><div class="result-actions">${wrong?'<button class="btn" data-action="repeat-round-mistakes">Fehler dieser Runde üben '+icon('refresh')+'</button>':''}<button class="btn ${wrong?'secondary':''}" data-action="${quiz.mode==='test'?'start-test':'start-practice'}">Neue ${quiz.mode==='test'?'Testrunde':'Übungsrunde'} ${icon('arrow')}</button><a class="btn secondary" href="#home">Zur Übersicht</a></div></section><h2 class="results-heading">Deine Antworten im Überblick</h2>${quiz.questions.map((q,i)=>{const a=quiz.answers[i];const answerText=q.type==='number'?`${compactMoney(a.value)} ${q.unit}`:q.options[a.value];const solution=q.type==='number'?`${money(q.answer)} ${q.unit}`:q.options[q.answer];return `<details class="review-card" ${!a.correct?'open':''}><summary><span class="${a.correct?'review-correct':'review-wrong'}">${a.correct?'✓ Richtig':'↻ Noch üben'}</span> · ${esc(q.q)}</summary><div class="review-answers"><div>Deine Antwort: <strong>${esc(answerText)}</strong></div>${!a.correct?`<div class="review-correct">Richtige Antwort: <strong>${esc(solution)}</strong></div>`:''}</div><p>${q.explain}</p><p><a href="#lesson/${q.lesson}"><u>Lernziel ${q.lesson} nochmals anschauen →</u></a></p></details>`;}).join('')}</div>`;
}
function field(id,label,value,min,max,step,small=''){return `<div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="${min}" max="${max}" step="${step}" required>${small?`<small>${small}</small>`:''}</div>`;}
function salary(){
  main.innerHTML=`<a href="#practice" class="back-link">${icon('left')} Zurück zum Üben</a>`+heading('SELBST AUSPROBIEREN','Was bleibt von deinem Lohn?','Ein vereinfachter Lernrechner für Lehrlingslöhne – keine vollständige Lohnabrechnung.')+`<div class="calculator-layout"><form class="calculator-controls" id="salary-form"><h2>Deine Annahmen</h2>${field('gross','Bruttolohn pro Monat (CHF)',1000,0,5000,.01)}<div class="field"><label for="age-status">Beitragspflicht</label><select id="age-status"><option value="young">16 Jahre · noch nicht AHV-pflichtig</option><option value="liable">Jahr des 18. Geburtstags oder später</option></select><small>AHV/IV/EO und ALV ab dem 1. Januar im Jahr des 18. Geburtstags.</small></div>${field('nbu','Angenommener NBU-Abzug (%)',1,0,5,.01,'Der tatsächliche Satz variiert. 0 % bedeutet hier: kein Abzug, z. B. weil der Betrieb zahlt.')}<button class="btn" type="submit">Neu berechnen ${icon('calculator')}</button><p class="calc-note">Annahme: NBU-Schutz über den Betrieb, mindestens acht Wochenstunden. Weitere Abzüge (z. B. BVG, KTG), Spesen und Verrechnungen sind nicht enthalten. Sätze 2026.</p></form><section class="calculator-result" id="salary-result" aria-live="polite" aria-atomic="true"></section></div>`;
  calculateSalary();
}
function calculateSalary(){
  const form=document.getElementById('salary-form');if(!form.reportValidity())return;
  const gross=Number(document.getElementById('gross').value),nbu=Number(document.getElementById('nbu').value),liable=document.getElementById('age-status').value==='liable';
  const round=n=>Math.round((n+Number.EPSILON)*100)/100;
  const ahv=liable?round(gross*.053):0,alv=liable?round(gross*.011):0,accident=round(gross*nbu/100),net=round(gross-ahv-alv-accident);
  document.getElementById('salary-result').innerHTML=`<h2>Dein Nettolohn im Lernbeispiel</h2><div class="calc-main">CHF ${money(net)}</div><p class="calc-description">${liable?'Mit AHV/IV/EO- und ALV-Beiträgen':'Mit 16: noch keine AHV/IV/EO- und ALV-Beiträge'}</p><div class="calc-lines"><div class="calc-line"><span>Bruttolohn</span><strong>CHF ${money(gross)}</strong></div><div class="calc-line"><span>AHV / IV / EO · ${liable?'5,3 %':'noch nicht pflichtig'}</span><strong>− CHF ${money(ahv)}</strong></div><div class="calc-line"><span>ALV · ${liable?'1,1 %':'noch nicht pflichtig'}</span><strong>− CHF ${money(alv)}</strong></div><div class="calc-line"><span>NBU · angenommen ${compactMoney(nbu)} %</span><strong>− CHF ${money(accident)}</strong></div><div class="calc-line total"><span>Nettolohn</span><strong>CHF ${money(net)}</strong></div></div><p class="calc-note">Auch vom Nettolohn musst du noch deine persönlichen Ausgaben und Rückstellungen einplanen.</p>`;
}
function leasing(){
  main.innerHTML=`<a href="#practice" class="back-link">${icon('left')} Zurück zum Üben</a>`+heading('DIE GANZE RECHNUNG','Die Rate ist erst der Anfang.','Ein fiktives Autoleasing als Lernbeispiel für später. Was kostet die Nutzung insgesamt?')+`<div class="calculator-layout"><form class="calculator-controls" id="leasing-form"><h2>Deine Annahmen</h2>${field('rate','Leasingrate pro Monat (CHF)',250,0,5000,.01)}<div class="field"><label for="months">Laufzeit</label><select id="months"><option value="24">24 Monate · 2 Jahre</option><option value="36">36 Monate · 3 Jahre</option><option value="48" selected>48 Monate · 4 Jahre</option><option value="60">60 Monate · 5 Jahre</option></select></div>${field('operating','Betriebskosten pro Monat (CHF)',300,0,5000,.01,'Zum Beispiel Versicherung, Treibstoff, Abgaben und Unterhalt.')}${field('upfront','Einmalige Sonderzahlung (CHF)',3000,0,100000,.01,'Nicht rückzahlbar. Keine Kaution.')}<button class="btn" type="submit">Gesamtkosten berechnen ${icon('calculator')}</button><p class="calc-note">Eine spätere Übernahme, Mehrkilometer, Rückgabeschäden und vorzeitige Beendigung sind nicht enthalten. Keine Offerte.</p></form><section class="calculator-result" id="leasing-result" aria-live="polite" aria-atomic="true"></section></div>`;
  calculateLeasing();
}
function calculateLeasing(){
  if(!document.getElementById('leasing-form').reportValidity())return;
  const rate=Number(document.getElementById('rate').value),months=Number(document.getElementById('months').value),operating=Number(document.getElementById('operating').value),upfront=Number(document.getElementById('upfront').value);
  const a=rate*months,b=operating*months,total=a+b+upfront;
  document.getElementById('leasing-result').innerHTML=`<h2>Durchschnittliche Gesamtausgaben</h2><div class="calc-main">CHF ${money(total/months)}</div><p class="calc-description">pro Monat · beworbene Rate: CHF ${money(rate)}</p><div class="cost-bar" aria-hidden="true"><span style="width:${total?a/total*100:0}%"></span><span style="width:${total?b/total*100:0}%"></span><span style="width:${total?upfront/total*100:0}%"></span></div><div class="bar-legend"><span><i></i>Raten</span><span><i></i>Betrieb</span><span><i></i>Sonderzahlung</span></div><div class="calc-lines"><div class="calc-line"><span>${months} Monatsraten</span><strong>CHF ${money(a)}</strong></div><div class="calc-line"><span>Betrieb über ${months} Monate</span><strong>CHF ${money(b)}</strong></div><div class="calc-line"><span>Einmalige Sonderzahlung</span><strong>CHF ${money(upfront)}</strong></div><div class="calc-line total"><span>Gesamtausgaben</span><strong>CHF ${money(total)}</strong></div></div><p class="calc-note">${money(total)} ÷ ${months} = CHF ${money(total/months)} pro Monat.</p><p class="note">Die Verpflichtungen bleiben grundsätzlich bestehen, auch wenn dein Einkommen sinkt. Das Auto gehört dir nicht automatisch.</p>`;
}
function openDialog(title,body,actions=''){
  dialog.innerHTML=`<div class="dialog-header"><h2 id="dialog-title">${title}</h2><button class="close-button" aria-label="Schliessen" data-action="close-dialog">${icon('close')}</button></div><div class="dialog-copy">${body}</div>${actions?`<div class="dialog-actions">${actions}</div>`:''}`;
  dialog.showModal();
}
function showSources(){openDialog('Quellen & Infos',`<p>FinanzCoach hilft dir beim Lernen für das erste KV-Lehrjahr. Grundlage sind die neun Lernziele aus dem geteilten Chat. Beispiele sind vereinfacht und fiktiv.</p><p><strong>Inhalte geprüft am 27. Oktober 2026.</strong> Beitragssätze: 2026. Das neue Sanierungsverfahren mit möglicher Restschuldbefreiung ist noch nicht in Kraft.</p><div class="source-links">${SOURCES.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗<small>${s.by}</small></a>`).join('')}</div><p><strong>Dein Fortschritt:</strong> Er wird nur in diesem Browser gespeichert. Es gibt keine Übertragung deiner Antworten an einen Lernserver. Auf einem anderen Gerät oder nach dem Löschen der Browserdaten startest du neu.</p><p><strong>Offline nutzen:</strong> Lade die Offline-Version über den Link unten auf der Seite herunter. Öffne diese HTML-Datei im Browser. Der Fortschritt der Offline-Datei kann je nach Browser separat gespeichert werden. Laufende Quizrunden bleiben bis zum Neuladen der Seite erhalten.</p>`);}
function route(){
  const [page,arg]=(location.hash.slice(1)||'home').split('/');
  let active=page==='lesson'?'learn':['salary','leasing'].includes(page)?'practice':page==='quiz'?(quiz?.mode==='test'?'test':'practice'):page;
  if(!['home','learn','practice','test'].includes(active))active='home';
  setNav(active);
  if(page==='learn')learn();else if(page==='lesson')lesson(Number(arg));else if(page==='practice')practice();else if(page==='test')testIntro();else if(page==='quiz')quizView();else if(page==='salary')salary();else if(page==='leasing')leasing();else home();
  document.title=`${active==='home'?'Dein Lernraum':active==='learn'?'Lernen':active==='practice'?'Üben':'Probetest'} · FinanzCoach`;
  window.scrollTo(0,0);main.focus({preventScroll:true});
  if(page==='learn'&&arg){document.getElementById('group-'+arg)?.scrollIntoView({block:'start'});}
}
document.addEventListener('click',event=>{
  const miniChoice=event.target.closest('[data-mini-choice]');
  if(miniChoice&&!mini.checked){mini.selected=Number(miniChoice.dataset.miniChoice);renderMini();document.querySelector(`[data-mini-choice="${mini.selected}"]`)?.focus({preventScroll:true});return;}
  const quizChoice=event.target.closest('[data-quiz-choice]');
  if(quizChoice&&quiz&&!quiz.checked){quiz.selected=Number(quizChoice.dataset.quizChoice);quizView();document.querySelector(`[data-quiz-choice="${quiz.selected}"]`)?.focus({preventScroll:true});return;}
  const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='sources')showSources();
  else if(action==='close-dialog')dialog.close();
  else if(action==='start-practice')startQuiz('practice');
  else if(action==='start-test')startQuiz('test');
  else if(action==='start-mistakes')startQuiz('mistakes');
  else if(action==='submit-answer')submitAnswer();
  else if(action==='next-question'&&quiz?.checked)advanceQuiz();
  else if(action==='repeat-round-mistakes'){
    const wrong=quiz.questions.filter((_,i)=>!quiz.answers[i].correct);
    quiz={mode:'mistakes',questions:wrong.map(shuffledQuestion),index:0,selected:null,number:'',checked:false,answers:[],finished:false};
    quizView();main.focus();window.scrollTo(0,0);
  }
  else if(action==='check-mini'&&!mini.checked&&mini.selected!==null){
    mini.checked=true;const q=QUESTIONS.find(x=>x.lesson===mini.lesson&&!x.type),correct=mini.selected===q.answer;
    updateQuestion(q.id,correct);
    if(correct&&!progress.completed.includes(mini.lesson)){progress.completed.push(mini.lesson);toast('Lernziel abgeschlossen. Ein Schritt weiter!');}
    saveState();renderMini();document.querySelector('#mini-feedback .feedback')?.focus({preventScroll:true});
  }
  else if(action==='retry-mini'){mini.selected=null;mini.checked=false;document.getElementById('mini-feedback').innerHTML='';renderMini();document.querySelector('[data-mini-choice]')?.focus({preventScroll:true});}
  else if(action==='reset')openDialog('Fortschritt wirklich löschen?','<p>Abgeschlossene Lernziele, beantwortete Fragen, Fehler und das beste Testergebnis werden in diesem Browser zurückgesetzt.</p>','<button class="btn secondary" data-action="close-dialog">Behalten</button><button class="btn" data-action="confirm-reset">Fortschritt löschen</button>');
  else if(action==='confirm-reset'){progress=freshState();quiz=null;mini={lesson:0,selected:null,checked:false};saveState();dialog.close();route();toast('Dein Lernraum ist zurückgesetzt.');}
});
document.addEventListener('input',event=>{if(event.target.id==='number-answer'&&quiz){quiz.number=event.target.value;document.getElementById('quiz-submit').disabled=!answerReady();}});
document.addEventListener('keydown',event=>{if(event.target.id==='number-answer'&&event.key==='Enter'&&answerReady()){event.preventDefault();submitAnswer();}});
document.addEventListener('submit',event=>{if(event.target.id==='salary-form'){event.preventDefault();calculateSalary();}if(event.target.id==='leasing-form'){event.preventDefault();calculateLeasing();}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
window.addEventListener('hashchange',route);
route();
