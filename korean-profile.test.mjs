import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROFILE_SYSTEM,PROFILE_KOREAN_REFERENCE_VOCABULARY,normalizeSetupProposal,mergeSelectedPreferences} from '../profile.mjs';
import {preferenceDisplayLabel,preferenceIdFromEdit} from '../preference-labels.mjs';

test('profile setup asks for Korean descriptions/reasons/labels, keeps English machine IDs',()=>{
  assert.match(PROFILE_SYSTEM,/natural KOREAN/);
  assert.match(PROFILE_SYSTEM,/every preference label/);
  assert.match(PROFILE_SYSTEM,/preference IDs/);
  assert.match(PROFILE_SYSTEM,/snake_case/);
  assert.match(PROFILE_SYSTEM,/NOT forced one-to-one translations/);
  assert.ok(PROFILE_KOREAN_REFERENCE_VOCABULARY.some(x=>x.includes('BDSM')));
  assert.ok(PROFILE_KOREAN_REFERENCE_VOCABULARY.some(x=>x.includes('신음')));
});

test('unmapped, model-generated interest uses model Korean label without translating ID',()=>{
  const raw={char:{fields:{contactStyle:{value:'상대의 반응을 살피며 손을 움직인다',basis:'suggested',reason:'움직이는 손이 반복해서 묘사됨'}},preferences:{confirmed:[],latent:[{id:'name_binding',label:'이름에 대한 특별한 반응',reason:'이름이 불리는 순간 긴장함'}]}},user:{fields:{},preferences:{confirmed:[],latent:[]}}};
  const draft=normalizeSetupProposal(raw,'chat1');
  const item=draft.roles.char.latent[0];
  assert.equal(item.id,'name_binding');
  assert.equal(preferenceDisplayLabel(item),'이름에 대한 특별한 반응');
  assert.equal(preferenceIdFromEdit('이름에 대한 특별한 반응',item.id,item.label),'name_binding');
  assert.equal(draft.roles.char.fields.find(f=>f.key==='contactStyle').value,'상대의 반응을 살피며 손을 움직인다');
  item.checked=true;
  const result=mergeSelectedPreferences({confirmed:[],latent:[],attitude:'curious'},draft.roles.char);
  assert.equal(result.latent[0].id,'name_binding');
  assert.equal(result.latent[0].label,'이름에 대한 특별한 반응');
  assert.equal(preferenceDisplayLabel(result.latent[0]),'이름에 대한 특별한 반응');
});

test('unchecked suggestions remain unapplied and legacy preferences keep old fallback behavior',()=>{
  const draft=normalizeSetupProposal({char:{fields:{},preferences:{confirmed:[{id:'fear_play',label:'공포 플레이'}],latent:[{id:'quiet_company',label:'함께하는 침묵'}]}},user:{fields:{},preferences:{}}},'chat2');
  draft.roles.char.confirmed[0].checked=false;
  const result=mergeSelectedPreferences({confirmed:[],latent:[],attitude:'curious'},draft.roles.char);
  assert.equal(result.confirmed.length,0);
  assert.equal(result.latent.length,0);
  assert.equal(preferenceDisplayLabel({id:'power_exchange'}),'권력 교환(D/s)');
  assert.equal(preferenceDisplayLabel({id:'some_custom_english'}),'some_custom_english');
});

test('exact user-provided Korean UI text and version appear in the extension',()=>{
  const index=readFileSync(new URL('../index.js',import.meta.url),'utf8');
  assert.ok(index.includes('잠재 후보 3~5개 · 확정 후보 별도'));
  assert.ok(index.includes('선택을 돕기 위해 제공되는 일반 후보입니다. 체크 시에만 적용됩니다.'));
  assert.ok(index.includes('v0.3.9'));
});


test('initial setup distinguishes intimate nonverbal vocal patterns from spoken language for both roles',()=>{
  assert.match(PROFILE_SYSTEM,/VOICE & SPEECH STYLE ANALYSIS/);
  assert.match(PROFILE_SYSTEM,/moans/);
  assert.match(PROFILE_SYSTEM,/breathing/);
  assert.match(PROFILE_SYSTEM,/held-back vs freely expressed voice/);
  assert.match(PROFILE_SYSTEM,/honorific vs casual register/);
  assert.match(PROFILE_SYSTEM,/Polite speech or sentence endings belong here, NOT in vocalStyle/);
  assert.match(PROFILE_SYSTEM,/For BOTH char and user/);
  assert.match(PROFILE_SYSTEM,/basis:"suggested"/);
  assert.match(PROFILE_SYSTEM,/Do not infer consent, acts, or preferences/);
  assert.ok(PROFILE_KOREAN_REFERENCE_VOCABULARY.some(x=>x.includes('NSFW 발성 참고 어휘')));
  assert.ok(PROFILE_KOREAN_REFERENCE_VOCABULARY.some(x=>x.includes('NSFW 언어 참고 어휘')));
  assert.match(PROFILE_SYSTEM,/No more than five latent tags per role/);
  assert.match(PROFILE_SYSTEM,/Never create a preference as CONFIRMED unless explicitly stated/);
});

test('titlebar uses a single CSS pixel emblem instead of mixed Unicode glyphs',()=>{
  const index=readFileSync(new URL('../index.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  assert.match(index,/<span class="abop-brandmark" aria-hidden="true"><\/span>/);
  assert.doesNotMatch(index,/✦ ▣/);
  assert.match(css,/\.abop-brandmark::before/);
  assert.match(index,/ABO \/ RELATIONSHIP TRACKER/);
  assert.match(index,/v0\.3\.9/);
});
