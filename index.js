import {DEFAULT_CONFIG, VERSION,hash,uniqKey,sortedRecords,replay,inferExplicit,formatPrompt,allowedInstincts,instinctChance,pressureScore,clamp} from './core.mjs';
import {ANALYZER_SYSTEM,parseModelOutput,buildAnalyzerUserPrompt} from './analyzer.mjs';
import {PROFILE_SYSTEM,PROFILE_FIELDS,SetupJsonFormatError,normalizeSetupProposal,mergeSelectedPreferences,anatomyChoices,anatomyDefault} from './profile.mjs';
import {user_avatar} from '/scripts/personas.js';
import {ConnectionManagerRequestService} from '/scripts/extensions/shared.js';
import {requestUsingProfile,extractedText,readableProfileError,profileErrorHint} from './connection.mjs';
import {OPTION_CANDIDATES} from './profile.mjs';
import {preferenceLabel,preferenceDisplayLabel,preferenceIdFromEdit,preferenceLevelLabel,attitudeLabel,cyclePhaseLabel,instinctLabel,pregnancyLabel} from './preference-labels.mjs';
import {readCurrentPersona,personaIdentity,syncPersonaProfile,filterRowsByPersona} from './persona-sync.mjs';
import {normalizeSetupOutputTokens,MIN_SETUP_OUTPUT_TOKENS,MAX_SETUP_OUTPUT_TOKENS} from './setup-options.mjs';
import {buildProfileSetupInput} from './profile-setup-input.mjs';
import {MAIN_TARGET,npcCanon,discoverNpcProfiles,namedTarget,sharedEvent,combineNpcRecords} from './npc-tracking.mjs';
import {getRequestHeaders} from '/script.js';
const STORAGE='abo_pixel_tracker_independent_v1';
const PROMPT='ABO_PIXEL_TRACKER_CONTINUITY_V1';
const S=()=>SillyTavern.getContext();
let active=false, working=false, state=null, status='준비됨',panelOpen=false, tab='status', lastKey='';
let sessionApiKey=''; // Never serialized or persisted. Cleared on page reload.
let npcCandidates=[], npcScanChatId='', npcSearch='';
const html=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const el=(id)=>document.getElementById(id);
const fmt=(n)=>Number.isFinite(n)?Math.round(n*10)/10:0;
function log(...v){console.log('[ABO Pixel]',...v);}
function connectionValue(config){return String(config?.analysisConnection||'');} // empty = current connection
function supportedProfiles(){
 try{return ConnectionManagerRequestService.getSupportedProfiles()||[];}
 catch(e){console.debug('[ABO Pixel] profile listing unavailable',readableProfileError(e));return [];}
}
function connectionOptions(config){
 const current=connectionValue(config), profiles=supportedProfiles();
 let htmlOptions='<option value="" '+(!current?'selected':'')+'>현재 연결 사용 (기본)</option>';
 for(const p of [...profiles].sort((a,b)=>String(a.name).localeCompare(String(b.name)))){
  const v=`profile:${p.id}`;
  htmlOptions+=`<option value="${html(v)}" ${current===v?'selected':''}>저장됨 · ${html(p.name||p.id)} (${html(p.model||p.api||'')})</option>`;
 }
 if(current.startsWith('profile:')&&!profiles.some(p=>`profile:${p.id}`===current))htmlOptions+=`<option value="${html(current)}" selected>선택한 프로필을 찾을 수 없음</option>`;
 htmlOptions+=`<option value="custom" ${current==='custom'?'selected':''}>직접 API 연결 (OpenAI 호환)</option>`;
 return htmlOptions;
}
function directEndpoint(raw){
 const url=new URL(String(raw).trim());
 if(!['https:','http:'].includes(url.protocol))throw new Error('http(s) API 주소만 사용 가능합니다');
 if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.origin!==location.origin)throw new Error('API 키 보호를 위해 원격 서버는 HTTPS를 사용하세요');
 const path=url.pathname.replace(/\/+$/,'');
 url.pathname=/\/chat\/completions$/.test(path)?path:`${path||''}/chat/completions`;
 return url.toString();
}
async function analysisRequest(systemPrompt,prompt,maxTokens=2200){
 const config=meta()?.config||DEFAULT_CONFIG, chosen=connectionValue(config);
 if(!chosen){
  if(typeof S().generateRaw!=='function')throw new Error('현재 SillyTavern 연결의 generateRaw가 없습니다');
  return extractedText(await S().generateRaw({systemPrompt,prompt,responseLength:maxTokens}));
 }
 if(chosen.startsWith('profile:')){
  const id=chosen.slice(8);
  if(!supportedProfiles().some(p=>p.id===id))throw new Error('선택한 저장 연결 프로필이 없거나 지원되지 않습니다');
  return await requestUsingProfile(ConnectionManagerRequestService,id,systemPrompt,prompt,maxTokens);
 }
 if(chosen==='custom'){
  if(!config.customApiUrl||!config.customModel)throw new Error('직접 API 주소와 모델명을 입력하세요');
  const endpoint=directEndpoint(config.customApiUrl);
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(sessionApiKey?{'Authorization':`Bearer ${sessionApiKey}`}:{})},body:JSON.stringify({model:config.customModel,stream:false,temperature:0.1,max_tokens:maxTokens,messages:[{role:'system',content:systemPrompt},{role:'user',content:prompt}]})});
  if(!r.ok)throw new Error(`직접 API 오류 HTTP ${r.status} (브라우저 CORS 정책/모델 설정 확인)`);
  const j=await r.json();
  const content=extractedText(j);
  if(typeof content!=='string'||!content.trim())throw new Error('직접 API에서 텍스트 응답이 없습니다');
  return content;
 }
 throw new Error('알 수 없는 분석 연결 설정입니다');
}
function meta(create=true){
 const c=S(); if(!c?.chatId||!c.chatMetadata)return null;
 if(!c.chatMetadata[STORAGE]&&create){
  const seed=(globalThis.crypto?.randomUUID?.()||`${Date.now()}:${Math.random()}`).replace(/-/g,'');
  const canon=readCanon();
  c.chatMetadata[STORAGE]={schema:VERSION,seed,config:structuredClone(DEFAULT_CONFIG),canon,ledger:{},overrides:{char:{},user:{}},profileInitialized:false,initialProposal:null,userPersonaIdentity:personaIdentity(canon.user),personaProfiles:{}};
  c.saveMetadata?.();
 }
 return c.chatMetadata[STORAGE]||null;
}
function npcTracking(m){
 if(!m.npcTracking)m.npcTracking={mode:'single',activeId:MAIN_TARGET,targets:{},ledgers:{},pending:{}};
 return m.npcTracking;
}
function selectedNpcId(m){const t=npcTracking(m);return t.mode==='multi'?t.activeId:MAIN_TARGET;}
function selectedNpc(m){const id=selectedNpcId(m);return id===MAIN_TARGET?null:npcTracking(m).targets[id]||null;}
function effectiveCanon(m){const t=selectedNpc(m);return t?{char:npcCanon(t),user:m.canon.user}:m.canon;}
function effectiveOverrides(m){const t=selectedNpc(m);return t?{char:t.overrides||{},user:m.overrides.user||{}}:m.overrides;}
function currentRoleOverrides(m,role){if(role==='char'){const t=selectedNpc(m);if(t)return t.overrides??={};}m.overrides[role]??={};return m.overrides[role];}
function currentCharLedger(m){const t=selectedNpc(m);return t?(npcTracking(m).ledgers[t.id]??={}):m.ledger;}
function clearProposalOnTargetChange(m,nextId){
 const t=npcTracking(m),current=selectedNpcId(m);
 if(m.initialProposal)t.pending[current]=m.initialProposal;
 t.activeId=nextId;
 m.initialProposal=t.pending[nextId]||null;
}
function currentNpcReady(m){return npcTracking(m).mode!=='multi'||!!selectedNpc(m);}
async function readWorldBook(name){
 const res=await fetch('/api/worldinfo/get',{method:'POST',headers:getRequestHeaders(),body:JSON.stringify({name}),cache:'no-cache'});
 if(!res.ok)throw new Error(`${name}: HTTP ${res.status}`);
 return res.json();
}
async function scanNpcSources(){
 const c=S(),m=meta(),chatId=c.chatId;
 if(!m||working)return;
 working=true;setStatus('현재 캐릭터·채팅 월드 인포에서 NPC 검색 중…');render();
 try{
  const ch=c.characters?.[c.characterId]||c.characters?.[c.this_chid]||{};
  const data=ch.data||{},sources=[];
  for(const [label,book] of [['캐릭터 내장 월드 인포',data.character_book||ch.character_book],['현재 채팅 내장 월드 인포',c.chatMetadata?.character_book]]){
   if(book)sources.push({name:label,data:book});
  }
  const names=[c.chatMetadata?.world_info,data.extensions?.world,ch.extensions?.world,...(Array.isArray(data.extensions?.worlds)?data.extensions.worlds:[])].filter(x=>typeof x==='string'&&x.trim());
  let failed=[];
  for(const name of [...new Set(names)]){
   try{sources.push({name,data:await readWorldBook(name)});}catch(e){failed.push(`${name}: ${e.message}`);}
  }
  if(S().chatId!==chatId)return setStatus('채팅이 바뀌어 NPC 검색 결과를 폐기했습니다');
  npcCandidates=discoverNpcProfiles(sources);npcScanChatId=chatId;npcSearch='';
  setStatus(`NPC 후보 ${npcCandidates.length}명 발견${failed.length?` · 읽지 못한 월드 인포 ${failed.length}개`:''}`);
  if(failed.length)console.warn('[ABO Pixel] NPC book read warnings:',failed);
 }catch(e){console.error('[ABO Pixel] NPC discovery failed',e);setStatus(`NPC 검색 실패: ${e.message}`);}finally{working=false;render();}
}
async function switchNpc(targetId){
 const m=meta(),t=npcTracking(m);if(working)return setStatus('분석 완료 후 추적 대상을 변경하세요');
 if(targetId!==MAIN_TARGET&&!t.targets[targetId])return setStatus('NPC를 찾을 수 없습니다. 다시 검색해 주세요');
 clearProposalOnTargetChange(m,targetId);t.mode=targetId===MAIN_TARGET?'single':'multi';
 await persist();refresh();setStatus(targetId===MAIN_TARGET?'단일 캐릭터 추적으로 전환 완료':`CHAR 추적 대상: ${t.targets[targetId].name}`);
}
function renderNpcTarget(){
 const m=meta(false);if(!m)return '';
 const t=npcTracking(m),active=selectedNpc(m),candidateOptions=npcCandidates.filter(x=>npcSearch&&!(x.name.toLowerCase().includes(npcSearch.toLowerCase())||x.source.toLowerCase().includes(npcSearch.toLowerCase()))?false:true);
 const registered=Object.values(t.targets);
 const options=[...registered,...candidateOptions.filter(c=>!t.targets[c.id])];
 return `<section class="abop-frame abop-npc"><header>◇ CHAR · 추적 대상 <small>USER 페르소나는 유지</small></header>
 <p class="abop-muted">다인·세계관 봇에서는 {{char}}가 서술자일 수 있습니다. NPC를 직접 지정하면 해당 인물의 설정과 사건만 CHAR로 관리합니다.</p>
 <div class="abop-actions"><button type="button" data-action="singleNpc" ${t.mode==='single'?'disabled':''}>일반 캐릭터</button><button type="button" data-action="multiNpc" ${t.mode==='multi'?'disabled':''}>다인 봇</button></div>
 ${t.mode==='multi'?`<div class="abop-npc-controls"><p class="abop-muted">현재 대상: <b>${html(active?.name||'선택되지 않음')}</b> ${active?`· ${html(active.source||'')}`:''}</p>
 <div class="abop-actions"><button type="button" data-action="scanNPCs">월드 인포에서 NPC 찾기</button><small>${npcScanChatId===S().chatId?`후보 ${npcCandidates.length}명`:'검색 전'}</small></div>
 <label class="abop-fieldlabel">이름 검색<input type="search" id="abop-npc-search" data-npc-search value="${html(npcSearch)}" placeholder="이름 또는 월드 인포 이름" /></label>
 <label class="abop-fieldlabel">검색/저장된 인물<select id="abop-npc-select"><option value="">NPC 선택…</option>${options.map(x=>`<option value="${html(x.id)}" ${active?.id===x.id?'selected':''}>${html(x.name)} · ${html(x.source||'직접 추가')}${t.targets[x.id]?' · 저장됨':''}</option>`).join('')}</select></label>
 <div class="abop-actions"><button type="button" class="abop-primary" data-action="selectNpc">이 NPC 추적</button></div>
 <details><summary>＋ NPC 직접 추가</summary><label class="abop-fieldlabel">이름<input id="abop-npc-name" maxlength="100" placeholder="캐릭터 이름" /></label>
 <label class="abop-fieldlabel">다른 이름·호칭 (쉼표로 구분)<input id="abop-npc-aliases" placeholder="영문명, 별명" /></label>
 <label class="abop-fieldlabel">프로필 설명 (선택)<textarea id="abop-npc-description" rows="6" placeholder="월드 인포에 없거나 직접 수정하고 싶은 설정을 입력하세요"></textarea></label>
 <button type="button" data-action="addNpc">NPC 추가하고 추적</button></details></div>`:''}
 <p class="abop-muted">현재 채팅의 메타데이터에 NPC별 설정·분석 기록을 저장합니다. 월드 인포 원본은 수정하지 않습니다. 한 번에 선택한 NPC 1명만 추적하며, 여러 상대의 임신·관계 사건을 합산하는 기능은 아직 지원하지 않습니다.</p></section>`;
}
async function persist(){try{if(typeof S().saveMetadata!=='function')throw new Error('SillyTavern 메타데이터 저장 기능이 없습니다');await S().saveMetadata();return true;}catch(e){console.warn('[ABO Pixel] Metadata saving failed',e);setStatus('저장 실패: 개발자 콘솔 확인');return false;}}
function readCanon(){
 const c=S(), character=c.characters?.[c.characterId]||c.characters?.[c.this_chid]||{};
 const cd=character.data||{};
 const card=[cd.description||character.description,cd.personality||character.personality,cd.scenario||character.scenario].filter(Boolean).join('\n');
 const user=readCurrentPersona(c,user_avatar,inferExplicit);
 const a=inferExplicit(card);
 return {char:{...a,name:character.name||cd.name||c.name2||'CHAR',card:card.slice(0,7000)},user};
}
/** SillyTavern can auto-switch the active persona AFTER CHAT_CHANGED. Refresh
 * canon from the live persona source, not only from chat metadata creation. */
