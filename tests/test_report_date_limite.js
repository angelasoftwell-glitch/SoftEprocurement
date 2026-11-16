const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));const dlg=[];p.on('dialog',d=>{dlg.push(d.message());d.accept()});
await p.goto('file://'+process.cwd()+'/V390.html');await p.waitForTimeout(7000);
let bf=null;for(const f of p.frames()){try{if(await f.evaluate(()=>typeof consOpen==='function'))bf=f}catch(e){}}
await bf.evaluate(()=>consOpen('CONS-DEMO-PAYANT-001'));await p.waitForTimeout(800);
const before=await bf.evaluate(()=>{const c=consCur();return {dl:c.date_limite,ouv:c.ouverture_offres,q:c.date_questions,rep:c.date_reponses}});console.log('before',before);
await bf.evaluate(()=>document.getElementById('v373-btn').click());await p.waitForTimeout(300);
console.log('prefill',await bf.evaluate(()=>({n:document.getElementById('v373-new').value,o:document.getElementById('v390-ouv').value,q:document.getElementById('v390-q').value,rap:document.getElementById('v390-rap').textContent,hint:document.getElementById('v373-hint').textContent,val:document.getElementById('v390-val').textContent})));
await (await bf.$('#v373-modal .v374-dlg')).screenshot({path:'s390_modal.png'});
// bad opening
await bf.evaluate(()=>{const o=document.getElementById('v390-ouv');const d=new Date(document.getElementById('v373-new').value);d.setHours(d.getHours()-2);o.value=consIsoLocal(d);o.oninput()});
console.log('bad ouv msg',await bf.evaluate(()=>document.getElementById('v390-val').textContent));
// far date -> validity warning
await bf.evaluate(()=>{const i=document.getElementById('v373-new');const d=new Date(i.value);d.setDate(d.getDate()+120);i.value=consIsoLocal(d);document.getElementById('v390-ouv').dataset.touched='';i.oninput()});
console.log('far msg',await bf.evaluate(()=>document.getElementById('v390-val').textContent.slice(0,140)));
// good
await bf.evaluate(()=>{const i=document.getElementById('v373-new');const d=new Date(consCur().date_limite);d.setDate(d.getDate()+7);d.setHours(10,0);i.value=consIsoLocal(d);i.oninput();document.getElementById('v373-motif').selectedIndex=2;document.getElementById('v373-just').value='TEST-CLAUDE report de 7 jours';});
await bf.setInputFiles('#v390-pj',{name:'TEST-CLAUDE_decision.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 test')});
await bf.evaluate(()=>document.getElementById('v373-ok').click());await p.waitForTimeout(800);
console.log('dialogs',dlg);
const after=await bf.evaluate(()=>{const c=consCur();const r=c.reports_date_limite;return {dl:c.date_limite,ouv:c.ouverture_offres,q:c.date_questions,rep:c.date_reponses,last:r[r.length-1],add:c.additifs[c.additifs.length-1],mails:JSON.parse(localStorage.getItem('sm324_mails')).slice(0,2).map(m=>m.to+' | '+m.subject)}});console.log('after',JSON.stringify(after,null,1));
await (await bf.$('#v373-report')).screenshot({path:'s390_panel.png'});
await bf.evaluate(()=>document.getElementById('v374-link').click());await p.waitForTimeout(700);
await bf.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:'s390_hist.png'});
const [d]=await Promise.all([p.waitForEvent('download'),bf.evaluate(()=>document.getElementById('v390-exp').click())]);
const fp='s390_export.csv';await d.saveAs(fp);console.log('csv',require('fs').readFileSync(fp,'utf8').split('\n').slice(0,3).join('\n'));
console.log('errs',errs);await b.close();})();
