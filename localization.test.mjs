import test from 'node:test';
import assert from 'node:assert/strict';
import {preferenceLabel,preferenceIdFromEdit,preferenceLevelLabel,attitudeLabel} from '../preference-labels.mjs';
import {normalizeSetupProposal,mergeSelectedPreferences} from '../profile.mjs';

test('common NSFW preference tags render contextually appropriate Korean',()=>{
 const dict={power_exchange:'권력 교환(D/s)',praise:'칭찬 플레이',embarrassment:'수치심 플레이',humiliation:'굴욕 플레이',exhibitionism:'노출 플레이',fear_play:'공포 플레이',loss_of_control:'통제권 상실',restraint:'구속 플레이',slow_burn:'서서히 깊어지는 관계',quiet_intimacy:'조용한 친밀감'};
 for (const [id,label] of Object.entries(dict)) assert.equal(preferenceLabel(id),label);
});
test('unknown tag and custom Korean label are preserved, not fabricated',()=>{
 assert.equal(preferenceLabel('some_new_kink'),'some_new_kink');
 assert.equal(preferenceIdFromEdit('나만의 성향','some_new_kink'),'나만의 성향');
});
test('unchanged localized labels keep canonical IDs; changed to known Korean labels resolves key',()=>{
 assert.equal(preferenceIdFromEdit('수치심 플레이','embarrassment'),'embarrassment');
 assert.equal(preferenceIdFromEdit('칭찬 플레이','praise'),'praise');
 assert.equal(preferenceIdFromEdit('굴욕 플레이','embarrassment'),'humiliation');
 assert.equal(preferenceIdFromEdit('수치심 플레이','praise'),'embarrassment');
 assert.equal(preferenceIdFromEdit('fear_play','fear_play'),'fear_play');
});
test('proposal labels are presentation only and selected id remains unchanged',()=>{
 const d=normalizeSetupProposal({char:{fields:{},preferences:{confirmed:[{id:'fear_play',level:'liked'}],latent:[{id:'sensory_play'}]}},user:{fields:{},preferences:{}}},'chat');
 d.roles.char.confirmed[0].checked=true;
 d.roles.char.latent[0].checked=true;
 const res=mergeSelectedPreferences({confirmed:[],latent:[],attitude:'curious'},d.roles.char);
 assert.ok(res.confirmed.some(p=>p.id==='fear_play'));
 assert.ok(res.latent.some(p=>p.id==='sensory_play'));
 assert.equal(preferenceLevelLabel('strongly_liked'),'강한 선호');
 assert.equal(attitudeLabel('curious'),'호기심만 있음');
});
