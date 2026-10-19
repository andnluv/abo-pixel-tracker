import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSetupProposal,completeInitialIdentityProposal,alignInitialPhysiologyProposal,deriveABOPhysiology,missingInitialSecondaryRoles,PROFILE_SYSTEM} from '../profile.mjs';
import {inferExplicit} from '../core.mjs';
const profile=(fields={char:{},user:{}})=>normalizeSetupProposal({char:{fields:fields.char,preferences:{}},user:{fields:fields.user,preferences:{}}},'chat-demo');
const clue='평소 관계에서 신중하게 주도권을 조절하며 타인의 반응을 확인하는 행동을 근거로 가상의 ABO 유형을 제안했다.';
const char={name:'CHAR',sex:'unknown',secondary:'unknown',card:'성별: 남성\n포지션: TOP 고정\n낙천적인 태도와 신중한 언어적 도발을 병행한다. ABO 관련 설정은 기재되지 않았다.'};
const user={name:'USER',sex:'female',secondary:'unknown',card:'성별: 여성\n갈등에서는 먼저 상대의 말을 듣고 자신의 경계를 분명히 한다.'};
const get=(d,r,k)=>d.roles[r].fields.find(f=>f.key===k);
const secondary=(value)=>({value,basis:'suggested',reason:clue});

test('screenshot regression: male TOP with no ABO details can be Omega and its physiology is NOT all false',()=>{
 const draft=profile({char:{sex:{value:'male',basis:'explicit',reason:'성별: 남성'},secondary:secondary('omega'),
  gestate:{value:false,basis:'suggested',reason:'남성으로 명시되고 임신 언급이 없다'},
  impregnate:{value:true,basis:'suggested',reason:'TOP 고정이므로 수태 가능하다'},
  menstruationEnabled:{value:false,basis:'suggested',reason:'남성 캐릭터이며 월경 서술이 없음'},
  cycleEnabled:{value:false,basis:'suggested',reason:'카드에 히트·러트 서술 없음'}},user:{secondary:secondary('alpha')}});
 completeInitialIdentityProposal(draft,{canon:{char,user},seed:'screen-demo'});
 assert.equal(get(draft,'char','secondary').value,'omega');
 assert.equal(get(draft,'char','secondary').checked,false);
 for(const [key,value] of Object.entries({gestate:true,impregnate:false,menstruationEnabled:true,cycleEnabled:true})){
  const f=get(draft,'char',key);
  assert.equal(f.value,value,`${key} must derive from ABO, not TOP or male stereotype`);
  assert.equal(f.source,'abo_default');assert.equal(f.basis,'suggested');assert.equal(f.checked,false);
  assert.match(f.reason,/OMEGA/);
  assert.doesNotMatch(f.reason,/TOP 고정|남성이므로|언급이 없어서/);
 }
 assert.equal(get(draft,'char','anatomy').checked,false);
 assert.equal(get(draft,'user','secondary').value,'alpha');
});

test('all six male/female ABO combinations agree with engine default traits',()=>{
 const cases=[
  ['male','alpha',[false,true,false,true]],
  ['male','beta',[false,true,false,false]],
  ['male','omega',[true,false,true,true]],
  ['female','alpha',[true,true,true,true]],
  ['female','beta',[true,false,true,false]],
  ['female','omega',[true,false,true,true]]
 ];
 for(const [sex,abo,expectation] of cases){
  const result=deriveABOPhysiology(sex,abo,sex==='male'?'male_only':'female_only');
  assert.deepEqual(Object.values(result),expectation,`${sex}/${abo}`);
 }
 assert.equal(deriveABOPhysiology('male','omega','male_only').gestate,true,'male-only Omega still has the worldbook reproductive tract');
});

