/* Profile setup: proposal normalization only. Never changes live canonical data. */
export const PROFILE_FIELDS = Object.freeze({
  sex:'성별', secondary:'제2성별', anatomy:'성기 형태·신체 유형', anatomyDetail:'특수 신체 구조',
  inseminationOrgan:'가상 수태기관·경로', gestate:'임신 가능', impregnate:'수태 가능',
  menstruationEnabled:'월경', cycleEnabled:'히트·러트', pheromoneScent:'페로몬 향',
  contactStyle:'접촉 성향', vocalStyle:'발성 성향', speechStyle:'언어 성향',
  baseCondition:'기초 컨디션 (0~100)', basePheromone:'기초 페로몬 발산 (0~100)'
});
const enumFields={
  sex:['male','female','nonbinary','unknown'],secondary:['alpha','beta','omega','unknown'],
  anatomy:['combined','vaginal_only','male_only','female_only','female_alpha_combined','custom'],
};
const booleanFields=['gestate','impregnate','menstruationEnabled','cycleEnabled'];
const stringFields=['anatomyDetail','inseminationOrgan','pheromoneScent','contactStyle','vocalStyle','speechStyle'];
const numericFields=['baseCondition','basePheromone'];
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
{"char":{"fields":{"sex":{"value":"male","basis":"explicit","reason":"카드에 남성이라고 명시됨"},"secondary":{"value":"omega","basis":"suggested","reason":"상처를 숨기면서도 타인의 변화에 민감한 성향을 ABO 세계관에 맞춰 해석한 가상 제안"},"anatomy":null,"anatomyDetail":null,"inseminationOrgan":null,"gestate":null,"impregnate":null,"menstruationEnabled":null,"cycleEnabled":null,"pheromoneScent":null,"contactStyle":null,"vocalStyle":null,"speechStyle":null,"baseCondition":{"value":74,"basis":"suggested","reason":"예시 수치: 실제 카드·페르소나의 체력 설정으로 추정해야 함"},"basePheromone":{"value":53,"basis":"suggested","reason":"예시 수치: 실제 ABO 유형과 페로몬 설정으로 추정해야 함"}},"preferences":{"confirmed":[{"id":"verbal_teasing","label":"언어적 도발","level":"liked","reason":"한국어로 작성한 카드 근거"}],"latent":[{"id":"some_interest","label":"문맥에 맞춘 한국어 명칭","reason":"한국어로 작성한 성격 기반 근거"}],"attitude":"curious"}},"user":{"fields":{"baseCondition":{"value":71,"basis":"suggested","reason":"예시 수치: 실제 유저 페르소나의 체력 설정으로 추정해야 함"},"basePheromone":{"value":46,"basis":"suggested","reason":"예시 수치: 실제 유저 페르소나의 ABO·페로몬 설정으로 추정해야 함"}},"preferences":{"confirmed":[],"latent":[],"attitude":"reserved"}}}
EXPLICIT SETUP SELECTIONS AND PHEROMONE SCENT:
- Each char/user may include setupSelections from the initial STATUS panel. These values are MANUAL choices, NOT guesses, and take precedence over missing or conflicting secondary/sex facts in the original card. The UI already saves these choices; never silently change alpha/omega/beta to another type based on card omissions or stereotypes.
- When setupSelections.secondary is "alpha" or "omega", OR this initial analysis proposes alpha/omega as secondary, and there is no established pheromoneScent (neither an explicit pheromone description in the source nor a nonempty setupSelections.pheromoneScent), INCLUDE a pheromoneScent field with a NEW, concise, plausible, Korean-language fragrance proposal. Build its scent notes from this character's individual characterization, manner, sensory imagery and atmosphere rather than defaulting to gender/ABO stereotypes. Use {"value":"한국어 향 조합","basis":"suggested","reason":"캐릭터의 어떤 분위기·묘사에서 향을 착안했는지"}. Do not mark a newly invented scent as explicit, and leave it unselected so the user can opt in.
- An ambient smell (such as coffee or wood in the card) is not automatically an established pheromone. It may INSPIRE a suggested pheromone but should not be mislabeled as card-explicit pheromone. If pheromone scent IS explicitly defined in the original source, return that as explicit instead. If setupSelections.pheromoneScent is nonempty, honor it and do not manufacture an alternative.
- For manual beta selection, do NOT invent a pheromone scent unless one is explicitly given in the source. A provisional seeded STATUS display value is never an analysis selection and must not trigger this scent proposal requirement; an AI-proposed alpha/omega may trigger it.
- The scent is a PROFILE PROPOSAL only. Never mutate the live profile or automatically approve an inferred scent.
FIRST INITIAL PROFILE ANALYSIS — CONTEXT-BASED SECONDARY GENDER AND COMPATIBLE ANATOMY:
- For BOTH CHAR and USER, if neither a manual selection nor a card/persona statement defines secondary sex, SELECT one of alpha/beta/omega by analyzing THIS individual's existing personality, preferences, behavioral patterns, interpersonal dynamics, and narrative traits. Return secondary with basis:"suggested" and a concrete KOREAN reason tracing relevant source characterization to the fictional ABO proposal. The source is a creative interpretation, NOT a card fact. Do NOT randomly or uniformly roll this field. Do NOT reuse any pre-analysis seeded tracker ABO default.
- Alpha/Beta/Omega are fictional physiology categories. Dominance, submission, sexual position, masculinity/femininity, social rank, or BDSM preferences NEVER mechanically equal an ABO type. Weigh multiple individualized clues; a powerful character may be any of the three. If cues are weak, still choose one as a deliberately tentative creative interpretation and explicitly acknowledge the uncertainty in the reason, without inventing an original-card fact.
- Preserve original-card explicit secondary identity (basis:"explicit") and manual setupSelections.secondary. Never override either. Never claim an AI-chosen secondary is explicit when the card does not actually contain it.
- For anatomy, the EXTENSION—not model preference or stereotypes—assigns an arbitrary option from its allowed sex+secondary pool AFTER secondary is selected. If anatomy is explicitly present in the original card or fixed in setupSelections.anatomy, preserve it. Do not infer genital anatomy from sexual position, D/s, or sexual preferences. Leave suggested secondary and anatomy UNCHECKED until the user edits/approves them.
- The secondary field is REQUIRED in the model output whenever not explicitly fixed. Include enough substantive Korean analysis reasoning in each suggested secondary field; leaving the value missing will result in a validation failure and a format retry. The model's anatomy value may be omitted when not fixed; the extension supplies the compatible anatomy candidate.
- Generate a character-grounded pheromoneScent suggestion for ALPHA/OMEGA even if that secondary type is an AI suggestion, provided no explicit/manually fixed scent exists. Beta gets no inferred pheromone scent by default.
INITIAL NUMERIC VITAL PROPOSALS (CHAR and USER, BOTH required):
- Include baseCondition and basePheromone as distinct integer scores in [0,100] with basis:"suggested" and concise Korean reasoning tied to each card/persona. These scores are FICTIONAL SIMULATION baselines, not medical measurements or permanent current state.
- Base condition reflects bodily constitution/stamina/health text. Base pheromone reflects the selected ABO category and individualized pheromone notes; Beta generally lower but explicit world exceptions override. Personality, sexual preferences, top/bottom roles and D/s do not by themselves establish pheromone strength or health.
- When information is sparse STILL propose both numerical values using a reasonable tentative fictional baseline (and explicitly say it is a weak inference), not "unknown" or identical fixed numbers for everyone. Do not fabricate evidence or pretend precise measurements.
- These are opt-in USER-EDITABLE proposals; until selected, locally estimated per-character baselines provide immediately visible numbers.
ABO PHYSIOLOGY DEPENDENCY (CRITICAL — not an ordinary absence classifier):
- Choose secondary FIRST using character personality/preferences, then choose genital anatomy from that sex+ABO pool; ONLY THEN derive gestate (ability to carry pregnancy), impregnate (ability to cause conception), menstruationEnabled, and cycleEnabled using the fictional ABO rule set. Never assign these four booleans simply because the card fails to mention pregnancy, menstruation or heat/rut.
- A character explicitly described as male can still be a gestational or menstruating OMEGA in this setting, including the fictional male-only Omega anatomy (with distinct reproductive/menstrual routes). Their physical sex, sexual position (TOP/BOTTOM), D/s dynamics and personality do NOT determine these four flags. In particular TOP fixed is NOT evidence of ability to cause conception, and male is NOT evidence of infertility or absence of a cycle.
- The extension derives the four default flags from the selected ABO and anatomy deterministically AFTER your response. Omit these four fields unless the character card/persona EXPLICITLY affirms or denies that specific ability/cycle (and quote the relevant fact in the reason). If explicitly stated, use basis:"explicit". Do NOT output false because no text exists.
- Fictional default matrix: male Alpha=(gestate:false,impregnate:true,menstruation:false,cycleEnabled:true); male Beta=(false,true,false,false); male Omega=(true,false,true,true) for ALL its allowed anatomical options; female Alpha=(true,true,true,true); female Beta=(true,false,true,false); female Omega=(true,false,true,true). Alpha rut can be disabled by later user choice. These are ABO STORY defaults, not real physiology.
- Suggested defaults are independently opt-in, NOT automatic modifications of the live profile. If you cannot verify a specific card fact, do not label a value as explicit.
VOICE & SPEECH STYLE ANALYSIS (adult relationship / NSFW-capable profile):
- vocalStyle (발성 성향) is primarily about *nonverbal and acoustic responses during closeness, tension, and potentially NSFW intimacy*, not a recap of everyday speaking manners. If the source supports it, propose a plausible pattern of breathing, sounds/moans, held-back vs freely expressed voice, pitch, volume, breathiness, and how audible reactions shift with excitement, embarrassment, vulnerability, or loss of composure. Ordinary voice timbre may be mentioned as a baseline but should NOT be the entire output. Differentiate the person's own vocal response from a preference for hearing someone else's voice.
- speechStyle (언어 성향) describes *what and how the person speaks*: honorific vs casual register, address terms, teasing, requests, reassurance, questions, commands, sentence structure, and potential changes in intimate or NSFW situations. Polite speech or sentence endings belong here, NOT in vocalStyle. Include relationship-specific speech tendencies when grounded in the source; do not simply repeat their everyday manner of speech.
- For BOTH char and user, derive context-specific possibilities from explicit traits and consistent behavioral cues, not from gender or genre stereotypes. If a detail is not explicitly stated, use basis:"suggested" and make the reason show the source-to-inference connection; never present a hypothetical NSFW vocalization or line of dialogue as an event that already occurred. Do not infer consent, acts, or preferences from a voice characteristic. When there is truly no basis for even a tentative pattern, omit the field rather than fabricating it.
- Keep vocalStyle and speechStyle DISTINCT. Write each as a short, natural Korean proposal, not a full paragraph. The reference vocabulary is optional; it must not force sounds, kinks, or generic phrases onto every character.
Other unsupported fields may be omitted or null; secondary is required when unset, while anatomy and the four dependent fertility/cycle defaults are supplied from the corresponding fictional ABO rules (unless explicitly established in source or manually locked). For populated fields use {"value":...,"basis":"explicit|suggested","reason":"..."}. Sex=male|female|nonbinary|unknown; secondary=alpha|beta|omega|unknown; anatomy=combined|vaginal_only|male_only|female_only|female_alpha_combined|custom. Other six descriptive fields must be concise strings. gestate/impregnate/menstruationEnabled/cycleEnabled are booleans.
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
 if(!['male','female'].includes(sex))return [['male_only','남성 생식기형'],['female_only','여성 생식기형'],['combined','복합형'],['vaginal_only','컨트보이형'],['female_alpha_combined','여성 알파 복합형'],['custom','사용자 정의']];
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
   else if(numericFields.includes(key)){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)continue;value=Math.round(value);}
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
/** Initial-analysis-only identity completion. The model selects secondary from
 * personality/preference evidence; only anatomy uses a stable pseudo-random choice
 * from the allowed sex+secondary pool. Neither affects canonical live state.
 */
