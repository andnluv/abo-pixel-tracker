import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSetupProposal,completeInitialIdentityProposal,anatomyChoices,PROFILE_SYSTEM,SetupJsonFormatError} from '../profile.mjs';
import {replay} from '../core.mjs';
import {buildProfileSetupInput} from '../profile-setup-input.mjs';
const original={char:{name:'깡통',sex:'male',secondary:'unknown',card:'남성. 상처를 숨기는 약사이며, 보호하고 싶은 사람에게만 조용히 매달린다.'},user:{name:'깡캐',sex:'female',secondary:'unknown',card:'여성. 정원사. 타인의 기분을 세심하게 읽되 자신의 경계를 지킨다.'}};
const normalize=(fields={char:{},user:{}})=>normalizeSetupProposal({char:{fields:fields.char,preferences:{}},user:{fields:fields.user,preferences:{}}},'chat-one');
const proposal=(char='omega',user='beta')=>normalize({char:{secondary:{value:char,basis:'suggested',reason:'상처를 감추면서도 가까운 상대의 감정에 민감하게 반응하는 설정을 근거로 제안했다.'}},user:{secondary:{value:user,basis:'suggested',reason:'주변 감정을 살피지만 관계의 주도권을 과도하게 추구하지 않는 경계 성향을 근거로 제안했다.'}}});
const get=(d,role,key)=>d.roles[role].fields.find(f=>f.key===key);
test('initial model ABO proposal survives and only anatomy uses stable candidate pool',()=>{
 const source=structuredClone(original),d=proposal('omega','alpha');
 completeInitialIdentityProposal(d,{canon:source,seed:'sample'});
 assert.equal(get(d,'char','secondary').value,'omega');
 assert.equal(get(d,'user','secondary').value,'alpha');
 for(const role of ['char','user']){
  const second=get(d,role,'secondary'),anatomy=get(d,role,'anatomy');
  assert.equal(second.source,'ai_analysis');assert.equal(second.basis,'suggested');assert.equal(second.checked,false);
  assert.match(second.reason,/근거/);
  assert.equal(anatomy.source,'arbitrary');assert.equal(anatomy.checked,false);
  assert.ok(anatomyChoices(source[role].sex,second.value).some(([key])=>key===anatomy.value));
  assert.ok(d.roles[role].fields.findIndex(f=>f.key==='secondary')<d.roles[role].fields.findIndex(f=>f.key==='anatomy'));
 }
 assert.deepEqual(source,original);
 const again=proposal('omega','alpha');completeInitialIdentityProposal(again,{canon:source,seed:'sample'});
 assert.deepEqual(d.roles.char.fields,again.roles.char.fields);
});
test('existing seeded tracker ABO never replaces a differing model analysis',()=>{
 const live=replay('seeded-1',original,{},[],{});
 const contrasting=live.people.char.secondary==='omega'?'alpha':'omega';
 const d=proposal(contrasting);
 completeInitialIdentityProposal(d,{canon:original,seed:'sample',existingDefaults:live.people});
 assert.equal(get(d,'char','secondary').value,contrasting);
 assert.notEqual(get(d,'char','secondary').value,live.people.char.secondary);
});
test('model secondary without concrete reason is rejected for retry',()=>{
 const d=normalize({char:{secondary:{value:'alpha',basis:'suggested',reason:''}},user:{secondary:{value:'omega',basis:'suggested',reason:'관계의 반응과 침착한 행동 패턴에서 착안했다.'}}});
 assert.throws(()=>completeInitialIdentityProposal(d,{canon:original,seed:'s-2'}),SetupJsonFormatError);
});
test('missing model secondary causes a clear format retry instead of a random ABO value',()=>{
 const d=normalize({char:{secondary:{value:'omega',basis:'suggested',reason:'캐릭터의 반응 양식에서 착안'}},user:{}});
 assert.throws(()=>completeInitialIdentityProposal(d,{canon:original,seed:'s-1'}),SetupJsonFormatError);
});
test('manual fixed sex/ABO/anatomy win and never receive alternatives',()=>{
 const manual={char:{secondary:'omega',anatomy:'male_only'},user:{secondary:'alpha',anatomy:'female_only'}};
 const d=normalize({char:{secondary:{value:'alpha',basis:'suggested'},anatomy:{value:'combined',basis:'suggested'}},user:{}});
 completeInitialIdentityProposal(d,{canon:original,overrides:manual,seed:'sample'});
 for(const role of ['char','user']){assert.equal(get(d,role,'secondary'),undefined);assert.equal(get(d,role,'anatomy'),undefined);}
 const input=JSON.parse(buildProfileSetupInput(original,manual));assert.equal(input.char.setupSelections.secondary,'omega');assert.equal(input.user.setupSelections.anatomy,'female_only');
});
test('explicit source ABO and anatomy are authoritative',()=>{
 const canon={char:{sex:'male',secondary:'omega',anatomy:'combined',card:'제2성별: 오메가; 생식기 유형: 복합형'},user:{sex:'female',secondary:'alpha',anatomy:'female_alpha_combined',card:'ABO: alpha; anatomy: female_alpha_combined'}};
 const d=normalize({char:{secondary:{value:'beta',basis:'suggested'},anatomy:{value:'male_only',basis:'suggested'}},user:{}});
 completeInitialIdentityProposal(d,{canon,seed:'sample'});
 for(const role of ['char','user'])for(const key of ['secondary','anatomy']){assert.equal(get(d,role,key).basis,'explicit');assert.equal(get(d,role,key).checked,true);}
 assert.equal(get(d,'char','secondary').value,'omega');assert.equal(get(d,'user','secondary').value,'alpha');
});
test('unsupported model explicit claim is downgraded to an unconfirmed AI interpretation',()=>{
 const d=normalize({char:{secondary:{value:'alpha',basis:'explicit',reason:'성격의 활동적인 행동으로 추론했다.'},anatomy:{value:'combined',basis:'explicit',reason:'명시됨'}},user:{secondary:{value:'beta',basis:'suggested',reason:'관계의 균형과 관찰자적 성격에서 제안했다.'}}});
 completeInitialIdentityProposal(d,{canon:original,seed:'sample'});
 assert.equal(get(d,'char','secondary').basis,'suggested');assert.equal(get(d,'char','secondary').source,'ai_analysis');assert.equal(get(d,'char','secondary').checked,false);
 assert.equal(get(d,'char','anatomy').source,'arbitrary');
});
test('anatomy pool follows AI-selected secondary and never uses role stereotypes',()=>{
 const canon={char:{name:'남성',sex:'male',card:'남성 오메가로 묘사됨'},user:{name:'기타',sex:'unknown',card:'성별 비공개'}};
 const d=normalize({char:{secondary:{value:'omega',basis:'explicit',reason:'원문에 오메가 명시'}},user:{secondary:{value:'beta',basis:'suggested',reason:'차분한 성격과 관계에서의 행동으로 제안했다.'}}});
 completeInitialIdentityProposal(d,{canon,seed:'sampler'});
 assert.ok(['combined','vaginal_only','male_only'].includes(get(d,'char','anatomy').value));
 assert.ok(anatomyChoices('unknown','beta').some(([key])=>key===get(d,'user','anatomy').value));
});
test('model prompt and UI use reasoned secondary choice rather than seeded fallback',()=>{
 const ui=readFileSync(new URL('../index.js',import.meta.url),'utf8');
 assert.match(ui,/completeInitialIdentityProposal\(draft,/);
 assert.doesNotMatch(ui,/existingDefaults:branchState\(\)\?\.people/);
 assert.match(ui,/성격·취향 분석 제안/);
 assert.match(PROFILE_SYSTEM,/personality, preferences, behavioral patterns/);
 assert.match(PROFILE_SYSTEM,/Do NOT randomly or uniformly roll this field/);
});
