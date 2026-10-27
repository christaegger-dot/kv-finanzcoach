import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);
assert.equal(await page.evaluate(()=>QUESTIONS.length),45);
assert.equal(await page.evaluate(()=>new Set(QUESTIONS.map(q=>q.id)).size),45);
// Old valid browser progress survives the expanded question bank.
await page.evaluate(()=>localStorage.setItem('finanzcoach-v1',JSON.stringify({completed:[1,2],mastered:['1a','2a'],mistakes:['9c'],bestTest:75,testCount:1})));
await page.reload();assert.equal(await page.evaluate(()=>progress.completed.length),2);
assert.equal(await page.evaluate(()=>progress.bestTest),75);
for(let i=1;i<=9;i++){
  await page.goto(base+'#lesson/'+i);
  const d=page.locator('.recall-panel details');assert.equal(await d.count(),1);
  await d.locator('summary').click();assert.equal(await d.getAttribute('open'),'');
  assert.ok((await d.innerText()).includes('Selbstcheck'));
  assert.equal(await page.evaluate(n=>QUESTIONS.filter(q=>q.lesson===n&&!q.type).length>=4,i),true);
}
// Independent arithmetic fixtures, plus submitted numeric formats.
const numeric=await page.evaluate(()=>QUESTIONS.filter(q=>q.type==='number').map(q=>[q.id,q.answer]));
assert.deepEqual(numeric,[['n1',990],['n2',140],['n3',612.5]]);
for(const [raw,expected] of [['612,50',612.5],['612.50',612.5],["1’000.00",1000],[' 140 ',140],['',null],['1.2.3',null],['-1',null]]){
  const actual=await page.evaluate(raw=>{const n=numericValue(raw);return Number.isFinite(n)?n:null;},raw);assert.equal(actual,expected);
}
// Exercise all 45 questions via actual submit/feedback, including shuffled answers.
await page.evaluate(()=>{progress=freshState();quiz={mode:'mistakes',questions:QUESTIONS.map(shuffledQuestion),index:0,selected:null,number:'',checked:false,answers:[],finished:false};location.hash='quiz';});
for(let i=0;i<45;i++){
  const q=await page.evaluate(()=>quiz.questions[quiz.index]);
  if(q.type==='number')await page.locator('#number-answer').fill(String(q.answer));
  else await page.locator(`[data-quiz-choice="${q.answer}"]`).click();
  await page.locator('#quiz-submit').click();assert.match(await page.locator('#quiz-feedback').innerText(),/Richtig/);
  await page.locator('[data-action="next-question"]').click();
}
assert.match(await page.locator('.result-hero p').innerText(),/45 von 45/);
assert.equal(await page.evaluate(()=>progress.mastered.length),45);
// Pausing and resuming must remain usable on small screens.
await page.goto(base+'#practice');await page.locator('[data-action="start-practice"]').click();
const first=await page.evaluate(()=>quiz.questions[0].id);
await page.locator('.quiz-top a').click();const resume=page.locator('.tip-strip a[href="#quiz"]');
await resume.waitFor({state:'visible'});await resume.click();assert.equal(await page.evaluate(()=>quiz.questions[0].id),first);
await page.reload();assert.match(await page.locator('main').innerText(),/beim Neuladen beendet/);
// Readable notice for denied storage, and recovery from malformed stored JSON.
const denied=await context.newPage();await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}}));
await denied.goto(base);assert.equal(await denied.locator('#storage-note').isVisible(),true);await denied.close();
await page.evaluate(()=>localStorage.setItem('finanzcoach-v1','broken'));await page.goto(base+'#home');await page.reload();
assert.equal(await page.locator('#storage-note').isVisible(),false);
// Accessibility also covers active quiz, feedback, result, open explanations,
// the glossary and sources dialog, which were not covered in the initial pass.
const axe=await readFile('/workspace/relational-recovery-startable-v1/node_modules/axe-core/axe.min.js','utf8');
async function audit(label){
  await page.addScriptTag({content:axe});
  const findings=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  assert.deepEqual(findings.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label);
}
await page.goto(base+'#lesson/2');await page.locator('.glossary summary').click();await page.locator('.recall-panel summary').click();await audit('Open explanations on phone');
await page.locator('.footer [data-action="sources"]').click();await audit('Sources dialog');await page.keyboard.press('Escape');
await page.goto(base+'#practice');await page.locator('[data-action="start-practice"]').click();await audit('Active question');
const current=await page.evaluate(()=>quiz.questions[quiz.index]);
if(current.type==='number')await page.locator('#number-answer').fill('0');else await page.locator('[data-quiz-choice="0"]').click();
await page.locator('#quiz-submit').click();await audit('Question feedback');
await page.evaluate(()=>{quiz={mode:'mistakes',questions:[{...QUESTIONS.find(q=>q.id==='n3')}],index:0,selected:null,number:'',checked:false,answers:[],finished:false};quizView();});
await page.locator('#number-answer').fill('0');await page.locator('#quiz-submit').click();await audit('Numeric wrong-answer feedback');
await page.locator('[data-action="next-question"]').click();await audit('Result and answer review');
// Screenshots capture new content and optional expanded explanations.
await page.goto(base+'#lesson/9');await page.locator('.recall-panel summary').click();
await page.screenshot({path:'/workspace/sites/kv-finanzcoach/artifacts/review-leasing-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);await browser.close();
console.log('PASS: 45-question bank, all answer interactions, nine recall tasks, preserved progress, numeric fixtures, phone resume, reload, storage notices and extended accessibility.');
