import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSetupProposal,mergeSelectedPreferences,anatomyChoices,anatomyDefault} from '../profile.mjs';
import {replay} from '../core.mjs';
const reply={char:{fields:{sex:{value:'male',basis:'explicit',reason:'card says male'},secondary:{value:'omega',basis:'explicit',reason:'card says omega'},anatomy:{value:'combined',basis:'suggested',reason:'ABO default'},impregnate:{value:false,basis:'suggested',reason:'standard'}},preferences:{confirmed:[{id:'verbal_teasing',level:'liked',reason:'directly declared'}],latent:['embarrassment_play','dominance','sensory_play','praise','roleplay','one_too_many'],attitude:'curious'}},user:{fields:{sex:{value:'female',basis:'explicit',reason:'persona'}},preferences:{confirmed:[],latent:[],attitude:'reserved'}}};
test('profile analysis is ONLY a proposal: normalization does not mutate source or persistent canon',()=>{
 const canon={char:{name:'One',sex:'unknown',secondary:'unknown'},user:{name:'Two'}};
 const original=structuredClone(canon);
 const d=normalizeSetupProposal(JSON.stringify(reply),'chat-1');
 assert.deepEqual(canon,original); assert.equal(d.roles.char.latent.length,5);
 assert.equal(d.roles.char.fields.find(x=>x.key==='sex').basis,'explicit');
 assert.equal(d.roles.user.fields.length,1);
});
test('selected preference records only are merged; non-selected suggestions never appear',()=>{
 const d=normalizeSetupProposal(reply,'chat-1');
 d.roles.char.latent[2].checked=true;
 d.roles.char.latent[3].checked=true;
 d.roles.char.confirmed[0].checked=false;
 const result=mergeSelectedPreferences({confirmed:[],latent:[],attitude:'reserved'},d.roles.char);
 assert.ok(!result.latent.some(x=>x.id==='embarrassment_play'));
 assert.ok(!result.confirmed.some(x=>x.id==='verbal_teasing'));
 assert.equal(result.latent.length,2);
 assert.equal(result.attitude,'reserved');
});
test('confirmed preference upgrades existing latent without duplication but preserves locked confirmed',()=>{
 const p={confirmed:[{id:'old',level:'strongly_liked',locked:true}],latent:[{id:'verbal_teasing',level:'latent'}],attitude:'reserved'};
 const d=normalizeSetupProposal(reply,'chat-1').roles.char;
 const a=mergeSelectedPreferences(p,d);
 assert.equal(a.confirmed.filter(x=>x.id==='verbal_teasing').length,1);
 assert.equal(a.latent.filter(x=>x.id==='verbal_teasing').length,0);
 assert.equal(a.confirmed.find(x=>x.id==='old').level,'strongly_liked');
});
test('anatomy choices: fixed defaults/custom except female Alpha & male Omega',()=>{
 assert.deepEqual(anatomyChoices('male','alpha').map(x=>x[0]),['male_only','custom']);
 assert.deepEqual(anatomyChoices('male','beta').map(x=>x[0]),['male_only','custom']);
 assert.deepEqual(anatomyChoices('female','beta').map(x=>x[0]),['female_only','custom']);
 assert.deepEqual(anatomyChoices('female','omega').map(x=>x[0]),['female_only','custom']);
 assert.deepEqual(anatomyChoices('female','alpha').map(x=>x[0]),['female_alpha_combined','female_only','custom']);
 assert.deepEqual(anatomyChoices('male','omega').map(x=>x[0]),['combined','vaginal_only','male_only','custom']);
 assert.equal(anatomyDefault('female','alpha'),'female_alpha_combined');
});
test('changing female Alpha to female-only retains both reproductive capacities; user notes preserved',()=>{
 const state=replay('seed-123',{char:{name:'A',sex:'female',secondary:'alpha'},user:{name:'O',sex:'male',secondary:'omega'}},{},[],{char:{anatomy:'female_only',inseminationOrgan:'fictional reproductive conduit',gestate:true,impregnate:true}});
 assert.equal(state.people.char.fertile.gestate,true);
 assert.equal(state.people.char.fertile.impregnate,true);
 assert.equal(state.people.char.inseminationOrgan,'fictional reproductive conduit');
});
test('unknown preferences cannot silently become established for USER',()=>{
 const result=mergeSelectedPreferences({confirmed:[],latent:[],attitude:'reserved'},{confirmed:[],latent:[],useAttitude:false});
 assert.equal(result.confirmed.length,0); assert.equal(result.latent.length,0);
});
