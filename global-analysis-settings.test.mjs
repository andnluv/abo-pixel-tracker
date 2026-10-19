import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_CONFIG} from '../core.mjs';
import {SHARED_ANALYSIS_SETTINGS_KEY,ensureSharedAnalysisSettings,setSharedAnalysisSetting} from '../global-analysis-settings.mjs';

test('first chat migrates its existing connection profile, model and token value exactly once',()=>{
 const extensionStore={};
 const first={analysisConnection:'profile:official-123',customApiUrl:'https://gateway.example/v1',customModel:'my-model',setupMaxTokens:20000};
 const a=ensureSharedAnalysisSettings(extensionStore,first,DEFAULT_CONFIG);
 assert.equal(a.created,true);assert.equal(a.shared.analysisConnection,first.analysisConnection);
 assert.equal(a.shared.setupMaxTokens,20000);assert.equal(a.shared.customApiUrl,first.customApiUrl);
 const second={analysisConnection:'profile:other',customApiUrl:'https://different.example/v1',customModel:'wrong',setupMaxTokens:512};
 const b=ensureSharedAnalysisSettings(extensionStore,second,DEFAULT_CONFIG);
 assert.equal(b.created,false);assert.equal(b.shared.setupMaxTokens,20000);
 assert.equal(b.shared.analysisConnection,'profile:official-123');assert.equal(b.shared.customModel,'my-model');
});
test('shared profile and tokens change globally and survive switching chats with different legacy values',()=>{
 const extensionStore={};
 ensureSharedAnalysisSettings(extensionStore,{setupMaxTokens:3000,analysisConnection:'profile:one'},DEFAULT_CONFIG);
 setSharedAnalysisSetting(extensionStore,'analysisConnection','profile:new-id');
 setSharedAnalysisSetting(extensionStore,'setupMaxTokens',65536);
 const anotherChat=ensureSharedAnalysisSettings(extensionStore,{analysisConnection:'profile:older',setupMaxTokens:512},DEFAULT_CONFIG);
 assert.equal(anotherChat.shared.analysisConnection,'profile:new-id');assert.equal(anotherChat.shared.setupMaxTokens,65536);
 assert.equal(extensionStore[SHARED_ANALYSIS_SETTINGS_KEY].setupMaxTokens,65536);
});
test('shared keys are deliberately limited; no API secret is persisted',()=>{
 const extensionStore={};
 assert.throws(()=>setSharedAnalysisSetting(extensionStore,'apiKey','secret-token'),/공통 설정 항목 아님/);
 assert.equal(JSON.stringify(extensionStore).includes('secret-token'),false);
});
test('analysis runtime and settings form use global values; per-chat simulation controls remain local',()=>{
 const ui=readFileSync(new URL('../index.js',import.meta.url),'utf8');
 assert.match(ui,/const config=analysisConfig\(\)/);
 assert.match(ui,/normalizeSetupOutputTokens\(sharedAnalysisSettings\(\)\.setupMaxTokens\)/);
 assert.match(ui,/connectionOptions\(shared\)/);
 assert.match(ui,/saveSharedAnalysisSetting\('analysisConnection',t.value\)/);
 assert.match(ui,/saveSharedAnalysisSetting\(t.dataset.custom,/);
 assert.match(ui,/m.config\[t.dataset.config\]=!!t.checked/);
 assert.doesNotMatch(ui,/m.config.analysisConnection=t.value/);
});
