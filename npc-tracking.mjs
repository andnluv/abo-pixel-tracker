/* Independent NPC selector. All functions in this file are pure and do not change world-info files. */
import {hash,inferExplicit} from './core.mjs';
const EXCLUDE=/^(?:세계|설정|룰|규칙|시스템|상태|에셋|선택지|고함|메인|프롬프트|world|system|lore|main|asset|global|정보)$/i;
export const MAIN_TARGET='__card__';
export function npcTargetId(source,name){return `npc_${hash(`${source}\u0000${String(name).trim().toLocaleLowerCase()}`)}`;}
export function isNpcEntry(entry){
 const content=String(entry?.content||'');if(content.length<45)return false;
 const comment=String(entry?.comment||entry?.name||'').trim();
 if(/^\[(?:세계|설정|룰|규칙|상태|에셋|선택지|고함|메인|WORLD|SYSTEM|Main)\]/i.test(comment))return false;
 if(/^\[NPC\s*:/i.test(content.trim()))return true;
 // A named profile entry, not an encyclopaedia section or a cast index.
 if(!/^\[[^\]]{1,40}\]\s*[^\s]/u.test(comment))return false;
 if(!/(?:^|\n)\s*(?:#{2,5}\s*BASICS|\*?\*?Name\*?\*?\s*:|\*?\*?Sex\*?\*?\s*:|\bAge\s*:)/im.test(content))return false;
 return true;
}
export function npcNameFromEntry(entry){
 const comment=String(entry?.comment||entry?.name||'').trim();
 const bracket=comment.match(/^\[[^\]]+\]\s*(.+)$/u);
 if(bracket && bracket[1].trim())return bracket[1].trim().slice(0,100);
 const npc=String(entry?.content||'').match(/^\s*\[NPC\s*:\s*([^|\]]+)/i);
 return npc?npc[1].trim().slice(0,100):'';
}
export function normalizeWorldEntries(raw){
 const entries=raw?.entries||raw?.character_book?.entries||raw?.data?.character_book?.entries||raw?.data?.entries||raw;
 return Array.isArray(entries)?entries:Object.values(entries&&typeof entries==='object'?entries:{});
}
export function discoverNpcProfiles(worldSources=[]){
 const found=[];const dedup=new Set();
 for(const source of worldSources){
  for(const entry of normalizeWorldEntries(source.data)){
   if(!isNpcEntry(entry))continue;
   const name=npcNameFromEntry(entry);if(!name)continue;
   const key=`${source.name}|${name.toLowerCase()}`;if(dedup.has(key))continue;dedup.add(key);
   const content=String(entry.content||'').slice(0,12000);
   // Child NPCs can be present in world books; their profiles are not offered to a NSFW tracker.
   if(/\bchild\s*\(\s*\d+\s*\)|\b(?:age|aged)\s*[:：]?\s*(?:[1-9]|1[0-9])\b|미성년|아동|어린이|\bminor\b/i.test(content.slice(0,280)))continue;
   const id=npcTargetId(source.name,name);
   found.push({id,name,source:source.name,card:content,aliases:(entry.key||entry.keys||[]).filter(v=>typeof v==='string'&&!v.startsWith('/')).slice(0,12),...inferExplicit(content)});
  }
 }
 return found;
}
export function namedTarget(name,description='',source='직접 추가',aliases=[]){
 const clean=String(name||'').trim().slice(0,100),card=String(description||'').trim().slice(0,12000);
 if(!clean)throw new Error('NPC 이름을 입력하세요');
 return {id:npcTargetId('manual',clean),name:clean,card,source,aliases:aliases.filter(Boolean).slice(0,12),...inferExplicit(card)};
}
export function npcCanon(target){
 const {id,name,card,source,aliases=[],sex='unknown',secondary='unknown',anatomy=null,preferences}=target;
 return {id,name,card,source,aliases,sex,secondary,anatomy,...(preferences?{preferences}:{})};
}
// One global USER + time stream, and one independently selected CHAR stream.
export function sharedEvent(event){
 if(event?.kind==='time_advance')return true;
 if(event?.kind==='exposure'||event?.kind==='bond')return false;
 return event?.person==='user';
}
export function combineNpcRecords(chat,sharedLedger={},charLedger={},personaId=''){
 const rows=[];
 for(let i=0;i<chat.length;i++){
  const msg=chat[i];if(!msg)continue;
  // The same unique-key formula as the normal timeline, avoiding external dependencies.
  const swipe=Number.isInteger(msg.swipe_id)?msg.swipe_id:0;
  const key=`${i}:${swipe}:${hash(String(msg.mes??''))}`;
  const a=sharedLedger[key],b=charLedger[key];
  const valid=r=>!r?.personaId||r.personaId===personaId;
  const events=[...(a&&valid(a)?(a.events||[]).filter(sharedEvent):[]),...(b&&valid(b)?(b.events||[]):[])];
  if(events.length)rows.push({index:i,events});
 }
 return rows;
}
export function targetAnalysisKey(key,targetId){return `${key}:${targetId}`;}
