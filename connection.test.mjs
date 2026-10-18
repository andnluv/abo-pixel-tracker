import test from 'node:test';
import assert from 'node:assert/strict';
import {requestUsingProfile, readableProfileError, profileErrorHint} from '../connection.mjs';
const messages=[{role:'system',content:'SYSTEM'},{role:'user',content:'PROMPT'}];
function mock(type='openai'){
 const calls=[];
 const profile={id:'active-saved',api:type,model:'same-as-current'};
 const service={
   getProfile:id=>id===profile.id?profile:null,
   validateProfile:p=>({selected:p.api}),
   sendRequest:async (...args)=>{calls.push(args);return {content:'OK',reasoning:''};}
 };
 return {calls,service};
}
test('saved active Chat Completion profile uses official profile service, even when same as current',async()=>{
 const {calls,service}=mock();
 assert.equal(await requestUsingProfile(service,'active-saved','SYSTEM','PROMPT',64),'OK');
 assert.equal(calls.length,1);assert.equal(calls[0][0],'active-saved');
 assert.deepEqual(calls[0][1],messages);assert.equal(calls[0][2],64);
 assert.deepEqual(calls[0][3],{stream:false,extractData:true,includePreset:false,includeInstruct:true});
 assert.equal(calls[0].length,4); // No model-specific temperature payload
});
test('saved Text Completion profile passes messages to official dispatcher; it applies instruct formatting',async()=>{
 const {calls,service}=mock('textgenerationwebui');
 assert.equal(await requestUsingProfile(service,'active-saved','SYSTEM','PROMPT',300),'OK');
 assert.deepEqual(calls[0][1],messages);
 assert.equal(calls[0][3].includeInstruct,true);
});
test('validates profile using service rather than context CONNECT_API_MAP',async()=>{
 const {service}=mock();
 service.validateProfile=()=>{throw Error('Unsupported profile');};
 await assert.rejects(requestUsingProfile(service,'active-saved','S','P'),/Unsupported profile/);
});
test('never silently falls back to current connection on saved profile API failure',async()=>{
 const {service}=mock();
 service.sendRequest=async()=>{throw new Error('API request failed',{cause:new Error('401 Unauthorized')});};
 await assert.rejects(requestUsingProfile(service,'active-saved','S','P'),/401 Unauthorized/);
 assert.match(profileErrorHint(new Error('401 Unauthorized')),/인증/);
});
test('does not discard relevant error cause behind generic API request failed',()=>{
 assert.equal(readableProfileError(new Error('API request failed',{cause:new Error('Response not OK (401)')})),'Response not OK (401)');
});
test('reports empty response as an error',async()=>{
 const {service}=mock();service.sendRequest=async()=>({content:'  '});
 await assert.rejects(requestUsingProfile(service,'active-saved','S','P'),/빈 텍스트 응답/);
});
