import { WORLD, getPoint, distance, walkable } from './world.mjs';

export const SAVE_KEY = 'the-eighth-class.save.v1';
export function createGame() {
  return {
    schema: 1, started: false, scene: 'S01', player: { x: 500, y: 530, facing: 'up' },
    solved: [], inventory: [], used: [], bells: [], clues: [], hints: {},
    flags: { doorOpen: false, returned: false, photoPlaced: false, scriptPlaced: false, exitOpen: false },
    ended: false, muted: true, elapsed: 0
  };
}
export function canInteract(state, target) {
  const p = getPoint(state.scene, target);
  return Boolean(p && distance(state.player, p) <= p.range);
}
const bell = (state, n) => { if (!state.bells.includes(n)) state.bells.push(n); };
const add = (list, id) => { if (!list.includes(id)) list.push(id); };
export function execute(original, action, story) {
  const fail = message => ({ state: original, ok: false, message });
  if (!action || typeof action.type !== 'string') return fail('無法辨識這個操作。');
  const state = structuredClone(original);
  const done = message => ({ state, ok: true, message });
  if (action.type === 'START') {
    if (state.started) return done('繼續探索。');
    state.started = true; bell(state, 1); return done('第一聲鐘響。請在第八次鐘聲，讓全班到齊。');
  }
  if (!state.started) return fail('請先開始遊戲。');
  if (state.ended && !['READ', 'HINT', 'TRAVEL'].includes(action.type)) return fail('已通關，可以繼續探索與閱讀線索。');
  if (action.type === 'HINT') {
    const puzzle = story.puzzles.find(p => p.id === action.id);
    if (!puzzle) return fail('沒有這道謎題。');
    state.hints[action.id] = Math.min(3, (state.hints[action.id] || 0) + 1);
    return done(puzzle.hints[state.hints[action.id] - 1]);
  }
  if (action.type === 'READ') {
    if (!canInteract(state, action.target)) return fail('請先走到物件附近。');
    if (!['blackboard', 'roster', 'science', 'recordings', 'photo', 'lectern'].includes(action.target)) return fail('這裡沒有可讀取的文件。');
    add(state.clues, action.target); return done('已記入探索筆記。');
  }
  if (action.type === 'SOLVE') {
    const target = { P01: 'drawer', P02: 'register', P03: 'player' }[action.id];
    const puzzle = story.puzzles.find(p => p.id === action.id);
    if (!target || !puzzle || !canInteract(state, target)) return fail('請先走到機關附近。');
    if (state.solved.includes(action.id)) return done('這道謎題已完成。');
    if (!puzzle.requiresPuzzles.every(id => state.solved.includes(id))) return fail('前面的線索還沒有完整。');
    if (!puzzle.requiredItemIds.every(id => state.inventory.includes(id))) return fail(action.id === 'P02' ? '請回教室取出借書卡，再比對班級與座號。' : '請先從走廊資料櫃拾取轉學交接單。');
    if (action.id === 'P02' && !state.flags.doorOpen) return fail('請先用鑰匙打開內門。');
    const correct = Array.isArray(puzzle.answer)
      ? Array.isArray(action.answer) && action.answer.length === puzzle.answer.length && action.answer.every((v, i) => v === puzzle.answer[i])
      : typeof action.answer === 'string' && action.answer.trim() === puzzle.answer;
    if (!correct) return fail(typeof action.answer === 'string' && !action.answer.trim() ? '請先填入你的答案。' : puzzle.failureText);
    add(state.solved, action.id); bell(state, { P01: 2, P02: 3, P03: 4 }[action.id]);
    return done(puzzle.revealText);
  }
  if (action.type === 'PICKUP') {
    const config = { I01: ['drawer', 'P01'], I02: ['drawer', 'P01'], I03: ['drawer', 'P01'], I04: ['cabinet', 'P02'], I05: ['script', 'P03'] }[action.id];
    if (!config || !canInteract(state, config[0])) return fail('請走到道具所在的位置。');
    if (!state.solved.includes(config[1])) return fail('機關還沒打開。');
    if (state.inventory.includes(action.id)) return done('這件道具已經在背包裡。');
    add(state.inventory, action.id);
    return done(`已拾取「${story.items.find(i => i.id === action.id).name}」。按 B 可查看背包。`);
  }
  if (action.type === 'USE') {
    if (!state.inventory.includes(action.id)) return fail('你尚未取得這件道具。');
    if (!canInteract(state, action.target)) return fail('距離太遠了，請先走到目標附近。');
    if (action.id === 'I03' && action.target === 'class-door' && state.scene === 'S01') {
      state.flags.doorOpen = true; add(state.used, 'I03'); return done('鑰匙轉動了。內門已開，走到門口就能進入走廊。');
    }
    if (action.id === 'I02' && action.target === 'photo' && state.scene === 'S01') {
      if (!state.solved.includes('P03') || !state.inventory.includes('I05')) return fail('先找回完整告別稿，確認她想留下的話，再完成最後點名。');
      state.flags.returned = true; bell(state, 5);
      state.flags.photoPlaced = true; add(state.used, 'I02'); bell(state, 6);
      return done('照片回到合照的空白處。接著，把完整告別稿放上講台稿架。');
    }
    if (action.id === 'I05' && action.target === 'lectern' && state.scene === 'S01') {
      if (!state.flags.photoPlaced || !state.solved.includes('P03')) return fail('先讓照片回到全班合照中，再放上告別稿。');
      state.flags.scriptPlaced = true; add(state.used, 'I05'); bell(state, 7);
      return done('廣播響起：「十七號，林予安。」這一次，點名等待著你的回應。');
    }
    return fail(action.id === 'I02' ? '這張照片需要一個能與全班留在一起的位置。' : '這件道具不適合用在這裡；它仍留在你的背包。');
  }
  if (action.type === 'ANSWER') {
    if (state.scene !== 'S01' || !canInteract(state, 'lectern')) return fail('請走到教室講台附近回應。');
    if (!state.flags.photoPlaced || !state.flags.scriptPlaced || !state.solved.includes('P03')) return fail('最後的點名還沒準備好。請檢查合照與講台上的告別稿。');
    state.flags.exitOpen = true; add(state.solved, 'P04'); bell(state, 8);
    return done('「到。轉學，也是我們班的一員。」校舍出口已開，經走廊離開吧。');
  }
  if (action.type === 'TRAVEL') {
    const p = getPoint(state.scene, action.target);
    if (!p || p.kind !== 'door' || distance(state.player, p) > 30) return fail('請親自走到門口。');
    if (state.scene === 'S01' && !state.flags.doorOpen) return fail('內門鎖住了。需要走廊資料區鑰匙。');
    if (p.id === 'broadcast-door' && !state.solved.includes('P02')) return fail('先把紀念名冊中的姓名補完整，廣播室才會開放。');
    if (p.to === 'END01') {
      if (!state.flags.exitOpen) return fail('校舍出口還沒開。最後的點名尚未結束。');
      state.ended = true; return done('你走出了校舍。離開教室的人，不該因此被擦掉。');
    }
    state.scene = p.to;
    state.player = { x: p.arrival[0], y: p.arrival[1], facing: 'up' };
    if (state.scene === 'S01' && state.solved.includes('P03')) { state.flags.returned = true; bell(state, 5); }
    return done(`來到${WORLD[state.scene].name}。`);
  }
  return fail('無法辨識這個操作。');
}

