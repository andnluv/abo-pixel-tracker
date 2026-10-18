import test from 'node:test';
import assert from 'node:assert/strict';
import {readCurrentPersona, personaIdentity, syncPersonaProfile, filterRowsByPersona} from '../persona-sync.mjs';
import {inferExplicit,replay} from '../core.mjs';

const context={
 name1:'stale generic name',
 powerUserSettings:{
  persona_description:'stale active description',
  personas:{'a.png':'서라온','b.png':'새 페르소나'},
  persona_descriptions:{'a.png':{description:'gender: male\nabo: omega'},'b.png':{description:'gender: female\nabo: beta'}},
 },
};
const a=readCurrentPersona(context,'a.png',inferExplicit);
const b=readCurrentPersona(context,'b.png',inferExplicit);
const newMeta=()=>({
 canon:{char:{name:'CHAR',sex:'male',secondary:'alpha'},user:{...a,preferences:{confirmed:[{id:'praise',level:'liked'}],latent:[],attitude:'curious'}}},
 overrides:{char:{},user:{secondary:'omega',anatomy:'combined'}},
 userPersonaIdentity:personaIdentity(a),personaProfiles:{},profileInitialized:true,initialProposal:{chatId:'chat1'},
 ledger:{'0:0:abc':{events:[{kind:'medication',id:'u',person:'user'},{kind:'time_advance',id:'t',hours:24},{kind:'medication',id:'c',person:'char'}]}}
});
test('live persona takes current avatar name and stored description (not stale global description)',()=>{
 assert.equal(a.name,'서라온');assert.equal(a.sex,'male');assert.equal(a.secondary,'omega');
 assert.equal(b.name,'새 페르소나');assert.equal(b.sex,'female');assert.equal(b.secondary,'beta');
});
test('persona switch resets USER override/preferences/proposal, not CHAR overrides',()=>{
 const m=newMeta();const r=syncPersonaProfile(m,b);
 assert.equal(r.changed,true);
 assert.equal(m.canon.user.name,'새 페르소나');assert.equal(m.canon.user.sex,'female');
 assert.equal(m.canon.user.preferences,undefined);
 assert.deepEqual(m.overrides.user,{});assert.deepEqual(m.overrides.char,{});
 assert.equal(m.profileInitialized,false);assert.equal(m.initialProposal,null);
 assert.equal(m.ledger['0:0:abc'].personaId,personaIdentity(a));
});
test('switching back restores exactly the old USER preferences and overrides',()=>{
 const m=newMeta();syncPersonaProfile(m,b);m.overrides.user.anatomy='female_only';
 syncPersonaProfile(m,a);
 assert.equal(m.canon.user.name,'서라온');assert.equal(m.canon.user.preferences.confirmed[0].id,'praise');
 assert.equal(m.overrides.user.secondary,'omega');assert.equal(m.overrides.user.anatomy,'combined');
 syncPersonaProfile(m,b);assert.equal(m.overrides.user.anatomy,'female_only');
});
test('switching same avatar after persona description edit preserves locks and preferences',()=>{
 const m=newMeta();const edited={...a,card:'new description',sex:'female',name:'새 이름'};
 const r=syncPersonaProfile(m,edited);
 assert.equal(r.changed,false);assert.equal(m.canon.user.name,'새 이름');
 assert.equal(m.overrides.user.secondary,'omega');assert.equal(m.canon.user.preferences.confirmed.length,1);
});
test('old USER events are filtered by persona; shared clock and CHAR events survive',()=>{
 const m=newMeta();syncPersonaProfile(m,b);
 const records=[{...m.ledger['0:0:abc']}];
 const out=filterRowsByPersona(records,personaIdentity(b));
 assert.deepEqual(out[0].events.map(e=>e.id),['t','c']);
 assert.deepEqual(filterRowsByPersona(records,personaIdentity(a))[0].events.map(e=>e.id),['u','t','c']);
});
test('legacy chat attaches live persona without losing user manual overrides',()=>{
 const m=newMeta();delete m.userPersonaIdentity;delete m.personaProfiles;
 const r=syncPersonaProfile(m,a);
 assert.equal(r.changed,false);assert.equal(m.userPersonaIdentity,personaIdentity(a));
 assert.equal(m.overrides.user.secondary,'omega');assert.equal(m.canon.user.preferences.confirmed.length,1);
});
test('replay now starts from selected persona canonical values',()=>{
 const m=newMeta();syncPersonaProfile(m,b);
 const s=replay('seed',m.canon,{},[],m.overrides);
 assert.equal(s.people.user.name,'새 페르소나');assert.equal(s.people.user.sex,'female');
 assert.equal(s.people.user.secondary,'beta');
});
