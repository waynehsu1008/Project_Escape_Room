import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, execute, restore, serialize } from '../game/engine.mjs';
import { WORLD, walkable, findPath } from '../game/world.mjs';
import { scoreRun, exploration, tickClock } from '../game/progress.mjs';
const story=JSON.parse(await readFile(new URL('../content/story.json',import.meta.url),'utf8'));
test('V-N01：所有場景門成對且上下相反，落點可走、面向前進、不立即彈回',()=>{
  for(const [scene,w] of Object.entries(WORLD))for(const door of w.points.filter(p=>p.kind==='door'&&p.to!=='END01')){
    const s=createGame();s.started=true;s.scene=scene;s.solved=['P01','P02','P03'];s.flags.doorOpen=true;s.player={x:door.x,y:door.y,facing:'up'};
    const r=execute(s,{type:'TRAVEL',target:door.id},story);assert.equal(r.ok,true);
    const reverse=WORLD[door.to].points.find(p=>p.to===scene);assert.ok(reverse);
    assert.notEqual(door.side,reverse.side);assert.equal(r.state.player.facing,door.side==='bottom'?'down':'up');
    assert.ok(walkable(door.to,r.state.player.x,r.state.player.y));
    assert.ok(Math.hypot(r.state.player.x-reverse.x,r.state.player.y-reverse.y)>30);
    assert.ok(findPath(door.to,[r.state.player.x,r.state.player.y],WORLD[door.to].spawn).length);
    assert.ok(door.side==='bottom'?r.state.player.y<250:r.state.player.y>450);
  }
});
test('V-S01：計分公式、時間單調、提示分與未通關',()=>{
  const s=createGame();assert.equal(scoreRun(s).total,0);s.ended=true;
  assert.equal(scoreRun(s).total,10000);s.elapsed=600;assert.equal(scoreRun(s).total,8500);
  s.hints={P01:1};assert.equal(scoreRun(s).total,8250);
  s.hints={P01:3,P02:3,P03:3,P04:3};assert.equal(scoreRun(s).hintBonus,0);
  assert.ok(scoreRun({...s,elapsed:601}).total<=scoreRun(s).total);
  assert.ok(scoreRun({...s,elapsed:1e12}).total>=4000);
});
test('V-S02：計時含閱讀，隱藏、未開始與通關後停止',()=>{
  const s=createGame();assert.equal(tickClock(s,5,true).elapsed,0);s.started=true;
  assert.equal(tickClock(s,5,true).elapsed,5);assert.equal(tickClock(s,5,false).elapsed,0);
  assert.equal(tickClock({...s,ended:true},5,true).elapsed,0);
  for(const delta of [-1,Infinity,NaN])assert.equal(tickClock(s,delta,true).elapsed,0);
});
test('V-E01：近距探索去重、失敗不發現、不含門與 NPC，存讀與舊檔遷移',()=>{
  let s=createGame();s.started=true;s.bells=[1];s.player={x:160,y:290,facing:'up'};
  assert.equal(exploration(s).total,23);
  assert.equal(exploration(s).found,0);assert.ok(exploration(s).items.some(p=>!p.found&&p.id==='old-thermos'));
  s=execute(s,{type:'DISCOVER',target:'old-thermos'},story).state;
  assert.equal(exploration(s).found,1);assert.equal(exploration(execute(s,{type:'DISCOVER',target:'old-thermos'},story).state).found,1);
  for(const target of ['class-door','npc-caretaker','blackboard','bad'])assert.equal(execute(s,{type:'DISCOVER',target},story).ok,false);
  assert.equal(exploration(restore(serialize(s))).found,1);
  const old={...s,clues:['roster']};delete old.discovered;assert.ok(exploration(restore(serialize(old))).items.find(p=>p.id==='roster').found);
  assert.equal(restore(serialize({...s,discovered:['bad']})),null);
  assert.equal(restore(serialize({...s,discovered:'bad'})),null);
  assert.equal(restore(serialize({...s,discovered:[...s.discovered,...s.discovered]})),null);
  assert.ok(exploration(s).items.every(p=>!['npc','door'].includes(p.kind)));
});
test('V-S03/V-E01：通關後補探索與存讀保持成績與時間，重開清空',()=>{
  const s=createGame();Object.assign(s,{started:true,ended:true,scene:'S02',elapsed:600,hints:{P01:1},solved:['P01','P02','P03','P04'],bells:[1,2,3,4,5,6,7,8],inventory:['I01','I02','I03','I04','I05'],used:['I02','I03','I05'],player:{x:350,y:185,facing:'up'}});
  for(const key of Object.keys(s.flags))s.flags[key]=true;
  const before=scoreRun(s), next=execute(s,{type:'DISCOVER',target:'old-bench'},story);
  assert.equal(next.ok,true);assert.equal(exploration(next.state).found,1);
  assert.deepEqual(scoreRun(restore(serialize(next.state))),before);
  assert.equal(tickClock(next.state,120,true).elapsed,600);
  assert.equal(exploration(createGame()).found,0);assert.equal(createGame().elapsed,0);assert.deepEqual(createGame().hints,{});
});
test('V-S03：提示最多計十二層，重看不扣，通關後不能再改提示或成績',()=>{
  let s=createGame();s.started=true;
  for(let n=0;n<5;n++)s=execute(s,{type:'HINT',id:'P01'},story).state;
  assert.equal(s.hints.P01,3);assert.equal(scoreRun({...s,ended:true}).hintBonus,2250);
  s.ended=true;assert.equal(execute(s,{type:'HINT',id:'P02'},story).ok,false);
});
