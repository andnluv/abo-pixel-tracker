import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,applyEvent,pickInt} from '../core.mjs';
import rules from '../rules.json' with {type:'json'};
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');

test('fictional gestation: nominal 150 days and boundaries 120–180 agree across rules and World Info',()=>{
 assert.equal(rules.pregnancy.term_days_center,150);
 assert.equal(rules.pregnancy.term_days_min,120);
 assert.equal(rules.pregnancy.term_days_max,180);
 const doc=read('../docs/ABO_WorldInfo_FullRules_v3.4_EN.md');
 const lore=JSON.parse(read('../worldinfo/ABO_Universal_WorldInfo_v3.4_EN.json'));
 assert.match(doc,/150 story-days/);assert.match(doc,/120–180 days/);
 const content=JSON.stringify(lore);
 assert.match(content,/150 story-days/);assert.match(content,/120–180 days/);
 assert.doesNotMatch(content,/150–210 days/);
});

test('gestation is deterministic and sampled within new 120–180 day range',()=>{
 const canon={char:{name:'임신 대상',sex:'male',secondary:'omega'},user:{name:'상대',sex:'female',secondary:'alpha'}};
 const seed='regression-0312';
 const s=initialState(seed,canon,{rate:{rise:1,fertile:1,peak:1,fall:1},windowCap:1});
 s.people.char.cycle.ovulationHour=100;
 applyEvent(s,{kind:'time_advance',id:'t0',hours:80});
 applyEvent(s,{kind:'exposure',id:'x0',gestator:'char',donor:'user',penetration:true,deposition:true,depositions:1});
 applyEvent(s,{kind:'time_advance',id:'t1',hours:73});
 const pregnancy=s.people.char.pregnancy;
 assert.notEqual(pregnancy.status,'none');
 const days=(pregnancy.dueAt-pregnancy.conceivedAt)/24;
 assert.equal(days,pickInt(seed,'term:char:100',120,180));
 assert.ok(days>=120&&days<=180);
});

test('older optional day selector is absent while manual hours and narrative event advances remain',()=>{
 const ui=read('../index.js');
 assert.match(ui,/id="abop-hours"/);
 assert.match(ui,/진행 시간\(h\)/);
 assert.doesNotMatch(ui,/abop-time-unit|시간 스킵 단위|시간 스킵 범위/);
 assert.match(ui,/kind:'time_advance',hours:n/);
});
