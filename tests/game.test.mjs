import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, execute, movePlayer, serialize, restore } from '../game/engine.mjs';
import { WORLD, findPath, walkable } from '../game/world.mjs';

const story = JSON.parse(await readFile(new URL('../content/story.json', import.meta.url), 'utf8'));
const perform = (state, action) => execute(state, action, story);
const start = () => perform(createGame(), { type: 'START' }).state;
const near = (state, target) => {
  const point = WORLD[state.scene].points.find(p => p.id === target);
  assert.ok(point, `目前場景須有 ${target}`);
  return { ...state, player: { ...state.player, x: point.stand[0], y: point.stand[1] } };
};
const portal = (state, id) => {
  const point = WORLD[state.scene].points.find(p => p.id === id);
  return { ...state, player: { ...state.player, x: point.x, y: point.y } };
};
function collectFirst() {
  let state = near(start(), 'drawer');
  state = perform(state, { type: 'SOLVE', id: 'P01', answer: '17' }).state;
  for (const id of ['I01', 'I02', 'I03']) state = perform(state, { type: 'PICKUP', id }).state;
  state = near(state, 'class-door');
  return perform(state, { type: 'USE', id: 'I03', target: 'class-door' }).state;
}
function reachThird() {
  let state = perform(portal(collectFirst(), 'class-door'), { type: 'TRAVEL', target: 'class-door' }).state;
  state = perform(near(state, 'register'), { type: 'SOLVE', id: 'P02', answer: '林予安' }).state;
  state = perform(near(state, 'cabinet'), { type: 'PICKUP', id: 'I04' }).state;
  state = perform(portal(state, 'broadcast-door'), { type: 'TRAVEL', target: 'broadcast-door' }).state;
  return near(state, 'player');
}
function finalReady() {
  let state = reachThird();
  state = perform(state, { type: 'SOLVE', id: 'P03', answer: story.departureOrder }).state;
  state = perform(near(state, 'script'), { type: 'PICKUP', id: 'I05' }).state;
  state = perform(portal(state, 'corridor-door'), { type: 'TRAVEL', target: 'corridor-door' }).state;
  return perform(portal(state, 'class-door'), { type: 'TRAVEL', target: 'class-door' }).state;
}

