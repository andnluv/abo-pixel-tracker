/* Independent analysis request adapter for SillyTavern's official ConnectionManagerRequestService.
 * Sends profile-bound requests without changing the RP connection and without persisting credentials.
 * Both Chat Completion and Text Completion are dispatched by the official service.
 */
export function readableProfileError(error){
 const visited=new Set(),messages=[];
 let e=error;
 while(e&&typeof e==='object'&&!visited.has(e)){
  visited.add(e);
  if(typeof e.message==='string'&&e.message.trim()&&!messages.includes(e.message.trim()))messages.push(e.message.trim());
  e=e.cause;
 }
 if(!messages.length)return String(error||'원인 미확인');
 const meaningful=messages.filter(x=>!['API request failed','저장된 프로필 호출 실패'].includes(x));
 return (meaningful.length?meaningful:messages).join(' → ').slice(0,800);
}
export function extractedText(value){
 if(typeof value==='string')return value;
 if(typeof value?.content==='string')return value.content;
 if(Array.isArray(value?.content))return value.content.map(p=>typeof p==='string'?p:p?.text||'').join('');
 if(typeof value?.choices?.[0]?.message?.content==='string')return value.choices[0].message.content;
 if(typeof value?.response==='string')return value.response;
 return '';
}
export function profileErrorHint(error){
 const e=readableProfileError(error).toLowerCase();
 if(/401|unauthoriz|authenticat|api key|invalid key|secret|403|forbidden/.test(e))return '프로필 인증 정보 확인: SillyTavern 연결 관리자에서 해당 프로필을 활성화한 상태로 업데이트한 뒤 재시도하세요.';
 if(/404|model.*not found|unknown model/.test(e))return '저장 프로필의 모델명과 API 주소를 확인하세요.';
 if(/429|rate.?limit|quota/.test(e))return 'API 사용량 제한 또는 할당량을 확인하세요.';
 if(/profile not found|연결 프로필을 찾지/.test(e))return '저장 프로필을 다시 선택하거나 목록을 새로고침하세요.';
 if(/응답|empty|content|텍스트/.test(e))return '응답 본문이 비어 있습니다. 모델 출력 설정과 프리셋을 확인하세요.';
 return '개발자 도구 콘솔의 [ABO Pixel] 오류 세부정보를 확인하세요.';
}
export async function requestUsingProfile(service,profileId,systemPrompt,prompt,maxTokens=5000){
 if(!service||typeof service.sendRequest!=='function')throw new Error('저장된 프로필 요청 서비스가 없습니다.');
 const profile=service.getProfile?.(profileId);
 if(!profile)throw new Error('저장된 연결 프로필을 찾지 못했습니다.');
 // Do NOT branch on getContext().CONNECT_API_MAP: it is not a stable public source for
 // third-party extensions. The official service validates the saved profile and handles
 // text / chat formats itself, including instruct-prompt conversion for text completions.
 if(typeof service.validateProfile==='function')service.validateProfile(profile);
 else if(typeof service.isProfileSupported==='function'&&!service.isProfileSupported(profile))throw new Error('선택한 연결 프로필의 API 형식이 지원되지 않습니다.');
 const messages=[{role:'system',content:String(systemPrompt)},{role:'user',content:String(prompt)}];
 try{
  const result=await service.sendRequest(profileId,messages,maxTokens,
   {stream:false,extractData:true,includePreset:false,includeInstruct:true});
  const response=extractedText(result);
  if(!response.trim())throw new Error('저장된 프로필에서 빈 텍스트 응답을 반환했습니다.');
  return response;
 }catch(e){
  throw new Error(`저장된 프로필 호출 실패: ${readableProfileError(e)}`,{cause:e});
 }
}