const VALID_ABO=['alpha','beta','omega'];
const VALID_ANATOMY=['combined','vaginal_only','male_only','female_only','female_alpha_combined','custom'];
function seededIndex(seed,tag,count){
 let h=2166136261;
 for(const ch of `${seed}:${tag}`){h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;}
 return h%count;
}
function directSourceMention(card,key,value){
 const text=String(card||'');
 if(!text.trim())return false;
 if(key==='secondary'){
  const names={alpha:['alpha','알파'],beta:['beta','베타'],omega:['omega','오메가']}[value]||[];
  // Only allow an AI 'explicit' claim when its supposed class is actually mentioned.
  return names.some(name=>/[가-힣]/u.test(name)?text.includes(name):new RegExp(`(?:^|[^\\p{L}])${name}(?=$|[^\\p{L}])`,'iu').test(text));
 }
 if(key==='anatomy')return /(?:신체\s*유형|생식기|성기\s*형태|anatomy|genital|복합형|컨트보이|vagin|penis)/iu.test(text);
 return false;
}
function identityChoicePool(sex,secondary){
 // Constrain arbitrary genital-form proposals to the existing fictional anatomy vocabulary.
 // This never sets an individual's sexual position or reproductive capacity.
 if(sex==='male'&&secondary==='omega')return ['combined','vaginal_only','male_only'];
 if(sex==='female'&&secondary==='alpha')return ['female_alpha_combined','female_only'];
 if(sex==='male')return ['male_only'];
 if(sex==='female')return ['female_only'];
 return ['male_only','female_only','combined','vaginal_only'];
}
/** Fictional ABO-default flags, aligned with core.mjs person/replay defaults.
 * Physical sex or sex-position by itself is never treated as an exclusion.
 */
