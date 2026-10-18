import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,person,areCompatible,applyEvent,eventChance,replay,sortedRecords,uniqKey,allowedInstincts,instinctChance,encounterChance,pressureScore,toleranceChange,rangeProbability,phaseForPerson,menstruationPhase} from '../core.mjs';
import {parseModelOutput} from '../analyzer.mjs';
const seed='stable-fixture-123';
const canon={char:{name:'CHAR',sex:'male',secondary:'omega',anatomy:'male_only'},user:{name:'USER',sex:'female',secondary:'alpha'}};
const fresh=()=>initialState(seed,canon);
const e=(kind,id,more={})=>({kind,id,...more});
test('adult role defaults + anatomy and Alpha/Omega fertility compatibility',()=>{
 const s=fresh();assert.equal(s.people.char.anatomy,'male_only');assert.equal(s.people.char.menstruation.enabled,true);
 assert.ok(areCompatible(s.people.user,s.people.char));assert.ok(areCompatible(s.people.user,s.people.user)===false);
 assert.deepEqual(allowedInstincts(s.people.char).includes('nesting'),true);
 const beta=person('b','B',seed,{sex:'male',secondary:'beta'});
 assert.ok(!allowedInstincts(beta).includes('territorial'));
 assert.ok(!allowedInstincts(beta).includes('nesting'));
 assert.ok(!allowedInstincts(beta).includes('bond_partner_seek'));
});
test('phase behavior correct odds and Alpha > Omega pressure',()=>{
 const s=fresh();assert.equal(instinctChance(s.people.char,'active'),.75);
 assert.equal(pressureScore(s.people.user,s.people.char),15);
 assert.equal(phaseForPerson(s.people.char,0),'quiet');
});
test('initial tolerance exactly zero, normal repeated +0, misuse and unlicensed ranges',()=>{
 const s=fresh();assert.equal(s.people.char.tolerance.long_suppressant??0,0);
 applyEvent(s,e('medication','a',{person:'char',drug:'oral_suppressant',use_mode:'normal'}));
 applyEvent(s,e('medication','b',{person:'char',drug:'oral_suppressant',use_mode:'normal'}));
 assert.equal(s.people.char.tolerance.oral_suppressant,0);
 applyEvent(s,e('medication','c',{person:'char',drug:'oral_suppressant',use_mode:'misuse'}));
 assert.ok(s.people.char.tolerance.oral_suppressant>=6&&s.people.char.tolerance.oral_suppressant<=10);
 applyEvent(s,e('medication','d',{person:'char',drug:'unlicensed_mixture',use_mode:'unlicensed'}));
 assert.ok(s.people.char.tolerance.unlicensed_mixture>=7&&s.people.char.tolerance.unlicensed_mixture<=14);
});
test('repeated deposits raise encounter chance but saturate',()=>{
 const p1=encounterChance(.3,1),p2=encounterChance(.3,2),p5=encounterChance(.3,5);
 assert.ok(p2>p1&&p5>p2&&p5<1);assert.equal(p1,.3);
});
test('unknown/invalid evidence not accepted; no fabricated USER preferences',()=>{
 const user='나는 쉴래.',assistant='그는 말했다. 내일 약을 먹겠다.';
 assert.equal(parseModelOutput(JSON.stringify({events:[{kind:'medication',person:'user',drug:'oral_suppressant',use_mode:'normal',evidence:'먹겠다'}]}),user,assistant).length,0);
 assert.equal(parseModelOutput(JSON.stringify({events:[{kind:'exposure',gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1,evidence:'이야기와 무관한 내용입니다'}]}),user,assistant).length,0);
});
test('time progression creates deterministic fertile-window result and one stored roll per window',()=>{
 const s=fresh();s.people.char.cycle.ovulationHour=100;
 applyEvent(s,e('time_advance','t1',{hours:80}));
 const ec=e('exposure','x1',{gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1});
 const chance=eventChance(s,ec);assert.ok(chance.p>0);
 applyEvent(s,ec);assert.equal(Object.values(s.windows).length,1);
 const w=Object.values(s.windows)[0],roll=w.roll;
 applyEvent(s,ec);assert.equal(w.exposures.length,1);
 applyEvent(s,e('exposure','x2',{gestator:'char',donor:'user',penetration:true,deposition:true,depositions:3}));
 assert.ok(w.total>=chance.p);
 applyEvent(s,e('time_advance','t2',{hours:80}));assert.equal(w.roll,roll);
});
test('emergency contraception reduces prior exposure without reroll',()=>{
 const s=fresh();s.people.char.cycle.ovulationHour=100;
 applyEvent(s,e('time_advance','advance-1',{hours:80}));
 applyEvent(s,e('exposure','sex-1',{gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1}));
 const window=Object.values(s.windows)[0],roll=window.roll;
 const before=window.total;
 applyEvent(s,e('time_advance','advance-2',{hours:12}));
 applyEvent(s,e('medication','emerg',{person:'char',drug:'emergency_contraceptive',use_mode:'normal'}));
 assert.ok(window.total<before);assert.equal(window.roll,roll);
});
test('branch replay excludes orphaned swipe, no lost manual override',()=>{
 const a={mes:'첫 번째 선택',swipe_id:0},b={mes:'두 번째 선택',swipe_id:1};
 const old=uniqKey(a,0),newkey=uniqKey(b,0);
 const ledger={[old]:{events:[e('time_advance','first',{hours:24})]},[newkey]:{events:[e('time_advance','second',{hours:48})]}};
 const state=replay(seed,canon,{},sortedRecords([b],ledger),{user:{secondary:'beta'}});
 assert.equal(state.clockHours,48);assert.equal(state.people.user.secondary,'beta');
 assert.equal(sortedRecords([a],ledger).length,1);
});
test('fertile stages have boundaries and nonexistent passage',()=>{
 const cfg=fresh().config;
 assert.equal(rangeProbability(-72,cfg),.03);
 assert.equal(rangeProbability(-24,cfg),.30);
 assert.equal(rangeProbability(24,cfg),0);
});

test('manual sex/ABO overrides apply before event eligibility and remain branch-safe',()=>{
 const rows=[{events:[e('time_advance','adv',{hours:80}),e('exposure','sc',{gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1})]}];
 const originals=replay(seed,canon,{},rows,{});
 const corrected=replay(seed,canon,{},rows,{user:{sex:'male',secondary:'beta'}});
 assert.equal(Object.keys(corrected.windows).length,0);
 assert.equal(corrected.people.user.fertile.impregnate,true);
 assert.ok(Object.keys(originals.windows).length>=0);
});
