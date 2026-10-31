import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NPCS, PROPS, CAMPUS_POINTS, npcGreeting } from '../game/campus.mjs';
import { createGame, execute, restore, serialize } from '../game/engine.mjs';
import { WORLD, walkable, findPath } from '../game/world.mjs';
const story = JSON.parse(await readFile(new URL('../content/story.json',import.meta.url),'utf8'));
test('三位 NPC 與九件校園物件均可到達，沒有改動主線必要道具', () => {
  assert.equal(Object.keys(NPCS).length,3); assert.equal(Object.keys(PROPS).length,9);
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
