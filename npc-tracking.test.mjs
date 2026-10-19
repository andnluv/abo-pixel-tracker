import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {discoverNpcProfiles,namedTarget,normalizeWorldEntries,combineNpcRecords,sharedEvent,MAIN_TARGET} from '../npc-tracking.mjs';
import {replay,uniqKey} from '../core.mjs';
import {buildAnalyzerUserPrompt} from '../analyzer.mjs';
const index=readFileSync(new URL('../index.js',import.meta.url),'utf8');
const fixture=(path)=>JSON.parse(readFileSync(path,'utf8'));
const umb=fixture(new URL('./fixtures/umbra-lore.json',import.meta.url));
const halo=fixture(new URL('./fixtures/halo-lore.json',import.meta.url));

test('UMBRA cast entries are discoverable without treating world rules or minor child as a selectable adult',()=>{
 const found=discoverNpcProfiles([{name:'UMBRA',data:umb.data.character_book}]);
 assert.ok(found.length>=5,`found only ${found.length}`);
 assert.ok(found.some(x=>x.name.includes('지크프리트 크로이츠')));
 assert.ok(!found.some(x=>x.name.includes('노엘')));
 assert.ok(!found.some(x=>x.name.includes('세계')));
});
test('H.A.L.O cast entries from embedded lorebook include named NPCs, not world entries',()=>{
 const found=discoverNpcProfiles([{name:'HALO',data:halo.data.character_book}]);
 assert.equal(found.length,10);
 for(const name of ['미카엘','릴','사탄','우리엘'])assert.ok(found.some(x=>x.name===name),name);
});
test('chat-bound external world-info entries can be recognized from entries map',()=>{
 const data={entries:{4:{comment:'[NPC] 리오',content:'[NPC: 리오 | ARC] - 27, male, with a scar and gentle personality, an NPC profile in the chat book.'},5:{comment:'[세계] 날씨',content:'The fictional world uses weather and seasonal changes in complex ways.'}}};
 assert.equal(normalizeWorldEntries(data).length,2);
 assert.deepEqual(discoverNpcProfiles([{name:'Chat Book',data}]).map(x=>x.name),['리오']);
});
test('manual NPC uses stable id, optional aliases, and independent card fields',()=>{
 const a=namedTarget('릴','Gender: female\nABO: omega','직접 추가',['Lil','리리']);
 const b=namedTarget('릴','another description');
 assert.equal(a.id,b.id);assert.equal(a.sex,'female');assert.equal(a.secondary,'omega');assert.deepEqual(a.aliases,['Lil','리리']);
 assert.equal(MAIN_TARGET,'__card__');
 assert.throws(()=>namedTarget('   '),/NPC 이름/);
});
test('one shared USER/time log plus independently selected CHAR ledger never leak other CHAR events',()=>{
 const chat=[{mes:'user entry'},{mes:'NPC says hello'}],key=uniqKey(chat[1],1);
 const shared={ [key]:{personaId:'p',events:[{id:'t',kind:'time_advance',hours:24},{id:'u',kind:'scene',person:'user',speech:'hi'},{id:'legacy',kind:'heat_start',person:'char'}]}};
 const michael={ [key]:{personaId:'p',events:[{id:'m',kind:'medication',person:'char',drug:'oral_suppressant',use_mode:'normal'}]}};
 const lil={ [key]:{personaId:'p',events:[{id:'l',kind:'heat_start',person:'char'}]}};
 const rowsM=combineNpcRecords(chat,shared,michael,'p');
 const rowsL=combineNpcRecords(chat,shared,lil,'p');
 assert.deepEqual(rowsM.flatMap(x=>x.events.map(e=>e.id)),['t','u','m']);
 assert.deepEqual(rowsL.flatMap(x=>x.events.map(e=>e.id)),['t','u','l']);
 const canonM={char:{id:'M',name:'미카엘',sex:'male',secondary:'omega'},user:{name:'시하',sex:'male',secondary:'alpha'}};
 const canonL={char:{id:'L',name:'릴',sex:'male',secondary:'omega'},user:canonM.user};
 const m=replay('seed',canonM,{},rowsM);
 const l=replay('seed',canonL,{},rowsL);
 assert.equal(m.clockHours,24);assert.equal(l.clockHours,24);
 assert.equal(m.people.char.name,'미카엘');assert.equal(l.people.char.name,'릴');
 assert.equal(m.people.char.medication.length,1);assert.equal(l.people.char.medication.length,0);
 assert.equal(m.people.user.scene.speech,'hi');assert.equal(l.people.user.scene.speech,'hi');
 assert.notEqual(m.people.char.cycle.intervalHours,l.people.char.cycle.intervalHours);
 assert.deepEqual(m.people.user.cycle,l.people.user.cycle);
});
test('multi-character event prompt explicitly forbids assigning other characters or narrator to CHAR',()=>{
 const p=buildAnalyzerUserPrompt({charName:'미카엘',charAliases:['Michael'],multiNpc:true,userName:'시하',charCard:'male',userPersona:'male',userText:'hello',assistantText:'미카엘은 말했다'});
 assert.match(p,/MULTI-NPC MODE/);assert.match(p,/other NPCs are NOT CHAR/);assert.match(p,/Michael/);
});
test('production index UI exposes world-info scan, explicit NPC selection, manual addition and isolated overrides',()=>{
 for(const snippet of ['scanNpcSources()','readWorldBook(name)','data-action="addNpc"','data-action="selectNpc"','currentRoleOverrides(m,role)','combineNpcRecords(chat','selectedNpcId(m)!==originTarget'])assert.ok(index.includes(snippet),snippet);
 assert.equal(sharedEvent({kind:'exposure',gestator:'user',donor:'char'}),false);
});
