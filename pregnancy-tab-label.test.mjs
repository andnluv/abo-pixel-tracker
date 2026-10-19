import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('pregnancy tab presentation uses 임신; stable fertility keys remain unchanged',()=>{
 const html=readFileSync(new URL('../index.js',import.meta.url),'utf8');
 assert.ok(html.includes("['fertility','임신','✦']"));
 assert.ok(html.includes("'fertility':'임신'"));
 assert.ok(html.includes('가임·임신 가능성 기록'));
 assert.ok(html.includes('임신 가능 사건 수동 기록'));
 assert.ok(html.includes('기본 임신 확률 (%)'));
 assert.ok(!html.includes("['fertility','수태','✦']"));
 const labels=readFileSync(new URL('../preference-labels.mjs',import.meta.url),'utf8');
 assert.ok(labels.includes('임신 여부 판정 중'));
});