export function movePlayer(state, dx, dy, paused = false) {
  if (paused || !state.started || !Number.isFinite(dx) || !Number.isFinite(dy)) return state;
  const player = { ...state.player };
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 5));
  if (dx || dy) player.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  for (let i = 0; i < steps; i++) {
    if (walkable(state.scene, player.x + dx / steps, player.y)) player.x += dx / steps;
    if (walkable(state.scene, player.x, player.y + dy / steps)) player.y += dy / steps;
  }
  return { ...state, player };
}
export const serialize = state => JSON.stringify(state);
export function restore(raw) {
  try {
    const data = JSON.parse(raw), base = createGame();
    if (!data || data.schema !== 1 || !WORLD[data.scene] || typeof data.started !== 'boolean' || typeof data.ended !== 'boolean' || typeof data.muted !== 'boolean' || !Number.isFinite(data.elapsed) || data.elapsed < 0) return null;
    const lists = { solved: ['P01', 'P02', 'P03', 'P04'], inventory: ['I01', 'I02', 'I03', 'I04', 'I05'], used: ['I02', 'I03', 'I05'], clues: ['blackboard', 'roster', 'science', 'recordings', 'photo', 'lectern'], bells: [1, 2, 3, 4, 5, 6, 7, 8] };
    for (const [key, allowed] of Object.entries(lists)) if (!Array.isArray(data[key]) || data[key].some(id => !allowed.includes(id)) || new Set(data[key]).size !== data[key].length) return null;
    if (!data.flags || Object.keys(base.flags).some(k => typeof data.flags[k] !== 'boolean')) return null;
    if (!data.player || !Number.isFinite(data.player.x) || !Number.isFinite(data.player.y) || !['up', 'down', 'left', 'right'].includes(data.player.facing)) return null;
    if (!data.hints || typeof data.hints !== 'object' || Array.isArray(data.hints) || Object.entries(data.hints).some(([key, v]) => !lists.solved.includes(key) || !Number.isInteger(v) || v < 0 || v > 3)) return null;
    const has = id => data.inventory.includes(id), solved = id => data.solved.includes(id), f = data.flags;
    if ((solved('P02') && (!solved('P01') || !f.doorOpen || !has('I01'))) || (solved('P03') && (!solved('P02') || !has('I04')))) return null;
    if (data.inventory.some(id => !solved(['I04', 'I05'].includes(id) ? (id === 'I04' ? 'P02' : 'P03') : 'P01'))) return null;
    if ((f.doorOpen && !has('I03')) || (data.scene !== 'S01' && !f.doorOpen) || (data.scene === 'S03' && !solved('P02'))) return null;
    if ((f.returned && !solved('P03')) || (f.photoPlaced && (!f.returned || !has('I02') || !has('I05'))) || (f.scriptPlaced && !f.photoPlaced) || (f.exitOpen && (!f.scriptPlaced || !solved('P04'))) || (solved('P04') !== f.exitOpen) || (data.ended && !f.exitOpen)) return null;
    const expectedUsed = [f.photoPlaced && 'I02', f.doorOpen && 'I03', f.scriptPlaced && 'I05'].filter(Boolean).sort();
    if (JSON.stringify([...data.used].sort()) !== JSON.stringify(expectedUsed)) return null;
    const expectedBells = [data.started && 1, solved('P01') && 2, solved('P02') && 3, solved('P03') && 4, f.returned && 5, f.photoPlaced && 6, f.scriptPlaced && 7, f.exitOpen && 8].filter(Boolean);
    if (JSON.stringify(data.bells) !== JSON.stringify(expectedBells)) return null;
    if (!data.started && (data.solved.length || data.inventory.length || data.bells.length)) return null;
    const state = { ...base, started: data.started, scene: data.scene, player: { ...data.player }, solved: [...data.solved], inventory: [...data.inventory], used: [...data.used], bells: [...data.bells], clues: [...data.clues], hints: { ...data.hints }, flags: Object.fromEntries(Object.keys(base.flags).map(k => [k, data.flags[k]])), ended: data.ended, muted: data.muted, elapsed: data.elapsed };
    if (!walkable(state.scene, state.player.x, state.player.y)) { const [x, y] = WORLD[state.scene].spawn; state.player = { x, y, facing: 'up' }; }
    return state;
  } catch { return null; }
}

