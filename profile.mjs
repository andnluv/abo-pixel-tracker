/* Profile setup: proposal normalization only. Never changes live canonical data. */
export const PROFILE_FIELDS = Object.freeze({
  sex:'성별', secondary:'제2성별', anatomy:'신체 유형', anatomyDetail:'특수 신체 구조',
  inseminationOrgan:'가상 수태기관·경로', gestate:'임신 가능', impregnate:'수태 가능',
  menstruationEnabled:'월경', cycleEnabled:'히트·러트', pheromoneScent:'페로몬 향',
  contactStyle:'접촉 성향', vocalStyle:'발성 성향', speechStyle:'언어 성향'
});
const enumFields={
  sex:['male','female','nonbinary','unknown'],secondary:['alpha','beta','omega','unknown'],
  anatomy:['combined','vaginal_only','male_only','female_only','female_alpha_combined','custom'],
};
const booleanFields=['gestate','impregnate','menstruationEnabled','cycleEnabled'];
const stringFields=['anatomyDetail','inseminationOrgan','pheromoneScent','contactStyle','vocalStyle','speechStyle'];
export const PROFILE_SYSTEM = `You analyze two ADULT fictional character descriptions for an ABO SillyTavern profile setup. Return ONLY a JSON object (no markdown):
{"char":{"fields":{"sex":{"value":"male","basis":"explicit","reason":"short source evidence"},"secondary":null,"anatomy":null,"anatomyDetail":null,"inseminationOrgan":null,"gestate":null,"impregnate":null,"menstruationEnabled":null,"cycleEnabled":null,"pheromoneScent":null,"contactStyle":null,"vocalStyle":null,"speechStyle":null},"preferences":{"confirmed":[{"id":"verbal_teasing","level":"liked","reason":"explicit source"}],"latent":[{"id":"some_interest","reason":"characterization evidence"}],"attitude":"curious"}},"user":{"fields":{},"preferences":{"confirmed":[],"latent":[],"attitude":"reserved"}}}
Every field may be omitted or null when not supported. For populated fields use {"value":...,"basis":"explicit|suggested","reason":"..."}. Sex=male|female|nonbinary|unknown; secondary=alpha|beta|omega|unknown; anatomy=combined|vaginal_only|male_only|female_only|female_alpha_combined|custom. Other six descriptive fields must be concise strings. gestate/impregnate/menstruationEnabled/cycleEnabled are booleans.
Explicit facts in sources must be distinguished from characterization-based guesses. Never infer sex, secondary gender, anatomy, or sexual position from a stereotype. Never create a preference as CONFIRMED unless explicitly stated. Recommend around five latent/interest tags when genuinely supported; up to five maximum. If weak evidence, use only one meaningful interest and exploration attitude open|reserved|curious; do not fabricate. Preference tags are neutral snake_case strings, not graphic text; topics can include exhibitionism, embarrassment, humiliation, power_exchange, sensory_play and other card-grounded interests. For USER, only treat the persona's own words as confirmed; do not infer consent, decisions, or acts from assistant narration. This is a PROPOSAL, never an instruction to change actual state.`;
export function anatomyDefault(sex,secondary){
 if(sex==='male'&&secondary==='omega')return 'combined';
 if(sex==='female'&&secondary==='alpha')return 'female_alpha_combined';
 if(sex==='male')return 'male_only';
 if(sex==='female')return 'female_only';
 return 'custom';
}
export function anatomyChoices(sex,secondary){
 if(sex==='male'&&secondary==='omega')return [['combined','복합형'],['vaginal_only','컨트보이형'],['male_only','남성 생식기형'],['custom','사용자 정의']];
 if(sex==='female'&&secondary==='alpha')return [['female_alpha_combined','남성 복합형'],['female_only','여성 생식기형'],['custom','사용자 정의']];
 return [[anatomyDefault(sex,secondary),'기본 신체 유형'],['custom','사용자 정의']];
}
const clean=s=>String(s??'').trim().slice(0,220);
const uniquePrefs=(values,limit,kind)=>{
 const out=[],seen=new Set();
 for(const item of Array.isArray(values)?values:[]){
  const id=clean(typeof item==='string'?item:item?.id).slice(0,80).replace(/[^\p{L}\p{N}_ -]/gu,'');
  if(!id||seen.has(id.toLowerCase()))continue;
  seen.add(id.toLowerCase());
  out.push({id,level:kind==='confirmed'&&['liked','strongly_liked','disliked','restricted'].includes(item?.level)?item.level:kind==='confirmed'?'liked':'latent',reason:clean(item?.reason).slice(0,150),checked:kind==='confirmed'});
  if(out.length>=limit)break;
 }
 return out;
};
export function normalizeSetupProposal(result,chatId){
 const obj=typeof result==='string'?JSON.parse(result.trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/i,'')):result;
 const roles={};
 for(const role of ['char','user']){
  const raw=obj?.[role]||{},fields=[];
  for(const [key,label] of Object.entries(PROFILE_FIELDS)){
   const entry=raw.fields?.[key];if(!entry||typeof entry!=='object'||!Object.hasOwn(entry,'value'))continue;
   let value=entry.value;
   if(enumFields[key]){if(!enumFields[key].includes(value)||value==='unknown')continue;}
   else if(booleanFields.includes(key)){if(typeof value!=='boolean')continue;}
   else if(stringFields.includes(key)){if(typeof value!=='string'||!value.trim())continue;value=clean(value);}
   else continue;
   fields.push({key,label,value,basis:entry.basis==='explicit'?'explicit':'suggested',reason:clean(entry.reason).slice(0,150),checked:entry.basis==='explicit'});
  }
  const preferences=raw.preferences||{};
  roles[role]={fields,confirmed:uniquePrefs(preferences.confirmed,25,'confirmed'),latent:uniquePrefs(preferences.latent,5,'latent'),attitude:['open','reserved','curious'].includes(preferences.attitude)?preferences.attitude:'curious',useAttitude:false};
 }
 return {chatId,createdAt:Date.now(),roles};
}
export function mergeSelectedPreferences(existing,proposal){
 const old=existing||{confirmed:[],latent:[],attitude:'curious'};
 const confirmed=(old.confirmed||[]).map(p=>({...p})),latent=(old.latent||[]).map(p=>({...p}));
 const has=id=>[...confirmed,...latent].some(p=>p.id===id);
 for(const p of proposal?.confirmed||[]){
  if(!p.checked||!p.id)continue;
  const existing=confirmed.find(x=>x.id===p.id);if(existing?.locked)continue;
  if(existing){existing.level=p.level;existing.source='user_approved_setup';existing.locked=true;continue;}
  const pos=latent.findIndex(x=>x.id===p.id);if(pos>=0)latent.splice(pos,1);
  confirmed.push({id:p.id,level:p.level,source:'user_approved_setup',locked:true,evidence:['setup']});
 }
 for(const p of proposal?.latent||[])if(p.checked&&p.id&&!has(p.id))latent.push({id:p.id,level:'latent',source:'user_approved_setup',evidence:[]});
 return {confirmed,latent,attitude:proposal?.useAttitude?proposal.attitude:(old.attitude||'curious')};
}
