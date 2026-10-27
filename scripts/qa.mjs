import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import { mkdir,readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/workspace/sites/kv-finanzcoach';
await mkdir(root+'/artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:4173/';
await page.goto(base);await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.locator('.topic-card').count(),3);
await page.screenshot({path:root+'/artifacts/home-desktop.png',fullPage:true});
// Every lesson renders. A correct mini-check is necessary to complete a goal.
for(let n=1;n<=9;n++){
  await page.goto(base+'#lesson/'+n);
  await page.waitForSelector('#mini-title');
  const answer=await page.evaluate(n=>QUESTIONS.find(q=>q.lesson===n&&!q.type).answer,n);
  if(n===1){await page.locator(`[data-mini-choice="${(answer+1)%3}"]`).click();await page.locator('#check-mini').click();assert.equal(await page.evaluate(()=>progress.completed.length),0);await page.locator('[data-action="retry-mini"]').click();}
  await page.locator(`[data-mini-choice="${answer}"]`).click();await page.locator('#check-mini').click();
  assert.equal(await page.locator('#check-mini').isVisible(),false);
}
assert.equal(await page.evaluate(()=>progress.completed.length),9);
await page.reload();assert.equal(await page.evaluate(()=>progress.completed.length),9);
// Salary: compare young and contribution-liable examples.
await page.goto(base+'#salary');await page.waitForSelector('#salary-result');
assert.match(await page.locator('#salary-result').innerText(),/990\.00/);
await page.locator('#age-status').selectOption('liable');await page.locator('#salary-form button').click();
assert.match(await page.locator('#salary-result').innerText(),/926\.00/);
await page.locator('#gross').fill('1200');await page.locator('#nbu').fill('1.5');await page.locator('#salary-form button').click();
assert.match(await page.locator('#salary-result').innerText(),/1[’']105\.20/);
// Leasing: advertised example and zero-cost edge case.
await page.goto(base+'#leasing');await page.waitForSelector('#leasing-result');
assert.match(await page.locator('#leasing-result').innerText(),/612\.50/);
assert.match(await page.locator('#leasing-result').innerText(),/29[’']400\.00/);
for(const id of ['rate','operating','upfront'])await page.locator('#'+id).fill('0');
await page.locator('#leasing-form button').click();assert.match(await page.locator('.calc-main').innerText(),/0\.00/);
assert.ok(!(await page.locator('#leasing-result').innerHTML()).includes('NaN'));
// Complete a full test with one deliberate error; results and retry must match.
await page.goto(base+'#test');await page.locator('[data-action="start-test"]').click();
for(let i=0;i<12;i++){
  const q=await page.evaluate(()=>quiz.questions[quiz.index]);
  if(q.type==='number'){await page.locator('#number-answer').fill(String(q.answer).replace('.',','));}
  else await page.locator(`[data-quiz-choice="${i===0?(q.answer+1)%3:q.answer}"]`).click();
  await page.locator('#quiz-submit').click();
}
assert.match(await page.locator('.result-circle').innerText(),/92/);
assert.match(await page.locator('.result-hero p').innerText(),/11 von 12/);
assert.equal(await page.evaluate(()=>progress.bestTest),92);
assert.equal(await page.evaluate(()=>progress.mistakes.length),1);
await page.locator('[data-action="repeat-round-mistakes"]').click();
const retry=await page.evaluate(()=>quiz.questions[quiz.index]);
await page.locator(`[data-quiz-choice="${retry.answer}"]`).click();await page.locator('#quiz-submit').click();
assert.match(await page.locator('#quiz-feedback').innerText(),/Richtig/);
await page.locator('[data-action="next-question"]').click();
assert.equal(await page.evaluate(()=>progress.mistakes.length),0);
await page.goto(base+'#practice');await page.locator('[data-action="start-practice"]').click();
assert.equal(await page.evaluate(()=>quiz.questions.length),8);
// No overflow at key phone/tablet/desktop widths on all screen types.
const routes=['home','learn','lesson/2','lesson/9','practice','test','salary','leasing'];
for(const width of [360,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of routes){
    await page.goto(base+'#'+route);await page.waitForTimeout(30);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert.equal(overflow,false,`Overflow: ${width}px ${route}`);
  }
}
await page.setViewportSize({width:390,height:844});await page.goto(base+'#home');
await page.screenshot({path:root+'/artifacts/home-mobile.png',fullPage:true});
await page.goto(base+'#lesson/9');await page.screenshot({path:root+'/artifacts/lesson-mobile.png',fullPage:true});
// Dialog controls, reset, corrupted storage, and storage denial.
await page.locator('.footer [data-action="sources"]').click();assert.equal(await page.locator('dialog').isVisible(),true);await page.keyboard.press('Escape');
await page.locator('.footer [data-action="reset"]').click();await page.locator('[data-action="confirm-reset"]').click();
assert.equal(await page.evaluate(()=>progress.completed.length),0);
await page.evaluate(()=>localStorage.setItem('finanzcoach-v1','{bad json'));await page.reload();assert.equal(await page.evaluate(()=>progress.completed.length),0);
const blocked=await context.newPage();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});});
await blocked.goto(base);assert.equal(await blocked.locator('.topic-card').count(),3);await blocked.close();
// file:// navigation is blocked by environment policy. Check the standalone
// download over HTTP with every other resource blocked instead.
const offline=await context.newPage();const external=[];
await offline.route('**/*',route=>{if(route.request().url().split('#')[0]===base+'finanzcoach-offline.html')return route.continue();external.push(route.request().url());return route.abort();});
await offline.goto(base+'finanzcoach-offline.html');
assert.equal(await offline.locator('.topic-card').count(),3);
await offline.goto(base+'finanzcoach-offline.html#salary');assert.match(await offline.locator('#salary-result').innerText(),/990\.00/);
assert.deepEqual(external,[]);await offline.close();
// Accessibility scan across representative screens.
const axePath='/workspace/relational-recovery-startable-v1/node_modules/axe-core/axe.min.js';
const axe=await readFile(axePath,'utf8');
await page.setViewportSize({width:1440,height:1100});
for(const route of ['home','learn','lesson/2','practice','test','salary','leasing']){
  await page.goto(base+'#'+route);await page.addScriptTag({content:axe});
  const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  const issues=result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
  if(issues.length)console.log('ACCESSIBILITY',route,JSON.stringify(issues));
  assert.deepEqual(issues,[],`Accessibility: ${route}`);
}
assert.deepEqual(errors,[]);
console.log('PASS: lessons, persistence, salary, leasing, full test, targeted retry, responsive layout, dialogs, storage fallback and offline app.');
await browser.close();