export function deriveABOPhysiology(sex,secondary,anatomy){
 const s=['male','female'].includes(sex)?sex:'unknown';
 const a=VALID_ABO.includes(secondary)?secondary:'unknown';
 if(a==='unknown')return null;
 return {
  gestate:a==='omega'||(s==='female'&&(a==='alpha'||a==='beta')),
  impregnate:a==='alpha'||(s==='male'&&a==='beta'),
  menstruationEnabled:a==='omega'||s==='female',
  cycleEnabled:a!=='beta'
 };
}
const PHYSIO_REASON={
 gestate:{yes:'임신 가능한 생식 경로를 갖는 ABO 세계관 기본 설정',no:'현재 조합의 ABO 기본 생식 모델에는 임신 유지 경로가 설정되지 않음'},
 impregnate:{yes:'수태를 유발할 수 있는 ABO 세계관 기본 설정',no:'현재 조합의 ABO 기본 생식 모델에는 수태 유발 능력이 설정되지 않음'},
 menstruationEnabled:{yes:'이 ABO 유형에 설정된 월경·생식 주기를 따름',no:'이 ABO 유형의 기본 주기 규칙에는 월경이 포함되지 않음'},
 cycleEnabled:{yes:'해당 ABO 유형의 히트·러트 주기 설정을 사용함',no:'베타 유형은 기본적으로 히트·러트 주기가 비활성화됨'}
};
/** Card-only explicit facts. Mere references to sex, TOP/BOTTOM, pregnancy as a genre
 * term, or absence of mention are not evidence of any reproductive property. */
