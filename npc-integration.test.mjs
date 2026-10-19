import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as core from '../core.mjs';
import * as npc from '../npc-tracking.mjs';

function harness(){
 const halo=JSON.parse(readFileSync(new URL('./fixtures/halo-lore.json',import.meta.url),'utf8'));
 const current={chatId:'test-chat',chatMetadata:{world_info:'CHAT_NPCS'},characters:[{...halo.data,name:'👼H.A.L.O😈',description:'Narrator world'}],characterId:0,chat:[{is_user:true,mes:'하루가 지났다'},{is_user:false,mes:'미카엘이 한숨을 쉬었다.'}],saveMetadata:async()=>{},setExtensionPrompt:()=>{}};
 const sandbox={
  ...core,...npc,VERSION:core.VERSION,DEFAULT_CONFIG:core.DEFAULT_CONFIG,
  SillyTavern:{getContext:()=>current},
  readCurrentPersona:()=>({name:'시하',card:'sex: male',sex:'male'}),personaIdentity:()=> 'p1',syncPersonaProfile:()=>({changed:false,updated:false}),filterRowsByPersona:(rows)=>rows,
  user_avatar:'',ConnectionManagerRequestService:{},
  document:{readyState:'loading',addEventListener:()=>{},getElementById:()=>null},
  window:{matchMedia:()=>({matches:false})},
  structuredClone,Date,Math,console,setTimeout:()=>{},
  getRequestHeaders:()=>({'Content-Type':'application/json','X-CSRF-Token':'test'}),
  fetch:async(_url,opts)=>({ok:true,json:async()=>({entries:{1:{comment:'[NPC] 테스트',content:'[NPC: 테스트 | others] - adult, 29, male, a very careful and gentle observer with long hair.'}}})}),
 };
 const code=readFileSync(new URL('../index.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'');
 vm.createContext(sandbox);
 vm.runInContext(code+'\nglobalThis.__hooks={meta,npcTracking,selectedNpc,selectedNpcId,switchNpc,branchState,scanNpcSources,refresh,currentRoleOverrides,getCandidates:()=>npcCandidates};',sandbox);
 return {current,sandbox,h:sandbox.__hooks};
}

test('integrated: NPC switch and manual overrides persist independently, original single character remains intact',async()=>{
 const {h}=harness();
 const m=h.meta();const t=h.npcTracking(m);
 const a=npc.namedTarget('미카엘','sex: male','직접 추가',['Michael']);const b=npc.namedTarget('릴','sex: female');
 t.targets[a.id]={...a,overrides:{}};t.targets[b.id]={...b,overrides:{}};
 await h.switchNpc(a.id);
 assert.equal(h.branchState().people.char.name,'미카엘');
 h.currentRoleOverrides(m,'char').secondary='omega';
 await h.switchNpc(b.id);
 assert.equal(h.branchState().people.char.name,'릴');
 assert.equal(h.currentRoleOverrides(m,'char').secondary,undefined);
 await h.switchNpc(a.id);
 assert.equal(h.branchState().people.char.secondary,'omega');
 await h.switchNpc(npc.MAIN_TARGET);
 assert.equal(h.branchState().people.char.name,'👼H.A.L.O😈');
 assert.equal(h.selectedNpcId(m),npc.MAIN_TARGET);
});

test('integrated: scan discovers external chat lorebook together with embedded H.A.L.O profiles',async()=>{
 const {h,current}=harness();h.meta();
 await h.scanNpcSources();
 assert.ok(h.getCandidates().some(x=>x.name==='미카엘'));
 assert.ok(h.getCandidates().some(x=>x.name==='테스트'));
 assert.equal(current.chatMetadata.world_info,'CHAT_NPCS');
});