test('V-B01：開始遊戲只有第一聲，重複開始不重置或多響一次', () => {
  const state = start();
  assert.deepEqual(state.bells, [1]);
  assert.deepEqual(perform(state, { type: 'START' }).state, state);
});
test('V-B02：角色受家具與邊界阻擋，視窗開啟時停止移動', () => {
  let state = start();
  state.player = { x: 270, y: 260, facing: 'right' };
  const blocked = movePlayer(state, 120, 0);
  assert.ok(blocked.player.x < 281);
  assert.deepEqual(movePlayer(state, 20, 0, true), state);
  const edge = movePlayer({ ...state, player: { x: 55, y: 470, facing: 'left' } }, -300, 0);
  assert.ok(edge.player.x >= 45);
});
test('V-B03：場景所有互動接近點有路可到，不把家具變成死路', () => {
  for (const [id, world] of Object.entries(WORLD)) {
    for (const point of world.points) {
      assert.ok(walkable(id, ...point.stand), `${id}/${point.id} 的接近點不能在牆內`);
      assert.ok(findPath(id, world.spawn, point.stand).length, `${id}/${point.id} 應可到達`);
    }
  }
});
test('V-B04：遠處猜中答案仍不能解鎖抽屜', () => {
  const state = start();
  const result = perform(state, { type: 'SOLVE', id: 'P01', answer: '17' });
  assert.equal(result.ok, false);
  assert.deepEqual(result.state, state);
});
test('V-B05：空白、錯誤與格式錯誤不推進；前後空白可忽略', () => {
  const state = near(start(), 'drawer');
  for (const answer of ['', '18', '017', '十七', null, ['17']]) {
    const result = perform(state, { type: 'SOLVE', id: 'P01', answer });
    assert.equal(result.ok, false);
    assert.deepEqual(result.state, state);
  }
  assert.equal(perform(state, { type: 'SOLVE', id: 'P01', answer: ' 17 ' }).ok, true);
});
test('V-B06：解開抽屜只開放拾取，鑰匙沒有自動進背包或開門', () => {
  let state = near(start(), 'drawer');
  state = perform(state, { type: 'SOLVE', id: 'P01', answer: '17' }).state;
  assert.deepEqual(state.inventory, []);
  assert.equal(state.flags.doorOpen, false);
  const result = perform(portal(state, 'class-door'), { type: 'TRAVEL', target: 'class-door' });
  assert.equal(result.ok, false);
});
test('V-B07：每件唯一道具只能拾取一次，不開放時不能拿', () => {
  assert.equal(perform(near(start(), 'drawer'), { type: 'PICKUP', id: 'I01' }).ok, false);
  let state = near(collectFirst(), 'drawer');
  state = perform(state, { type: 'PICKUP', id: 'I01' }).state;
  assert.equal(state.inventory.filter(id => id === 'I01').length, 1);
  assert.equal(perform(state, { type: 'PICKUP', id: 'UNKNOWN' }).ok, false);
});
test('V-B08：用錯、遠距使用不消耗道具或開門；使用後道具保留狀態', () => {
  let state = near(collectFirst(), 'drawer');
  const before = structuredClone(state);
  assert.equal(perform(state, { type: 'USE', id: 'I02', target: 'drawer' }).ok, false);
  assert.equal(perform(state, { type: 'USE', id: 'I03', target: 'class-door' }).ok, false);
  assert.deepEqual(state, before);
  assert.ok(state.used.includes('I03'));
  assert.ok(state.inventory.includes('I03'));
});
test('V-B09：場景往返保留道具與解題，剛切換時不立即彈回', () => {
  const first = collectFirst();
  let state = perform(portal(first, 'class-door'), { type: 'TRAVEL', target: 'class-door' }).state;
  assert.equal(state.scene, 'S02');
  assert.deepEqual(state.inventory, first.inventory);
  assert.equal(perform(state, { type: 'TRAVEL', target: 'class-door' }).ok, false);
  state = perform(portal(state, 'class-door'), { type: 'TRAVEL', target: 'class-door' }).state;
  assert.equal(state.scene, 'S01');
  assert.deepEqual(state.bells, [1, 2]);
});
test('V-B10：沒有借書卡不能猜姓名；缺交接單不能排列錄音', () => {
  let state = perform(portal(collectFirst(), 'class-door'), { type: 'TRAVEL', target: 'class-door' }).state;
  state = near({ ...state, inventory: state.inventory.filter(id => id !== 'I01') }, 'register');
  assert.equal(perform(state, { type: 'SOLVE', id: 'P02', answer: '林予安' }).ok, false);
  state = reachThird();
  state.inventory = state.inventory.filter(id => id !== 'I04');
  assert.equal(perform(state, { type: 'SOLVE', id: 'P03', answer: story.departureOrder }).ok, false);
});
test('V-B11：排序須恰好三項且順序正確，重複／交換不能通過', () => {
  const state = reachThird();
  for (const answer of [['read_farewell', 'return_book', 'transfer_school'], ['return_book', 'return_book', 'transfer_school'], [], story.departureOrder.join(',')]) {
    const result = perform(state, { type: 'SOLVE', id: 'P03', answer });
    assert.equal(result.ok, false);
    assert.deepEqual(result.state, state);
  }
});
test('V-B12：照片、告別稿、回應固定順序，不能只持有或提早回應', () => {
  let state = finalReady();
  assert.equal(state.ended, false);
  assert.equal(perform(near(state, 'lectern'), { type: 'ANSWER' }).ok, false);
  assert.equal(perform(near(state, 'lectern'), { type: 'USE', id: 'I05', target: 'lectern' }).ok, false);
  state = perform(near(state, 'photo'), { type: 'USE', id: 'I02', target: 'photo' }).state;
  assert.deepEqual(state.bells, [1, 2, 3, 4, 5, 6]);
  assert.equal(state.flags.exitOpen, false);
  state = perform(near(state, 'lectern'), { type: 'USE', id: 'I05', target: 'lectern' }).state;
  assert.deepEqual(state.bells, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(state.flags.exitOpen, false);
});
test('V-B13／V-I01：完整路線必須回應後親自走到出口才 END01', () => {
  let state = finalReady();
  state = perform(near(state, 'photo'), { type: 'USE', id: 'I02', target: 'photo' }).state;
  state = perform(near(state, 'lectern'), { type: 'USE', id: 'I05', target: 'lectern' }).state;
  state = perform(state, { type: 'ANSWER' }).state;
  assert.equal(state.flags.exitOpen, true);
  assert.equal(state.ended, false);
  assert.equal(state.bells.length, 8);
  const duplicate = perform(state, { type: 'ANSWER' }).state;
  assert.deepEqual(duplicate.bells, state.bells);
  state = perform(portal(state, 'class-door'), { type: 'TRAVEL', target: 'class-door' }).state;
  assert.equal(perform(state, { type: 'TRAVEL', target: 'exit' }).ok, false);
  state = perform(portal(state, 'exit'), { type: 'TRAVEL', target: 'exit' }).state;
  assert.equal(state.ended, true);
  assert.equal(state.scene, 'S02');
});
test('V-I02：漏拿照片或告別稿可返回補拿，沒有永久卡死', () => {
  let state = finalReady();
  state.inventory = state.inventory.filter(id => id !== 'I02');
  assert.equal(perform(near(state, 'photo'), { type: 'USE', id: 'I02', target: 'photo' }).ok, false);
  state = perform(near(state, 'drawer'), { type: 'PICKUP', id: 'I02' }).state;
  assert.ok(state.inventory.includes('I02'));
  assert.equal(perform(near(state, 'photo'), { type: 'USE', id: 'I02', target: 'photo' }).ok, true);
});
test('V-B14：提示逐層增加至三層，不增加鐘聲', () => {
  let state = start();
  for (let i = 0; i < 5; i++) state = perform(state, { type: 'HINT', id: 'P01' }).state;
  assert.equal(state.hints.P01, 3);
  assert.deepEqual(state.bells, [1]);
});
test('V-B15：刷新保存與讀回一次性事件，不重複響鐘或生成道具', () => {
  const state = finalReady();
  const loaded = restore(serialize(state));
  assert.deepEqual(loaded, state);
  assert.deepEqual(perform(loaded, { type: 'START' }).state.bells, state.bells);
  assert.equal(loaded.inventory.length, 5);
});
test('V-B16：損壞或不相容存檔可安全拒絕，不悄悄略過機關', () => {
  for (const raw of ['bad json', 'null', '{}', JSON.stringify({ ...start(), schema: 99 }), JSON.stringify({ ...start(), solved: ['P03'] }), JSON.stringify({ ...start(), flags: { ...start().flags, exitOpen: true } }), JSON.stringify({ ...start(), bells: [1, 8] })]) {
    assert.equal(restore(raw), null);
  }
});
test('V-B17：未知動作與未開始的機關不改動狀態', () => {
  const state = createGame();
  assert.equal(perform(state, { type: 'UNKNOWN' }).ok, false);
  assert.equal(perform(near(state, 'drawer'), { type: 'SOLVE', id: 'P01', answer: '17' }).ok, false);
});

test('V-I06：通關後仍可移動、往返閱讀，存檔保留通關與八聲鐘', () => {
  let state = finalReady();
  state = perform(near(state, 'photo'), { type: 'USE', id: 'I02', target: 'photo' }).state;
  state = perform(near(state, 'lectern'), { type: 'USE', id: 'I05', target: 'lectern' }).state;
  state = perform(state, { type: 'ANSWER' }).state;
  state = perform(portal(state, 'class-door'), { type: 'TRAVEL', target: 'class-door' }).state;
  state = perform(portal(state, 'exit'), { type: 'TRAVEL', target: 'exit' }).state;
  const moved = movePlayer(state, -20, 0);
  assert.notEqual(moved.player.x, state.player.x);
  const returned = perform(portal(moved, 'class-door'), { type: 'TRAVEL', target: 'class-door' });
  assert.equal(returned.ok, true);
  state = returned.state;
  assert.equal(perform(near(state, 'blackboard'), { type: 'READ', target: 'blackboard' }).ok, true);
  assert.equal(state.ended, true);
  assert.deepEqual(state.bells, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(restore(serialize(state)), state);
});
