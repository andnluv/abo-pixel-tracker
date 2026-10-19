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
/** Reference vocabulary only: the model chooses context-appropriate Korean labels.
 * Not a forced translation table and not a list of suggested preferences. */
export const PROFILE_KOREAN_REFERENCE_VOCABULARY = Object.freeze([
  '관계·친밀 성향: 친밀감, 감정적 교감, 신뢰, 긴장감, 애정 표현, 스킨십, 밀착, 거리감, 시선, 관계의 주도권',
  'NSFW·BDSM 기본 용어: 지배·복종(D/s), 스위치, 권력 교환, 구속·본디지, 역할극, 감각 플레이, 언어 플레이, 칭찬 플레이, 도발, 애프터케어',
  '서로 구별할 표현: 노출 플레이, 수치심 플레이, 굴욕 플레이, 공포 플레이, 소유욕, 통제권, 신체·음성 취향',
  '장면 기록용 용어: 자세·체위, 접촉, 자극, 압박, 호흡, 숨소리, 발성, 신음, 목소리, 말투, 존댓말·반말',
  'NSFW 발성 참고 어휘: 억누른 소리, 새어 나오는 숨, 짧은 탄식, 숨소리의 변화, 떨리는 음성, 음량 변화, 발성의 억제·표출',
  'NSFW 언어 참고 어휘: 호칭, 애칭, 요청, 질문, 명령, 언어적 도발, 안심시키는 말, 말의 속도·길이, 존댓말·반말 전환',
  'ABO 맥락 용어: 알파, 베타, 오메가, 히트, 러트, 페로몬, 각인, 억제제, 가임기, 배란, 월경, 임신'
]);
const PROFILE_KOREAN_VOCABULARY_NOTE = `\nKorean vocabulary reference (examples, NOT an approved list of preferences, NOT forced one-to-one translations):\n- ${PROFILE_KOREAN_REFERENCE_VOCABULARY.join('\n- ')}\nUse accurate, natural Korean suited to each card/persona and its context. Do not force a listed term into results without evidence or a valid general candidate. Do not automatically label a relationship trait as BDSM or sexual play. Differentiate exhibitionism, embarrassment, humiliation, and other independent interests. For newly generated tags, invent an appropriate Korean label based on meaning; do not rely on a fixed dictionary.\n`;
export const PROFILE_SYSTEM = `You analyze two ADULT fictional character descriptions for an ABO SillyTavern profile setup. Return ONLY a JSON object (no markdown):
LANGUAGE RULE: Write all human-readable analysis prose in fluent, natural KOREAN. This includes ALL descriptive field values (pheromoneScent, contactStyle, vocalStyle, speechStyle, anatomyDetail, inseminationOrgan), every field reason, every confirmed/latent preference reason, and every preference label. Do not copy full English source descriptions into the result as analysis. Refer faithfully to the source, including original proper nouns or brief verbatim quotations only when necessary. Do NOT translate or alter machine-readable JSON keys, enum values, preference IDs, or quoted original proper nouns.
{"char":{"fields":{"sex":{"value":"male","basis":"explicit","reason":"카드에 남성이라고 명시됨"},"secondary":null,"anatomy":null,"anatomyDetail":null,"inseminationOrgan":null,"gestate":null,"impregnate":null,"menstruationEnabled":null,"cycleEnabled":null,"pheromoneScent":null,"contactStyle":null,"vocalStyle":null,"speechStyle":null},"preferences":{"confirmed":[{"id":"verbal_teasing","label":"언어적 도발","level":"liked","reason":"한국어로 작성한 카드 근거"}],"latent":[{"id":"some_interest","label":"문맥에 맞춘 한국어 명칭","reason":"한국어로 작성한 성격 기반 근거"}],"attitude":"curious"}},"user":{"fields":{},"preferences":{"confirmed":[],"latent":[],"attitude":"reserved"}}}
EXPLICIT SETUP SELECTIONS AND PHEROMONE SCENT:
- Each char/user may include setupSelections from the initial STATUS panel. These values are MANUAL choices, NOT guesses, and take precedence over missing or conflicting secondary/sex facts in the original card. The UI already saves these choices; never silently change alpha/omega/beta to another type based on card omissions or stereotypes.
- When setupSelections.secondary is "alpha" or "omega" and there is no established pheromoneScent (neither an explicit pheromone description in the source nor a nonempty setupSelections.pheromoneScent), INCLUDE a pheromoneScent field with a NEW, concise, plausible, Korean-language fragrance proposal. Build its scent notes from this character's individual characterization, manner, sensory imagery and atmosphere rather than defaulting to gender/ABO stereotypes. Use {"value":"한국어 향 조합","basis":"suggested","reason":"캐릭터의 어떤 분위기·묘사에서 향을 착안했는지"}. Do not mark a newly invented scent as explicit, and leave it unselected so the user can opt in.
- An ambient smell (such as coffee or wood in the card) is not automatically an established pheromone. It may INSPIRE a suggested pheromone but should not be mislabeled as card-explicit pheromone. If pheromone scent IS explicitly defined in the original source, return that as explicit instead. If setupSelections.pheromoneScent is nonempty, honor it and do not manufacture an alternative.
- For manual beta selection, do NOT invent a pheromone scent unless one is explicitly given in the source. A random/seeded ABO type not present in setupSelections is not a manual selection and must not by itself trigger this scent proposal requirement.
- The scent is a PROFILE PROPOSAL only. Never mutate the live profile or automatically approve an inferred scent.
VOICE & SPEECH STYLE ANALYSIS (adult relationship / NSFW-capable profile):
- vocalStyle (발성 성향) is primarily about *nonverbal and acoustic responses during closeness, tension, and potentially NSFW intimacy*, not a recap of everyday speaking manners. If the source supports it, propose a plausible pattern of breathing, sounds/moans, held-back vs freely expressed voice, pitch, volume, breathiness, and how audible reactions shift with excitement, embarrassment, vulnerability, or loss of composure. Ordinary voice timbre may be mentioned as a baseline but should NOT be the entire output. Differentiate the person's own vocal response from a preference for hearing someone else's voice.
- speechStyle (언어 성향) describes *what and how the person speaks*: honorific vs casual register, address terms, teasing, requests, reassurance, questions, commands, sentence structure, and potential changes in intimate or NSFW situations. Polite speech or sentence endings belong here, NOT in vocalStyle. Include relationship-specific speech tendencies when grounded in the source; do not simply repeat their everyday manner of speech.
- For BOTH char and user, derive context-specific possibilities from explicit traits and consistent behavioral cues, not from gender or genre stereotypes. If a detail is not explicitly stated, use basis:"suggested" and make the reason show the source-to-inference connection; never present a hypothetical NSFW vocalization or line of dialogue as an event that already occurred. Do not infer consent, acts, or preferences from a voice characteristic. When there is truly no basis for even a tentative pattern, omit the field rather than fabricating it.
- Keep vocalStyle and speechStyle DISTINCT. Write each as a short, natural Korean proposal, not a full paragraph. The reference vocabulary is optional; it must not force sounds, kinks, or generic phrases onto every character.
Every field may be omitted or null when not supported. For populated fields use {"value":...,"basis":"explicit|suggested","reason":"..."}. Sex=male|female|nonbinary|unknown; secondary=alpha|beta|omega|unknown; anatomy=combined|vaginal_only|male_only|female_only|female_alpha_combined|custom. Other six descriptive fields must be concise strings. gestate/impregnate/menstruationEnabled/cycleEnabled are booleans.
Explicit facts in sources must be distinguished from characterization-based guesses. Never infer sex, secondary gender, anatomy, or sexual position from a stereotype. Never create a preference as CONFIRMED unless explicitly stated. Offer 3-5 editable latent preference CANDIDATES for BOTH char and user. Prefer evidence-grounded suggestions; if insufficient evidence, return general neutral OPTIONAL candidates instead of claiming to know a preference. Do not claim user interests as confirmed from personality alone. Use source:"optional" for generic candidates and source:"suggested" for character-grounded interests. No more than five latent tags per role. Preference IDs are neutral snake_case strings for stable storage (English machine IDs only), not graphic text. For EACH preference candidate, also provide a separate short Korean "label" appropriate for an ADULT NSFW/relationship profile. Labels are editable presentation only; never replace or translate the ID itself. Do not translate the user-provided source examples yourself as a fixed mapping: use the reference vocabulary only for natural-language guidance and generate a context-sensitive label. Topics can include exhibitionism, embarrassment, humiliation, power_exchange, sensory_play and other card-grounded interests. For USER, only treat the persona's own words as confirmed; do not infer consent, decisions, or acts from assistant narration. This is a PROPOSAL, never an instruction to change actual state.${PROFILE_KOREAN_VOCABULARY_NOTE}`;
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
// These are generic selectable labels, not inferred or confirmed preferences.
export const OPTION_CANDIDATES=Object.freeze([
 ['gentle_touch','부드러운 접촉'],['verbal_teasing','언어적 도발'],
 ['sensory_play','감각 플레이'],['praise','칭찬 플레이'],['roleplay','역할극'],
 ['power_exchange','권력 교환(D/s)'],['physical_closeness','밀착 접촉'],
 ['embarrassment','수치심 플레이'],['exhibitionism','노출 플레이'],['humiliation','굴욕 플레이'],
 ['restraint','구속 플레이'],['aftercare','사후 돌봄']
]);
const idClean=value=>clean(value).slice(0,80).replace(/[^\p{L}\p{N}_ -]/gu,'');
const koreanCandidateLabel=value=>{const v=clean(value).slice(0,80);return /[가-힣]/u.test(v)?v:'';};
function supplementCandidates(latent,confirmed,min=3){
 const seen=new Set([...latent,...confirmed].map(x=>x.id.toLowerCase()));
 for(const [id] of OPTION_CANDIDATES){
  if(latent.length>=min)break;
  if(seen.has(id))continue;
  latent.push({id,level:'latent',reason:'일반 선택 후보 · 카드/페르소나에서 확인된 취향이 아님',source:'optional',checked:false});
  seen.add(id);
 }
 return latent;
}

