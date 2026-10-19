/* ABO Pixel Tracker · standalone pure state engine. No third-party extension code. */
import {anatomyDefault} from './profile.mjs';
export const VERSION = 1;
export const PHASE_RATES = Object.freeze({ quiet: .10, prodrome: .40, active: .75, recovery: .35 });
export const INSTINCTS = Object.freeze({
  approach:['alpha','beta','omega'], contact_request:['alpha','beta','omega'],
  protect:['alpha','beta','omega'], jealousy:['alpha','beta','omega'],
  territorial:['alpha','omega'], nesting:['omega'], bond_partner_seek:['alpha','omega']
});
export const COMPATIBLE = Object.freeze({
  male_alpha:['female_alpha','male_omega','female_omega','female_beta'],
  female_alpha:['female_alpha','male_omega','female_omega','female_beta'],
  male_beta:['female_beta']
});
export const DRUGS = Object.freeze({
  oral_suppressant:{adverse:.08,duration:[12,24]},
  long_suppressant:{adverse:.12,duration:[480,1080]},
  emergency_suppressant:{adverse:.10,duration:[4,12]},
  scent_blocker:{adverse:.04,duration:[6,12]},
  symptom_inducer:{adverse:.15,duration:[12,36]},
  cycle_inducer:{adverse:.22,duration:[12,72]},
  unlicensed_mixture:{adverse:.40,duration:[4,72]},
  emergency_contraceptive:{adverse:.10,duration:[0,0]},
  oral_contraceptive:{adverse:.08,duration:[24,24]}
});
export const DEFAULT_CONFIG = Object.freeze({
  enabled:true,autoAnalyze:true,injectState:true,hideTruth:false,pregnancyEnabled:true,
  analysisConnection:'',customApiUrl:'',customModel:'',setupMaxTokens:5000,
  rate:{rise:.03,fertile:.14,peak:.30,fall:.06},
  sideEffectScale:1, windowCap:.85,
  oralContraceptiveEffectiveness:.85,emergencyContraceptiveReduction:.75,longSuppressantSuccess:.90,
  style:'pixel',uiTheme:'auto', analysisMaxChars:4500
});
// Symptoms are fictional narrative defaults, never clinical claims.
export const ADVERSE_SYMPTOMS = Object.freeze({
 oral_suppressant:['두통','어지러움','일시적인 페로몬 감각 둔화'],
 long_suppressant:['피로','체온 변화','일시적인 주기 불규칙'],
 emergency_suppressant:['메스꺼움','몸의 열감','일시적인 감각 과민'],
 scent_blocker:['후각 둔화','피부 건조감','잔향의 불안정'],
 symptom_inducer:['발열감','심박 상승','초조함'],
 cycle_inducer:['복부 불편감','극심한 피로','불규칙한 페로몬 발산'],
 unlicensed_mixture:['급격한 체온 변화','현기증','페로몬 조절 불안정'],
 emergency_contraceptive:['메스꺼움','피로','일시적인 주기 변화'],
 oral_contraceptive:['두통','메스꺼움','가벼운 피로']
});
const CLAMP=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
export const clamp=CLAMP;
export function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(16).padStart(8,'0');}
export function dice(seed,tag){return parseInt(hash(`${seed}:${tag}`),16)/4294967296;}
export function pickInt(seed,tag,lo,hi){return lo+Math.floor(dice(seed,tag)*(hi-lo+1));}
export function uniqKey(m,i){const swipe=Number.isInteger(m?.swipe_id)?m.swipe_id:0;const text=String(m?.mes??'');return`${i}:${swipe}:${hash(text)}`;}
export function normalizeSex(raw){const v=String(raw||'').toLowerCase().trim();return ['male','남성','남자','m'].includes(v)?'male':['female','여성','여자','f'].includes(v)?'female':['nonbinary','non-binary','논바이너리'].includes(v)?'nonbinary':'unknown';}
export function normalizeABO(raw){const v=String(raw||'').toLowerCase().trim();return ['alpha','알파','a'].includes(v)?'alpha':['beta','베타','b'].includes(v)?'beta':['omega','오메가','o'].includes(v)?'omega':'unknown';}
export function inferExplicit(text){
 const s=String(text||'').slice(0,13000);
 const sexMatches=[...s.matchAll(/(?:^|[\s\n\[:(])(?:gender|성별|sex)\s*[:：=]\s*(male|female|남성|여성|남자|여자|nonbinary|논바이너리)(?=$|[^\p{L}\p{N}_])/igu)];
 const aboMatches=[...s.matchAll(/(?:^|[\s\n\[:(])(?:secondary\s*(?:sex|gender)|제2성별|2차\s*성별|abo)\s*[:：=]\s*(alpha|beta|omega|알파|베타|오메가)(?=$|[^\p{L}\p{N}_])/igu)];
 const shapeMatches=[...s.matchAll(/(?:anatomy|신체\s*유형|생식기\s*유형)\s*[:：=]\s*(female_alpha_combined|female_only|combined|vaginal_only|male_only|복합형|컨트보이형|남성\s*생식기형|여성\s*생식기형|여성\s*알파\s*복합형)/ig)];
 const shape=shapeMatches.length?shapeMatches.at(-1)[1].toLowerCase():null;
 return {sex:sexMatches.length?normalizeSex(sexMatches.at(-1)[1]):'unknown',secondary:aboMatches.length?normalizeABO(aboMatches.at(-1)[1]):'unknown',anatomy:shape===null?null:shape==='컨트보이형'?'vaginal_only':shape.includes('여성')&&shape.includes('복합')?'female_alpha_combined':shape.includes('여성')?'female_only':shape.includes('남성')?'male_only':shape==='복합형'?'combined':shape};
}
export function person(id,name,seed,canon={}){
 const sex=normalizeSex(canon.sex);
 const secondary=normalizeABO(canon.secondary)||'unknown';
 const abo=secondary==='unknown'?['alpha','beta','omega'][pickInt(seed,`abo:${id}`,0,2)]:secondary;
 const omegaMale=sex==='male'&&abo==='omega';
 const interval=abo==='omega'?pickInt(seed,`${id}:interval`,20,35):pickInt(seed,`${id}:interval`,30,90);
 const prodrome=abo==='omega'?pickInt(seed,`${id}:prodrome`,6,48):pickInt(seed,`${id}:prodrome`,6,24);
 const active=abo==='omega'?pickInt(seed,`${id}:active`,3,7)*24:pickInt(seed,`${id}:active`,1,3)*24;
 const recovery=abo==='omega'?pickInt(seed,`${id}:recovery`,12,72):pickInt(seed,`${id}:recovery`,12,48);
 return {
  id,identityId:String(canon.id||''),name:String(name||id),sex,secondary:abo,source:{sex:sex!=='unknown'?'card':'unknown',secondary:secondary!=='unknown'?'card':'initial_roll'},
  locks:{},anatomy:canon.anatomy||anatomyDefault(sex,abo),anatomyDetail:canon.anatomyDetail||'',inseminationOrgan:canon.inseminationOrgan||'',
  presentation:{pheromoneScent:canon.pheromoneScent||'',contactStyle:canon.contactStyle||'',vocalStyle:canon.vocalStyle||'',speechStyle:canon.speechStyle||''},
  cycle:{enabled:abo!=='beta',intervalHours:interval*24,prodromeHours:prodrome,activeHours:active,recoveryHours:recovery,anchorHour:interval*24, phase:'quiet',ovulationHour:null},
  menstruation:{enabled:omegaMale||sex==='female',days:pickInt(seed,`${id}:menses`,3,7)},
  fertile:{gestate:(abo==='omega'||sex==='female'&&['alpha','beta'].includes(abo)),impregnate:abo==='alpha'||(sex==='male'&&abo==='beta')},
  body:{condition:70,fatigue:20,desire:25,sensitivity:35,emission:40,stress:20,resistance:50,instinct:50},
  pheromone:{emission:50,sensitivity:50,control:50,pressure:50},
  medication:[],tolerance:{},adverse:[], preferences:canon.preferences?structuredClone(canon.preferences):{confirmed:[],latent:[],attitude:'curious'},
  awareness:{pregnancy:'unaware'},bondWith:null,
  pregnancy:{status:'none',conceivedAt:null,implantAt:null,dueAt:null,deliveryAt:null},
  scene:{posture:'',contact:'',vocal:'',speech:'',play:[]},recentScenes:[]
 };
}
export function initialState(seed,canon={},config={}){
 return {schema:VERSION,seed,clockHours:0,
 people:{char:person('char',canon.char?.name||'CHAR',canon.char?.id?`${seed}:${canon.char.id}`:seed,canon.char),user:person('user',canon.user?.name||'USER',seed,canon.user)},
 bonds:[],affinity:{},windows:{},events:[],alerts:[],config:{...DEFAULT_CONFIG,...config,rate:{...DEFAULT_CONFIG.rate,...(config.rate||{})}}};
}
export function areCompatible(source,target){
 if(source===target)return false;
 const a=`${source.sex}_${source.secondary}`;
 const b=`${target.sex}_${target.secondary}`;
 if(source.sex==='unknown'||target.sex==='unknown')return false;
 return !!(COMPATIBLE[a]||[]).includes(b) && source.fertile.impregnate && target.fertile.gestate;
}
export function rangeProbability(offset,conf){
 if(!Number.isFinite(offset))return 0;
 if(offset < -72 || offset>=24)return 0;
 if(offset< -48)return conf.rate.rise;
 if(offset< -24)return conf.rate.fertile;
 if(offset<12)return conf.rate.peak;
 return conf.rate.fall;
}
export function phaseAt(c,t){
 if(!c?.enabled||!Number.isFinite(c.intervalHours)||c.intervalHours<=0)return'quiet';
 const total=c.prodromeHours+c.activeHours+c.recoveryHours;
 const remaining=((t-c.anchorHour)%c.intervalHours+c.intervalHours)%c.intervalHours;
 const untilStart=(c.anchorHour-t)%c.intervalHours;
 if(t<c.anchorHour && t>=c.anchorHour-c.prodromeHours)return'prodrome';
 if(t<c.anchorHour)return'quiet';
 if(remaining<c.activeHours)return'active';
 if(remaining<c.activeHours+c.recoveryHours)return'recovery';
 if(c.intervalHours-remaining<=c.prodromeHours)return'prodrome';
 return 'quiet';
}
export function ovulationHour(p,time){
 if(Number.isFinite(p.cycle.ovulationHour))return p.cycle.ovulationHour;
 if(p.secondary==='omega' && p.cycle.enabled){
  const c=p.cycle;
  const k=Math.round((time-(c.anchorHour+c.activeHours/2))/c.intervalHours);
  return c.anchorHour+Math.max(0,k)*c.intervalHours+c.activeHours/2;
 }
 if(p.sex==='female'&&p.secondary==='alpha'&&p.cycle.enabled){
  const c=p.cycle,k=Math.round((time-c.anchorHour)/c.intervalHours);
  const start=c.anchorHour+Math.max(0,k)*c.intervalHours;
  return start+(p.cycle.ovulationSide==='post'?c.activeHours+12:-12);
 }
 if(p.sex==='female'&&p.secondary==='beta'){
  const days=28*24, k=Math.round((time-14*24)/days);return 14*24+Math.max(0,k)*days;
 }
 return null;
}
export function encounterChance(single,n){
 const p=CLAMP(single,0,1), count=CLAMP(Number(n)||1,1,30);
 if(count===1)return p;
 return 1-Math.pow(1-p,1+.5*(1-Math.exp(-.9*(count-1))));
}
export function pairMultiplier(donor,gestator,clock){
 const dp=phaseAt(donor.cycle,clock), gp=phaseAt(gestator.cycle,clock);
 if(donor.secondary==='alpha'&&gestator.secondary==='omega'){
  if(dp==='active'&&gp==='active')return 1.8;
  if(dp==='active'||gp==='active')return 1.4;
  return 1.1;
 }
 if(donor.secondary==='alpha'&&gestator.secondary==='alpha'&&donor.sex==='female'&&gestator.sex==='female'&&dp==='active'&&gp==='active')return 1.1;
 return 1.1; // ovulation-stage small elevation, never stacks with other multipliers
}
export function activeContraceptionFactor(state,gestator,time=state.clockHours){
 const p=state.people[gestator];if(!p)return 1;
 const effectiveness=CLAMP(Number(state.config.oralContraceptiveEffectiveness??.85),0,1);
 // Only a confirmed NORMAL dose with an active simulated protection interval counts.
 // Doses mentioned in dialogue but not confirmed are never added to medication[].
 return p.medication.some(m=>m.drug==='oral_contraceptive'&&m.mode==='normal'&&m.at<=time&&m.until>time)
  ? 1-effectiveness : 1;
}
export function eventChance(state,event){
 if(state.config.pregnancyEnabled===false)return {p:0,reason:'pregnancy_disabled'};
 const g=state.people[event.gestator],d=state.people[event.donor];
 if(!g||!d||!areCompatible(d,g)||event.penetration!==true||event.deposition!==true)return {p:0,reason:'gate_failed'};
 if(g.pregnancy.status!=='none')return {p:0,reason:'already_pregnant'};
 const ov=ovulationHour(g,state.clockHours);
 const offset=Number.isFinite(ov)?state.clockHours-ov:NaN;
 const base=rangeProbability(offset,state.config);
 if(!base)return {p:0,reason:Number.isFinite(ov)?'outside_fertile_window':'ovulation_unknown'};
 const personF=CLAMP(Number(event.gestatorFertility)||1,0,3)*CLAMP(Number(event.donorFertility)||1,0,3);
 const contraceptive=CLAMP(Number.isFinite(event.contraceptiveFactor)?event.contraceptiveFactor:1,0,1)*activeContraceptionFactor(state,event.gestator);
 if(g.cycle.ovulationBlockedUntil>=state.clockHours)return {p:0,reason:'ovulation_suppressed'};
 const p=CLAMP(base*pairMultiplier(d,g,state.clockHours)*personF*contraceptive,0,1);
 return {p:encounterChance(p,event.depositions||1),reason:'qualified',ov};
}
export function phaseForPerson(p,time){
 if(['conception_pending','pregnant_unaware','pregnant_suspected','pregnant_confirmed','due'].includes(p.pregnancy.status))return 'suspended';
 if(p.pregnancy.status==='postpartum'&&time<p.cycle.anchorHour)return 'recovery';
 if(p.cycle.inducedUntil>time)return 'active';
 return phaseAt(p.cycle,time);
}
export function menstruationPhase(p,time,seed){
 if(!p.menstruation.enabled||['conception_pending','pregnant_unaware','pregnant_suspected','pregnant_confirmed','due','postpartum'].includes(p.pregnancy.status))return 'none';
 const firstOv=ovulationHour(p,time);if(!Number.isFinite(firstOv))return 'unknown';
 const interval=p.secondary==='beta'?28*24:p.cycle.intervalHours;
 const ov=firstOv>time?firstOv-interval:firstOv;
 const luteal=pickInt(seed,`${p.id}:luteal`,11,16)*24;
 return time>=ov+luteal&&time<ov+luteal+p.menstruation.days*24?'menstruating':'not_menstruating';
}
export function sideEffectChance(drug,conf={}){return CLAMP((DRUGS[drug]?.adverse||0)*(conf.sideEffectScale??1),0,1);}
export function adverseSymptoms(seed,event){
 const list=ADVERSE_SYMPTOMS[event.drug]||[];
 return list.length?[list[pickInt(seed,`symptom:${event.id}:${event.drug}`,0,list.length-1)]]:[];
}
export function toleranceChange(seed,event){
 if(event.use_mode==='normal')return 0;
 const [lo,hi]=event.use_mode==='misuse'?[6,10]:event.use_mode==='unlicensed'?[7,14]:[0,0];
 return pickInt(seed,`${event.id}:tolerance`,lo,hi);
}
export function instinctChance(p,phase,{nearBond=false,separatedFromBond=false}={}){
 const base=PHASE_RATES[phase]??.10;
 const sensitivity=(CLAMP(p.body.instinct,0,100)-50)/500;
 const resistance=(50-CLAMP(p.body.resistance,0,100))/500;
 const bonded=p.bondWith && (separatedFromBond?.12:nearBond?.08:0);
 return CLAMP(base+sensitivity+resistance+(bonded||0),0,1);
}
export function allowedInstincts(p){return Object.entries(INSTINCTS).filter(([key,list])=>list.includes(p.secondary)&&(key!=='bond_partner_seek'||!!p.bondWith)).map(([key])=>key);}
export function pressureScore(source,target){const hierarchy=source.secondary==='alpha'&&target.secondary==='omega'?15:0;return CLAMP(source.pheromone.pressure-target.body.resistance+hierarchy,0,100);}
const normEvent=(e)=>({...e,id:String(e.id||'unknown').slice(0,100)});
function updateCycles(state){
 for(const p of Object.values(state.people)){
  p.cycle.phase=phaseForPerson(p,state.clockHours);
  p.menstruation.phase=menstruationPhase(p,state.clockHours,state.seed);
  if(state.config.pregnancyEnabled===false)continue;
  if(p.pregnancy.status==='conception_pending'&&state.clockHours>=p.pregnancy.implantAt){p.pregnancy.status='pregnant_unaware';}
  if(p.pregnancy.status==='postpartum'&&state.clockHours>=p.cycle.anchorHour){p.pregnancy.status='ended';}
  if(p.pregnancy.status.startsWith('pregnant')&&Number.isFinite(p.pregnancy.dueAt)&&state.clockHours>=p.pregnancy.dueAt){p.pregnancy.status='due';}
 }
}
function updateWindow(state,gestator,ovulation){
 if(state.config.pregnancyEnabled===false)return;
 const key=`${gestator}:${ovulation}`;
 const w=state.windows[key]||{id:key,gestator,ovulation,roll:dice(state.seed,state.people[gestator]?.identityId?`fertile:${state.people[gestator].identityId}:${key}`:`fertile:${key}`),exposures:[],total:0};
 state.windows[key]=w;
 let chance=0;
 for(const x of w.exposures){chance=1-(1-chance)*(1-CLAMP(x.p*x.emergencyFactor,0,1));}
 w.total=CLAMP(chance,0,state.config.windowCap??.85);
 const p=state.people[gestator];
 const passed=state.clockHours>=Math.max(...w.exposures.map(e=>e.t+72),-Infinity);
 if(p.pregnancy.status==='none'&&w.roll<w.total && passed){
   let rolling=0,early=w.exposures.at(-1)?.t??state.clockHours;
   for(const exposure of w.exposures){rolling=1-(1-rolling)*(1-CLAMP(exposure.p*exposure.emergencyFactor,0,1));if(w.roll<CLAMP(rolling,0,state.config.windowCap??.85)){early=exposure.t;break;}}
   const implantation=pickInt(state.seed,`implant:${key}`,5,10)*24;
   const term=pickInt(state.seed,`term:${key}`,120,180)*24;
   p.pregnancy={status:state.clockHours>=early+implantation?'pregnant_unaware':'conception_pending',conceivedAt:early,implantAt:early+implantation,dueAt:early+term,deliveryAt:null};
   state.alerts.push(`${p.name}: internally confirmed conception (character awareness remains separate)`);
 }
}
function applyPreference(p,e){
 const id=String(e.preference||'').slice(0,80);if(!id)return;
 const levels=['latent','liked','strongly_liked','disliked','restricted'];
 if(!levels.includes(e.level))return;
 const all=[...p.preferences.confirmed,...p.preferences.latent];
 const old=all.find(x=>x.id===id);
 if(old?.locked)return;
 if(e.level==='latent'){
  if(old)return;
  if(p.preferences.latent.length<5)p.preferences.latent.push({id,level:e.level,source:e.source||'event',evidence:[e.id]});
  return;
 }
 const direct=e.direct===true;
 const evidences=[...new Set([...(old?.evidence||[]),e.sceneId||e.id])];
 if(!direct&&evidences.length<2){
  if(!old&&p.preferences.latent.length<5)p.preferences.latent.push({id,level:'latent',source:'observed',evidence:evidences});
  else if(old)old.evidence=evidences;
  return;
 }
 p.preferences.latent=p.preferences.latent.filter(x=>x.id!==id);
 p.preferences.confirmed=p.preferences.confirmed.filter(x=>x.id!==id);
 p.preferences.confirmed.push({id,level:e.level,source:e.source||'event',evidence:evidences});
}
export function applyEvent(state,input){
 const e=normEvent(input),p=state.people[e.person];
 if(state.events.some(x=>x.id===e.id))return;
 if(state.events.length>600)state.events.shift();
 switch(e.kind){
 case 'time_advance':{
  const hours=Number(e.hours);
  if(Number.isFinite(hours)&&hours>=0&&hours<=8760){state.clockHours+=hours;for(const w of Object.values(state.windows))updateWindow(state,w.gestator,w.ovulation);}
  break;
 }
 case 'heat_start':case 'rut_start':{
  if(p&&p.cycle.enabled){p.cycle.anchorHour=state.clockHours;p.cycle.ovulationHour=null;}
  break;
 }
 case 'ovulation':if(p?.fertile.gestate)p.cycle.ovulationHour=state.clockHours;break;
 case 'bond':{
  const a=state.people[e.person],b=state.people[e.partner];
  if(a&&b&&a!==b){a.bondWith=b.id;b.bondWith=a.id;
   if(!state.bonds.some(x=>x.includes(a.id)&&x.includes(b.id)))state.bonds.push([a.id,b.id]);}
  break;
 }
 case 'medication':{
  if(!p||!DRUGS[e.drug])break;
  const c=toleranceChange(state.seed,e),old=p.tolerance[e.drug]||0;
  p.tolerance[e.drug]=CLAMP(old+c,0,100);
  const adverse=dice(state.seed,`adverse:${e.id}`)<sideEffectChance(e.drug,state.config);
  const duration=pickInt(state.seed,`duration:${e.id}`,...DRUGS[e.drug].duration);
  p.medication.push({id:e.id,drug:e.drug,mode:e.use_mode||'normal',at:state.clockHours,until:state.clockHours+duration,adverse});
  if(adverse)p.adverse.push({id:e.id,drug:e.drug,at:state.clockHours,until:state.clockHours+Math.max(12,Math.min(duration||24,72)),type:'general',symptoms:adverseSymptoms(state.seed,e)});
  if(e.drug==='long_suppressant'&&dice(state.seed,`ovulation:block:${e.id}`)<CLAMP(Number(state.config.longSuppressantSuccess??.90),0,1)){p.cycle.ovulationHour=null;p.cycle.ovulationBlockedUntil=state.clockHours+duration;}
  const reboundChances={oral_suppressant:.02,long_suppressant:.05,unlicensed_mixture:.25};
  const drugRisk=reboundChances[e.drug]??0;
  if(drugRisk&&dice(state.seed,`induced-adverse:${e.id}`)<drugRisk){
   p.cycle.inducedUntil=state.clockHours+pickInt(state.seed,`induced-length:${e.id}`,12,48);
   p.adverse.push({id:`${e.id}:induced`,drug:e.drug,at:state.clockHours,type:'unexpected_heat_or_rut'});
  }
  if(['symptom_inducer','cycle_inducer'].includes(e.drug)){
   if(e.drug==='cycle_inducer'&&p.cycle.enabled){p.cycle.anchorHour=state.clockHours;p.cycle.ovulationHour=null;}
   p.cycle.inducedUntil=state.clockHours+duration;
  }
  if(e.drug==='emergency_contraceptive'){
   for(const w of Object.values(state.windows)){
    if(w.gestator!==e.person)continue;
    for(const x of w.exposures)if(state.clockHours-x.t<=72&&state.clockHours>=x.t)x.emergencyFactor=1-CLAMP(Number(state.config.emergencyContraceptiveReduction??.75),0,1);
    updateWindow(state,e.person,w.ovulation);
   }
  }
  break;
 }
 case 'exposure':{
  const out=eventChance(state,e);if(out.p<=0){state.alerts.push(`Exposure not rolled: ${out.reason}`);break;}
  const key=`${e.gestator}:${out.ov}`,w=state.windows[key]||{id:key,gestator:e.gestator,ovulation:out.ov,roll:dice(state.seed,state.people[e.gestator]?.identityId?`fertile:${state.people[e.gestator].identityId}:${key}`:`fertile:${key}`),exposures:[],total:0};
  if(!w.exposures.some(x=>x.id===e.id))w.exposures.push({id:e.id,t:state.clockHours,p:out.p,emergencyFactor:1,depositions:CLAMP(Number(e.depositions)||1,1,30)});
  state.windows[key]=w;updateWindow(state,e.gestator,out.ov);
  break;
 }
 case 'pregnancy_reveal':{
  if(state.config.pregnancyEnabled===false)break;
  if(p&&['char','user'].includes(e.knower)&&['suspected','confirmed'].includes(e.level)){
   state.people[e.knower].awareness.pregnancy=e.level;
  }
  break;
 }
 case 'delivery':{
  if(state.config.pregnancyEnabled===false)break;
  if(p&&p.pregnancy.status!=='none'){
   p.pregnancy.status='postpartum';p.pregnancy.deliveryAt=state.clockHours;
   p.cycle.anchorHour=state.clockHours+pickInt(state.seed,`recover:${e.id}`,28,42)*24;
  }break;
 }
 case 'pregnancy_end':if(p&&state.config.pregnancyEnabled!==false){p.pregnancy.status='ended';p.cycle.anchorHour=state.clockHours+pickInt(state.seed,`recover:${e.id}`,28,42)*24;}break;
 case 'preference':if(p)applyPreference(p,e);break;
 case 'scene':if(p){
   const fields=['posture','contact','vocal','speech'];for(const f of fields)if(typeof e[f]==='string')p.scene[f]=e[f].slice(0,90);
   if(Array.isArray(e.play))p.scene.play=e.play.filter(x=>typeof x==='string').slice(0,8);
   if(e.completed){p.recentScenes.push({at:state.clockHours,posture:p.scene.posture,contact:p.scene.contact,vocal:p.scene.vocal,speech:p.scene.speech,play:p.scene.play});p.recentScenes=p.recentScenes.slice(-3);p.scene={posture:'',contact:'',vocal:'',speech:'',play:[]};}
   break;
 }
 }
 state.events.push({id:e.id,kind:e.kind,person:e.person||null,at:state.clockHours});
 updateCycles(state);
}
export function replay(seed,canon,config,rows,overrides={}){
 const s=initialState(seed,canon,config);
 // Apply manual overrides BEFORE replaying events. This is essential: fertility gates
 // and cycle eligibility must be computed from the user's corrected canonical facts.
 for(const [who,changes] of Object.entries(overrides)){
  const p=s.people[who];if(!p)continue;
  for(const [k,v] of Object.entries(changes||{})){
   if(k==='sex')p.sex=normalizeSex(v);
   else if(k==='secondary')p.secondary=normalizeABO(v);
   else if(k==='anatomy'&&['combined','vaginal_only','male_only','female_only','female_alpha_combined','custom'].includes(v))p.anatomy=v;
   else if(k==='anatomyDetail'||k==='inseminationOrgan')p[k]=String(v).slice(0,1200);
   else if(['pheromoneScent','contactStyle','vocalStyle','speechStyle'].includes(k))p.presentation[k]=String(v).slice(0,220);
   else if(k==='name')p.name=String(v).slice(0,100);
   else if(k==='cycleEnabled')p.cycle.enabled=!!v;
   else if(k==='gestate')p.fertile.gestate=!!v;
   else if(k==='impregnate')p.fertile.impregnate=!!v;
   else if(k==='menstruationEnabled')p.menstruation.enabled=!!v;
  }
  if(!Object.hasOwn(changes,'gestate'))p.fertile.gestate=p.secondary==='omega'||p.sex==='female'&&['alpha','beta'].includes(p.secondary);
  if(!Object.hasOwn(changes,'impregnate'))p.fertile.impregnate=p.secondary==='alpha'||p.sex==='male'&&p.secondary==='beta';
  if(!Object.hasOwn(changes,'menstruationEnabled'))p.menstruation.enabled=p.secondary==='omega'||p.sex==='female';
  if(!Object.hasOwn(changes,'cycleEnabled'))p.cycle.enabled=p.secondary!=='beta';
  if(!Object.hasOwn(changes,'anatomy'))p.anatomy=anatomyDefault(p.sex,p.secondary);
 }
 for(const row of rows){for(const evt of row.events||[])applyEvent(s,evt);}
 updateCycles(s);return s;
}
export function sortedRecords(chat,ledger){
 return chat.map((m,i)=>({i,key:uniqKey(m,i),m})).filter(x=>ledger[x.key]).map(x=>({index:x.i,...ledger[x.key]}));
}
export function formatPrompt(s,hideTruth=false){
 const out=['[ABO TRACKER — CONTINUITY / NOT CHARACTER KNOWLEDGE]',`Story clock: D${Math.floor(s.clockHours/24)} ${Math.floor(s.clockHours%24)}h. Treat time as story time, not real time.`];
 if(s.config.pregnancyEnabled===false)out.push('PREGNANCY TRACKING OFF for this chat: do not introduce tracker-generated pregnancy, conception outcomes, pregnancy symptoms or due dates.');
 for(const [id,p] of Object.entries(s.people)){
  out.push(`${id.toUpperCase()} ${p.name}: sex=${p.sex}; ABO=${p.secondary}; anatomy=${p.anatomy||'not specified'}; cycle=${p.cycle.phase}; menses=${p.menstruation.phase}; bond=${p.bondWith||'none'}; symptoms: condition=${p.body.condition}, sensitivity=${p.body.sensitivity}, stress=${p.body.stress}; recent meds=${p.medication.filter(m=>m.until>=s.clockHours).map(m=>m.drug).join(',')||'none'}.`);
  if(p.anatomyDetail||p.inseminationOrgan)out.push(`${id.toUpperCase()} anatomical notes=${(p.anatomyDetail||'').slice(0,240)}; insemination anatomy=${(p.inseminationOrgan||'').slice(0,240)}.`);
  const prs=p.presentation||{};if(Object.values(prs).some(Boolean))out.push(`${id.toUpperCase()} interaction profile: scent=${prs.pheromoneScent||'unknown'}; contact=${prs.contactStyle||'unknown'}; voice=${prs.vocalStyle||'unknown'}; speech=${prs.speechStyle||'unknown'}.`);
  const pref=p.preferences||{};
  const fmtPref=x=>`${String(x.label||x.id||'').slice(0,55)} (${x.level||'latent'})`;
  if(pref.confirmed?.length||pref.latent?.length)out.push(`${id.toUpperCase()} established preferences=${(pref.confirmed||[]).slice(0,8).map(fmtPref).join(', ')||'none'}; latent possibilities (NOT confirmed or mandated)=${(pref.latent||[]).slice(0,5).map(fmtPref).join(', ')||'none'}.`);
  const symptoms=(p.adverse||[]).filter(x=>x.until===undefined||x.until>=s.clockHours).slice(-3);
  if(symptoms.length)out.push(`${id.toUpperCase()} observed fictional medication reactions=${symptoms.map(x=>(x.symptoms||[x.type||'unspecified']).join('/')).join(', ')}. These are NOT proof of tolerance or pregnancy.`);
  if(p.recentScenes?.length)out.push(`${id.toUpperCase()} recent scenes (continuity only)=${p.recentScenes.slice(-3).map(x=>(x.play||[]).slice(0,3).join('/')||x.contact||x.vocal||'scene').join(' > ')}.`);
  const pr=p.pregnancy;
  if(s.config.pregnancyEnabled===false)continue;
  if(!hideTruth&&pr.status!=='none')out.push(`INTERNAL PHYSIOLOGY for ${p.name}: pregnancy=${pr.status}, elapsed=${pr.conceivedAt===null?'?':Math.floor((s.clockHours-pr.conceivedAt)/24)} days. Do not disclose this as knowledge unless in-story discovery established. Subject awareness=${p.awareness.pregnancy}.`);
  else out.push(`${p.name} awareness of pregnancy=${p.awareness.pregnancy}.`);
 }
 out.push('Character knowledge ≠ objective physiology. Respect established boundaries and user agency. Vary dialogue, contact, and vocal responses according to individual character personality and explicit preferences rather than repeating a universal script. Latent preferences are hypotheses, not consent, confirmed facts, or required play. Do not script USER decisions, dialogue, bodily consent, or actions. World Info/card canon overrides unknown defaults. This is continuity data, not an instruction to trigger events.');
 return out.join('\n');
}
