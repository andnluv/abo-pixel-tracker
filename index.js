import {DEFAULT_CONFIG, VERSION,hash,uniqKey,sortedRecords,replay,inferExplicit,formatPrompt,allowedInstincts,instinctChance,pressureScore,clamp} from './core.mjs';
import {ANALYZER_SYSTEM,parseModelOutput,buildAnalyzerUserPrompt} from './analyzer.mjs';
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
  c.chatMetadata[STORAGE]={schema:VERSION,seed,config:structuredClone(DEFAULT_CONFIG),canon:readCanon(),ledger:{},overrides:{char:{},user:{}},profileInitialized:false};
  c.saveMetadata?.();
 }
 return c.chatMetadata[STORAGE]||null;
}
async function persist(){try{await S().saveMetadata?.();}catch(e){console.warn('[ABO Pixel] Metadata saving failed',e);setStatus('저장 실패: 개발자 콘솔 확인');}}
function readCanon(){
 const c=S(), character=c.characters?.[c.characterId]||c.characters?.[c.this_chid]||{};
 const cd=character.data||{};
 const card=[cd.description||character.description,cd.personality||character.personality,cd.scenario||character.scenario].filter(Boolean).join('\n');
 const persona=String(c.powerUserSettings?.persona_description||c.persona_description||c.personaDescription||'');
 const a=inferExplicit(card),b=inferExplicit(persona);
 return {char:{...a,name:character.name||cd.name||c.name2||'CHAR',card:card.slice(0,7000)},user:{...b,name:c.name1||'USER',card:persona.slice(0,7000)}};
}
function setStatus(s){status=s;const node=el('abop-statusline');if(node)node.textContent=s;}
function branchState(){
 const m=meta(false);if(!m)return null;
 const chat=S().chat||[];
 const rows=sortedRecords(chat,m.ledger||{});
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
function refresh(){meta();state=branchState();updatePrompt();render();}
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
 const m=meta();const src=sourceForCurrent();if(!m||!src)return setStatus('분석할 CHAR 메시지가 없습니다');
 if(!m.config.enabled)return setStatus('확장이 비활성화됨');
 if(!force&&!m.config.autoAnalyze)return;
 if(m.ledger[src.key]?.analyzed&&!force)return;
 const originChat=S().chatId, originKey=src.key;
 const c=S();
 working=true;setStatus('별도 모델로 사건 분석 중…');render();
 try{
  const last=branchState();
  const prompt=buildAnalyzerUserPrompt({charName:m.canon.char.name,userName:m.canon.user.name,charCard:m.canon.char.card,userPersona:m.canon.user.card,userText:src.userText,assistantText:src.assistantText,existingState:last?{clockHours:last.clockHours,people:Object.fromEntries(Object.entries(last.people).map(([k,p])=>[k,{sex:p.sex,secondary:p.secondary,phase:p.cycle.phase,pregnancy:p.pregnancy.status}]))}:null});
  const reply=await analysisRequest(ANALYZER_SYSTEM,prompt);
  if(S().chatId!==originChat||!sourceForCurrent()||sourceForCurrent().key!==originKey){setStatus('채팅/응답 변경으로 분석 결과 폐기');return;}
  const events=parseModelOutput(reply,src.userText,src.assistantText).map((e,i)=>({...e,id:eventIDFor(originKey,i),sceneId:e.sceneId||originKey}));
  const existing=m.ledger[originKey]||{};
  m.ledger[originKey]={analyzed:true,events:[...events,...(existing.manual||[])],manual:existing.manual||[],at:Date.now()};
  await persist();setStatus(`분석 완료 · 확인된 사건 ${events.length}건`);refresh();
 }catch(e){console.error('[ABO Pixel] generation error',e);setStatus(`분석 실패: ${e.message||'모델/API 연결 확인'}`);}finally{working=false;render();}
}
async function initialProfileAnalyze(){
 const m=meta();if(!m||working)return;
 // Analyze through current connection, a selected saved profile, or a session-only direct API.
 working=true;setStatus('CHAR·USER 프로필 분석 중…');render();
 const chatId=S().chatId;
 try{
  const input={char:m.canon.char,user:m.canon.user};
  const result=await analysisRequest(`You extract a concise character profile for an adult fictional ABO tracker. Output JSON only: {"char":{"sex":"male|female|nonbinary|unknown","secondary":"alpha|beta|omega|unknown","preferences":{"confirmed":["tag"],"latent":["tag"],"attitude":"open|reserved|curious"}},"user":{same structure}}. Explicit gender and ABO only when literally stated in source; do not infer these from stereotypes. Extract preferences explicitly in source; latent interests can be reasonably supported by characterization but must not be mistaken for confirmed. Up to 5 latent interests, aim at 2 when evidence supports, otherwise at most 1 plus attitude. For USER, do not attribute actions or tastes invented by narration. No unsupported sexual preferences.`,JSON.stringify(input));
  if(S().chatId!==chatId)return;
  let v;try{v=JSON.parse(String(result).replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/i,''));}catch{throw new Error('프로필 분석 JSON 오류');}
  for(const role of ['char','user']){
   const p=v?.[role];if(!p)continue;
   for(const k of ['sex','secondary']){
    const accepted=k==='sex'?['male','female','nonbinary']:['alpha','beta','omega'];
    if(accepted.includes(p[k])&&!m.overrides[role]?.[k]&&m.canon[role][k]==='unknown')m.canon[role][k]=p[k];
   }
   const confirmed=(p.preferences?.confirmed||[]).filter(x=>typeof x==='string').slice(0,12).map(id=>({id:id.slice(0,80),level:'liked',source:'card',locked:true,evidence:['character_card']}));
   const latent=(p.preferences?.latent||[]).filter(x=>typeof x==='string').slice(0,5).map(id=>({id:id.slice(0,80),level:'latent',source:'initial_analysis',evidence:[]}));
   m.canon[role].preferences={confirmed,latent,attitude:['open','reserved','curious'].includes(p.preferences?.attitude)?p.preferences.attitude:'curious'};
  }
  m.profileInitialized=true;await persist();setStatus('초기 프로필 분석 완료');refresh();
 }catch(e){console.error(e);setStatus(`프로필 분석 실패: ${e.message}`);}finally{working=false;render();}
}
function selectedSection(){
 const m=meta(false);if(!state||!m)return `<p class="abop-muted">채팅을 연 뒤 사용할 수 있습니다.</p>`;
 const people=Object.entries(state.people);
 if(tab==='status')return `<div class="abop-people">${people.map(([id,p])=>personCard(id,p,m)).join('')}</div>
  <section class="abop-frame"><header>◈ STORY CLOCK · EVENTS</header><p class="abop-meta">D${Math.floor(state.clockHours/24)} · ${fmt(state.clockHours%24)}h / 기록 ${state.events.length}건</p>
  <div class="abop-actions"><input id="abop-hours" type="number" min="0" step="1" placeholder="진행 시간(h)" aria-label="진행 시간"/><button data-action="advance">시간 적용</button><button data-action="rebuild">다시 계산</button></div>
  ${state.alerts.slice(-3).map(x=>`<p class="abop-note">${html(x)}</p>`).join('')}
  <details><summary>최근 사건</summary>${state.events.slice(-14).reverse().map(e=>`<div class="abop-line">D${Math.floor(e.at/24)} · ${html(e.kind)} ${html(e.person||'')}</div>`).join('')||'기록 없음'}</details></section>`;
 if(tab==='cycles')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · CYCLE</header><p class="abop-title">${html(p.name)}</p><p>단계: <b>${html(p.cycle.phase)}</b></p><p>간격: ${fmt(p.cycle.intervalHours/24)}일</p><p>전조: ${fmt(p.cycle.prodromeHours)}시간 · 활성: ${fmt(p.cycle.activeHours/24)}일</p><p>회복: ${fmt(p.cycle.recoveryHours)}시간</p><p>월경: ${p.menstruation.enabled?'활성':'없음/미설정'} · 임신 능력: ${p.fertile.gestate?'있음':'없음'}</p><p class="abop-muted">본능 행동화: ${(instinctChance(p,p.cycle.phase)*100).toFixed(0)}% · 후보: ${html(allowedInstincts(p).join(', '))}</p></section>`).join('')}</div>`;
 if(tab==='fertility')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · BIOLOGICAL TRUTH</header><div class="abop-title">${html(p.name)}</div><p>임신 상태: <b>${m.config.hideTruth?'●●●● (스포일러 숨김)':html(p.pregnancy.status)}</b></p><p>인지 상태: ${html(p.awareness.pregnancy)}</p><p>출산 예정: ${p.pregnancy.dueAt===null?'—':`D${fmt(p.pregnancy.dueAt/24)}`}</p><p>결합: ${html(p.bondWith||'없음')}</p></section>`).join('')}</div><section class="abop-frame"><header>◈ FERTILITY WINDOWS</header>${Object.values(state.windows).map(w=>`<div class="abop-line">${html(w.gestator)} · 노출 ${w.exposures.length}건 · 누적 ${(w.total*100).toFixed(1)}% · ${m.config.hideTruth?'결과 숨김':`고정 난수 ${w.roll.toFixed(4)}`}</div>`).join('')||'<p>판정 기록 없음</p>'}<button data-action="exposure">수태 사건 수동 기록</button></section>`;
 if(tab==='preferences')return `<div class="abop-people">${people.map(([id,p])=>`<section class="abop-frame"><header>${id.toUpperCase()} · PREFERENCES</header><div class="abop-title">${html(p.name)}</div><p class="abop-muted">태도: ${html(p.preferences.attitude)}</p>${[...p.preferences.confirmed,...p.preferences.latent].map(x=>`<div class="abop-line">${html(x.id)} <small>[${html(x.level)}]</small></div>`).join('')||'<p>확정된 취향 없음</p>'}<hr/><p class="abop-muted">장면: ${html(p.scene.posture||'—')} · ${html(p.scene.contact||'—')}</p><p class="abop-muted">최근 장면: ${p.recentScenes.length}/3</p></section>`).join('')}</div>`;
 return `<section class="abop-frame"><header>◈ CONFIGURATION</header>
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
  <hr/><label class="abop-check"><input type="checkbox" data-config="enabled" ${m.config.enabled?'checked':''}/> 확장 활성화</label><label class="abop-check"><input type="checkbox" data-config="autoAnalyze" ${m.config.autoAnalyze?'checked':''}/> 응답마다 별도 분석 호출 (추가 API 비용 발생 가능)</label><label class="abop-check"><input type="checkbox" data-config="injectState" ${m.config.injectState?'checked':''}/> 다음 RP에 내부 상태 주입</label><label class="abop-check"><input type="checkbox" data-config="hideTruth" ${m.config.hideTruth?'checked':''}/> 화면에서 임신 결과 숨기기 (모델 주입에는 유지)</label><hr/><div class="abop-title">기본 수태 확률 (%)</div>${Object.entries(m.config.rate).map(([k,v])=>`<label class="abop-number">${html(k)} <input type="number" min="0" max="100" step="1" data-rate="${k}" value="${fmt(v*100)}" /></label>`).join('')}<hr/><button data-action="init">캐릭터 카드·페르소나 초기 분석</button><button data-action="reanalyze">최근 응답 재분석</button><button data-action="export">채팅 데이터 내보내기</button><p class="abop-muted">수동 변경은 자동 판독보다 우선합니다. 선택된 응답에 속한 분석 사건만 적용됩니다.</p></section>`;
}
function personCard(id,p,m){
 const own=m.overrides?.[id]||{};
 const options=(val,items)=>items.map(([k,v])=>`<option value="${k}" ${val===k?'selected':''}>${v}</option>`).join('');
 return `<section class="abop-frame abop-person"><header><span class="abop-icon">${id==='char'?'◇':'◆'}</span> ${id.toUpperCase()} <small>${id==='char'?'캐릭터':'페르소나'}</small></header>
 <div class="abop-title">${html(p.name)}</div>
 <div class="abop-fields"><label>성별<select data-person="${id}" data-field="sex">${options(p.sex,[['unknown','미설정'],['male','남성'],['female','여성'],['nonbinary','기타']])}</select></label>
 <label>ABO<select data-person="${id}" data-field="secondary">${options(p.secondary,[['alpha','ALPHA'],['beta','BETA'],['omega','OMEGA']])}</select></label>
 <label>신체 유형<select data-person="${id}" data-field="anatomy">${options(p.anatomy||'combined',[['combined','복합형'],['vaginal_only','컨트보이형'],['male_only','남성 생식기형']])}</select></label>
 <label>러트/히트<select data-person="${id}" data-field="cycleEnabled">${options(String(p.cycle.enabled),[['true','ON'],['false','OFF']])}</select></label></div>
 <div class="abop-meterlabel">컨디션 <b>${fmt(p.body.condition)}</b></div><div class="abop-meter"><i style="width:${clamp(p.body.condition,0,100)}%"></i></div>
 <div class="abop-meterlabel">페로몬 발산 <b>${fmt(p.pheromone.emission)}</b></div><div class="abop-meter mint"><i style="width:${clamp(p.pheromone.emission,0,100)}%"></i></div>
 <div class="abop-tagrow"><span>${html(p.cycle.phase)}</span><span>${html(p.secondary)}</span><span>${p.bondWith?'BOND ♥':'NO BOND'}</span></div>
 <div class="abop-muted">지속 상태: ${p.medication.filter(x=>x.until>=state.clockHours).map(x=>html(x.drug)).join(', ')||'없음'}</div>
 </section>`;
}
function render(){
 const root=el('abop-panel');if(!root)return;
 root.classList.toggle('abop-visible',panelOpen);
 const m=meta(false);
 root.innerHTML=`<div class="abop-window"><div class="abop-top"><span class="abop-stars">✦ ▣</span><strong>ABO / RELATIONSHIP TRACKER</strong><span class="abop-version">v0.2.0</span><button title="닫기" aria-label="닫기" data-action="close">✕</button></div>
 <div class="abop-shell"><nav class="abop-nav">${[['status','STATUS','▦'],['cycles','CYCLES','◷'],['fertility','FERTILITY','✦'],['preferences','PREFS','♥'],['settings','SETTINGS','⚙']].map(([id,label,icon])=>`<button data-tab="${id}" class="${tab===id?'selected':''}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>
 <main class="abop-main"><div class="abop-subhead"><span>◈ ${tab.toUpperCase()} / ${html(S()?.chatId?'CURRENT CHAT':'NO CHAT')}</span><span class="abop-dot">● ${working?'ANALYZING':'READY'}</span></div>${selectedSection()}<footer id="abop-statusline">${html(status)}</footer></main></div></div>`;
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
 if(t.dataset.person){
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
 const m=meta(),src=sourceForCurrent();if(!m||!src)return setStatus('먼저 대화를 시작하세요');
 const key=src.key;let rec=m.ledger[key]||{analyzed:false,events:[],manual:[]};
 const rows=events.map((e,i)=>({...e,id:`${key}/manual:${Date.now()}:${i}`}));
 rec.manual.push(...rows);rec.events.push(...rows);m.ledger[key]=rec;await persist();refresh();
}
async function handlePanelClick(e){
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;render();return;}
 const act=t.dataset.action;if(!act)return;
 if(act==='close'){panelOpen=false;render();return;}
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
function onEvent(){refresh();}
function onMessage(){
 refresh();const m=meta(false);if(!m?.config?.autoAnalyze||!m.config.enabled)return;
 // Allow the host to finish appending and selecting the final swipe before analysis.
 setTimeout(()=>{analyzeLatest().catch(err=>console.error(err));},350);
}
function subscribe(){
 const c=S(),source=c.eventSource,t=c.event_types||{};if(!source?.on)return;
 for(const name of ['CHAT_CHANGED','MESSAGE_SWIPED','MESSAGE_EDITED','MESSAGE_DELETED','PERSONA_CHANGED','CHARACTER_EDITED'])if(t[name])source.on(t[name],onEvent);
 if(t.MESSAGE_RECEIVED)source.on(t.MESSAGE_RECEIVED,onMessage);
 if(t.GENERATION_STARTED)source.on(t.GENERATION_STARTED,updatePrompt);
}
function boot(){if(active)return;active=true;buildUI();subscribe();refresh();log('Loaded (no third-party dependencies)');}
// Module evaluation occurs after SillyTavern resolves its extension entrypoint.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
