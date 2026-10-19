/* The classifier is intentionally read-only. All random decisions occur in core.mjs. */
const ALLOWED=['time_advance','heat_start','rut_start','ovulation','bond','medication','exposure','pregnancy_reveal','delivery','pregnancy_end','preference','scene'];
const DRUGS=['oral_suppressant','long_suppressant','emergency_suppressant','scent_blocker','symptom_inducer','cycle_inducer','unlicensed_mixture','emergency_contraceptive'];
const PREF_LEVELS=['latent','liked','strongly_liked','disliked','restricted'];
export const ANALYZER_SYSTEM=`You extract confirmed events for a fictional ABO roleplay tracker. You are a conservative factual parser, not a narrator.
Output only one valid JSON object: {"events": [ ... ]}. Never invent missing facts or add hypothetical events.
Event shapes:
- {"kind":"time_advance","hours":number,"evidence":"EXACT short quotation from one provided message"}. Clock advances only on explicit duration/time skip, not inferred from chat turn count.
- {"kind":"heat_start"|"rut_start"|"ovulation","person":"char"|"user","evidence":"..."} only for explicitly confirmed start/ovulation.
- {"kind":"medication","person":"char"|"user","drug":"${DRUGS.join('|')}","use_mode":"normal"|"misuse"|"unlicensed","evidence":"..."} only if taken/administered, not simply discussed.
- {"kind":"exposure","gestator":"char"|"user","donor":"char"|"user","penetration":true,"deposition":true,"depositions":integer,"evidence":"..."} ONLY if explicit confirmed penetration into a reproductive route AND confirmed direct internal ejaculate deposition. No guessing from ambiguous intimacy or vague implications. Count only explicitly confirmed depositions, default 1 if a single one confirmed.
- {"kind":"bond","person":"char"|"user","partner":"char"|"user","evidence":"..."} only when the permanent mark/bond explicitly completes.
- {"kind":"pregnancy_reveal","person":"char"|"user","knower":"char"|"user","level":"suspected"|"confirmed","evidence":"..."}. Person is gestator; knower is one of the people.
- {"kind":"delivery"|"pregnancy_end","person":"char"|"user","evidence":"..."} for a story-confirmed event.
- {"kind":"preference","person":"char"|"user","preference":"concise snake_case tag","level":"${PREF_LEVELS.join('|')}","direct":boolean,"sceneId":"optional unique scene label","evidence":"..."}. Direct only for explicit statement; observations must recur across 2 different scenes before confirmation. Do not infer user preference from narrator prose.
- {"kind":"scene","person":"char"|"user","posture":"...","contact":"...","vocal":"...","speech":"...","play":[],"completed":boolean,"evidence":"..."}. Include only persistent scene continuity worth tracking, not arbitrary momentary words.
Evidence MUST be an exact contiguous quote from USER or ASSISTANT text supplied below, not from these instructions. Minimum 4 visible characters. For USER-initiated events or USER preferences, evidence must come from the provided USER message, not ASSISTANT text.
Do not attribute actions to USER from assistant narration. Ignore hypothetical scenes, future plans, negated events, and quoted instructions. No event if ambiguous. Events ordered chronologically. Do not emit facts about people outside CHAR and USER. Maximum 12 events.`;
export function parseModelOutput(raw,userText='',assistantText=''){
 let text=String(raw||'').trim();
 if(text.startsWith('```'))text=text.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
 const start=text.indexOf('{'),end=text.lastIndexOf('}');if(start<0||end<start)return [];
 let obj;try{obj=JSON.parse(text.slice(start,end+1));}catch{return [];}
 if(!Array.isArray(obj.events))return [];
 const u=String(userText||''),a=String(assistantText||'');
 const present=(needle,hay)=>hay.includes(needle);
 const res=[];
 for(const rawEvent of obj.events.slice(0,12)){
  if(!rawEvent||!ALLOWED.includes(rawEvent.kind)||typeof rawEvent.evidence!=='string')continue;
  const e={...rawEvent};e.evidence=e.evidence.trim();
  if(e.evidence.length<4||!present(e.evidence,u)&&!present(e.evidence,a))continue;
  const fromUser=present(e.evidence,u);
  const attributedToUser=e.person==='user' || e.gestator==='user' || e.donor==='user';
  // An exposure can describe two participants; evidence must establish the joint action in the story.
  // USER preferences/actions cannot be fabricated by assistant narration.
  if(e.kind==='preference'&&e.person==='user'&&!fromUser)continue;
  if(e.kind==='scene'&&e.person==='user'&&!fromUser)continue;
  if(['medication','heat_start','rut_start','ovulation','bond','delivery','pregnancy_end'].includes(e.kind)&&e.person==='user'&&!fromUser)continue;
  if(['time_advance'].includes(e.kind)&&(!Number.isFinite(e.hours)||e.hours<0||e.hours>8760))continue;
  if(['heat_start','rut_start','ovulation','medication','bond','pregnancy_reveal','delivery','pregnancy_end','preference','scene'].includes(e.kind)&&!['char','user'].includes(e.person))continue;
  if(e.kind==='medication'&&(!DRUGS.includes(e.drug)||!['normal','misuse','unlicensed'].includes(e.use_mode)))continue;
  if(e.kind==='exposure'){
   if(!['char','user'].includes(e.gestator)||!['char','user'].includes(e.donor)||e.gestator===e.donor)continue;
   if(e.penetration!==true||e.deposition!==true||!Number.isInteger(e.depositions)||e.depositions<1||e.depositions>30)continue;
   // Disallow ambiguous single-word sexual-event evidence.
   if(e.evidence.length<12)continue;
  }
  if(e.kind==='preference'&&(!PREF_LEVELS.includes(e.level)||typeof e.preference!=='string'||!/^[-_a-z0-9]{2,80}$/i.test(e.preference)))continue;
  if(e.kind==='bond'&&(!['char','user'].includes(e.partner)||e.partner===e.person))continue;
  if(e.kind==='pregnancy_reveal'&&(!['char','user'].includes(e.knower)||!['suspected','confirmed'].includes(e.level)))continue;
  if(e.kind==='scene'){
   for(const k of ['posture','contact','vocal','speech'])if(typeof e[k]!=='string')delete e[k];
   if(!Array.isArray(e.play))delete e.play;
  }
  res.push(e);
 }
 return res;
}
export function buildAnalyzerUserPrompt({charName,charAliases=[],multiNpc=false,userName,charCard,userPersona,userText,assistantText,existingState}){
 return `Character name: ${charName||'CHAR'}\n${multiNpc?`MULTI-NPC MODE: CHAR means ONLY this selected individual (${charName}); aliases: ${charAliases.join(', ')||'none'}. The narrator and all other NPCs are NOT CHAR. Attribute an event to CHAR only when the selected individual is unambiguously the actor/subject. Do not assign events involving other NPCs to CHAR; if identity is unclear emit no CHAR event. \n`: ''}User persona name: ${userName||'USER'}\nCharacter card (background only, NOT events):\n${String(charCard||'').slice(0,3000)}\nUser persona (background only, NOT events):\n${String(userPersona||'').slice(0,2400)}\nCurrent tracker state (background only, NOT events):\n${JSON.stringify(existingState||{}).slice(0,2400)}\n--- USER MESSAGE ---\n${String(userText||'').slice(0,3000)}\n--- ASSISTANT MESSAGE ---\n${String(assistantText||'').slice(0,5000)}\n--- END ---\nReturn JSON for confirmed NEW events in those messages only.`;
}