test('explicit card statements and manual reproductive choices override ABO suggested defaults',()=>{
 const canon={char:{name:'explicit',sex:'male',card:'성별: 남성\n제2성별: 오메가\n임신 불가능\n월경 없음',secondary:'omega'},user};
 const draft=profile({char:{gestate:{value:false,basis:'explicit',reason:'원문에서 임신 불가능이라고 명시'},menstruationEnabled:{value:false,basis:'explicit',reason:'월경 없음'}},user:{secondary:secondary('omega')}});
 completeInitialIdentityProposal(draft,{canon,overrides:{char:{impregnate:true},user:{}},seed:'fixed'});
 assert.equal(get(draft,'char','gestate').value,false);assert.equal(get(draft,'char','gestate').basis,'explicit');assert.equal(get(draft,'char','gestate').checked,true);
 assert.equal(get(draft,'char','menstruationEnabled').value,false);assert.equal(get(draft,'char','menstruationEnabled').checked,true);
 assert.equal(get(draft,'char','impregnate'),undefined,'manual fertility lock not replaced');
 assert.equal(get(draft,'char','cycleEnabled').value,true);
});

test('hallucinated explicit no-heat/no-pregnancy on unmentioned card is downgraded to ABO defaults',()=>{
 const draft=profile({char:{secondary:secondary('omega'),gestate:{value:false,basis:'explicit',reason:'카드에 임신 없음'},cycleEnabled:{value:false,basis:'explicit',reason:'히트 내용 없음'}},user:{secondary:secondary('beta')}});
 completeInitialIdentityProposal(draft,{canon:{char,user},seed:'no-absence'});
 assert.equal(get(draft,'char','gestate').value,true);
 assert.equal(get(draft,'char','gestate').basis,'suggested');
 assert.equal(get(draft,'char','cycleEnabled').value,true);
 assert.equal(get(draft,'char','cycleEnabled').checked,false);
});

test('changing an editable ABO proposal re-aligns dependent physiological entries',()=>{
 const draft=profile({char:{secondary:secondary('omega')},user:{secondary:secondary('beta')}});
 completeInitialIdentityProposal(draft,{canon:{char:{...char,sex:'male'},user},seed:'edit'});
 const rec=draft.roles.char;const before=rec.fields.length;
 get(draft,'char','secondary').value='alpha';
 alignInitialPhysiologyProposal(rec,{source:{...char,sex:'male'},manual:{}});
 assert.equal(get(draft,'char','gestate').value,false);
 assert.equal(get(draft,'char','impregnate').value,true);
 assert.equal(get(draft,'char','menstruationEnabled').value,false);
 assert.equal(get(draft,'char','cycleEnabled').value,true);
 assert.equal(rec.fields.length,before,'no duplicate fields on re-alignment');
});

test('legacy proposal with no secondary demands reanalysis; pre-analysis STATUS roll does not count',()=>{
 const old=profile({char:{sex:{value:'male',basis:'explicit'}},user:{secondary:secondary('alpha')}});
 assert.deepEqual(missingInitialSecondaryRoles(old,{canon:{char,user}}),['char']);
 assert.deepEqual(missingInitialSecondaryRoles(old,{canon:{char,user},overrides:{char:{secondary:'omega'}}}),[]);
 assert.deepEqual(missingInitialSecondaryRoles(profile(),{canon:{char:{...char,secondary:'omega'},user:{...user,secondary:'beta'}}}),[]);
});

test('Korean card field values at Hangul boundaries are read as explicit',()=>{
 const fields=inferExplicit('성별: 남성\n제2성별: 오메가\n신체 유형: 복합형');
 assert.deepEqual(fields,{sex:'male',secondary:'omega',anatomy:'combined'});
 const variant=inferExplicit('성별: 여성\nABO: 알파\n생식기 유형: 여성 생식기형');
 assert.equal(variant.sex,'female');assert.equal(variant.secondary,'alpha');assert.equal(variant.anatomy,'female_only');
});

test('system instructions forbid infer infertility from male or TOP and UI guards legacy draft',()=>{
 assert.match(PROFILE_SYSTEM,/TOP\/BOTTOM/);
 assert.match(PROFILE_SYSTEM,/Choose secondary FIRST/);
 assert.match(PROFILE_SYSTEM,/Do NOT output false because no text exists/);
 const ui=readFileSync(new URL('../index.js',import.meta.url),'utf8');
 assert.match(ui,/missingInitialSecondaryRoles\(draft/);
 assert.match(ui,/alignInitialPhysiologyProposal\(rec/);
 assert.match(ui,/ABO 규칙 제안/);
 assert.match(ui,/제2성별을 먼저 체크해야/);
});