function directPhysiologyFact(card,key,value){
 const t=String(card||'');if(!t.trim())return false;
 const facts={
  gestate:{true:[/임신\s*(?:가능|할\s*수\s*있)/u,/가임\s*(?:가능|상태)/u,/can\s+(?:become|get)\s+pregnant/i],false:[/임신\s*(?:불가능|불가|할\s*수\s*없|하지\s*못)/u,/불임/u,/cannot\s+(?:become|get)\s+pregnant/i]},
  impregnate:{true:[/수태\s*(?:가능|시킬\s*수\s*있)/u,/임신시킬\s*수\s*있/u,/can\s+impregnate/i],false:[/수태\s*(?:불가능|불가|시킬\s*수\s*없)/u,/임신시킬\s*수\s*없/u,/cannot\s+impregnate/i]},
  menstruationEnabled:{true:[/월경\s*(?:있음|한다|가능|주기)/u,/생리\s*(?:있음|한다|주기)/u,/menstruat(?:es|ion)\s*[:=]\s*(?:true|yes)/i],false:[/월경\s*(?:없음|하지\s*않|불가능)/u,/무월경/u,/생리\s*(?:없음|하지\s*않)/u,/menstruat(?:es|ion)\s*[:=]\s*(?:false|no)/i]},
  cycleEnabled:{true:[/히트\s*(?:있음|주기|발현)/u,/러트\s*(?:있음|주기|발현)/u,/heat\s*(?:cycle)?\s*[:=]\s*(?:true|yes)/i,/rut\s*(?:cycle)?\s*[:=]\s*(?:true|yes)/i],false:[/히트\s*(?:없음|미발현|비활성)/u,/러트\s*(?:없음|미발현|비활성)/u,/히트[·\/\s]*러트\s*(?:없음|비활성)/u,/heat\s*(?:cycle)?\s*[:=]\s*(?:false|no)/i,/rut\s*(?:cycle)?\s*[:=]\s*(?:false|no)/i]}
 };
 return facts[key]?.[String(value)]?.some(pattern=>pattern.test(t))||false;
}
/** Reconcile model physiology suggestions to the chosen ABO/anatomy.
 * Manually fixed traits stay out of the proposal, and evidenced explicit card
 * declarations are preserved. Every other value is computed, not guessed. */
