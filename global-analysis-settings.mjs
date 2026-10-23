/** Shared analysis connection settings; all world and character state remains chat-local. */
export const SHARED_ANALYSIS_SETTINGS_KEY='abo_pixel_tracker_analysis';
export const SHARED_ANALYSIS_FIELDS=Object.freeze(['analysisConnection','customApiUrl','customModel','setupMaxTokens','postprocessMode','postprocessConnection','postprocessScopes']);
export function ensureSharedAnalysisSettings(extensionStore,legacyConfig={},defaults={}){
 if(!extensionStore||typeof extensionStore!=='object')throw new Error('확장 설정 저장소가 없습니다');
 let shared=extensionStore[SHARED_ANALYSIS_SETTINGS_KEY];
 let created=false;
 if(!shared||typeof shared!=='object'||Array.isArray(shared)){
  shared={};
  for(const key of SHARED_ANALYSIS_FIELDS)shared[key]=legacyConfig?.[key]??defaults?.[key];
  extensionStore[SHARED_ANALYSIS_SETTINGS_KEY]=shared;
  created=true;
 }
 for(const key of SHARED_ANALYSIS_FIELDS)if(shared[key]===undefined)shared[key]=defaults?.[key];
 return {shared,created};
}
export function sharedAnalysisConfig(extensionStore,legacyConfig={},defaults={}){
 return ensureSharedAnalysisSettings(extensionStore,legacyConfig,defaults).shared;
}
export function setSharedAnalysisSetting(extensionStore,key,value,legacyConfig={},defaults={}){
 if(!SHARED_ANALYSIS_FIELDS.includes(key))throw new Error(`공통 설정 항목 아님: ${key}`);
 const {shared}=ensureSharedAnalysisSettings(extensionStore,legacyConfig,defaults);
 shared[key]=value;
 return shared;
}
