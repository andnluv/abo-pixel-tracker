import {DEFAULT_CONFIG, VERSION,hash,uniqKey,sortedRecords,replay,inferExplicit,formatPrompt,allowedInstincts,instinctChance,pressureScore,clamp} from './core.mjs';
import {ANALYZER_SYSTEM,parseModelOutput,buildAnalyzerUserPrompt} from './analyzer.mjs';
import {PROFILE_SYSTEM,PROFILE_FIELDS,normalizeSetupProposal,mergeSelectedPreferences,anatomyChoices,anatomyDefault} from './profile.mjs';
import {user_avatar} from '/scripts/personas.js';
import {readCurrentPersona,personaIdentity,syncPersonaProfile,filterRowsByPersona} from './persona-sync.mjs';
const STORAGE='abo_pixel_tracker_independent_v1';
const PROMPT='ABO_PIXEL_TRACKER_CONTINUITY_V1';
const S=()=>SillyTavern.getContext();
let active=false, working=false, state=null, status='준비됨',panelOpen=false, tab='status', lastKey='';
let sessionApiKey=''; // Never serialized or persisted. Cleared on page reload.
const html=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const el=(id)=>document.getElementById(id);
const fmt=(n)=>Number.isFinite(n)?Math.round(n*10)/10:0;
function log(...v){console.log('[ABO Pixel]',...v);}
function connectionValue(config){return String(config?.analysisConnection||'');} // empty = current connection
function supportedProfiles(){
 try{
  const c=S();
  if(c?.extensionSettings?.disabledExtensions?.includes('connection-manager'))return [];
  // SillyTavern's built-in Connection Manager stores profiles in extensionSettings.
  const svc=c?.ConnectionManagerRequestService;
  const all=c?.extensionSettings?.connectionManager?.profiles||[];
  if(typeof svc?.getSupportedProfiles==='function')return svc.getSupportedProfiles();
  return all.filter(p=>{const a=c?.CONNECT_API_MAP?.[p?.api];return p?.id&&a&&(a.selected==='openai'&&!!a.source||a.selected==='textgenerationwebui'&&!!a.type);});
 }catch(e){console.debug('[ABO Pixel] profile listing unavailable',e);return [];}
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
async function analysisRequest(systemPrompt,prompt){
 const config=meta()?.config||DEFAULT_CONFIG, chosen=connectionValue(config);
 if(!chosen){
  if(typeof S().generateRaw!=='function')throw new Error('현재 SillyTavern 연결의 generateRaw가 없습니다');
  return await S().generateRaw({systemPrompt,prompt});
 }
 if(chosen.startsWith('profile:')){
  const id=chosen.slice(8);
  if(!supportedProfiles().some(p=>p.id===id))throw new Error('선택한 저장 연결 프로필이 없거나 지원되지 않습니다');
  // Lazy-load official request service only when profile mode is selected.
  const {ConnectionManagerRequestService:service}=await import('/scripts/extensions/shared.js');
  const selected=service.getProfile(id);
  const apiType=S()?.CONNECT_API_MAP?.[selected.api]?.selected;
  const messages=[{role:'system',content:systemPrompt},{role:'user',content:prompt}];
  const input=apiType==='textgenerationwebui'?`[SYSTEM]\n${systemPrompt}\n\n[USER]\n${prompt}\n\n[ASSISTANT]\n`:messages;
  const response=await service.sendRequest(id,input,1600,{stream:false,extractData:true,includePreset:false,includeInstruct:true},{temperature:0.1});
  const result=typeof response==='string'?response:response?.content;
  if(typeof result!=='string')throw new Error('저장 프로필에서 텍스트 결과를 받지 못했습니다');
  return result;
 }
 if(chosen==='custom'){
  if(!config.customApiUrl||!config.customModel)throw new Error('직접 API 주소와 모델명을 입력하세요');
  const endpoint=directEndpoint(config.customApiUrl);
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(sessionApiKey?{'Authorization':`Bearer ${sessionApiKey}`}:{})},body:JSON.stringify({model:config.customModel,stream:false,temperature:0.1,max_tokens:1600,messages:[{role:'system',content:systemPrompt},{role:'user',content:prompt}]})});
  if(!r.ok)throw new Error(`직접 API 오류 HTTP ${r.status} (브라우저 CORS 정책/모델 설정 확인)`);
  const j=await r.json();
  const content=j?.choices?.[0]?.message?.content||j?.response||'';
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
async function persist(){try{await S().saveMetadata?.();}catch(e){console.warn('[ABO Pixel] Metadata saving failed',e);setStatus('저장 실패: 개발자 콘솔 확인');}}
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
 const rows=filterRowsByPersona(sortedRecords(chat,m.ledger||{}),m.userPersonaIdentity);
 return replay(m.seed,m.canon,m.config||DEFAULT_CONFIG,rows,m.overrides||{});
}
function updatePrompt(){
 try{
  const c=S();if(typeof c.setExtensionPrompt!=='function')return;
  const m=meta(false);
  const body=state&&m?.config?.enabled&&m?.config?.injectState?formatPrompt(state,false):'';
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
 if(m.ledger[src.key]?.analyzed&&m.ledger[src.key]?.personaId===m.userPersonaIdentity&&!force)return;
 const originChat=S().chatId, originKey=src.key, originPersona=m.userPersonaIdentity;
 const c=S();
 working=true;setStatus('별도 모델로 사건 분석 중…');render();
 try{
  const last=branchState();
  const prompt=buildAnalyzerUserPrompt({charName:m.canon.char.name,userName:m.canon.user.name,charCard:m.canon.char.card,userPersona:m.canon.user.card,userText:src.userText,assistantText:src.assistantText,existingState:last?{clockHours:last.clockHours,people:Object.fromEntries(Object.entries(last.people).map(([k,p])=>[k,{sex:p.sex,secondary:p.secondary,phase:p.cycle.phase,pregnancy:p.pregnancy.status}]))}:null});
  const reply=await analysisRequest(ANALYZER_SYSTEM,prompt);
  syncCanon();
  if(S().chatId!==originChat||m.userPersonaIdentity!==originPersona||!sourceForCurrent()||sourceForCurrent().key!==originKey){setStatus('채팅/페르소나/응답 변경으로 분석 결과 폐기');return;}
  const events=parseModelOutput(reply,src.userText,src.assistantText).map((e,i)=>({...e,id:eventIDFor(originKey,i),sceneId:e.sceneId||originKey}));
  const existing=m.ledger[originKey]||{};
  if(existing.personaId&&existing.personaId!==originPersona){setStatus('이 응답은 이전 USER 페르소나의 기록입니다. 새 응답에서 다시 분석하세요.');return;}
  m.ledger[originKey]={analyzed:true,events:[...events,...(existing.manual||[])],manual:existing.manual||[],personaId:originPersona,at:Date.now()};
  await persist();setStatus(`분석 완료 · 확인된 사건 ${events.length}건`);refresh();
 }catch(e){console.error('[ABO Pixel] generation error',e);setStatus(`분석 실패: ${e.message||'모델/API 연결 확인'}`);}finally{working=false;render();}
}
async function initialProfileAnalyze(){
 const m=meta();syncCanon();if(!m||working)return;
 working=true;tab='setup';setStatus('CHAR·USER 프로필 제안 생성 중…');render();
 const chatId=S().chatId, originalPersona=m.userPersonaIdentity;
 try{
  const result=await analysisRequest(PROFILE_SYSTEM,JSON.stringify({char:m.canon.char,user:m.canon.user}));
  syncCanon();
  if(S().chatId!==chatId||m.userPersonaIdentity!==originalPersona){setStatus('채팅/페르소나 변경으로 분석 결과 폐기');return;}
  const draft=normalizeSetupProposal(result,chatId);
  draft.personaIdentity=originalPersona;
  // Models can be wrong. Explicit manual settings always start unchecked/locked.
  for(const role of ['char','user']){
   const locked=m.overrides?.[role]||{};
   for(const field of draft.roles[role].fields)if(Object.hasOwn(locked,field.key))field.checked=false;
  }
  m.initialProposal=draft;await persist();
  setStatus('제안 생성 완료 · 선택 후 적용해야 반영됩니다');refresh();
 }catch(e){console.error('[ABO Pixel] initial proposal failed',e);setStatus(`초기 프로필 제안 실패: ${e.message}`);}
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
 if(!draft||draft.chatId!==S().chatId||draft.personaIdentity!==m.userPersonaIdentity)return `<section class="abop-frame"><header>◇ INITIAL PROFILE SETUP</header><h3 class="abop-title">초기 프로필 통합 분석</h3>${hint}<p>신체 구조·생식 능력·페로몬·접촉·발성·언어와 친밀 취향을 한 번에 분석해 제안합니다. 기존 상태는 분석만으로 변경되지 않습니다.</p><button data-action="init">CHAR + USER 분석 제안 만들기</button></section>`;
 let out=`<section class="abop-frame"><header>◇ SETUP PROPOSAL <small>미적용 초안</small></header>${hint}
 <div class="abop-actions"><button data-action="init">다시 분석</button><button data-action="discardProposal">제안 버리기</button></div></section>`;
 for(const role of ['char','user']){
  const d=draft.roles[role],own=m.overrides?.[role]||{};
  out+=`<section class="abop-frame"><header>◇ ${role.toUpperCase()} · ${html(m.canon[role]?.name||'')}</header>
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
    <div class="abop-proposal-content"><div class="abop-rowhead"><b>${html(f.label)}</b><span class="abop-basis ${f.basis}">${f.basis==='explicit'?'CARD FACT':'SUGGESTION'}</span>${disabled?'<span class="abop-basis">수동 고정</span>':''}</div>${edit}<small>${html(f.reason||'카드·페르소나 분석')}</small></div></div>`;
  }
  out+=`</div><h3 class="abop-setup-subtitle">친밀 성향·취향 제안 <span>최대 5개 잠재 취향</span></h3>`;
  for(const [kind,list] of [['confirmed',d.confirmed],['latent',d.latent]]){
   for(const [i,pref] of list.entries()){
    out+=`<div class="abop-proposal-row"><label class="abop-check abop-proposal-check"><input type="checkbox" data-pref-check="${role}" data-kind="${kind}" data-i="${i}" ${pref.checked?'checked':''}/><span class="abop-sr-only">${html(pref.id)} 적용</span></label>
     <div class="abop-proposal-content"><div class="abop-rowhead"><b>${kind==='confirmed'?'카드 확정':'잠재 취향'}</b><span class="abop-basis ${kind==='confirmed'?'explicit':'suggested'}">${kind==='confirmed'?'CONFIRMED':'SUGGESTED'}</span></div>
     <input data-pref-id="${role}" data-kind="${kind}" data-i="${i}" type="text" value="${html(pref.id)}" aria-label="취향 이름" />
     ${kind==='confirmed'?`<select data-pref-level="${role}" data-i="${i}">${choiceHTML(LEVELS.filter(x=>x[0]!=='latent'),pref.level)}</select>`:''}
     <small>${html(pref.reason||'캐릭터의 성격·설정 기반 제안')}</small></div></div>`;
   }
  }
  if(!d.confirmed.length&&!d.latent.length)out+='<p class="abop-muted">근거가 있는 취향 제안이 없습니다. 새 취향을 임의로 확정하지 않습니다.</p>';
  out+=`<div class="abop-rowhead abop-attitude"><label class="abop-check"><input type="checkbox" data-pref-attitude-check="${role}" ${d.useAttitude?'checked':''}/> 성향 적용</label>
   <select data-pref-attitude="${role}">${choiceHTML([['open','열려 있음'],['reserved','소극적임'],['curious','호기심만 있음']],d.attitude)}</select></div></section>`;
 }
 return out+`<section class="abop-frame abop-applybar"><p class="abop-muted">적용 전까지 월드 인포, 임신 계산 및 RP에 영향을 주지 않습니다.</p><button data-action="applyProposal" class="abop-primary">✓ 선택한 제안 적용</button></section>`;
}
async function applyProfileProposal(){
 const m=meta(),draft=m?.initialProposal;
 syncCanon();
 if(!draft||draft.chatId!==S().chatId||draft.personaIdentity!==m.userPersonaIdentity)return setStatus('페르소나가 변경되어 이전 제안은 적용할 수 없습니다');
 let applied=0;
 for(const role of ['char','user']){
  const rec=draft.roles?.[role];if(!rec)continue;
  m.overrides[role]??={};
  for(const f of rec.fields){
   if(!f.checked||Object.hasOwn(m.overrides[role],f.key))continue;
   m.overrides[role][f.key]=f.value;applied++;
  }
  const chosen=[...(rec.confirmed||[]),...(rec.latent||[])].some(p=>p.checked);
  if(chosen||rec.useAttitude){
   m.canon[role].preferences=mergeSelectedPreferences(m.canon[role].preferences,rec);
   applied += [...(rec.confirmed||[]),...(rec.latent||[])].filter(p=>p.checked).length;
  }
 }
 m.profileInitialized=true;m.initialProposal=null;
 await persist();tab='status';refresh();setStatus(`선택한 제안 ${applied}개 적용 완료`);
}
function selectedSection(){
 const m=meta(false);if(!state||!m)return `<p class="abop-muted">채팅을 연 뒤 사용할 수 있습니다.</p>`;
 const people=Object.entries(state.people);
 if(tab==='setup')return renderSetup();
 if(tab==='status')return `<div class="abop-people">${people.map(([id,p])=>personCard(id,p,m)).join('')}</div>
  <section class="abop-frame"><header>◈ STORY CLOCK · EVENTS</header><p class="abop-meta">D${Math.floor(state.clockHours/24)} · ${fmt(state.clockHours%24)}h / 기록 ${state.events.length}건</p>
  <div class="abop-actions"><input id="abop-hours" type="number" min="0" step="1" placeholder="진행 시간(h)" aria-label="진행 시간"/><button data-action="advance">시간 적용</button><button data-action="rebuild">다시 계산</button></div>
  ${state.alerts.slice(-3).map(x=>`<p class="abop-note">${html(x)}</p>`).join('')}
  <details><summary>최근 사건</summary>${state.events.slice(-14).reverse().map(e=>`<div class="abop-line">D${Math.floor(e.at/24)} · ${html(e.kind)} ${html(e.person||'')}</div>`).join('')||'기록 없음'}</details></section>`;
 if(tab==='cycles')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · CYCLE</header><p class="abop-title">${html(p.name)}</p><p>단계: <b>${html(p.cycle.phase)}</b></p><p>간격: ${fmt(p.cycle.intervalHours/24)}일</p><p>전조: ${fmt(p.cycle.prodromeHours)}시간 · 활성: ${fmt(p.cycle.activeHours/24)}일</p><p>회복: ${fmt(p.cycle.recoveryHours)}시간</p><p>월경: ${p.menstruation.enabled?'활성':'없음/미설정'} · 임신 능력: ${p.fertile.gestate?'있음':'없음'}</p><p class="abop-muted">본능 행동화: ${(instinctChance(p,p.cycle.phase)*100).toFixed(0)}% · 후보: ${html(allowedInstincts(p).join(', '))}</p></section>`).join('')}</div>`;
 if(tab==='fertility')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · BIOLOGICAL TRUTH</header><div class="abop-title">${html(p.name)}</div><p>임신 상태: <b>${m.config.hideTruth?'●●●● (스포일러 숨김)':html(p.pregnancy.status)}</b></p><p>인지 상태: ${html(p.awareness.pregnancy)}</p><p>출산 예정: ${p.pregnancy.dueAt===null?'—':`D${fmt(p.pregnancy.dueAt/24)}`}</p><p>결합: ${html(p.bondWith||'없음')}</p></section>`).join('')}</div><section class="abop-frame"><header>◈ FERTILITY WINDOWS</header>${Object.values(state.windows).map(w=>`<div class="abop-line">${html(w.gestator)} · 노출 ${w.exposures.length}건 · 누적 ${(w.total*100).toFixed(1)}% · ${m.config.hideTruth?'결과 숨김':`고정 난수 ${w.roll.toFixed(4)}`}</div>`).join('')||'<p>판정 기록 없음</p>'}<button data-action="exposure">수태 사건 수동 기록</button></section>`;
 if(tab==='preferences')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · PREFERENCES</header><div class="abop-title">${html(p.name)}</div><p class="abop-muted">태도: ${html(p.preferences.attitude)}</p>${[...p.preferences.confirmed,...p.preferences.latent].map(x=>`<div class="abop-line">${html(x.id)} <small>[${html(x.level)}]</small></div>`).join('')||'<p>확정된 취향 없음</p>'}<hr/><p class="abop-muted">장면: ${html(p.scene.posture||'—')} · ${html(p.scene.contact||'—')}</p><p class="abop-muted">최근 장면: ${p.recentScenes.length}/3</p></section>`).join('')}</div>`;
 return `<section class="abop-frame"><header>◈ CONFIGURATION</header>
  <div class="abop-title">디자인 설정</div>
  <label class="abop-fieldlabel">색상 테마<select data-theme-choice>${choiceHTML([['auto','시스템 설정에 맞춤'],['light','LIGHT · 밝은 테마'],['dark','DARK · 어두운 테마']],m.config.uiTheme||'auto')}</select></label>
  <p class="abop-muted">화면 대비를 높이고 산세리프 글꼴을 적용했습니다. 설정은 이 채팅에 저장됩니다.</p><hr/>
  <div class="abop-title">분석 모델 연결</div>
  <label class="abop-fieldlabel">분석에 사용할 API / 저장 연결 프로필
  <select id="abop-connection" data-connection>${connectionOptions(m.config)}</select></label>
  <p class="abop-muted">선택하지 않으면 현재 SillyTavern 연결을 사용합니다. 저장된 프로필은 메인 RP 연결을 전환하지 않고 별도로 호출합니다.</p>
  ${connectionValue(m.config)==='custom'?`<div class="abop-api-fields">
    <label class="abop-fieldlabel">OpenAI 호환 API 주소<input type="url" data-custom="customApiUrl" value="${html(m.config.customApiUrl||'')}" placeholder="https://api.example.com/v1" /></label>
    <label class="abop-fieldlabel">모델 이름<input type="text" data-custom="customModel" value="${html(m.config.customModel||'')}" placeholder="model-id" /></label>
    <label class="abop-fieldlabel">API 키 (메모리에만 저장)<input type="password" data-secret placeholder="${sessionApiKey?'등록됨 · 바꾸려면 새 키 입력':'API 키 입력'}" autocomplete="off" /></label>
    <p class="abop-muted">키는 채팅·설정·내보내기에 저장하지 않습니다. 새로고침하면 다시 입력해야 합니다. 직접 API 호출은 제공 업체의 브라우저 CORS 허용이 필요하며, 지원하지 않으면 저장된 연결 프로필을 사용하세요.</p>
    <button data-action="clearKey">임시 API 키 지우기</button>
  </div>`:''}
  <button data-action="refreshProfiles">프로필 목록 새로고침</button><button data-action="testConnection">분석 연결 테스트</button>
  <hr/><label class="abop-check"><input type="checkbox" data-config="enabled" ${m.config.enabled?'checked':''}/> 확장 활성화</label><label class="abop-check"><input type="checkbox" data-config="autoAnalyze" ${m.config.autoAnalyze?'checked':''}/> 응답마다 별도 분석 호출 (추가 API 비용 발생 가능)</label><label class="abop-check"><input type="checkbox" data-config="injectState" ${m.config.injectState?'checked':''}/> 다음 RP에 내부 상태 주입</label><label class="abop-check"><input type="checkbox" data-config="hideTruth" ${m.config.hideTruth?'checked':''}/> 화면에서 임신 결과 숨기기 (모델 주입에는 유지)</label><hr/><div class="abop-title">기본 수태 확률 (%)</div>${Object.entries(m.config.rate).map(([k,v])=>`<label class="abop-number">${html(k)} <input type="number" min="0" max="100" step="1" data-rate="${k}" value="${fmt(v*100)}" /></label>`).join('')}<hr/><button data-action="openSetup">초기 프로필 셋업 열기</button><button data-action="reanalyze">최근 응답 재분석</button><button data-action="export">채팅 데이터 내보내기</button><p class="abop-muted">수동 변경은 자동 판독보다 우선합니다. 선택된 응답에 속한 분석 사건만 적용됩니다.</p></section>`;
}
function personCard(id,p,m){
 const own=m.overrides?.[id]||{};
 const options=(val,items)=>items.map(([k,v])=>`<option value="${k}" ${val===k?'selected':''}>${v}</option>`).join('');
 return `<section class="abop-frame abop-person"><header><span class="abop-icon">${id==='char'?'◇':'◆'}</span> ${id.toUpperCase()} <small>${id==='char'?'캐릭터':'페르소나'}</small></header>
 <div class="abop-title">${html(p.name)}</div>
 <div class="abop-fields"><label>성별<select data-person="${id}" data-field="sex">${options(p.sex,[['unknown','미설정'],['male','남성'],['female','여성'],['nonbinary','기타']])}</select></label>
 <label>ABO<select data-person="${id}" data-field="secondary">${options(p.secondary,[['alpha','ALPHA'],['beta','BETA'],['omega','OMEGA']])}</select></label>
 <label>신체 유형<select data-person="${id}" data-field="anatomy">${options(p.anatomy||anatomyDefault(p.sex,p.secondary),anatomyChoices(p.sex,p.secondary))}</select></label>
 <label>러트/히트<select data-person="${id}" data-field="cycleEnabled">${options(String(p.cycle.enabled),[['true','ON'],['false','OFF']])}</select></label></div>
 <div class="abop-meterlabel">컨디션 <b>${fmt(p.body.condition)}</b></div><div class="abop-meter"><i style="width:${clamp(p.body.condition,0,100)}%"></i></div>
 <div class="abop-meterlabel">페로몬 발산 <b>${fmt(p.pheromone.emission)}</b></div><div class="abop-meter mint"><i style="width:${clamp(p.pheromone.emission,0,100)}%"></i></div>
 <div class="abop-tagrow"><span>${html(p.cycle.phase)}</span><span>${html(p.secondary)}</span><span>${p.bondWith?'BOND ♥':'NO BOND'}</span></div>
 <div class="abop-muted">지속 상태: ${p.medication.filter(x=>x.until>=state.clockHours).map(x=>html(x.drug)).join(', ')||'없음'}</div>
 ${p.anatomy==='custom'?`<label class="abop-fieldlabel">특수 생식 구조<textarea data-person="${id}" data-field="anatomyDetail" rows="2" placeholder="구조 설명">${html(p.anatomyDetail||'')}</textarea></label>`:''}
 ${p.sex==='female'&&p.secondary==='alpha'?`<details class="abop-advanced"><summary>여성 Alpha · 가상 수태기관</summary><label class="abop-fieldlabel">생식기관·전달 경로 설명<textarea data-person="${id}" data-field="inseminationOrgan" rows="2" placeholder="외형과 별도로 수태 능력 유지">${html(p.inseminationOrgan||'')}</textarea></label></details>`:''}
 </section>`;
}
function render(){
 const root=el('abop-panel');if(!root)return;
 const previousScroll=root.querySelector('.abop-main')?.scrollTop||0;
 root.classList.toggle('abop-visible',panelOpen);
 const m=meta(false);
 const theme=m?.config?.uiTheme||'auto';
 root.dataset.theme=theme==='light'||theme==='dark'?theme:(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches?'dark':'light');
 root.innerHTML=`<div class="abop-window"><div class="abop-top"><span class="abop-stars">✦ ▣</span><strong>ABO / RELATIONSHIP TRACKER</strong><span class="abop-version">v0.3.1</span><button title="테마 전환" aria-label="테마 전환" data-action="themeCycle" class="abop-theme-button">◐</button><button title="닫기" aria-label="닫기" data-action="close">✕</button></div>
 <div class="abop-shell"><nav class="abop-nav">${[['status','STATUS','▦'],['setup','SETUP','◈'],['cycles','CYCLES','◷'],['fertility','FERTILITY','✦'],['preferences','PREFS','♥'],['settings','SETTINGS','⚙']].map(([id,label,icon])=>`<button data-tab="${id}" class="${tab===id?'selected':''}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>
 <main class="abop-main"><div class="abop-subhead"><span>◈ ${tab.toUpperCase()} / ${html(S()?.chatId?'CURRENT CHAT':'NO CHAT')}</span><span class="abop-dot">● ${working?'ANALYZING':'READY'}</span></div>${selectedSection()}<footer id="abop-statusline">${html(status)}</footer></main></div></div>`;
 const scrollArea=root.querySelector('.abop-main');if(scrollArea)scrollArea.scrollTop=previousScroll;
}
function buildUI(){
 if(!el('abop-open')){
  const b=document.createElement('button');b.id='abop-open';b.type='button';b.textContent='▦ ABO';b.title='ABO Pixel Tracker 열기';b.addEventListener('click',()=>{panelOpen=!panelOpen;refresh();});document.body.appendChild(b);
 }
 if(!el('abop-panel')){
  const panel=document.createElement('div');panel.id='abop-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','ABO Pixel Tracker');panel.addEventListener('click',handlePanelClick);panel.addEventListener('change',handlePanelChange);document.body.appendChild(panel);
 }
}
async function handlePanelChange(e){
 const t=e.target,m=meta();if(!m)return;
 if(t.hasAttribute('data-theme-choice')){m.config.uiTheme=t.value;
 }else if(t.dataset.proposalCheck){const field=m.initialProposal?.roles?.[t.dataset.proposalCheck]?.fields?.[Number(t.dataset.i)];if(field)field.checked=t.checked;
 }else if(t.dataset.proposalValue){const f=m.initialProposal?.roles?.[t.dataset.proposalValue]?.fields?.[Number(t.dataset.i)];if(f){f.value=typeof f.value==='boolean'?t.value==='true':t.value;}
 }else if(t.dataset.prefCheck){const pref=m.initialProposal?.roles?.[t.dataset.prefCheck]?.[t.dataset.kind]?.[Number(t.dataset.i)];if(pref)pref.checked=t.checked;
 }else if(t.dataset.prefId){const pref=m.initialProposal?.roles?.[t.dataset.prefId]?.[t.dataset.kind]?.[Number(t.dataset.i)];if(pref)pref.id=t.value.trim().slice(0,80);
 }else if(t.dataset.prefLevel){const pref=m.initialProposal?.roles?.[t.dataset.prefLevel]?.confirmed?.[Number(t.dataset.i)];if(pref&&LEVELS.some(x=>x[0]===t.value))pref.level=t.value;
 }else if(t.dataset.prefAttitude){const d=m.initialProposal?.roles?.[t.dataset.prefAttitude];if(d)d.attitude=t.value;
 }else if(t.dataset.prefAttitudeCheck){const d=m.initialProposal?.roles?.[t.dataset.prefAttitudeCheck];if(d)d.useAttitude=t.checked;
 }else if(t.dataset.person){
  const id=t.dataset.person,field=t.dataset.field;
  const value=field==='cycleEnabled'?t.value==='true':t.value;
  m.overrides[id]??={};m.overrides[id][field]=value;
 }else if(t.dataset.config){m.config[t.dataset.config]=!!t.checked;
 }else if(t.hasAttribute('data-connection')){
  m.config.analysisConnection=t.value;
 }else if(t.dataset.custom){
  m.config[t.dataset.custom]=t.value.trim();
 }else if(t.hasAttribute('data-secret')){
  // Never write keys to metadata, world info, backups, or console logs.
  sessionApiKey=t.value.trim();t.value='';setStatus(sessionApiKey?'임시 API 키가 메모리에 등록됨':'임시 API 키가 비어 있음');
 }else if(t.dataset.rate){m.config.rate[t.dataset.rate]=clamp(Number(t.value)/100,0,1);
 }else return;
 await persist();refresh();
}
async function addManualEvents(events){
 const m=meta(),src=sourceForCurrent();syncCanon();if(!m||!src)return setStatus('먼저 대화를 시작하세요');
 const key=src.key;let rec=m.ledger[key]||{analyzed:false,events:[],manual:[]};
 if(rec.personaId&&rec.personaId!==m.userPersonaIdentity)return setStatus('이 응답은 이전 USER 페르소나의 기록입니다. 새 응답 뒤에 사건을 기록하세요.');
 const rows=events.map((e,i)=>({...e,id:`${key}/manual:${Date.now()}:${i}`}));
 rec.manual.push(...rows);rec.events.push(...rows);rec.personaId=m.userPersonaIdentity;m.ledger[key]=rec;await persist();refresh();
}
async function handlePanelClick(e){
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;render();const a=el('abop-panel')?.querySelector('.abop-main');if(a)a.scrollTop=0;return;}
 const act=t.dataset.action;if(!act)return;
 if(act==='close'){panelOpen=false;render();return;}
 if(act==='themeCycle'){const m=meta();m.config.uiTheme=m.config.uiTheme==='dark'?'light':'dark';await persist();refresh();return;}
 if(act==='openSetup'){tab='setup';render();return;}
 if(act==='applyProposal'){await applyProfileProposal();return;}
 if(act==='discardProposal'){const m=meta();m.initialProposal=null;await persist();refresh();setStatus('미적용 제안 폐기됨');return;}
 if(act==='refreshProfiles'){refresh();setStatus('연결 프로필 목록 새로고침 완료');return;}
 if(act==='clearKey'){sessionApiKey='';setStatus('임시 API 키 삭제됨');refresh();return;}
 if(act==='testConnection'){
  if(working)return;working=true;setStatus('분석 모델 연결 테스트 중…');render();
  try{const reply=await analysisRequest('Answer using only the word OK.','Connection test.');setStatus(`연결 성공 (${String(reply).trim().slice(0,48)})`);}
  catch(err){console.warn('[ABO Pixel] connection test failed',err);setStatus(`연결 실패: ${err.cause?.message||err.message}`);}
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
 if(act==='exposure'){
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
function onEvent(){refresh();
 // CHAT_CHANGED may precede SillyTavern's persona auto-selection. Recheck after
 // its own synchronous/async persona-lock handlers have finished.
 setTimeout(()=>refresh(),0);
 setTimeout(()=>refresh(),300);
}
function onMessage(){
 refresh();const m=meta(false);if(!m?.config?.autoAnalyze||!m.config.enabled)return;
 // Allow the host to finish appending and selecting the final swipe before analysis.
 setTimeout(()=>{analyzeLatest().catch(err=>console.error(err));},350);
}
function subscribe(){
 const c=S(),source=c.eventSource,t=c.event_types||{};if(!source?.on)return;
 for(const name of ['CHAT_CHANGED','CHAT_CREATED','MESSAGE_SWIPED','MESSAGE_EDITED','MESSAGE_DELETED','PERSONA_CHANGED','PERSONA_UPDATED','PERSONA_RENAMED','CHARACTER_EDITED'])if(t[name])source.on(t[name],onEvent);
 if(t.MESSAGE_RECEIVED)source.on(t.MESSAGE_RECEIVED,onMessage);
 if(t.GENERATION_STARTED)source.on(t.GENERATION_STARTED,updatePrompt);
}
function boot(){if(active)return;active=true;buildUI();subscribe();refresh();log('Loaded (no third-party dependencies)');}
// Module evaluation occurs after SillyTavern resolves its extension entrypoint.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
