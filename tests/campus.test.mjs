import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NPCS, PROPS, CAMPUS_POINTS, npcGreeting } from '../game/campus.mjs';
import { createGame, execute, restore, serialize } from '../game/engine.mjs';
import { WORLD, walkable, findPath } from '../game/world.mjs';
const story = JSON.parse(await readFile(new URL('../content/story.json',import.meta.url),'utf8'));
test('三位 NPC 與十二件校園物件均可到達，沒有改動主線必要道具', () => {
  assert.equal(Object.keys(NPCS).length,3); assert.equal(Object.keys(PROPS).length,12);
  for (const [scene,points] of Object.entries(CAMPUS_POINTS)) for (const p of points) {
    assert.ok(walkable(scene,...p.stand),p.id);
    assert.ok(findPath(scene,WORLD[scene].spawn,p.stand).length,p.id);
    const initial = createGame(); initial.started=true;initial.bells=[1];initial.scene=scene;
    initial.player={x:p.stand[0],y:p.stand[1],facing:'down'};
    const result=execute(initial,{type:'READ',target:p.id},story);
    assert.equal(result.ok,true,p.id);
    assert.deepEqual(result.state.inventory,initial.inventory);
    assert.deepEqual(result.state.solved,initial.solved);
    assert.deepEqual(result.state.bells,initial.bells);
    assert.deepEqual(result.state.flags,initial.flags);
  }
});
test('可選對話與物件筆記可存讀，舊存檔仍相容，遠距不能讀取',()=>{
  const state=createGame();state.started=true;state.bells=[1];state.player={x:200,y:450,facing:'left'};
  const next=execute(state,{type:'READ',target:'npc-caretaker'},story).state;
  assert.ok(restore(serialize(next)).clues.includes('npc-caretaker'));
  assert.ok(restore(serialize(state)));
  assert.equal(execute(state,{type:'READ',target:'archive-box'},story).ok,false);
});
test('對話分階段揭露，初見不洩漏姓名，每位有三個非必需話題',()=>{
  const state=createGame();
  for(const [id,npc] of Object.entries(NPCS)) {
    assert.equal(npc.topics.length,3);
    assert.ok(!npcGreeting(id,state).includes('林予安'));
    const found={...state,solved:['P01','P02']};
    assert.notEqual(npcGreeting(id,found),npcGreeting(id,state));
    assert.notEqual(npcGreeting(id,{...found,flags:{exitOpen:true}}),npcGreeting(id,found));
    assert.ok(npc.topics.every(([q,a])=>q.length&&a.length));
  }
});

// VERIFY-LIB-01: unlock gate is enforced by the engine, independently of UI.
test('圖書館需確認姓名，支線可存讀且不改主線進度',()=>{
  const s=createGame(); Object.assign(s,{started:true,bells:[1,2],scene:'S02',solved:['P01'],inventory:['I01','I02','I03'],used:['I03']});s.flags.doorOpen=true;s.player={x:235,y:130,facing:'up'};
  assert.equal(execute(s,{type:'TRAVEL',target:'library-door'},story).ok,false);
  s.solved.push('P02');s.bells.push(3);
  const arrival=execute(s,{type:'TRAVEL',target:'library-door'},story);assert.equal(arrival.ok,true);assert.equal(arrival.state.scene,'S04');
  let next=arrival.state;
  for(const p of CAMPUS_POINTS.S04){next.player={x:p.stand[0],y:p.stand[1],facing:'up'};const read=execute(next,{type:'READ',target:p.id},story);assert.equal(read.ok,true);next=read.state;}
  for(const [id,npc] of Object.entries(NPCS))assert.equal(npcGreeting(id,next),npc.afterLetter);
  assert.deepEqual(next.bells,[1,2,3]);assert.deepEqual(next.solved,['P01','P02']);assert.ok(restore(serialize(next)));
  next.player={x:500,y:625,facing:'down'};assert.equal(execute(next,{type:'TRAVEL',target:'corridor-door'},story).state.scene,'S02');
});