function syncCanon(){
 const m=meta(false);if(!m)return false;
 const live=readCanon();
 const previousChar=m.canon.char||{};
 const result=syncPersonaProfile(m,live.user);
 // Edited character cards are also refreshed; manual overrides remain authoritative.
 const charUpdated=previousChar.name!==live.char.name||previousChar.card!==live.char.card;
 if(charUpdated){
  const prefs=m.canon.char.preferences;
  m.canon.char={...live.char,...(prefs?{preferences:prefs}:{})};
  m.initialProposal=null;
 }
 if(result.changed){
  setStatus(`USER 페르소나 동기화: ${live.user.name}`);
  log('Active persona changed:',live.user.name);
 }
 if(result.updated || charUpdated){
  void persist();
 }
 return result.changed;
}
function setStatus(s){status=s;const node=el('abop-statusline');if(node)node.textContent=s;}
function branchState(){
 const m=meta(false);if(!m)return null;
 const chat=S().chat||[];
 const t=selectedNpc(m);
 const rows=t?combineNpcRecords(chat,m.ledger||{},currentCharLedger(m),m.userPersonaIdentity):filterRowsByPersona(sortedRecords(chat,m.ledger||{}),m.userPersonaIdentity);
 return replay(m.seed,effectiveCanon(m),m.config||DEFAULT_CONFIG,rows,effectiveOverrides(m));
}
function updatePrompt(){
 try{
  const c=S();if(typeof c.setExtensionPrompt!=='function')return;
  const m=meta(false);
  const body=state&&m?.config?.enabled&&m?.config?.injectState&&currentNpcReady(m)?formatPrompt(state,false):'';
  c.setExtensionPrompt(PROMPT,body,0,0,false,0);
 }catch(e){console.warn('[ABO Pixel] prompt injection unavailable',e);}
}
function refresh(){meta();syncCanon();state=branchState();updatePrompt();render();}
function eventIDFor(messageKey,i){return `${messageKey}/e${i}`;}
function sourceForCurrent(){
 const c=S(),chat=c.chat||[];
 for(let i=chat.length-1;i>=0;i--){
  const m=chat[i];if(!m||m.is_system||m.is_user||!String(m.mes||'').trim())continue;
  const pair=chat[i-1]?.is_user?chat[i-1]:null;
  return {m,i,key:uniqKey(m,i),userText:String(pair?.mes||''),assistantText:String(m.mes||'')};
 }return null;
}
async function analyzeLatest({force=false}={}){
 if(working)return;
 const m=meta();syncCanon();const src=sourceForCurrent();if(!m||!src)return setStatus('분석할 CHAR 메시지가 없습니다');
 if(!m.config.enabled)return setStatus('확장이 비활성화됨');
 if(!force&&!m.config.autoAnalyze)return;
 if(!currentNpcReady(m))return setStatus('먼저 CHAR 추적 NPC를 선택하세요');
 const originTarget=selectedNpcId(m), ledger=currentCharLedger(m);
 if(ledger[src.key]?.analyzed&&ledger[src.key]?.personaId===m.userPersonaIdentity&&!force)return;
 const originChat=S().chatId, originKey=src.key, originPersona=m.userPersonaIdentity;
 const c=S();
 working=true;setStatus('별도 모델로 사건 분석 중…');render();
 try{
  const last=branchState();
  const ec=effectiveCanon(m);
  const prompt=buildAnalyzerUserPrompt({charName:ec.char.name,charAliases:ec.char.aliases||[],multiNpc:originTarget!==MAIN_TARGET,userName:ec.user.name,charCard:ec.char.card,userPersona:ec.user.card,userText:src.userText,assistantText:src.assistantText,existingState:last?{clockHours:last.clockHours,people:Object.fromEntries(Object.entries(last.people).map(([k,p])=>[k,{sex:p.sex,secondary:p.secondary,phase:p.cycle.phase,pregnancy:p.pregnancy.status}]))}:null});
  const reply=await analysisRequest(ANALYZER_SYSTEM,prompt,2200);
  syncCanon();
  if(S().chatId!==originChat||m.userPersonaIdentity!==originPersona||selectedNpcId(m)!==originTarget||!sourceForCurrent()||sourceForCurrent().key!==originKey){setStatus('채팅/페르소나/응답 변경으로 분석 결과 폐기');return;}
  const events=parseModelOutput(reply,src.userText,src.assistantText).map((e,i)=>({...e,id:eventIDFor(originKey,i),sceneId:e.sceneId||originKey}));
  const existing=ledger[originKey]||{};
  if(existing.personaId&&existing.personaId!==originPersona){setStatus('이 응답은 이전 USER 페르소나의 기록입니다. 새 응답에서 다시 분석하세요.');return;}
  if(originTarget===MAIN_TARGET){
   ledger[originKey]={analyzed:true,events:[...events,...(existing.manual||[])],manual:existing.manual||[],personaId:originPersona,at:Date.now()};
  }else{
   const charEvents=events.filter(e=>!sharedEvent(e)), userEvents=events.filter(sharedEvent);
   ledger[originKey]={analyzed:true,events:[...charEvents,...(existing.manual||[])],manual:existing.manual||[],personaId:originPersona,at:Date.now()};
   const common=m.ledger[originKey]||{};
   if(!common.personaId||common.personaId===originPersona){
    const oldEvents=common.events||[];
    const signature=e=>`${e.kind}|${e.person||''}|${e.evidence||''}|${e.hours||''}`;
    const seen=new Set(oldEvents.map(signature));
    const additional=userEvents.filter(e=>{const k=signature(e);if(seen.has(k))return false;seen.add(k);return true;});
    m.ledger[originKey]={...common,events:[...oldEvents,...additional],personaId:originPersona,at:Date.now()};
   }
  }
  await persist();setStatus(`분석 완료 · 확인된 사건 ${events.length}건`);refresh();
 }catch(e){console.error('[ABO Pixel] generation error',e);setStatus(`분석 실패: ${e.message||'모델/API 연결 확인'}`);}finally{working=false;render();}
}
async function initialProfileAnalyze(){
 const m=meta();syncCanon();if(!m||working)return;
 if(!currentNpcReady(m))return setStatus('먼저 CHAR 추적 NPC를 선택하세요');
 const targetId=selectedNpcId(m);
 working=true;tab='setup';setStatus('CHAR·USER 프로필 제안 생성 중…');render();
 const chatId=S().chatId, originalPersona=m.userPersonaIdentity;
 try{
  const setupInput=buildProfileSetupInput(effectiveCanon(m),effectiveOverrides(m));
  const setupMax=normalizeSetupOutputTokens(m.config.setupMaxTokens);
  let draft;
  try{
   const result=await analysisRequest(PROFILE_SYSTEM,setupInput,setupMax);
   draft=normalizeSetupProposal(result,chatId);
  }catch(firstError){
   // Only malformed model output gets a format retry; API failures must retain their actual cause.
   if(!(firstError instanceof SetupJsonFormatError))throw firstError;
   setStatus('초기 분석 응답 형식 오류 · 간결한 JSON으로 1회 재시도 중…');render();
   const brief='FORMAT RETRY: Preserve the same role fields, confirmed/latent evidence rules and candidate counts. Output a COMPLETE valid JSON object only; no markdown or trailing prose. Write values, reasons and candidate labels in natural Korean, keep machine IDs and enums in English. Keep each reason under 65 Korean characters. Omit unsupported fields rather than adding filler.\n'+PROFILE_SYSTEM;
   try{
    const retry=await analysisRequest(brief,setupInput,setupMax);
    draft=normalizeSetupProposal(retry,chatId);
   }catch(secondError){
    if(secondError instanceof SetupJsonFormatError)throw new Error(`초기 분석 JSON이 2회 연속 불완전합니다. 실제 모델 출력 한도와 분석 연결을 확인하세요. (재시도: ${secondError.message})`,{cause:secondError});
    throw secondError;
   }
  }
  syncCanon();
  if(S().chatId!==chatId||m.userPersonaIdentity!==originalPersona||selectedNpcId(m)!==targetId){setStatus('채팅/페르소나 변경으로 분석 결과 폐기');return;}
  draft.personaIdentity=originalPersona;draft.targetId=targetId;
  // Models can be wrong. Explicit manual settings always start unchecked/locked.
  for(const role of ['char','user']){
   const locked=effectiveOverrides(m)?.[role]||{};
   for(const field of draft.roles[role].fields)if(Object.hasOwn(locked,field.key))field.checked=false;
  }
  m.initialProposal=draft;await persist();
  setStatus('제안 생성 완료 · 선택 후 적용해야 반영됩니다');refresh();
 }catch(e){console.error('[ABO Pixel] initial proposal failed',e);setStatus(`초기 프로필 제안 실패: ${readableProfileError(e)}`);}
 finally{working=false;render();}
}
const PROPOSAL_SELECT={
 sex:[['male','남성'],['female','여성'],['nonbinary','기타']],
 secondary:[['alpha','ALPHA'],['beta','BETA'],['omega','OMEGA']],
};
const LEVELS=[['latent','잠재적 관심'],['liked','선호'],['strongly_liked','강한 선호'],['disliked','비선호'],['restricted','제한']];
const choiceHTML=(arr,chosen)=>arr.map(([v,label])=>`<option value="${html(v)}" ${String(chosen)===String(v)?'selected':''}>${html(label)}</option>`).join('');
function renderSetup(){
 const m=meta(false);if(!m)return '';
 const draft=m.initialProposal;
 const hint='<p class="abop-muted">카드·페르소나의 확정 정보와 성격 기반 제안을 구분합니다. 체크한 항목만 실제 프로필에 적용됩니다. 수동으로 이미 고정한 항목은 보호됩니다.</p>';
 if(!draft||draft.chatId!==S().chatId||draft.personaIdentity!==m.userPersonaIdentity||draft.targetId!==selectedNpcId(m))return `<section class="abop-frame"><header>◇ 초기 프로필 설정</header><h3 class="abop-title">초기 프로필 통합 분석</h3>${hint}<p>신체 구조·생식 능력·페로몬·접촉·발성·언어와 친밀 취향을 한 번에 분석해 제안합니다. 기존 상태는 분석만으로 변경되지 않습니다.</p><button data-action="init">CHAR + USER 분석 제안 만들기</button></section>`;
 let out=`<section class="abop-frame"><header>◇ 초기 프로필 제안 <small>미적용 초안</small></header>${hint}
 <div class="abop-actions"><button data-action="init">다시 분석</button><button data-action="discardProposal">제안 버리기</button></div></section>`;
 for(const role of ['char','user']){
  const d=draft.roles[role],own=effectiveOverrides(m)?.[role]||{};
  out+=`<section class="abop-frame"><header>◇ ${role.toUpperCase()} · ${html(effectiveCanon(m)[role]?.name||'')}</header>
  <p class="abop-muted">왼쪽 체크 = 적용 여부 · 제안 내용을 자유롭게 수정할 수 있습니다.</p><div class="abop-proposal-fields">`;
  for(const [i,f] of d.fields.entries()){
   const disabled=Object.hasOwn(own,f.key),checked=f.checked&&!disabled;
   const inferredSex=d.fields.find(x=>x.key==='sex')?.value||state?.people[role]?.sex||'unknown';
   const inferredABO=d.fields.find(x=>x.key==='secondary')?.value||state?.people[role]?.secondary||'unknown';
   const choices=f.key==='anatomy'?anatomyChoices(inferredSex,inferredABO):PROPOSAL_SELECT[f.key];
   const options=choices&&choices.some(([v])=>v===f.value)?choices:choices?[...choices,[f.value,'제안값: '+f.value]]:null;
   const edit=typeof f.value==='boolean'?`<select data-proposal-value="${role}" data-i="${i}">${choiceHTML([['true','있음'],['false','없음']],f.value)}</select>`:
    options?`<select data-proposal-value="${role}" data-i="${i}">${choiceHTML(options,f.value)}</select>`:
    `<input type="text" data-proposal-value="${role}" data-i="${i}" value="${html(f.value)}" />`;
   out+=`<div class="abop-proposal-row"><label class="abop-check abop-proposal-check"><input type="checkbox" data-proposal-check="${role}" data-i="${i}" ${checked?'checked':''} ${disabled?'disabled':''}/><span class="abop-sr-only">${html(f.label)} 적용</span></label>
    <div class="abop-proposal-content"><div class="abop-rowhead"><b>${html(f.label)}</b><span class="abop-basis ${f.basis}">${f.basis==='explicit'?'카드 명시':'분석 제안'}</span>${disabled?'<span class="abop-basis">수동 고정</span>':''}</div>${edit}<small>${html(f.reason||'카드·페르소나 분석')}</small></div></div>`;
  }
  out+=`</div><h3 class="abop-setup-subtitle">친밀 성향·취향 후보 <span>잠재 후보 3~5개 · 확정 후보 별도</span></h3>`;
  for(const [kind,list] of [['confirmed',d.confirmed],['latent',d.latent]]){
   for(const [i,pref] of list.entries()){
    out+=`<div class="abop-proposal-row"><label class="abop-check abop-proposal-check"><input type="checkbox" data-pref-check="${role}" data-kind="${kind}" data-i="${i}" ${pref.checked?'checked':''}/><span class="abop-sr-only">${html(preferenceDisplayLabel(pref))} 적용</span></label>
     <div class="abop-proposal-content"><div class="abop-rowhead"><b>${kind==='confirmed'?'카드 확정':pref.source==='optional'?'선택 후보':'잠재 취향'}</b><span class="abop-basis ${kind==='confirmed'?'explicit':'suggested'}">${kind==='confirmed'?'확정 제안':pref.source==='optional'?'선택 후보':pref.source==='custom'?'직접 추가':'잠재 제안'}</span></div>
     <input data-pref-id="${role}" data-kind="${kind}" data-i="${i}" type="text" value="${html(preferenceDisplayLabel(pref))}" title="원본 ID: ${html(pref.id)}" aria-label="취향 이름" />
     ${kind==='confirmed'?`<select data-pref-level="${role}" data-i="${i}">${choiceHTML(LEVELS.filter(x=>x[0]!=='latent'),pref.level)}</select>`:''}
     <small>${html(pref.reason||'캐릭터의 성격·설정 기반 제안')}</small></div></div>`;
   }
  }
  out+=`<div class="abop-pref-add"><label>후보 직접 추가<input id="abop-newpref-${role}" type="text" placeholder="예: 애프터케어, 역할극, 노출 플레이" maxlength="80" /></label><button data-action="addPref" data-role="${role}" type="button">+ 후보 추가</button></div><p class="abop-muted">선택을 돕기 위해 제공되는 일반 후보입니다. 체크 시에만 적용됩니다.</p>`;
  out+=`<div class="abop-rowhead abop-attitude"><label class="abop-check"><input type="checkbox" data-pref-attitude-check="${role}" ${d.useAttitude?'checked':''}/> 성향 적용</label>
   <select data-pref-attitude="${role}">${choiceHTML([['open','열려 있음'],['reserved','소극적임'],['curious','호기심만 있음']],d.attitude)}</select></div></section>`;
 }
 return out+`<section class="abop-frame abop-applybar"><p class="abop-muted">적용 전까지 월드 인포, 임신 계산 및 RP에 영향을 주지 않습니다.</p><button data-action="applyProposal" class="abop-primary">✓ 선택한 제안 적용</button></section>`;
}
async function applyProfileProposal(){
 const m=meta(),draft=m?.initialProposal;
 syncCanon();
 if(!draft||draft.chatId!==S().chatId||draft.personaIdentity!==m.userPersonaIdentity||draft.targetId!==selectedNpcId(m))return setStatus('페르소나가 변경되어 이전 제안은 적용할 수 없습니다');
 let applied=0;
 for(const role of ['char','user']){
  const rec=draft.roles?.[role];if(!rec)continue;
  const own=currentRoleOverrides(m,role);
  for(const f of rec.fields){
   if(!f.checked||Object.hasOwn(own,f.key))continue;
   own[f.key]=f.value;applied++;
  }
  const chosen=[...(rec.confirmed||[]),...(rec.latent||[])].some(p=>p.checked);
  if(chosen||rec.useAttitude){
   const target=role==='char'?selectedNpc(m):null;
   if(target)target.preferences=mergeSelectedPreferences(target.preferences,rec);
   else m.canon[role].preferences=mergeSelectedPreferences(m.canon[role].preferences,rec);
   applied += [...(rec.confirmed||[]),...(rec.latent||[])].filter(p=>p.checked).length;
  }
 }
 m.profileInitialized=true;m.initialProposal=null;
 await persist();tab='status';refresh();setStatus(`선택한 제안 ${applied}개 적용 완료`);
}
function selectedSection(){
 const m=meta(false);if(!state||!m)return `<p class="abop-muted">채팅을 연 뒤 사용할 수 있습니다.</p>`;
 const people=Object.entries(state.people);
 if(!currentNpcReady(m)&&tab!=='settings')return renderNpcTarget()+'<section class="abop-frame"><p class="abop-muted">다인 봇 모드에서는 추적할 NPC를 먼저 선택해 주세요. 선택하기 전에는 내레이터를 CHAR로 분석하지 않습니다.</p></section>';
 if(tab==='setup')return renderSetup();
 if(tab==='status')return `${renderNpcTarget()}<div class="abop-people">${people.map(([id,p])=>personCard(id,p,m)).join('')}</div>
  <section class="abop-frame"><header>◈ 서사 시간 · 사건</header><p class="abop-meta">D${Math.floor(state.clockHours/24)} · ${fmt(state.clockHours%24)}h / 기록 ${state.events.length}건</p>
  <div class="abop-actions"><input id="abop-hours" type="number" min="0" step="1" placeholder="진행 시간(h)" aria-label="진행 시간"/><button data-action="advance">시간 적용</button><button data-action="rebuild">다시 계산</button></div>
  ${state.alerts.slice(-3).map(x=>`<p class="abop-note">${html(x)}</p>`).join('')}
  <details><summary>최근 사건</summary>${state.events.slice(-14).reverse().map(e=>`<div class="abop-line">D${Math.floor(e.at/24)} · ${html(e.kind)} ${html(e.person||'')}</div>`).join('')||'기록 없음'}</details></section>`;
 if(tab==='cycles')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · 생리 주기</header><p class="abop-title">${html(p.name)}</p><p>단계: <b>${html(cyclePhaseLabel(p.cycle.phase))}</b></p><p>간격: ${fmt(p.cycle.intervalHours/24)}일</p><p>전조: ${fmt(p.cycle.prodromeHours)}시간 · 활성: ${fmt(p.cycle.activeHours/24)}일</p><p>회복: ${fmt(p.cycle.recoveryHours)}시간</p><p>월경: ${p.menstruation.enabled?'활성':'없음/미설정'} · 임신 능력: ${p.fertile.gestate?'있음':'없음'}</p><p class="abop-muted">본능 행동화: ${(instinctChance(p,p.cycle.phase)*100).toFixed(0)}% · 후보: ${html(allowedInstincts(p).map(instinctLabel).join(', '))}</p>
 <details><summary>약물 · 부작용 · 내성</summary><p class="abop-muted">복용 ${p.medication.length}건 · 부작용 기록 ${p.adverse.length}건</p>
 ${(p.adverse||[]).slice(-4).map(x=>`<div class="abop-line">${html(x.drug)} · ${html((x.symptoms||[x.type||'기타']).join(', '))}${Number.isFinite(x.until)&&x.until<state.clockHours?' (경과)':''}</div>`).join('')||'<p class="abop-muted">부작용 기록 없음</p>'}
 <p class="abop-muted">내성: ${html(Object.entries(p.tolerance||{}).map(([k,v])=>`${k} ${v}`).join(' · ')||'기록 없음')}</p>
 <div class="abop-actions"><select id="abop-drug-${id}" aria-label="${id} 약물 종류">${[['oral_suppressant','경구 억제제'],['long_suppressant','장기 억제제'],['emergency_suppressant','응급 억제제'],['scent_blocker','페로몬 차단제'],['oral_contraceptive','일반 피임약'],['emergency_contraceptive','응급 피임약'],['symptom_inducer','증상 유도제'],['cycle_inducer','주기 유도제'],['unlicensed_mixture','비승인 혼합약물']].map(([v,label])=>`<option value="${v}">${label}</option>`).join('')}</select>
 <select id="abop-drug-mode-${id}" aria-label="${id} 사용 방식"><option value="normal">정상 사용</option><option value="misuse">오남용</option><option value="unlicensed">비승인 사용</option></select>
 <button data-action="recordMedication" data-role="${id}">확인된 복용 기록</button></div>
 <p class="abop-muted">실제로 복용한 것으로 확인된 사건만 기록하세요. 자동 분석에서 이미 기록한 복용은 중복 입력하지 마세요. 발생 확률과 증상은 가상의 세계관 규칙에 따라 결정됩니다.</p></details></section>`).join('')}</div>`;
 if(tab==='fertility')return `${m.config.pregnancyEnabled===false?'<section class="abop-frame"><header>임신 기능 OFF</header><p>임신 판정 및 RP 주입이 비활성화되어 있습니다. 기록은 삭제되지 않으며 다시 켜면 기존 사건도 재계산됩니다.</p></section>':''}<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · 실제 신체 상태</header><div class="abop-title">${html(p.name)}</div><p>임신 상태: <b>${m.config.hideTruth?'●●●● (스포일러 숨김)':html(p.pregnancy.status)}</b></p><p>인지 상태: ${html(pregnancyLabel(p.awareness.pregnancy))}</p><p>출산 예정: ${p.pregnancy.dueAt===null?'—':`D${fmt(p.pregnancy.dueAt/24)}`}</p><p>결합: ${html(p.bondWith||'없음')}</p></section>`).join('')}</div><section class="abop-frame"><header>◈ 가임·임신 가능성 기록</header>${Object.values(state.windows).map(w=>`<div class="abop-line">${html(w.gestator)} · 노출 ${w.exposures.length}건 · 누적 ${(w.total*100).toFixed(1)}% · ${m.config.hideTruth?'결과 숨김':`고정 난수 ${w.roll.toFixed(4)}`}</div>`).join('')||'<p>판정 기록 없음</p>'}<button data-action="exposure" ${m.config.pregnancyEnabled===false?'disabled title="임신 기능이 꺼져 있습니다"':''}>임신 가능 사건 수동 기록</button></section>`;
 if(tab==='preferences')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · 취향</header><div class="abop-title">${html(p.name)}</div><p class="abop-muted">성향: ${html(attitudeLabel(p.preferences.attitude))}</p>${[...p.preferences.confirmed,...p.preferences.latent].map(x=>`<div class="abop-line">${html(preferenceDisplayLabel(x))} <small>[${html(preferenceLevelLabel(x.level))}]</small></div>`).join('')||'<p>등록된 취향 없음</p>'}<hr/><p class="abop-muted">장면: ${html(p.scene.posture||'—')} · ${html(p.scene.contact||'—')}</p><p class="abop-muted">최근 장면: ${p.recentScenes.length}/3</p></section>`).join('')}</div>`;
 return `<section class="abop-frame"><header>◈ 설정</header>
  <div class="abop-title">디자인 설정</div>
  <label class="abop-fieldlabel">색상 테마<select data-theme-choice>${choiceHTML([['auto','시스템 설정에 맞춤'],['light','라이트 · 밝은 테마'],['dark','다크 · 어두운 테마']],m.config.uiTheme||'auto')}</select></label>
  <p class="abop-muted">화면 대비를 높이고 산세리프 글꼴을 적용했습니다. 설정은 이 채팅에 저장됩니다.</p><hr/>
  <div class="abop-title">분석 모델 연결</div>
  <label class="abop-fieldlabel">분석에 사용할 API / 저장 연결 프로필
  <select id="abop-connection" data-connection>${connectionOptions(m.config)}</select></label>
  <p class="abop-muted">선택하지 않으면 현재 SillyTavern 연결을 사용합니다. 저장된 프로필은 메인 RP 연결을 전환하지 않고 공식 프로필 요청 서비스로 별도 호출합니다. 연결 테스트에서 인증 오류가 나면 연결 관리자에서 그 프로필을 활성화한 상태로 업데이트하세요.</p>
  ${connectionValue(m.config)==='custom'?`<div class="abop-api-fields">
    <label class="abop-fieldlabel">OpenAI 호환 API 주소<input type="url" data-custom="customApiUrl" value="${html(m.config.customApiUrl||'')}" placeholder="https://api.example.com/v1" /></label>
    <label class="abop-fieldlabel">모델 이름<input type="text" data-custom="customModel" value="${html(m.config.customModel||'')}" placeholder="model-id" /></label>
    <label class="abop-fieldlabel">API 키 (메모리에만 저장)<input type="password" data-secret placeholder="${sessionApiKey?'등록됨 · 바꾸려면 새 키 입력':'API 키 입력'}" autocomplete="off" /></label>
    <p class="abop-muted">키는 채팅·설정·내보내기에 저장하지 않습니다. 새로고침하면 다시 입력해야 합니다. 직접 API 호출은 제공 업체의 브라우저 CORS 허용이 필요하며, 지원하지 않으면 저장된 연결 프로필을 사용하세요.</p>
    <button data-action="clearKey">임시 API 키 지우기</button>
  </div>`:''}
  <label class="abop-fieldlabel">초기 셋업 최대 출력 토큰<input type="number" min="${MIN_SETUP_OUTPUT_TOKENS}" max="${MAX_SETUP_OUTPUT_TOKENS}" step="1" data-custom="setupMaxTokens" value="${html(normalizeSetupOutputTokens(m.config.setupMaxTokens))}" /></label>
  <p class="abop-muted">모델·제공업체의 실제 최대 출력 토큰은 다를 수 있습니다. 현재 연결 사용 시에는 SillyTavern의 현재 연결에 응답 길이 값을 전달합니다.</p>
  <button data-action="refreshProfiles">프로필 목록 새로고침</button><button data-action="testConnection">분석 연결 테스트</button>
  <hr/><label class="abop-check"><input type="checkbox" data-config="enabled" ${m.config.enabled?'checked':''}/> 확장 활성화</label><label class="abop-check"><input type="checkbox" data-config="autoAnalyze" ${m.config.autoAnalyze?'checked':''}/> 응답마다 별도 분석 호출 (추가 API 비용 발생 가능)</label><label class="abop-check"><input type="checkbox" data-config="injectState" ${m.config.injectState?'checked':''}/> 다음 RP에 내부 상태 주입</label><label class="abop-check"><input type="checkbox" data-config="hideTruth" ${m.config.hideTruth?'checked':''}/> 화면에서 임신 결과 숨기기 (모델 주입에는 유지)</label>
  <label class="abop-check"><input type="checkbox" data-config="pregnancyEnabled" ${m.config.pregnancyEnabled!==false?'checked':''}/> 임신 시뮬레이션 ON/OFF (채팅별)</label>
  <p class="abop-muted">OFF: 새 임신 확률·진행·RP 주입을 계산하지 않습니다. 사건 기록은 유지하므로 다시 ON이면 기존 사건까지 결정적 난수로 재계산됩니다. 이미 진행 중인 채팅에서는 먼저 백업을 권장합니다.</p>
  <hr/><div class="abop-title">기본 임신 확률 (%)</div>${Object.entries(m.config.rate).map(([k,v])=>`<label class="abop-number">${html(k)} <input type="number" min="0" max="100" step="1" data-rate="${k}" value="${fmt(v*100)}" /></label>`).join('')}<hr/><div class="abop-title">약물 시뮬레이션 확률 (%)</div>
  <p class="abop-muted">세계관 설정용 가상 확률입니다. 현실 의학에서 사용하는 실제 약물의 효과·복용법을 의미하지 않습니다.</p>
  ${[['oralContraceptiveEffectiveness','일반 피임약 유효 중 임신 위험 감소'],['emergencyContraceptiveReduction','72시간 이내 응급 피임 위험 감소'],['longSuppressantSuccess','장기 억제제 배란 억제 성공']].map(([key,label])=>`<label class="abop-number">${label} <input type="number" min="0" max="100" step="1" data-probability="${key}" value="${fmt((m.config[key]??DEFAULT_CONFIG[key])*100)}" /></label>`).join('')}
  <label class="abop-number">전체 부작용 발생 확률 배율 (%) <input type="number" min="0" max="300" step="5" data-probability="sideEffectScale" value="${fmt((m.config.sideEffectScale??1)*100)}" /></label>
  <p class="abop-muted">약물별 기본 부작용 확률: 경구 억제제 8% · 장기 억제제 12% · 응급 억제제 10% · 페로몬 차단제 4% · 일반 피임약 8% · 응급 피임약 10%. 배율은 개별 약물의 부작용 확률에만 적용됩니다.</p>
  <hr/><button data-action="openSetup">초기 프로필 셋업 열기</button><button data-action="reanalyze">최근 응답 재분석</button><button data-action="export">채팅 데이터 내보내기</button><p class="abop-muted">수동 변경은 자동 판독보다 우선합니다. 선택된 응답에 속한 분석 사건만 적용됩니다.</p></section>`;
}
function personCard(id,p,m){
 const own=effectiveOverrides(m)?.[id]||{};
 const options=(val,items)=>items.map(([k,v])=>`<option value="${k}" ${val===k?'selected':''}>${v}</option>`).join('');
 return `<section class="abop-frame abop-person"><header><span class="abop-icon">${id==='char'?'◇':'◆'}</span> ${id.toUpperCase()} <small>${id==='char'?'캐릭터':'페르소나'}</small></header>
 <div class="abop-title">${html(p.name)}</div>
 <div class="abop-fields"><label>성별<select data-person="${id}" data-field="sex">${options(p.sex,[['unknown','미설정'],['male','남성'],['female','여성'],['nonbinary','기타']])}</select></label>
 <label>ABO<select data-person="${id}" data-field="secondary">${options(p.secondary,[['alpha','ALPHA'],['beta','BETA'],['omega','OMEGA']])}</select></label>
 <label>신체 유형<select data-person="${id}" data-field="anatomy">${options(p.anatomy||anatomyDefault(p.sex,p.secondary),anatomyChoices(p.sex,p.secondary))}</select></label>
 <label>러트/히트<select data-person="${id}" data-field="cycleEnabled">${options(String(p.cycle.enabled),[['true','사용'],['false','사용 안 함']])}</select></label></div>
 <div class="abop-savebar"><small>항목 변경 시 자동 저장됩니다. 자동 배정된 ABO도 확정할 수 있습니다.</small><button type="button" data-action="saveABO" data-role="${id}">ABO 선택 저장</button></div>
 <div class="abop-meterlabel">컨디션 <b>${fmt(p.body.condition)}</b></div><div class="abop-meter"><i style="width:${clamp(p.body.condition,0,100)}%"></i></div>
 <div class="abop-meterlabel">페로몬 발산 <b>${fmt(p.pheromone.emission)}</b></div><div class="abop-meter mint"><i style="width:${clamp(p.pheromone.emission,0,100)}%"></i></div>
 <div class="abop-tagrow"><span>${html(cyclePhaseLabel(p.cycle.phase))}</span><span>${html(String(p.secondary||'미설정').toUpperCase())}</span><span>${p.bondWith?'결합 ♥':'미결합'}</span></div>
 <div class="abop-muted">지속 상태: ${p.medication.filter(x=>x.until>=state.clockHours).map(x=>html(x.drug)).join(', ')||'없음'}</div>
 ${p.anatomy==='custom'?`<label class="abop-fieldlabel">특수 생식 구조<textarea data-person="${id}" data-field="anatomyDetail" rows="2" placeholder="구조 설명">${html(p.anatomyDetail||'')}</textarea></label>`:''}
 ${p.sex==='female'&&p.secondary==='alpha'?`<details class="abop-advanced"><summary>여성 Alpha · 가상 생식기관</summary><label class="abop-fieldlabel">생식기관·전달 경로 설명<textarea data-person="${id}" data-field="inseminationOrgan" rows="2" placeholder="외형과 별도로 임신 능력 유지">${html(p.inseminationOrgan||'')}</textarea></label></details>`:''}
 </section>`;
}
function render(){
 const root=el('abop-panel');if(!root)return;
 const previousScroll=root.querySelector('.abop-main')?.scrollTop||0;
 root.classList.toggle('abop-visible',panelOpen);
 const m=meta(false);
 const theme=m?.config?.uiTheme||'auto';
 root.dataset.theme=theme==='light'||theme==='dark'?theme:(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches?'dark':'light');
 root.innerHTML=`<div class="abop-window"><div class="abop-top"><span class="abop-brandmark" aria-hidden="true"></span><strong>그날의 사정 <small>ABO TRACKER</small></strong><span class="abop-version">v0.3.12</span><button title="테마 전환" aria-label="테마 전환" data-action="themeCycle" class="abop-theme-button">◐</button><button title="닫기" aria-label="닫기" data-action="close">✕</button></div>
 <div class="abop-shell"><nav class="abop-nav">${[['status','상태','▦'],['setup','초기 설정','◈'],['cycles','주기','◷'],['fertility','임신','✦'],['preferences','취향','♥'],['settings','설정','⚙']].map(([id,label,icon])=>`<button data-tab="${id}" class="${tab===id?'selected':''}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>
 <main class="abop-main"><div class="abop-subhead"><span>◈ ${({'status':'상태','setup':'초기 설정','cycles':'주기','fertility':'임신','preferences':'취향','settings':'설정'}[tab]||tab.toUpperCase())} / ${html(S()?.chatId?'현재 채팅':'채팅 없음')}</span><span class="abop-dot">● ${working?'분석 중':'준비됨'}</span></div>${selectedSection()}<footer id="abop-statusline">${html(status)}</footer></main></div></div>`;
 const scrollArea=root.querySelector('.abop-main');if(scrollArea)scrollArea.scrollTop=previousScroll;
}
function buildUI(){
 if(!el('abop-open')){
  const b=document.createElement('button');b.id='abop-open';b.type='button';b.textContent='▦ ABO';b.title='그날의 사정 열기';b.addEventListener('click',()=>{panelOpen=!panelOpen;refresh();});document.body.appendChild(b);
 }
 if(!el('abop-panel')){
  const panel=document.createElement('div');panel.id='abop-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','그날의 사정');panel.addEventListener('click',handlePanelClick);panel.addEventListener('change',handlePanelChange);document.body.appendChild(panel);
 }
}
async function handlePanelChange(e){
 const t=e.target,m=meta();if(!m)return;
 if(t.hasAttribute('data-npc-search')){npcSearch=t.value;render();return;}
 if(t.hasAttribute('data-theme-choice')){m.config.uiTheme=t.value;
 }else if(t.dataset.proposalCheck){const field=m.initialProposal?.roles?.[t.dataset.proposalCheck]?.fields?.[Number(t.dataset.i)];if(field)field.checked=t.checked;
 }else if(t.dataset.proposalValue){const f=m.initialProposal?.roles?.[t.dataset.proposalValue]?.fields?.[Number(t.dataset.i)];if(f){f.value=typeof f.value==='boolean'?t.value==='true':t.value;}
 }else if(t.dataset.prefCheck){const pref=m.initialProposal?.roles?.[t.dataset.prefCheck]?.[t.dataset.kind]?.[Number(t.dataset.i)];if(pref)pref.checked=t.checked;
 }else if(t.dataset.prefId){
  const pref=m.initialProposal?.roles?.[t.dataset.prefId]?.[t.dataset.kind]?.[Number(t.dataset.i)];
  if(pref){
   const original=pref.id, shown=preferenceDisplayLabel(pref), edited=String(t.value||'').trim();
   pref.id=preferenceIdFromEdit(edited,original,pref.label);
   if(edited!==shown)pref.label=/[가-힣]/u.test(edited)?edited:'';
  }
 }else if(t.dataset.prefLevel){const pref=m.initialProposal?.roles?.[t.dataset.prefLevel]?.confirmed?.[Number(t.dataset.i)];if(pref&&LEVELS.some(x=>x[0]===t.value))pref.level=t.value;
 }else if(t.dataset.prefAttitude){const d=m.initialProposal?.roles?.[t.dataset.prefAttitude];if(d)d.attitude=t.value;
 }else if(t.dataset.prefAttitudeCheck){const d=m.initialProposal?.roles?.[t.dataset.prefAttitudeCheck];if(d)d.useAttitude=t.checked;
 }else if(t.dataset.person){
  const id=t.dataset.person,field=t.dataset.field;
  const value=field==='cycleEnabled'?t.value==='true':t.value;
  currentRoleOverrides(m,id)[field]=value;
 }else if(t.dataset.config){m.config[t.dataset.config]=!!t.checked;
 }else if(t.hasAttribute('data-connection')){
  m.config.analysisConnection=t.value;
 }else if(t.dataset.custom){
  m.config[t.dataset.custom]=t.dataset.custom==='setupMaxTokens'?normalizeSetupOutputTokens(t.value):t.value.trim();
 }else if(t.hasAttribute('data-secret')){
  // Never write keys to metadata, world info, backups, or console logs.
  sessionApiKey=t.value.trim();t.value='';setStatus(sessionApiKey?'임시 API 키가 메모리에 등록됨':'임시 API 키가 비어 있음');
 }else if(t.dataset.rate){m.config.rate[t.dataset.rate]=clamp(Number(t.value)/100,0,1);
 }else if(t.dataset.probability){const key=t.dataset.probability;if(!['oralContraceptiveEffectiveness','emergencyContraceptiveReduction','longSuppressantSuccess','sideEffectScale'].includes(key))return;const n=Number(t.value),max=key==='sideEffectScale'?300:100;if(!Number.isFinite(n)||n<0||n>max)return setStatus(`확률 설정 범위: 0~${max}%`);m.config[key]=n/100;
 }else return;
 const saved=await persist();refresh();
 if(t.dataset.person)setStatus(saved?`${t.dataset.person.toUpperCase()} ${t.dataset.field==='secondary'?'ABO':'설정'} 변경 자동 저장 완료`:'채팅 설정 저장 실패 · 콘솔 확인');
}
async function addManualEvents(events){
 const m=meta(),src=sourceForCurrent();syncCanon();if(!m||!src)return setStatus('먼저 대화를 시작하세요');
 if(!currentNpcReady(m))return setStatus('먼저 CHAR 추적 NPC를 선택하세요');
 const key=src.key,target=selectedNpcId(m),ledger=currentCharLedger(m);let rec=ledger[key]||{analyzed:false,events:[],manual:[]};
 if(rec.personaId&&rec.personaId!==m.userPersonaIdentity)return setStatus('이 응답은 이전 USER 페르소나의 기록입니다. 새 응답 뒤에 사건을 기록하세요.');
 const rows=events.map((e,i)=>({...e,id:`${key}/manual:${Date.now()}:${i}`}));
 if(target!==MAIN_TARGET){
  const shared=rows.filter(sharedEvent),local=rows.filter(e=>!sharedEvent(e));
  if(shared.length){const base=m.ledger[key]||{events:[],manual:[]};base.events.push(...shared);base.manual.push(...shared);base.personaId=m.userPersonaIdentity;m.ledger[key]=base;}
  rec.manual.push(...local);rec.events.push(...local);
 }else{rec.manual.push(...rows);rec.events.push(...rows);}
 rec.personaId=m.userPersonaIdentity;ledger[key]=rec;await persist();refresh();
}
async function handlePanelClick(e){
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;render();const a=el('abop-panel')?.querySelector('.abop-main');if(a)a.scrollTop=0;return;}
 const act=t.dataset.action;if(!act)return;
 if(act==='close'){panelOpen=false;render();return;}
 if(act==='themeCycle'){const m=meta();m.config.uiTheme=m.config.uiTheme==='dark'?'light':'dark';await persist();refresh();return;}
 if(act==='singleNpc'){await switchNpc(MAIN_TARGET);return;}
 if(act==='multiNpc'){const m=meta(),t=npcTracking(m);if(m.initialProposal)t.pending[MAIN_TARGET]=m.initialProposal;t.mode='multi';t.activeId=t.activeId===MAIN_TARGET?'':t.activeId;m.initialProposal=t.pending[t.activeId]||null;await persist();refresh();setStatus('다인 봇 모드 · NPC를 선택하거나 직접 추가하세요');return;}
 if(act==='scanNPCs'){await scanNpcSources();return;}
 if(act==='selectNpc'){
  const id=el('abop-npc-select')?.value,m=meta();if(!id)return setStatus('NPC를 먼저 선택하세요');
  const t=npcTracking(m),candidate=npcCandidates.find(x=>x.id===id);
  if(!t.targets[id]&&candidate)t.targets[id]={...npcCanon(candidate),overrides:{}};
  await switchNpc(id);return;
 }
 if(act==='addNpc'){
  const m=meta(),name=el('abop-npc-name')?.value,description=el('abop-npc-description')?.value;
  const aliases=(el('abop-npc-aliases')?.value||'').split(',').map(x=>x.trim()).filter(Boolean);
  let target;try{target=namedTarget(name,description,'직접 추가',aliases);}catch(e){return setStatus(e.message);}
  const t=npcTracking(m);if(t.targets[target.id])return setStatus('이미 추가된 NPC입니다. 목록에서 해당 인물을 선택해 주세요');
  t.targets[target.id]={...target,overrides:{}};await switchNpc(target.id);return;
 }
 if(act==='openSetup'){tab='setup';render();return;}
 if(act==='saveABO'){
  const role=t.dataset.role;if(!['char','user'].includes(role))return;
  const m=meta();const selected=el('abop-panel')?.querySelector(`select[data-person="${role}"][data-field="secondary"]`)?.value;
  if(!['alpha','beta','omega'].includes(selected))return setStatus('ABO 선택값이 올바르지 않습니다');
  currentRoleOverrides(m,role).secondary=selected;
  const saved=await persist();refresh();setStatus(saved?`${role.toUpperCase()} ABO ${selected.toUpperCase()} 선택 저장 완료`:'ABO 설정 저장 실패 · 콘솔 확인');return;
 }
 if(act==='applyProposal'){await applyProfileProposal();return;}
 if(act==='addPref'){
  const role=t.dataset.role;
  if(!['char','user'].includes(role))return;
  const m=meta(),d=m?.initialProposal?.roles?.[role];if(!d)return;
  const input=el(`abop-newpref-${role}`);
  const tag=preferenceIdFromEdit(input?.value||'');
  if(!/^[\p{L}\p{N}_ -]{2,80}$/u.test(tag))return setStatus('취향 이름은 글자·숫자·공백·밑줄로 2~80자 입력하세요');
  if([...d.confirmed,...d.latent].some(p=>p.id.toLowerCase()===tag.toLowerCase()))return setStatus('이미 제안된 취향입니다');
  d.latent.push({id:tag,level:'latent',reason:'사용자가 직접 추가한 후보',source:'custom',checked:true});
  await persist();refresh();setStatus(`새 취향 후보 추가: ${preferenceLabel(tag)}`);return;
 }

 if(act==='discardProposal'){const m=meta();m.initialProposal=null;await persist();refresh();setStatus('미적용 제안 폐기됨');return;}
 if(act==='refreshProfiles'){refresh();setStatus('연결 프로필 목록 새로고침 완료');return;}
 if(act==='clearKey'){sessionApiKey='';setStatus('임시 API 키 삭제됨');refresh();return;}
 if(act==='testConnection'){
  if(working)return;working=true;setStatus('분석 모델 연결 테스트 중…');render();
  try{const reply=await analysisRequest('Answer using only the word OK.','Connection test.',64);setStatus(`연결 성공 (${String(reply).trim().slice(0,48)})`);}
  catch(err){console.warn('[ABO Pixel] connection test failed',err);setStatus(`연결 실패: ${readableProfileError(err)} | ${profileErrorHint(err)}`);}
  finally{working=false;render();}return;
 }
 if(act==='rebuild'){refresh();setStatus('선택 분기 상태 재계산 완료');return;}
 if(act==='reanalyze'){await analyzeLatest({force:true});return;}
 if(act==='init'){await initialProfileAnalyze();return;}
 if(act==='advance'){
  const n=Number(el('abop-hours')?.value);
  if(!Number.isFinite(n)||n<=0||n>8760)return setStatus('0보다 크고 8760 이하인 시간 입력');
  await addManualEvents([{kind:'time_advance',hours:n}]);setStatus(`시간 +${n}h 반영`);return;
 }
 if(act==='recordMedication'){
  const role=t.dataset.role;if(!['char','user'].includes(role))return;
  const drug=el(`abop-drug-${role}`)?.value,mode=el(`abop-drug-mode-${role}`)?.value;
  if(!['oral_suppressant','long_suppressant','emergency_suppressant','scent_blocker','oral_contraceptive','emergency_contraceptive','symptom_inducer','cycle_inducer','unlicensed_mixture'].includes(drug))return;
  if(!['normal','misuse','unlicensed'].includes(mode))return;
  await addManualEvents([{kind:'medication',person:role,drug,use_mode:mode}]);setStatus(`${role.toUpperCase()} 약물 복용 사건 기록 완료`);return;
 }
 if(act==='exposure'){
  if(meta()?.config?.pregnancyEnabled===false)return setStatus('임신 기능이 꺼져 있습니다. 설정에서 ON으로 변경하세요');
  const gestator=window.prompt('임신 대상: char / user (취소 가능)','char');if(!['char','user'].includes(gestator))return;
  const donor=gestator==='char'?'user':'char';
  const n=Number(window.prompt('이 장면에서 확인된 생식기관 내부 사정 횟수 (1~30)','1'));
  if(!Number.isInteger(n)||n<1||n>30)return setStatus('횟수는 1~30의 정수');
  if(!window.confirm('유효한 삽입과 생식기관 내부 사정이 모두 확인되었습니까?'))return;
  await addManualEvents([{kind:'exposure',gestator,donor,penetration:true,deposition:true,depositions:n}]);return;
 }
 if(act==='export'){
  const m=meta(false);if(!m)return;
  const blob=new Blob([JSON.stringify(m,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='abo-tracker-chat-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
}
function onEvent(){if(npcScanChatId!==S().chatId){npcCandidates=[];npcScanChatId='';npcSearch='';}refresh();
 // CHAT_CHANGED may precede SillyTavern's persona auto-selection. Recheck after
 // its own synchronous/async persona-lock handlers have finished.
 setTimeout(()=>refresh(),0);
 setTimeout(()=>refresh(),300);
}
function onMessage(){
 refresh();const m=meta(false);if(!m?.config?.autoAnalyze||!m.config.enabled||!currentNpcReady(m))return;
 // Allow the host to finish appending and selecting the final swipe before analysis.
 setTimeout(()=>{analyzeLatest().catch(err=>console.error(err));},350);
}
function subscribe(){
 const c=S(),source=c.eventSource,t=c.event_types||{};if(!source?.on)return;
 for(const name of ['CHAT_CHANGED','CHAT_CREATED','MESSAGE_SWIPED','MESSAGE_EDITED','MESSAGE_DELETED','PERSONA_CHANGED','PERSONA_UPDATED','PERSONA_RENAMED','CHARACTER_EDITED','WORLDINFO_UPDATED','WORLDINFO_SETTINGS_UPDATED'])if(t[name])source.on(t[name],onEvent);
 if(t.MESSAGE_RECEIVED)source.on(t.MESSAGE_RECEIVED,onMessage);
 if(t.GENERATION_STARTED)source.on(t.GENERATION_STARTED,updatePrompt);
}
function boot(){if(active)return;active=true;buildUI();subscribe();refresh();log('Loaded (no third-party dependencies)');}
// Module evaluation occurs after SillyTavern resolves its extension entrypoint.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
