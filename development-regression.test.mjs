import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,applyEvent,eventChance,activeContraceptionFactor,sideEffectChance,adverseSymptoms,formatPrompt,replay,DRUGS,DEFAULT_CONFIG} from '../core.mjs';
import {parseModelOutput} from '../analyzer.mjs';
const canon={char:{name:'선택된 성인 NPC',sex:'male',secondary:'omega'},user:{name:'페르소나',sex:'female',secondary:'alpha'}};
const advance=(s,id,hours)=>applyEvent(s,{id,kind:'time_advance',hours});
const exposure=(s,id)=>applyEvent(s,{id,kind:'exposure',gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1});
const initial=(config={})=>initialState('regression-0311',canon,config);
function near(x,y,epsilon=1e-8){assert.ok(Math.abs(x-y)<epsilon,`${x} != ${y}`);}

test('pregnancy OFF blocks exposure, pregnancy outcomes, and pregnancy knowledge injected to RP',()=>{
 const s=initial({pregnancyEnabled:false});s.people.char.cycle.ovulationHour=100;advance(s,'a',80);
 assert.equal(eventChance(s,{gestator:'char',donor:'user',penetration:true,deposition:true}).reason,'pregnancy_disabled');
 exposure(s,'x');advance(s,'b',8000);
 assert.equal(s.people.char.pregnancy.status,'none');assert.equal(Object.keys(s.windows).length,0);
 const prompt=formatPrompt(s);assert.match(prompt,/PREGNANCY TRACKING OFF/);assert.doesNotMatch(prompt,/INTERNAL PHYSIOLOGY/);
});

test('default pregnancy ON and 120–180 day due date work after elapsed story time',()=>{
 const s=initial({rate:{rise:1,fertile:1,peak:1,fall:1},windowCap:1});s.people.char.cycle.ovulationHour=100;
 advance(s,'a',80);exposure(s,'b');assert.equal(Object.values(s.windows).length,1);
 advance(s,'c',180*24);
 assert.equal(s.people.char.pregnancy.status,'due');
 const gestation=(s.people.char.pregnancy.dueAt-s.people.char.pregnancy.conceivedAt)/24;
 assert.ok(gestation>=120&&gestation<=180);assert.equal(DEFAULT_CONFIG.pregnancyEnabled,true);
});

test('turning off the pregnancy engine during replay preserves raw events and rolls on re-enable',()=>{
 const rows=[{events:[{id:'t',kind:'time_advance',hours:80},{id:'x',kind:'exposure',gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1},{id:'advance',kind:'time_advance',hours:100}]}];
 // Natural ovulation is unknown in new states until phase reaches each character's first cycle.
 // The event stream is kept unchanged in both configurations.
 const off=replay('r-1',canon,{pregnancyEnabled:false},rows);
 const on=replay('r-1',canon,{pregnancyEnabled:true},rows);
 assert.equal(off.events.length,on.events.length);assert.equal(off.clockHours,on.clockHours);
 assert.equal(off.people.char.pregnancy.status,'none');assert.ok(formatPrompt(on).includes('Story clock'));
});

test('regular fictional contraceptive pill reduces pregnancy probability only in coverage window',()=>{
 const s=initial({oralContraceptiveEffectiveness:.8});s.people.char.cycle.ovulationHour=100;advance(s,'time',80);
 const evt={gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1};
 const baseline=eventChance(s,evt).p;
 applyEvent(s,{id:'dose',kind:'medication',person:'char',drug:'oral_contraceptive',use_mode:'normal'});
 near(activeContraceptionFactor(s,'char'),.2);near(eventChance(s,evt).p,baseline*.2);
 assert.equal(s.people.char.tolerance.oral_contraceptive,0);
 advance(s,'day',25);assert.equal(activeContraceptionFactor(s,'char'),1);
});

test('contraceptive pill does not apply if misused or unlicensed mode',()=>{
 const s=initial();applyEvent(s,{id:'bad',kind:'medication',person:'char',drug:'oral_contraceptive',use_mode:'misuse'});
 assert.equal(activeContraceptionFactor(s,'char'),1);
 assert.ok(s.people.char.tolerance.oral_contraceptive>=6);
});

test('emergency contraception reduction is editable, never compounds on two doses',()=>{
 const s=initial({emergencyContraceptiveReduction:.6});s.people.char.cycle.ovulationHour=100;advance(s,'t',80);exposure(s,'exp');
 const w=Object.values(s.windows)[0],base=w.total,roll=w.roll;
 applyEvent(s,{id:'em-1',kind:'medication',person:'char',drug:'emergency_contraceptive',use_mode:'normal'});
 near(w.total,base*.4);assert.equal(w.roll,roll);
 applyEvent(s,{id:'em-2',kind:'medication',person:'char',drug:'emergency_contraceptive',use_mode:'normal'});
 near(w.total,base*.4);
});

test('long suppressant success is user-configurable with zero and full protection',()=>{
 const full=initial({longSuppressantSuccess:1}), none=initial({longSuppressantSuccess:0});
 for(const s of [full,none])applyEvent(s,{id:'long',kind:'medication',person:'char',drug:'long_suppressant',use_mode:'normal'});
 assert.ok(full.people.char.cycle.ovulationBlockedUntil>0);
 assert.equal(none.people.char.cycle.ovulationBlockedUntil,undefined);
});

test('side-effect symptoms are reproducible, stored independently from normal-dose tolerance',()=>{
 const s=initial({sideEffectScale:100});
 applyEvent(s,{id:'symptom',kind:'medication',person:'char',drug:'oral_suppressant',use_mode:'normal'});
 const p=s.people.char;assert.equal(p.tolerance.oral_suppressant,0);assert.equal(p.adverse.length,1);
 assert.ok(p.adverse[0].symptoms.length>0);assert.deepEqual(p.adverse[0].symptoms,adverseSymptoms(s.seed,{id:'symptom',drug:'oral_suppressant'}));
 assert.equal(DRUGS.oral_suppressant.adverse,.08);assert.equal(sideEffectChance('oral_suppressant',{sideEffectScale:0}),0);
});

test('RP prompt respects explicit and latent preferences without claiming they are mandatory',()=>{
 const s=initial();s.people.char.preferences.confirmed=[{id:'voice_kink',label:'목소리 취향',level:'liked'}];
 s.people.char.preferences.latent=[{id:'roleplay',label:'역할극',level:'latent'}];
 const prompt=formatPrompt(s);assert.match(prompt,/목소리 취향/);assert.match(prompt,/역할극/);assert.match(prompt,/Latent preferences are hypotheses, not consent/);
});

test('analyzer only records explicitly confirmed fictional oral contraceptive consumption',()=>{
 const a='그는 임신을 막기 위한 피임약을 실제로 복용했다.';
 const raw=JSON.stringify({events:[{kind:'medication',person:'char',drug:'oral_contraceptive',use_mode:'normal',evidence:'피임약을 실제로 복용했다'}]});
 const output=parseModelOutput(raw,'',a);assert.equal(output.length,1);assert.equal(output[0].drug,'oral_contraceptive');
});

test('extension presents independent single-NPC tracking and keeps multi-partner unsupported',()=>{
 const js=readFileSync(new URL('../index.js',import.meta.url),'utf8');
 assert.match(js,/선택한 NPC 1명만 추적/);assert.match(js,/여러 상대의 임신·관계 사건을 합산하는 기능은 아직 지원하지 않습니다/);
 assert.match(js,/pregnancyEnabled/);assert.match(js,/recordMedication/);assert.doesNotMatch(js,/abop-time-unit/);
});