export function alignInitialPhysiologyProposal(record,{source={},manual={}}={}){
 if(!record||!Array.isArray(record.fields))return record;
 const byKey=key=>record.fields.find(f=>f.key===key);
 const sex=(['male','female','nonbinary'].includes(manual.sex)?manual.sex:null)||(['male','female','nonbinary'].includes(source.sex)?source.sex:null)||byKey('sex')?.value||'unknown';
 const secondary=manual.secondary|| (VALID_ABO.includes(source.secondary)?source.secondary:null)||byKey('secondary')?.value;
 const anatomy=manual.anatomy||source.anatomy||byKey('anatomy')?.value;
 const defaults=deriveABOPhysiology(sex,secondary,anatomy);
 if(!defaults)return record;
 const label=secondary.toUpperCase(),shape=anatomy||'미설정';
 for(const key of booleanFields){
  const existing=byKey(key);
  if(Object.hasOwn(manual,key)){
   if(existing)record.fields.splice(record.fields.indexOf(existing),1);
   continue;
  }
  if(existing?.basis==='explicit' && typeof existing.value==='boolean' && directPhysiologyFact(source.card,key,existing.value)){
   existing.checked=true;continue;
  }
  const value=defaults[key];
  const reason=`${label} · ${shape}: ${PHYSIO_REASON[key][value?'yes':'no']}. 카드에 해당 능력이 명시되지 않아 세계관 규칙으로 제안했으며, 성별이나 성적 포지션만으로 판정하지 않았다.`;
  const proposal={key,label:PROFILE_FIELDS[key],value,basis:'suggested',source:'abo_default',reason,checked:false};
  if(existing)Object.assign(existing,proposal);else record.fields.push(proposal);
 }
 return record;
}
/** Ensure a stored older proposal cannot silently omit required secondary sex. */
export function missingInitialSecondaryRoles(draft,{canon={},overrides={}}={}){
 return ['char','user'].filter(role=>{
  const source=canon[role]||{},fixed=overrides[role]||{};
  if(VALID_ABO.includes(fixed.secondary)||VALID_ABO.includes(source.secondary))return false;
  return !draft?.roles?.[role]?.fields?.some(f=>f.key==='secondary'&&VALID_ABO.includes(f.value));
 });
}
export function completeInitialIdentityProposal(draft,{canon={},overrides={},seed='',existingDefaults={}}={}){
 if(!draft?.roles)return draft;
 for(const role of ['char','user']){
  const record=draft.roles[role];if(!record)continue;
  const source=canon?.[role]||{},manual=overrides?.[role]||{};
  const fields=Array.isArray(record.fields)?record.fields:[];
  const byKey=key=>fields.find(item=>item.key===key);
  const manualHas=key=>Object.hasOwn(manual,key)&&(key!=='secondary'||VALID_ABO.includes(manual[key]));
  const sourceValue=(key,valid)=>valid.includes(source[key])?source[key]:null;
  const takeSource=(key,valid)=>{
   if(manualHas(key)){
    // Even if the model included the field, no competing proposal should appear.
    const i=fields.findIndex(f=>f.key===key);if(i>=0)fields.splice(i,1);
    return manual[key];
   }
   const canonValue=sourceValue(key,valid);
   const existing=byKey(key);
   const explicit=canonValue || (existing?.basis==='explicit'&&valid.includes(existing.value)&&directSourceMention(source.card,key,existing.value)?existing.value:null);
   if(explicit){
    const entry={key,label:PROFILE_FIELDS[key],value:explicit,basis:'explicit',reason:existing?.value===explicit&&existing?.basis==='explicit'&&existing.reason?existing.reason:'원문 카드·페르소나에 명시된 설정이다.',checked:true};
    if(existing)Object.assign(existing,entry);else fields.push(entry);
    return explicit;
   }
   return null;
  };
  const knownABO=takeSource('secondary',VALID_ABO);
  let chosenABO=knownABO;
  if(!manualHas('secondary')&&!knownABO){
   const existing=byKey('secondary');
   if(!existing||!VALID_ABO.includes(existing.value)){
    throw new SetupJsonFormatError(`${role.toUpperCase()} 제2성별의 성격·취향 기반 분석이 누락되었습니다. 분석 모델의 결과를 다시 생성하세요.`);
   }
   if(!existing.reason?.trim()||existing.reason.trim().length<8){
    throw new SetupJsonFormatError(`${role.toUpperCase()} 제2성별 선택 근거가 누락되었습니다. 성격·행동·취향에서 무엇을 읽었는지 분석하세요.`);
   }
   chosenABO=existing.value;
   Object.assign(existing,{
    key:'secondary',label:PROFILE_FIELDS.secondary,value:chosenABO,basis:'suggested',
    reason:existing.reason||'카드에 제2성별이 명시되지 않아 캐릭터의 기존 성격과 취향을 근거로 제안한 가상 설정이다.',
    source:'ai_analysis',checked:false
   });
  }
  const sex=(['male','female','nonbinary'].includes(manual.sex)?manual.sex:null)||(['male','female','nonbinary'].includes(source.sex)?source.sex:null)||byKey('sex')?.value||'unknown';
  const knownAnatomy=takeSource('anatomy',VALID_ANATOMY);
  if(!manualHas('anatomy')&&!knownAnatomy){
   const pool=identityChoicePool(sex,chosenABO);
   const entry={key:'anatomy',label:PROFILE_FIELDS.anatomy,value:pool[seededIndex(seed,`${role}:${source.id||source.name||''}:anatomy`,pool.length)],basis:'suggested',reason:'원문 카드·페르소나에 성기 형태가 없어 기존 가상 신체 유형 중 임의 배정했다. 확정 정보가 아니다.',source:'arbitrary',checked:false};
   const existing=byKey('anatomy');if(existing)Object.assign(existing,entry);else fields.push(entry);
  }
  // Derive all dependent flags only AFTER ABO + compatible anatomy are known.
  alignInitialPhysiologyProposal(record,{source,manual});
  // Present the identity choices before lengthy interaction/preference proposals.
  const order=['sex','secondary','anatomy','gestate','impregnate','menstruationEnabled','cycleEnabled'];
  record.fields=fields.map((f,i)=>({...f,__order:i})).sort((a,b)=>{
   const ai=order.indexOf(a.key),bi=order.indexOf(b.key);
   return (ai<0?100+ a.__order:ai)-(bi<0?100+b.__order:bi);
  }).map(({__order,...rest})=>rest);
 }
 return draft;
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
