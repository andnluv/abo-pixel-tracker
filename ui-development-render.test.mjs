import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as core from '../core.mjs';
import * as npc from '../npc-tracking.mjs';
import {anatomyChoices,anatomyDefault} from '../profile.mjs';
function harness(config={}){
 const canon={char:{name:'성인 캐릭터',sex:'male',secondary:'omega'},user:{name:'페르소나',sex:'female',secondary:'alpha'}};
 const chat={chatId:'ui-render',chatMetadata:{},characters:[],chat:[],saveMetadata:async()=>{},setExtensionPrompt:()=>{}};
 const sandbox={...core,...npc,anatomyChoices,anatomyDefault,DEFAULT_CONFIG:core.DEFAULT_CONFIG,VERSION:core.VERSION,
  SillyTavern:{getContext:()=>chat},user_avatar:'',
  readCurrentPersona:()=>({name:'USER',card:'',sex:'unknown'}),personaIdentity:()=> 'p1',syncPersonaProfile:()=>({changed:false,updated:false}),filterRowsByPersona:(x)=>x,
  choiceHTML:()=>'',MIN_SETUP_OUTPUT_TOKENS:512,MAX_SETUP_OUTPUT_TOKENS:65536,normalizeSetupOutputTokens:(x)=>x||5000,ConnectionManagerRequestService:{getSupportedProfiles:()=>[]},
  preferenceLabel:(x)=>x,preferenceDisplayLabel:(x)=>x.id,preferenceLevelLabel:(x)=>x,
  attitudeLabel:(x)=>x,cyclePhaseLabel:(x)=>x,instinctLabel:(x)=>x,pregnancyLabel:(x)=>x,
  document:{readyState:'loading',addEventListener:()=>{},getElementById:()=>null},
  window:{matchMedia:()=>({matches:false})},console,structuredClone,Math,Date,setTimeout:()=>{}};
 vm.createContext(sandbox);
 const js=readFileSync(new URL('../index.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,'');
 vm.runInContext(js+'\nglobalThis.__ui={meta,selectedSection,setState:(s)=>{state=s},setTab:(t)=>{tab=t}};',sandbox);
 const m=sandbox.__ui.meta();m.config={...m.config,...config};
 sandbox.__ui.setState(core.initialState('ui-render',canon,m.config));
 const view=t=>{sandbox.__ui.setTab(t);return sandbox.__ui.selectedSection();};
 return {view,m};
}
test('all newly changed panels render in DOM-free integration harness',()=>{
 const {view}=harness();
 assert.match(view('settings'),/임신 시뮬레이션 ON\/OFF/);
 assert.match(view('settings'),/sideEffectScale/);
 assert.match(view('cycles'),/확인된 복용 기록/);
 assert.match(view('status'),/placeholder="진행 시간\(h\)"/);
 assert.doesNotMatch(view('status'),/abop-time-unit/);
 assert.match(view('fertility'),/임신 가능 사건 수동 기록/);
});
test('pregnancy off mode renders warning and disabled manual exposure',()=>{
 const {view}=harness({pregnancyEnabled:false});
 assert.match(view('fertility'),/임신 기능 OFF/);
 assert.match(view('fertility'),/disabled title/);
});
