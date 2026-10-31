import test from 'node:test';
import assert from 'node:assert/strict';
import { actionSound } from '../game/effects.mjs';
const base = { solved: [], inventory: [], used: [], scene: 'S01', ended: false, flags: { exitOpen: false } };
const result = state => ({ ok: true, state: { ...base, ...state } });
test('音效只對實際解題、拾取、使用與場景變化發聲，重複操作不重播', () => {
  for (const type of ['SOLVE','PICKUP','USE','TRAVEL','ANSWER']) assert.equal(actionSound({ type }, result({}), base), null);
  assert.equal(actionSound({type:'SOLVE'},result({solved:['P01']}),base),'success');
  assert.equal(actionSound({type:'PICKUP'},result({inventory:['I01']}),base),'pickup');
  assert.equal(actionSound({type:'USE',id:'I03'},result({used:['I03']}),base),'unlock');
  assert.equal(actionSound({type:'USE',id:'I02'},result({used:['I02']}),base),'place');
  assert.equal(actionSound({type:'TRAVEL'},result({scene:'S02'}),base),'door');
  assert.equal(actionSound({type:'TRAVEL'},result({ended:true}),base),'ending');
  assert.equal(actionSound({type:'ANSWER'},result({flags:{exitOpen:true}}),base),'success');
});
test('失敗回饋不冒充成功，閱讀與非機關動作不產生錯誤音', () => {
  for (const type of ['SOLVE','USE','PICKUP','ANSWER','TRAVEL']) assert.equal(actionSound({type},{ok:false,state:base},base),'error');
  assert.equal(actionSound({type:'READ'},{ok:false,state:base},base),null);
  assert.equal(actionSound({type:'HINT'},result({}),base),'paper');
});
