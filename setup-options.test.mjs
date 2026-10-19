import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSetupOutputTokens} from '../setup-options.mjs';
import {normalizeSetupProposal,SetupJsonFormatError} from '../profile.mjs';
const index=readFileSync(new URL('../index.js',import.meta.url),'utf8');

test('token setting accepts lower and higher valid numbers and caps only extreme values',()=>{
 assert.equal(normalizeSetupOutputTokens(3000),3000);
 assert.equal(normalizeSetupOutputTokens('20000'),20000);
 assert.equal(normalizeSetupOutputTokens(65536),65536);
 assert.equal(normalizeSetupOutputTokens(100000),65536);
 assert.equal(normalizeSetupOutputTokens(250),512);
 assert.equal(normalizeSetupOutputTokens(''),5000);
});
test('current SillyTavern connection receives requested responseLength for raw analysis',()=>{
 assert.match(index,/generateRaw\(\{systemPrompt,prompt,responseLength:maxTokens\}\)/);
 assert.match(index,/const setupMax=normalizeSetupOutputTokens\(sharedAnalysisSettings\(\)\.setupMaxTokens\)/);
 assert.doesNotMatch(index,/Math\.min\(12000/);
});
test('only JSON-format errors trigger fallback retry, not API errors',()=>{
 assert.match(index,/firstError instanceof SetupJsonFormatError/);
 assert.doesNotMatch(index,/\/JSON\|응답\|출력\|텍스트\/i/);
 assert.match(index,/JSON이 2회 연속 불완전/);
 assert.throws(()=>normalizeSetupProposal('{"char":', 'chat'),SetupJsonFormatError);
 assert.throws(()=>normalizeSetupProposal('','chat'),SetupJsonFormatError);
});
