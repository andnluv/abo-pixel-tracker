import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildProfileSetupInput} from '../profile-setup-input.mjs';
import {PROFILE_SYSTEM,normalizeSetupProposal} from '../profile.mjs';
import {replay} from '../core.mjs';

const index=readFileSync(new URL('../index.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');

test('manual ABO choices enter initial model analysis, without inventing manual choices from a seeded ABO',()=>{
 const canon={char:{name:'서하재',card:'28, male; no ABO classification'},user:{name:'에티엔',card:'violinist'}};
 const data=JSON.parse(buildProfileSetupInput(canon,{char:{secondary:'omega',sex:'male'},user:{secondary:'alpha'}}));
 assert.equal(data.char.setupSelections.secondary,'omega');
 assert.equal(data.char.setupSelections.sex,'male');
 assert.equal(data.user.setupSelections.secondary,'alpha');
 const noManual=JSON.parse(buildProfileSetupInput(canon,{}));
 assert.deepEqual(noManual.char.setupSelections,{});
 assert.deepEqual(noManual.user.setupSelections,{});
});

test('already fixed scent is supplied to analysis, not replaced by a guessed scent',()=>{
 const result=JSON.parse(buildProfileSetupInput({char:{name:'A'},user:{}},{char:{secondary:'alpha',pheromoneScent:'백단향'}}));
 assert.equal(result.char.setupSelections.pheromoneScent,'백단향');
 assert.match(PROFILE_SYSTEM,/setupSelections\.pheromoneScent is nonempty/);
 assert.match(PROFILE_SYSTEM,/honor it and do not manufacture an alternative/);
});

test('alpha/omega get independent Korean pheromone scent proposals; beta and random type do not',()=>{
 assert.match(PROFILE_SYSTEM,/setupSelections\.secondary is "alpha" or "omega"/);
 assert.match(PROFILE_SYSTEM,/INCLUDE a pheromoneScent field/);
 assert.match(PROFILE_SYSTEM,/basis":"suggested/);
 assert.match(PROFILE_SYSTEM,/manual beta selection, do NOT invent/);
 assert.match(PROFILE_SYSTEM,/provisional seeded STATUS display value/);
});

test('scent proposed by the model is unchecked and not applied to live state until user approval',()=>{
 const data=normalizeSetupProposal({char:{fields:{pheromoneScent:{value:'서늘한 소나무와 잉크',basis:'suggested',reason:'조용하고 예리한 분위기'}}},user:{fields:{}}},'chat1');
 const scent=data.roles.char.fields.find(x=>x.key==='pheromoneScent');
 assert.ok(scent);assert.equal(scent.checked,false);
 const live=replay('seed',{char:{name:'A'},user:{name:'B'}},{},[],{});
 assert.equal(live.people.char.presentation.pheromoneScent,'');
});

test('state tab exposes automatic save and a meaningful manual ABO confirmation action',()=>{
 assert.match(index,/변경 시 자동 저장됩니다/);
 assert.match(index,/data-action="saveABO"/);
 assert.match(index,/currentRoleOverrides\(m,role\)\.secondary=selected/);
 assert.match(index,/ABO .*선택 저장 완료/);
 assert.match(index,/buildProfileSetupInput\(effectiveCanon\(m\),effectiveOverrides\(m\)\)/);
 assert.match(css,/\.abop-savebar/);
});
