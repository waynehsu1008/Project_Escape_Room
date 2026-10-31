import { createMusic } from './music.mjs';
import { NPCS, PROPS, campusText, npcGreeting } from './campus.mjs';
import { createEffects, actionSound } from './effects.mjs';
const effects = createEffects();
const backgroundMusic = createMusic();
import { WORLD, getPoint, distance, findPath, walkable } from './world.mjs';
import { createGame, execute, movePlayer, canInteract, getObjective, SAVE_KEY, serialize, restore } from './engine.mjs';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
  close: '<path d="m4 4 16 16M20 4 4 20"/>',
  book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4M12 2V1"/>',
  sound: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/>',
  settings: '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  bag: '<path d="M8 7V5a4 4 0 0 1 8 0v2M5 9c0-2 14-2 14 0l2 11H3L5 9Z"/><path d="M8 9v5h8V9m-5 9h2"/>',
  note: '<path d="M5 3h14v18H5V3Zm4 4h6m-6 4h6m-6 4h4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  door: '<path d="M5 22V3h13v19M2 22h20M14 12h1"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  hand: '<path d="M8 13V5a2 2 0 0 1 4 0v7-3a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v5c0 5-4 7-8 5l-7-7a2 2 0 0 1 3-1Z"/>'
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.eye}</svg>`; }
const art = {
  blackboard: 'assets/objects/campus-01-chalkboard-v1.png', roster: 'assets/objects/campus-02-student-desk-v1.png',
  lectern: 'assets/objects/campus-03-lectern-script-stand-v1.png', drawer: 'assets/objects/campus-04-return-drawer-v1.png',
  photo: 'assets/objects/campus-05-class-photo-frame-v1.png', science: 'assets/objects/campus-06-science-bulletin-board-v1.png',
  register: 'assets/objects/campus-07-memorial-register-v1.png', cabinet: 'assets/objects/campus-08-archive-cabinet-v1.png',
  player: 'assets/objects/campus-09-cassette-player-v1.png', door: 'assets/objects/campus-10-classroom-door-v1.png'
};
const itemArt = { I01: art.register, I02: 'assets/generated/student-portrait-v1.png', I03: 'assets/generated/brass-key-v1.png', I04: art.register, I05: art.lectern };
const itemLabels = { I01: '借書卡', I02: '個人照', I03: '鑰匙', I04: '交接單', I05: '告別稿' };

let story, state = createGame(), saved = null, hasBadSave = false, storageAvailable = true;
let selectedItem = null, path = [], intent = null, keys = new Set(), nearestId = null, sceneId = null;
let toastTimer, feedbackTimer, feedbackAnimation, blockedDoorAt = 0, audioContext, modalReturnFocus, lastSaveTime = 0;
const modal = $('#modal'), game = $('#game');

function toast(message, duration = 4200) {
  if (!message) return;
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), duration);
}
function clearMovement() { keys.clear(); path = []; intent = null; $('#destination').hidden = true; }
function save() {
  if (!state.started) return;
  try {
    localStorage.setItem(SAVE_KEY, serialize(state));
    storageAvailable = true; $('#save-status').classList.remove('error');
    $('#save-status').textContent = '進度已自動儲存';
  } catch {
    if (storageAvailable) toast('此瀏覽器目前無法保存進度；離開前請留意。', 6000);
    storageAvailable = false; $('#save-status').classList.add('error'); $('#save-status').textContent = '暫時無法儲存進度';
  }
}
function chime() {
  if (state.muted) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume().catch(() => {});
    const time = audioContext.currentTime;
    for (const [frequency, volume] of [[523.25, .11], [1046.5, .04], [1569.75, .015]]) {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + .02); gain.gain.exponentialRampToValueAtTime(.0001, time + 2.2);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(time); oscillator.stop(time + 2.3);
    }
  } catch { toast('此瀏覽器無法播放音效，仍可用文字完成遊戲。'); }
}
function act(action, announce = true) {
  const previousBells = state.bells.length, result = execute(state, action, story);
  const sound = actionSound(action, result, state);
  if (sound) effects.play(sound);
  if (result.ok) {
    state = result.state;
    if (state.bells.length > previousBells) chime();
    render(); save();
  }
  if (announce) toast(result.message);
  return result;
}
function clearFormFeedback() {
  clearTimeout(feedbackTimer);
  feedbackAnimation?.cancel();
  $('#form-feedback')?.replaceChildren();
  $('#answer-input')?.removeAttribute('aria-invalid');
}
function showFormFeedback(message) {
  clearFormFeedback();
  const feedback = $('#form-feedback'), input = $('#answer-input');
  if (!feedback) return;
  feedback.textContent = message;
  input?.setAttribute('aria-invalid', 'true');
  feedbackAnimation = feedback.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
  feedbackTimer = setTimeout(() => {
    feedback.replaceChildren();
    input?.removeAttribute('aria-invalid');
  }, 2000);
}
function openModal(title, body, subtitle = '', { closable = true, className = '' } = {}) {
  if (state.started) effects.play('paper');
  clearFormFeedback();
  clearMovement();
  if (!modal.open) modalReturnFocus = document.activeElement;
  modal.className = `modal ${className}`;
  $('#modal-content').innerHTML = `<header class="modal-header"><div><h2 id="modal-title">${esc(title)}</h2>${subtitle ? `<p class="modal-subtitle">${esc(subtitle)}</p>` : ''}</div>${closable ? `<button class="close-button" data-close aria-label="關閉視窗" type="button">${icon('close')}</button>` : ''}</header><div class="modal-body">${body}</div>`;
  if (!modal.open) modal.showModal();
  modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
}
function closeModal() { if (state.started) modal.close(); }
modal.addEventListener('cancel', event => { if (!state.started) event.preventDefault(); });
modal.addEventListener('close', () => { clearFormFeedback(); keys.clear(); const target = modalReturnFocus?.isConnected ? modalReturnFocus : game; target?.focus({ preventScroll: true }); });

function doorOpen(point) {
  if (point.id === 'exit') return state.flags.exitOpen;
  if (['broadcast-door','library-door'].includes(point.id)) return state.solved.includes('P02');
  if (state.scene === 'S01' && point.id === 'class-door') return state.flags.doorOpen;
  return true;
}
function completed(point) {
  return ({ drawer: state.solved.includes('P01'), register: state.solved.includes('P02'), player: state.solved.includes('P03'), photo: state.flags.photoPlaced, lectern: state.flags.scriptPlaced, cabinet: state.inventory.includes('I04'), script: state.inventory.includes('I05') })[point.id] || false;
}
function renderMap() {
  const world = WORLD[state.scene];
  if (sceneId !== state.scene) {
    sceneId = state.scene; nearestId = null;
    $('#map-image').src = world.image; $('#map-image').alt = `${world.name}俯視探索地圖`;
    $('#scene-name').textContent = world.name; $('#scene-subtitle').textContent = world.subtitle;
    $('#map-objects').innerHTML = world.points.map(p => `<button class="map-point ${p.sprite ? 'has-sprite' : ''} ${p.kind === 'door' ? 'door' : ''}" type="button" data-target="${p.id}" aria-label="${esc(p.name)}" style="left:${p.x / 10}%;top:${p.y / 6.67}%">${p.sprite ? `<img class="campus-sprite ${p.kind === 'npc' ? 'npc-sprite' : 'prop-sprite'}" src="${p.sprite}" alt="" draggable="false">` : ''}<span class="point-symbol">${icon(p.kind === 'npc' ? 'note' : p.kind === 'flavor' ? 'eye' : p.kind === 'door' ? 'door' : p.kind === 'read' ? 'eye' : p.kind === 'pickup' ? 'hand' : p.kind === 'use' ? 'hand' : 'lock')}</span><span class="point-label">${esc(p.name)}</span></button>`).join('');
    modal.close();
    $('#map-objects').querySelectorAll('[data-target]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); walkToPoint(button.dataset.target); }));
  }
  for (const p of world.points) {
    const node = $(`[data-target="${p.id}"]`);
    node.classList.toggle('complete', completed(p)); node.classList.toggle('locked', p.kind === 'door' && !doorOpen(p));
  }
  game.dataset.scene = state.scene; game.dataset.bells = String(state.bells.length); game.dataset.ended = String(state.ended);
  game.dataset.solved = state.solved.join(',');
  renderPosition(false);
}
function renderPosition(moving) {
  const { x, y, facing } = state.player;
  const character = $('#character'); character.style.left = `${x / 10}%`; character.style.top = `${y / 6.67}%`;
  character.dataset.facing = facing; character.classList.toggle('walking', moving);
  $('#player-shadow').style.left = `${x / 10}%`; $('#player-shadow').style.top = `${y / 6.67}%`;
  const nearby = WORLD[state.scene].points.filter(p => canInteract(state, p.id)).sort((a, b) => distance(state.player, a) - distance(state.player, b))[0];
  const nextId = nearby?.id || null;
  if (nearestId !== nextId) {
    nearestId = nextId;
    $('#map-objects').querySelectorAll('.near').forEach(node => node.classList.remove('near'));
    if (nextId) $(`[data-target="${nextId}"]`)?.classList.add('near');
    $('#nearby-text').textContent = nearby ? `${nearby.name} · 按 E 查看${selectedItem ? '，或點擊目標使用道具' : ''}` : '走近物件，找回留在這裡的線索。';
    $('#interact-button').disabled = !nearby;
  }
}
function render() {
  renderMap();
  const [main, detail] = getObjective(state);
  $('#objective-main').textContent = main; $('#objective-detail').textContent = detail;
  $('#bells').innerHTML = Array.from({ length: 8 }, (_, i) => `<span class="bell ${state.bells.includes(i + 1) ? 'rung' : ''}" title="第 ${i + 1} 聲${state.bells.includes(i + 1) ? '已響起' : '尚未響起'}">${icon('bell')}</span>`).join('');
  $('#bell-caption').textContent = state.bells.length ? `第 ${state.bells.length} 聲 ／ 共八聲` : '鐘聲尚未響起';
  $('#bells').setAttribute('aria-label', `八次鐘聲已響起 ${state.bells.length} 次，沒有倒數時間限制`);
  $('#scene-list').innerHTML = Object.entries(WORLD).map(([id, world]) => {
    const unlocked = id === 'S01' || (id === 'S02' ? state.flags.doorOpen : state.solved.includes('P02'));
    return `<li class="scene-row ${id === state.scene ? 'current' : ''} ${unlocked ? '' : 'locked'}" ${id === state.scene ? 'aria-current="location"' : ''}><img src="${world.image}" alt="" loading="lazy"><div><h3>${world.name}</h3><p>${id === state.scene ? '你在這裡' : unlocked ? '已開放 · 可走回探索' : '通路尚未開放'}</p></div></li>`;
  }).join('');
  $('#inventory-slots').innerHTML = ['I01', 'I02', 'I03', 'I04', 'I05'].map(id => state.inventory.includes(id)
    ? `<button class="inventory-slot occupied ${state.used.includes(id) ? 'used' : ''}" data-item="${id}" type="button" aria-label="查看${esc(itemLabels[id])}"><img src="${itemArt[id]}" alt="${esc(itemLabels[id])}"></button>`
    : `<div class="inventory-slot empty" aria-label="空的背包格"></div>`).join('');
  $('#inventory-slots').querySelectorAll('[data-item]').forEach(node => node.addEventListener('click', () => showItem(node.dataset.item)));
  $('#bag-caption').textContent = state.inventory.length ? `已收集 ${state.inventory.length}／5 件物品 · 文件可以重讀` : '重要的物品，都會好好留下。';
  $('#journal-count').textContent = String(state.clues.length);
  $('#sound-button').innerHTML = icon(state.muted ? 'muted' : 'sound');
  $('#sound-button').setAttribute('aria-label', state.muted ? '開啟音效' : '關閉音效');
  $('#sound-button').setAttribute('aria-pressed', String(!state.muted));
  backgroundMusic.setEnabled(!state.muted && !document.hidden);
  effects.setEnabled(!state.muted && !document.hidden);
  $('#selected-tool').hidden = !selectedItem;
  if (selectedItem) {
    $('#selected-tool').innerHTML = `<span>拿著${esc(itemLabels[selectedItem])} · 點擊使用目標</span><button type="button" id="cancel-item">收回背包</button>`;
    $('#cancel-item').addEventListener('click', () => { selectedItem = null; render(); });
  }
}

function showWelcome() {
  clearMovement();
  modal.className = 'modal opening-modal';
  $('#modal-content').innerHTML = `<div class="opening-header"><p class="opening-caption">一場發生在舊校舍的探索與告別</p><h2 id="modal-title" class="opening-title">不存在的<br>第八節課</h2></div><div class="opening-body"><p>2026 年，放學後。身為校史志工的你，走進了即將封存的三年二班。門在身後合上，廣播的點名聲停在一個沒有被唸出的名字。</p><blockquote class="opening-quote">「請在第八次鐘聲，讓全班到齊。」</blockquote><p>走過教室、翻開舊資料，讓一段未完成的告別，重新被記得。</p><p class="opening-note">沒有倒數，也不用害怕答錯。用方向鍵移動，或點擊地面走近；看到物件時按 E。進度會自動保存在此瀏覽器。</p>${hasBadSave ? '<p class="form-feedback">先前的存檔無法讀取。請重新開始；遊戲不會載入不完整的進度。</p>' : ''}<div class="modal-actions">${saved ? '<button class="primary-button" id="continue-game">繼續上次的探索 →</button><button class="secondary-button" id="new-game">重新開始</button>' : '<button class="primary-button" id="new-game">走進舊教室 →</button>'}</div></div>`;
  if (!modal.open) modal.showModal();
  $('#continue-game')?.addEventListener('click', () => { state = saved; sceneId = null; render(); modal.close(); if (state.ended) showEnding(); else { toast('已接續上次進度。'); save(); } });
  $('#new-game').addEventListener('click', () => saved ? confirmRestart() : startNew());
}
function startNew() {
  state = createGame(); saved = null; selectedItem = null; sceneId = null;
  state.muted = false; act({ type: 'START' }, false); modal.close(); toast(story.opening.objective, 6500); game.focus({ preventScroll: true });
}
function confirmRestart() {
  openModal('重新開始這段故事？', '<p>此瀏覽器的遊戲進度將重設，回到第一聲鐘響之前。已生成的素材與作品檔案不受影響。</p><div class="modal-actions"><button class="primary-button" id="confirm-restart">確認重新開始</button><button class="secondary-button" id="cancel-restart">保留進度</button></div>', '請確認是否放下這次的探索', { closable: state.started });
  $('#confirm-restart').addEventListener('click', startNew);
  $('#cancel-restart').addEventListener('click', () => state.started ? closeModal() : showWelcome());
}
function showSettings() {
  openModal('在這裡，慢慢探索', `<p>你是來到舊校舍的校史志工。尋找線索、拾取道具，讓三年二班未完成的點名繼續下去。鐘聲依故事推進，沒有即時倒數。</p><dl class="help-controls"><dt><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></dt><dd>四方向移動角色，也可以點擊地面自動走路。</dd><dt><kbd>E</kbd></dt><dd>查看最近的物件；點擊物件標記也會先走近再互動。</dd><dt><kbd>B</kbd></dt><dd>開啟背包。文件可以重讀；選擇道具後，點擊目標使用。</dd><dt><kbd>Esc</kbd></dt><dd>關閉視窗，或將手上的道具收回背包。</dd></dl><p>閱讀與輸入時角色會停下來。開過的門可以往返；漏拿物品也能回去補取。拾取道具與解開機關是兩件事，別把東西留在抽屜裡。</p><p class="opening-note">目前為第一版：四場景、圖書館便箋支線、三道主要謎題與最後點名。背景音樂為原創 72 BPM chill 電鋼琴與柔和和弦，搭配合成鐘聲；必要廣播以可讀文字呈現。</p><div class="modal-actions"><button class="secondary-button" id="settings-save">手動儲存</button><button class="secondary-button" id="settings-restart">重新開始</button></div>`, '移動、互動、找回一個人的位置');
  $('#settings-save').addEventListener('click', () => { save(); toast(storageAvailable ? '已保存目前進度。' : '目前無法儲存進度。'); });
  $('#settings-restart').addEventListener('click', confirmRestart);
}

function clueText(id) {
  if (NPCS[id] || PROPS[id]) return campusText(id, state);
  if (id === 'blackboard') return state.flags.returned ? '把她的位置留下。\n最後一次點名，請也算上她。' : '請在第八次鐘聲，讓全班到齊。\n廣播：「三年二班，開始點名……十六號……」';
  if (id === 'roster') return `${story.evidence.find(e => e.id === 'E01').text}\n${story.evidence.find(e => e.id === 'E02').text}`;
  if (id === 'science') return story.evidence.find(e => e.id === 'E04').text;
  if (id === 'recordings') return story.audio.filter(a => a.eventId).map(a => `${a.label}｜${a.transcript}`).join('\n\n');
  if (id === 'photo') return state.flags.photoPlaced ? '個人照補進了班級合照。曾在這一班的人，都有自己的位置。' : story.evidence.find(e => e.id === 'E07').text;
  if (id === 'lectern') return state.flags.scriptPlaced ? '完整告別稿已放上講台。廣播：「十七號，林予安。」' : '講台稿架註記：「請放入完整告別稿，讓最後一次點名接續下去。」';
  return '';
}
function record(id) { act({ type: 'READ', target: id }, false); }
function showRead(id) {
  record(id);
  const point = getPoint(state.scene, id);
  let body;
  if (id === 'roster') {
    body = `<img class="modal-art" src="${art.roster}" alt="舊課桌上的資料"><p>泛黃的班級資料，和畢業前留下的座號名單。兩份紀錄的人數，似乎對不上。</p><div class="clue-paper"><div class="document-meta"><span>1998 · 三年二班</span><span>班級資料</span></div>本班原有 <strong>34</strong> 位同學。<div class="roster-grid">${story.classRecord.recordedNumbers.map(n => `<span>${String(n).padStart(2, '0')}</span>`).join('')}</div><p class="roster-summary">現存畢業名單：33 筆，依座號排列。</p></div>`;
  } else if (id === 'science') {
    body = `<img class="modal-art" src="${art.science}" alt="科展公布欄"><p>膠帶遮住了部分姓名，但班級與座號仍清楚可讀。</p><div class="clue-paper"><div class="document-meta"><span>1998 · 科展參展名單</span><span>三年二班</span></div>座號：17<br>姓名：<strong>□予□</strong></div><p class="roster-summary">也許能和另一份同班、同座號的資料比對。背包中的文件可以隨時重讀。</p>`;
  } else {
    body = `<img class="modal-art" src="${art[id] || art.player}" alt="${esc(point.name)}"><div class="clue-paper">${esc(clueText(id))}</div>`;
  }
  openModal(point.name, body, `${WORLD[state.scene].name} · 探索紀錄`);
}
function hintArea(puzzleId) {
  const level = state.hints[puzzleId] || 0, puzzle = story.puzzles.find(p => p.id === puzzleId);
  return `<div class="hint-area"><button id="puzzle-hint" type="button">${level >= 3 ? '重新查看三層提示' : `再給我一點方向（${level}/3）`}</button><ol class="hint-list" id="hint-list">${puzzle.hints.slice(0, level).map(text => `<li>${esc(text)}</li>`).join('')}</ol></div>`;
}
function bindHints(puzzleId) {
  $('#puzzle-hint')?.addEventListener('click', () => {
    act({ type: 'HINT', id: puzzleId }, false);
    const level = state.hints[puzzleId], puzzle = story.puzzles.find(p => p.id === puzzleId);
    $('#hint-list').innerHTML = puzzle.hints.slice(0, level).map(text => `<li>${esc(text)}</li>`).join('');
    $('#puzzle-hint').textContent = level >= 3 ? '已顯示全部提示' : `再給我一點方向（${level}/3）`;
  });
}
function showHints() {
  const id = currentPuzzle(), puzzle = story.puzzles.find(p => p.id === id);
  openModal('留一點空間，給線索', `<p>${esc(puzzle.prompt)}</p><p class="opening-note">提示不會增加鐘聲，也不會消耗道具。先試著觀察，再逐層展開。</p>${hintArea(id)}`, puzzle.title);
  bindHints(id);
}
function currentPuzzle() { return state.solved.includes('P03') ? 'P04' : state.solved.includes('P02') ? 'P03' : state.solved.includes('P01') ? 'P02' : 'P01'; }

function showPuzzle(id) {
  const puzzle = story.puzzles.find(p => p.id === id);
  if (state.solved.includes(id)) {
    if (id === 'P01') return showLoot('drawer', ['I01', 'I02', 'I03'], '打開的抽屜', '三件被留下的物品。請逐一拾取，放進背包。');
    if (id === 'P02') return openModal('補回的名字', `<img class="modal-art" src="${art.register}" alt="班級紀念名冊"><div class="clue-paper">三年二班 · 十七號<br><strong>林予安</strong></div><p style="margin-top:18px">她在畢業前轉學。姓名補回紀念名冊後，旁邊的廣播室資料櫃已經打開。</p>`, '不是消失，只是沒有被記錄');
    return openModal('告別，終於完整', `<img class="modal-art" src="${art.player}" alt="錄音播放機"><div class="clue-paper">${esc(story.evidence.find(e => e.id === 'E06').text)}</div><p style="margin-top:18px">請在設備旁拾取完整告別稿，帶回教室。</p>`, '錄音播放機 · 已還原順序');
  }
  if (id === 'P03') return showSequence();
  const isNumber = id === 'P01';
  const missingCard = !isNumber && !state.inventory.includes('I01');
  openModal(puzzle.title, `<img class="modal-art" src="${isNumber ? art.drawer : art.register}" alt="${isNumber ? '待歸還物品抽屜' : '班級紀念名冊'}"><p>${esc(puzzle.prompt)}</p><div class="clue-paper">${isNumber ? '待歸還物品<br>請輸入缺少的兩位數座號。' : '三年二班 · 十七號<br>姓名：＿＿＿'}</div>${missingCard ? '<p class="hint-document">你還沒有借書卡。可以返回教室，在打開的抽屜中拾取，再比對科展資料。</p>' : ''}<form class="puzzle-form" id="answer-form"><label class="sr-only" for="answer-input">${isNumber ? '兩位數座號' : '完整姓名'}</label><input id="answer-input" name="answer" ${isNumber ? 'inputmode="numeric" maxlength="2"' : 'maxlength="12"'} placeholder="${isNumber ? '輸入兩位數座號' : '輸入完整姓名'}" autocomplete="off" aria-describedby="form-feedback"><button class="primary-button" type="submit">${isNumber ? '轉動抽屜鎖' : '補回紀念名冊'}</button></form><p class="form-feedback" id="form-feedback" role="status"></p>${hintArea(id)}`, `${WORLD[state.scene].name} · ${isNumber ? '第一道謎題' : '第二道謎題'}`);
  bindHints(id);
  $('#answer-form').addEventListener('submit', event => {
    event.preventDefault(); const answer = $('#answer-input').value;
    const result = act({ type: 'SOLVE', id, answer }, false);
    if (!result.ok) { showFormFeedback(result.message); return; }
    toast(result.message, 6500);
    if (isNumber) showLoot('drawer', ['I01', 'I02', 'I03'], '打開的抽屜', '十七號的物品仍在這裡。請逐一拾取，放進背包。');
    else {
      openModal('把名字拼回來了', `<div class="clue-paper"><strong>林予安</strong><br>三年二班 · 十七號</div><p style="margin-top:18px">${esc(result.message)}</p><p>旁邊的資料櫃已開啟，廣播室的通路也開放了。別忘了取出轉學交接單。</p><div class="modal-actions"><button class="primary-button" id="return-explore">繼續探索 →</button></div>`, '第三聲鐘響');
      $('#return-explore').addEventListener('click', closeModal);
    }
  });
}
function showLoot(target, ids, title, intro) {
  openModal(title, `<img class="modal-art" src="${art[target] || art.lectern}" alt="${esc(title)}"><p>${esc(intro)}</p><div class="loot-list">${ids.map(id => {
    const item = story.items.find(i => i.id === id), collected = state.inventory.includes(id);
    return `<div class="loot-row ${collected ? 'collected' : ''}"><img src="${itemArt[id]}" alt="${esc(item.name)}"><div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p></div>${collected ? '<span class="collected-text">✓ 已拾取</span>' : `<button class="secondary-button" data-pickup="${id}" type="button">拾取${esc(itemLabels[id])}</button>`}</div>`;
  }).join('')}</div>`, `${WORLD[state.scene].name} · 拾取後才會放進背包`);
  modal.querySelectorAll('[data-pickup]').forEach(button => button.addEventListener('click', () => {
    const result = act({ type: 'PICKUP', id: button.dataset.pickup });
    if (result.ok) showLoot(target, ids, title, intro);
  }));
}
function showSequence() {
  let order = ['transfer_school', 'return_book', 'read_farewell'];
  const options = Object.fromEntries(story.audio.filter(a => a.eventId).map(a => [a.eventId, a]));
  openModal('被打亂的告別', `<img class="modal-art" src="${art.player}" alt="錄音播放機"><p>三段錄音稿的標籤清楚，順序卻亂了。依照交接單，把最後一天的事件排回來。</p>${state.inventory.includes('I04') ? `<div class="hint-document">${esc(story.evidence.find(e => e.id === 'E05').text)}</div>` : '<div class="hint-document">你還沒有交接單。可以先返回走廊，從資料櫃拾取。</div>'}<div class="sequence-list" id="sequence-list"></div><button class="primary-button" id="check-sequence" type="button">依此順序播放</button><p class="form-feedback" id="form-feedback" role="status"></p>${hintArea('P03')}`, '第三道謎題 · 使用上下按鈕排序');
  function renderSequence() {
    $('#sequence-list').innerHTML = order.map((id, index) => `<div class="sequence-row" data-sequence-id="${id}"><span class="sequence-number">${index + 1}</span><div class="sequence-copy"><strong>${esc(options[id].label)}</strong><p>${esc(options[id].transcript)}</p></div><div class="sequence-buttons"><button type="button" data-index="${index}" data-swap="-1" aria-label="將${esc(options[id].label)}往前移" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-index="${index}" data-swap="1" aria-label="將${esc(options[id].label)}往後移" ${index === 2 ? 'disabled' : ''}>↓</button></div></div>`).join('');
    modal.querySelectorAll('[data-swap]').forEach(button => button.addEventListener('click', () => {
      const i = Number(button.dataset.index), j = i + Number(button.dataset.swap);
      [order[i], order[j]] = [order[j], order[i]]; renderSequence();
    }));
  }
  renderSequence(); bindHints('P03');
  $('#check-sequence').addEventListener('click', () => {
    const result = act({ type: 'SOLVE', id: 'P03', answer: order }, false);
    if (!result.ok) { showFormFeedback(result.message); return; }
    openModal('這次，聽見了她的告別', `<div class="clue-paper">${esc(story.evidence.find(e => e.id === 'E06').text)}</div><p style="margin-top:18px">完整告別稿已放在設備旁。請走近拾取，帶回教室，讓她的位置留在全班合照中。</p><div class="modal-actions"><button class="primary-button" id="return-explore">去拾取告別稿 →</button></div>`, '第四聲鐘響');
    $('#return-explore').addEventListener('click', closeModal);
  });
}

function showBag() {
  if (!state.inventory.length) return openModal('背包裡，還沒有物品', '<p>靠近場景中的物件互動。機關打開後，別忘了逐一拾取道具。</p>', '重要的物品都能保留，不必擔心背包裝不下');
  openModal('你的背包', `<p class="opening-note">文件可以隨時重讀。要使用道具，先拿起，再點擊場景中的目標；角色會走近後使用。</p><div class="loot-list">${state.inventory.map(id => {
    const item = story.items.find(i => i.id === id);
    return `<div class="loot-row"><img src="${itemArt[id]}" alt=""><div><h3>${esc(item.name)}</h3><p>${state.used.includes(id) ? (id === 'I03' ? '已使用 · 內門保持開放' : '已放置 · 保留紀錄') : esc(item.description)}</p></div><button class="secondary-button" data-view-item="${id}" type="button">查看${esc(itemLabels[id])}</button></div>`;
  }).join('')}</div>`, `${state.inventory.length} 件物品 · 可重讀、可回頭補拿`);
  modal.querySelectorAll('[data-view-item]').forEach(button => button.addEventListener('click', () => showItem(button.dataset.viewItem)));
}
function showItem(id) {
  if (!state.inventory.includes(id)) return;
  const item = story.items.find(i => i.id === id), used = state.used.includes(id);
  const documentText = id === 'I01' ? '借書卡 · 1998 年三年二班\n座號：17\n姓名：林□安\n姓名的中間一字已磨損。' : id === 'I04' ? story.evidence.find(e => e.id === 'E05').text : id === 'I05' ? story.evidence.find(e => e.id === 'E06').text : item.description;
  openModal(item.name, `<div class="bag-detail"><img src="${itemArt[id]}" alt="${esc(item.name)}"><div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><p class="item-state">${used ? (id === 'I03' ? '已使用，內門保持開放。' : '已放置，仍可查看這份紀錄。') : '好好保存在你的背包裡。'}</p></div></div><div class="clue-paper" style="margin-top:20px">${esc(documentText)}</div><div class="modal-actions">${['I02', 'I03', 'I05'].includes(id) && !used ? '<button class="primary-button" id="select-item" type="button">拿起這件道具</button>' : ''}<button class="secondary-button" id="back-to-bag" type="button">返回背包</button></div>`, '背包中的物品');
  $('#back-to-bag').addEventListener('click', showBag);
  $('#select-item')?.addEventListener('click', () => { selectedItem = id; render(); modal.close(); toast(`已拿起${itemLabels[id]}。點擊場景中的使用目標。`); });
}
function showUseTarget(id) {
  record(id);
  const point = getPoint(state.scene, id), appropriate = { photo: 'I02', lectern: 'I05' }[id];
  const available = state.inventory.filter(item => ['I02', 'I03', 'I05'].includes(item) && !state.used.includes(item));
  const finalCall = id === 'lectern' && state.flags.scriptPlaced && !state.ended;
  openModal(point.name, `<img class="modal-art" src="${art[id]}" alt="${esc(point.name)}"><div class="clue-paper">${esc(clueText(id))}</div>${state.flags.photoPlaced && id === 'photo' ? `<img style="width:75px;height:100px;object-fit:cover;margin-top:15px" src="${itemArt.I02}" alt="已放回的個人照">` : ''}${finalCall ? '<p style="margin-top:20px">第七聲鐘響。這一次，你可以代她回答。</p><div class="modal-actions"><button class="primary-button" id="answer-roll-call">代為回應：「到。」</button></div>' : `<p style="margin-top:20px">${available.length ? '從背包選一件道具，對這裡使用。' : '也許需要一件能放在這裡的物品。可以繼續探索，之後再回來。'}</p><div class="modal-actions">${available.sort((a, b) => Number(b === appropriate) - Number(a === appropriate)).map(item => `<button class="secondary-button" data-use-item="${item}" type="button">使用${esc(itemLabels[item])}</button>`).join('')}</div>`}`, '讓留下的物品，找到自己的位置');
  bindUseButtons(id);
  $('#answer-roll-call')?.addEventListener('click', () => {
    const result = act({ type: 'ANSWER' }, false);
    if (result.ok) {
      openModal('第八聲鐘響', '<div class="clue-paper">「到。轉學，也是我們班的一員。」</div><p style="margin-top:20px">走廊的校舍出口終於開了。窗外的光回到熟悉的顏色。<br>帶著這段記憶，親自走出去吧。</p><div class="modal-actions"><button class="primary-button" id="leave-classroom">前往校舍出口 →</button></div>', '最後一次點名，終於完整');
      $('#leave-classroom').addEventListener('click', closeModal);
    } else toast(result.message);
  });
}
function useItem(id, target) {
  const result = act({ type: 'USE', id, target }, false);
  if (!result.ok) { toast(result.message); return; }
  selectedItem = null; render(); toast(result.message, 6500);
  if (target === 'lectern') showUseTarget(target); else if (modal.open) modal.close();
}
function bindUseButtons(target) { modal.querySelectorAll('[data-use-item]').forEach(button => button.addEventListener('click', () => useItem(button.dataset.useItem, target))); }
function showDoor(id) {
  const point = getPoint(state.scene, id), open = doorOpen(point);
  if (open) { walkToPoint(id, true); return; }
  let message = id === 'exit' ? '出口像被一段未結束的點名鎖住。不是這把內門鑰匙能打開的門。' : id === 'library-door' ? '圖書館的校史資料還在整理，請先在紀念名冊確認十七號的姓名。' : id === 'broadcast-door' ? '廣播室門旁寫著：「請先把紀念名冊中的十七號補完整。」' : '內門鎖住了。鑰匙應該和待歸還物品放在一起。';
  openModal(point.name, `<img class="modal-art" src="${art.door}" alt="鎖住的門"><p>${message}</p>${id === 'class-door' && state.scene === 'S01' && state.inventory.includes('I03') ? '<div class="modal-actions"><button class="primary-button" data-use-item="I03">使用鑰匙開門</button></div>' : '<p class="opening-note">可以先回頭探索。必要道具不會因為用錯位置而消失。</p>'}`, '通路尚未開啟');
  bindUseButtons(id);
}
function interact(id) {
  if (!state.started || !canInteract(state, id)) return;
  const point = getPoint(state.scene, id);
  if (selectedItem) return useItem(selectedItem, id);
  if (NPCS[id] || PROPS[id]) return showCampus(id);
  if (['blackboard', 'roster', 'science', 'recordings'].includes(id)) return showRead(id);
  if (point.kind === 'door') return showDoor(id);
  if (id === 'drawer') return showPuzzle('P01');
  if (id === 'register') return showPuzzle('P02');
  if (id === 'player') return showPuzzle('P03');
  if (id === 'photo' || id === 'lectern') return showUseTarget(id);
  if (id === 'cabinet') {
    if (!state.solved.includes('P02')) return openModal('還沒打開的資料櫃', '<p>櫃上標記著「三年二班 · 十七號」。紀念名冊的姓名還留著空白。</p>', '先找回名字，再翻開下一頁');
    return showLoot('cabinet', ['I04'], '打開的資料櫃', '一張轉學交接單，留下了最後一天的順序。');
  }
  if (id === 'script') {
    if (!state.solved.includes('P03')) return openModal('設備旁的稿架', '<p>稿架還空著。播放設備中的三段錄音，似乎還沒有接回原本的順序。</p>', '告別，還沒說完');
    return showLoot('script', ['I05'], '完整告別稿', '拾取後帶回教室。合照和講台，都還在等著你。');
  }
}
function showCampus(id) {
  const result = act({ type: 'READ', target: id }, false);
  if (!result.ok) return;
  const npc = NPCS[id], prop = PROPS[id];
  if (npc) {
    openModal(npc.name, `<div class="npc-conversation"><img class="npc-portrait" src="${npc.image}" alt="${esc(npc.name)}"><div><p class="npc-role">${esc(npc.role)}</p><p id="npc-dialogue" role="status">${esc(npcGreeting(id,state))}</p></div></div><div class="dialogue-options">${npc.topics.map(([question],i) => `<button type="button" class="secondary-button" data-topic="${i}">${esc(question)}</button>`).join('')}</div><div class="modal-actions"><button type="button" class="text-button" id="leave-conversation">先去別處看看 →</button></div>`, '校園相遇 · 可自由交談');
    modal.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.topic);
      $('#npc-dialogue').textContent = npc.topics[index][1];
      effects.play('paper');
      modal.querySelectorAll('[data-topic]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    }));
    $('#leave-conversation').addEventListener('click', closeModal);
  } else {
    openModal(prop.name, `<img class="modal-art" src="${prop.image}" alt="${esc(prop.name)}"><div class="clue-paper">${esc(prop.text)}</div><p class="opening-note" style="margin-top:18px">你把這段校園日常記在探索筆記裡。物品留在原處，不占用背包。</p>`, '校園物件 · 查看與觀察');
  }
}
function showJournal() {
  const entries = state.clues.map(id => { const point = Object.values(WORLD).flatMap(w => w.points).find(p => p.id === id); return `<article class="journal-entry"><h3>${esc(point?.name || id)}</h3><p>${esc(clueText(id))}</p></article>`; }).join('');
  openModal('探索筆記', entries || '<p>筆記還是空白。走近黑板、文件或物件互動，看過的線索會留在這裡。</p>', '記住看過的線索，不代替你解答');
}
function walkToPoint(id, forceDoor = false) {
  if (!state.started || modal.open) return;
  const point = getPoint(state.scene, id);
  if (!point) return;
  const enterDoor = point.kind === 'door' && doorOpen(point) && !selectedItem;
  if (!enterDoor && canInteract(state, id)) return interact(id);
  const goal = enterDoor || forceDoor ? [point.x, point.y] : point.stand;
  path = findPath(state.scene, [state.player.x, state.player.y], goal);
  if (!path.length) return toast('這裡無法直接走過去，試著從通道繞行。');
  keys.clear(); intent = { target: id, door: enterDoor || forceDoor };
  showDestination(goal);
}
function showDestination([x, y]) { $('#destination').style.left = `${x / 10}%`; $('#destination').style.top = `${y / 6.67}%`; $('#destination').hidden = false; }
function travelIfAtDoor(timestamp) {
  const point = WORLD[state.scene].points.find(p => p.kind === 'door' && distance(state.player, p) < 26);
  if (!point || (state.ended && point.id === 'exit')) return false;
  if (!doorOpen(point)) {
    if (timestamp - blockedDoorAt > 3500) { toast(point.id === 'exit' ? '最後的點名還沒結束，校舍出口尚未開放。' : ['broadcast-door','library-door'].includes(point.id) ? '先把紀念名冊的姓名補回來。' : '內門鎖著。先從背包使用鑰匙。'); blockedDoorAt = timestamp; }
    path = []; intent = null; $('#destination').hidden = true; return false;
  }
  const wasEnded = state.ended;
  const result = act({ type: 'TRAVEL', target: point.id }, false);
  if (!result.ok) return false;
  clearMovement();
  if (state.ended && !wasEnded) showEnding();
  else {
    const arrival = $('#scene-arrival'); arrival.textContent = WORLD[state.scene].name;
    arrival.classList.remove('show'); void arrival.offsetWidth; arrival.classList.add('show');
    if (state.scene === 'S01' && state.flags.returned) toast('黑板上的字變了：「把她的位置留下。」');
  }
  return true;
}
function showEnding() {
  openModal('一個都沒有少', `<img class="ending-portrait" src="${itemArt.I02}" alt="被放回班級紀念冊的林予安個人照"><p>你走出了校舍。第八節課，終於下課了。</p><p class="ending-quote">「離開教室的人，<br>不該因此被擦掉。」</p><p>當年畢業前轉學的林予安，沒有消失。她的照片、名字與告別，重新成為班級記憶的一部分。</p><section class="memorial"><h3>曾在這一班的我們 · 34 位同學</h3><div class="roster-grid">${Array.from({ length: 34 }, (_, i) => `<span ${i === 16 ? 'style="background:#d1dac0;border-color:#829173"' : ''}>${String(i + 1).padStart(2, '0')}${i === 16 ? ' · 到' : ''}</span>`).join('')}</div><p class="memorial-note">十七號：林予安，畢業前轉學。這是校史紀念頁，不是當年的正式畢業名冊。</p></section><div class="modal-actions"><button class="secondary-button" id="ending-restart">重新走進故事</button><button class="secondary-button" id="ending-return">看看留下的校舍</button></div>`, 'END01 · 最後一次點名，完整了');
  $('#ending-restart').addEventListener('click', confirmRestart);
  $('#ending-return').addEventListener('click', closeModal);
}

function bindControls() {
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !button.disabled) effects.play('click');
  });
  document.addEventListener('keydown', event => {
    if (event.repeat || event.target.matches('input,textarea,select')) return;
    if (['e', 'b', 'escape', 'enter', ' '].includes(event.key.toLowerCase())) effects.play('click');
  });
  $('#brand-icon').innerHTML = icon('book'); $('#objective-icon').innerHTML = icon('target'); $('#map-icon').innerHTML = icon('map'); $('#bag-icon').innerHTML = icon('bag'); $('#journal-icon').innerHTML = icon('note');
  $('#settings-button').innerHTML = icon('settings');
  const volumeControl = document.createElement('input');
  volumeControl.type = 'range'; volumeControl.min = '0'; volumeControl.max = '100'; volumeControl.value = '45';
  volumeControl.setAttribute('aria-label', '背景音樂音量'); volumeControl.title = '背景音樂音量';
  volumeControl.style.cssText = 'width:64px;accent-color:#697a58';
  volumeControl.addEventListener('input', () => backgroundMusic.setVolume(Number(volumeControl.value) / 100));
  $('#sound-button').after(volumeControl);
  $('#bag-button').addEventListener('click', showBag); $('#journal-button').addEventListener('click', showJournal); $('#hint-button').addEventListener('click', showHints); $('#settings-button').addEventListener('click', showSettings);
  $('#sound-button').addEventListener('click', () => { state.muted = !state.muted; render(); save(); if (!state.muted) chime(); toast(state.muted ? '音效已關閉，所有線索仍有文字。' : '音效已開啟。'); });
  $('#interact-button').addEventListener('click', () => nearestId && interact(nearestId));
  game.addEventListener('click', event => {
    if (event.target.closest('button') || modal.open || !state.started) return;
    const rect = game.getBoundingClientRect(), goal = [(event.clientX - rect.left) / rect.width * 1000, (event.clientY - rect.top) / rect.height * 667];
    if (!walkable(state.scene, ...goal)) return toast('那裡是牆壁或家具，試著走在空地上。');
    path = findPath(state.scene, [state.player.x, state.player.y], goal); intent = null; keys.clear();
    if (path.length) showDestination(goal);
  });
  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (modal.open) return;
    if (!state.started) return;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault(); path = []; intent = null; $('#destination').hidden = true; keys.add(key);
    }
    if (key === 'e' && !event.repeat && nearestId) { event.preventDefault(); interact(nearestId); }
    if (key === 'b' && !event.repeat) { event.preventDefault(); showBag(); }
    if (key === 'escape') { selectedItem = null; clearMovement(); render(); }
  });
  window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => { clearMovement(); save(); });
  document.addEventListener('visibilitychange', () => { effects.setEnabled(!state.muted && !document.hidden); backgroundMusic.setEnabled(!state.muted && !document.hidden); if (document.hidden) { clearMovement(); save(); } });
  window.addEventListener('pagehide', save);
  for (const button of document.querySelectorAll('[data-direction]')) {
    const direction = 'arrow' + button.dataset.direction;
    button.addEventListener('pointerdown', event => { event.preventDefault(); if (!modal.open) { path = []; intent = null; keys.add(direction); button.setPointerCapture(event.pointerId); } });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, () => keys.delete(direction));
  }
}
let previousFrame = 0;
function frame(timestamp) {
  const dt = Math.min(.04, Math.max(0, (timestamp - previousFrame) / 1000)); previousFrame = timestamp;
  let moving = false;
  if (state.started && !modal.open && !document.hidden) {
    if (!state.ended) state.elapsed += dt;
    let dx = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
    let dy = Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'));
    const speed = 190;
    if (dx || dy) { const length = Math.hypot(dx, dy); dx = dx / length * speed * dt; dy = dy / length * speed * dt; }
    else if (path.length) {
      let next = path[0], distanceToNext = Math.hypot(next[0] - state.player.x, next[1] - state.player.y);
      if (distanceToNext < .03) {
        state = { ...state, player: { ...state.player, x: next[0], y: next[1] } };
        path.shift(); next = path[0]; distanceToNext = next ? Math.hypot(next[0] - state.player.x, next[1] - state.player.y) : 0;
      }
      if (next && distanceToNext) { const step = Math.min(speed * dt, distanceToNext); dx = (next[0] - state.player.x) / distanceToNext * step; dy = (next[1] - state.player.y) / distanceToNext * step; }
    }
    if (dx || dy) {
      const old = state.player; state = movePlayer(state, dx, dy);
      moving = Math.abs(state.player.x - old.x) + Math.abs(state.player.y - old.y) > .05;
      if (travelIfAtDoor(timestamp)) { renderPosition(false); requestAnimationFrame(frame); return; }
    }
    if (!path.length && intent) {
      const next = intent; intent = null; $('#destination').hidden = true;
      if (!next.door) interact(next.target);
    } else if (!path.length) $('#destination').hidden = true;
    if (timestamp - lastSaveTime > 2000) { save(); lastSaveTime = timestamp; }
  }
  renderPosition(moving); requestAnimationFrame(frame);
}

try {
  const response = await fetch(new URL('../content/story.json', import.meta.url));
  if (!response.ok) throw new Error('故事資料未成功載入');
  story = await response.json();
  try { const raw = localStorage.getItem(SAVE_KEY); saved = raw ? restore(raw) : null; hasBadSave = Boolean(raw && !saved); }
  catch { storageAvailable = false; }
  bindControls(); render(); showWelcome(); requestAnimationFrame(frame);
} catch (error) {
  console.error(error);
  $('.game-layout').innerHTML = '<div class="loading-error"><h1>校舍的資料還沒準備好</h1><p>請透過本機伺服器開啟遊戲：在作品資料夾執行 <code>npm start</code>，再開啟 <a href="http://127.0.0.1:4173">http://127.0.0.1:4173</a>。若已使用伺服器，請確認 content/story.json 存在後重新整理。</p></div>';
}