export function getObjective(state) {
  if (state.ended) return ['第八節課，終於下課了。', '已通關，可以自由探索校舍、重讀線索與背包。'];
  if (state.flags.exitOpen) return ['最後一聲，終於有了回應。', '經過走廊，親自走出校舍出口。'];
  if (state.flags.scriptPlaced) return ['廣播正在等待你的回答。', '靠近講台，代她回應最後一次點名。'];
  if (state.flags.photoPlaced) return ['她的位置已經回到合照。', '將完整告別稿放上講台稿架。'];
  if (state.solved.includes('P03')) return [state.inventory.includes('I05') ? '把她的位置留在班級裡。' : '告別終於完整，別把它留下。', state.inventory.includes('I05') ? '帶著照片與告別稿回教室，先補上合照。' : '靠近設備旁的稿件，拾取完整告別稿。'];
  if (state.solved.includes('P02')) return ['有些話，還沒有被聽見。', state.inventory.includes('I04') ? '前往廣播室，依交接單還原當天順序。' : '從走廊資料櫃取出轉學交接單。'];
  if (state.flags.doorOpen) return ['有座號，卻沒有名字。', '重讀借書卡，比對走廊科展名單。'];
  if (state.solved.includes('P01')) return ['抽屜裡的物品還在等你。', '逐一拾取道具，再對內門使用鑰匙。'];
  return ['留在教室的名單，少了誰？', '查看班級資料，找出缺少的座號。'];
}