const uniquePrefs=(values,limit,kind)=>{
 const out=[],seen=new Set();
 for(const item of Array.isArray(values)?values:[]){
  const id=idClean(typeof item==='string'?item:item?.id);
  if(!id||seen.has(id.toLowerCase()))continue;
  seen.add(id.toLowerCase());
  out.push({id,...(koreanCandidateLabel(item?.label)?{label:koreanCandidateLabel(item?.label)}:{}),source:item?.source==='optional'?'optional':'suggested',level:kind==='confirmed'&&['liked','strongly_liked','disliked','restricted'].includes(item?.level)?item.level:kind==='confirmed'?'liked':'latent',reason:clean(item?.reason).slice(0,150),checked:kind==='confirmed'});
  if(out.length>=limit)break;
 }
 return out;
};
export class SetupJsonFormatError extends Error {
 constructor(message,options){super(message,options);this.name='SetupJsonFormatError';}
}
export function normalizeSetupProposal(result,chatId){
 let obj=result;
 if(typeof result==='string'){
  const data=result.trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/i,'').trim();
  if(!data)throw new SetupJsonFormatError('분석 모델이 빈 응답을 반환했습니다. 연결/출력 토큰 설정을 확인하세요.');
  const begin=data.indexOf('{'),end=data.lastIndexOf('}');
  if(begin<0||end<begin)throw new SetupJsonFormatError('분석 JSON이 완성되지 않았습니다. 출력 길이 제한 또는 모델 형식을 확인하세요.');
  try{obj=JSON.parse(data.slice(begin,end+1));}
  catch(e){throw new SetupJsonFormatError('분석 JSON을 해석하지 못했습니다. 출력이 중간에 끊겼을 수 있습니다.',{cause:e});}
 }
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new SetupJsonFormatError('초기 분석 응답이 올바른 JSON 객체가 아닙니다.');

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
  const confirmed=uniquePrefs(preferences.confirmed,25,'confirmed');
  const latent=supplementCandidates(uniquePrefs(preferences.latent,5,'latent').filter(x=>!confirmed.some(y=>y.id===x.id)),confirmed);
  roles[role]={fields,confirmed,latent,attitude:['open','reserved','curious'].includes(preferences.attitude)?preferences.attitude:'curious',useAttitude:false};
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
  if(existing){existing.level=p.level;existing.source='user_approved_setup';existing.locked=true;if(p.label)existing.label=p.label;continue;}
  const pos=latent.findIndex(x=>x.id===p.id);if(pos>=0)latent.splice(pos,1);
  confirmed.push({id:p.id,...(p.label?{label:p.label}:{}),level:p.level,source:'user_approved_setup',locked:true,evidence:['setup']});
 }
 for(const p of proposal?.latent||[])if(p.checked&&p.id&&!has(p.id))latent.push({id:p.id,...(p.label?{label:p.label}:{}),level:'latent',source:p.source==='custom'?'user_added_setup':'user_approved_setup',evidence:[]});
 return {confirmed,latent,attitude:proposal?.useAttitude?proposal.attitude:(old.attitude||'curious')};
}
