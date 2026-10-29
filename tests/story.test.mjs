import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// 小安的獨立內容檢核，不是 game/ 的執行邏輯或整合測試框架。
const loadStory = async () => JSON.parse(await readFile(new URL('../content/story.json', import.meta.url), 'utf8'));
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function validateRoster(story) {
  const { originalCount, recordedNumbers, missingNumber } = story.classRecord;
  assert.equal(originalCount, 34);
  assert.equal(recordedNumbers.length, originalCount - 1);
  assert.equal(new Set(recordedNumbers).size, recordedNumbers.length);
  assert.ok(recordedNumbers.every(n => Number.isInteger(n) && n >= 1 && n <= originalCount));
  const missing = Array.from({ length: originalCount }, (_, i) => i + 1).filter(n => !recordedNumbers.includes(n));
  assert.deepEqual(missing, [17]);
  assert.equal(missingNumber, 17);
  assert.equal(story.puzzles.find(p => p.id === 'P01').answer, String(missingNumber));
  assert.ok(story.evidence.find(e => e.id === 'E01').text.includes(String(originalCount)));
  const displayedRoster = story.evidence.find(e => e.id === 'E02').text;
  assert.ok(displayedRoster.includes(String(recordedNumbers.length)));
  assert.ok(displayedRoster.includes(recordedNumbers.join('、')), '畫面名單文字與結構化名單必須一致');
}

function validateName(story) {
  const clues = story.nameClues;
  assert.equal(clues.length, 2);
  assert.ok(clues.every(c => c.classId === story.classRecord.classId && c.number === 17));
  assert.ok(clues.every(c => [...c.mask].length === 3));
  const restored = Array.from({ length: 3 }, (_, i) => {
    const letters = new Set(clues.map(c => [...c.mask][i]).filter(c => c !== '□'));
    assert.equal(letters.size, 1, `姓名第 ${i + 1} 字應有且只有一種有依據的讀法`);
    return [...letters][0];
  }).join('');
  assert.equal(restored, '林予安');
  assert.equal(story.puzzles.find(p => p.id === 'P02').answer, restored);
  for (const clue of clues) {
    const evidence = story.evidence.find(e => e.id === clue.evidenceId);
    assert.ok(evidence.text.includes(clue.mask));
    assert.ok(evidence.text.includes('17'));
  }
}

function validateSequence(story) {
  const expected = ['return_book', 'read_farewell', 'transfer_school'];
  const puzzle = story.puzzles.find(p => p.id === 'P03');
  assert.deepEqual(puzzle.answer, expected);
  assert.deepEqual(story.departureOrder, expected);
  assert.deepEqual([...puzzle.options].sort(), [...expected].sort());
  assert.equal(new Set(puzzle.options).size, 3);
  const text = story.evidence.find(e => e.id === 'E05').text;
  assert.ok(text.includes('先把借的書還了'));
  assert.ok(text.includes('再把告別廣播稿'));
  assert.ok(text.includes('最後辦好轉學'));
}

function validateFlow(story) {
  const solved = new Set();
  const openScenes = new Set(story.initialSceneIds);
  const inventory = new Set(story.initialItemIds);
  const pending = new Map(story.puzzles.map(p => [p.id, p]));
  while (pending.size) {
    let progressed = false;
    for (const [id, puzzle] of pending) {
      if (!puzzle.requiresPuzzles.every(p => solved.has(p))) continue;
      if (!openScenes.has(puzzle.sceneId)) continue;
      if (!puzzle.requiredItemIds.every(i => inventory.has(i))) continue;
      const evidenceAvailable = puzzle.evidenceIds.every(id => {
        const evidence = story.evidence.find(e => e.id === id);
        return evidence && openScenes.has(evidence.sceneId)
          && evidence.requiresPuzzles.every(p => solved.has(p));
      });
      if (!evidenceAvailable) continue;
      solved.add(id);
      puzzle.rewardItemIds.forEach(i => inventory.add(i));
      puzzle.unlockSceneIds.forEach(s => openScenes.add(s));
      pending.delete(id);
      progressed = true;
    }
    assert.ok(progressed, `無法推進的題目／線索依賴：${[...pending.keys()].join(', ')}`);
  }
  assert.deepEqual([...solved].sort(), ['P01', 'P02', 'P03', 'P04']);
}

function validateReferences(story) {
  const collections = ['scenes', 'evidence', 'items', 'puzzles', 'audio', 'endings'];
  const ids = collections.flatMap(key => story[key].map(entry => entry.id));
  assert.ok(ids.every(nonempty));
  assert.equal(new Set(ids).size, ids.length, '所有內容 ID 必須唯一');
  const by = key => new Set(story[key].map(entry => entry.id));
  const sceneIds = by('scenes');
  const puzzleIds = by('puzzles');
  const evidenceIds = by('evidence');
  const itemIds = by('items');
  const endingIds = by('endings');
  const verifyIds = new Set(Array.from({ length: 12 }, (_, i) => `V-A${String(i + 1).padStart(2, '0')}`));
  for (const entry of story.evidence) {
    assert.ok(sceneIds.has(entry.sceneId));
    assert.ok(entry.requiresPuzzles.every(id => puzzleIds.has(id)));
    assert.ok(nonempty(entry.text));
  }
  for (const puzzle of story.puzzles) {
    assert.ok(nonempty(puzzle.prompt) && nonempty(puzzle.failureText) && nonempty(puzzle.revealText));
    assert.ok(sceneIds.has(puzzle.sceneId));
    assert.ok(puzzle.requiresPuzzles.every(id => puzzleIds.has(id)));
    assert.ok(puzzle.evidenceIds.every(id => evidenceIds.has(id)));
    assert.ok([...puzzle.requiredItemIds, ...puzzle.rewardItemIds].every(id => itemIds.has(id)));
    assert.ok(puzzle.unlockSceneIds.every(id => sceneIds.has(id)));
    assert.ok(puzzle.verifyIds.length && puzzle.verifyIds.every(id => verifyIds.has(id)));
    if (puzzle.endingId) assert.ok(endingIds.has(puzzle.endingId));
  }
  assert.ok(story.initialSceneIds.every(id => sceneIds.has(id)));
  assert.ok(story.initialItemIds.every(id => itemIds.has(id)));
  for (const item of story.items) assert.ok(nonempty(item.name) && nonempty(item.description));
  for (const scene of story.scenes) assert.ok(nonempty(scene.name) && nonempty(scene.description));
}

test('T-A01 開場有玩家身分與目標，沒有提前揭露姓名', async () => {
  const story = await loadStory();
  assert.equal(story.title, '不存在的第八節課');
  assert.ok(story.opening.text.includes('校史志工'));
  assert.ok(story.opening.text.includes('第八次鐘聲'));
  assert.ok(story.opening.text.includes('全班到齊'));
  assert.ok(!story.opening.text.includes('林予安'));
  assert.ok(!story.opening.text.includes('轉學'));
});

test('T-A02 名單只缺 17，P01 答案有證據', async () => validateRoster(await loadStory()));
test('T-A03 錯誤名單或錯誤解答會被拒絕', async () => {
  for (const change of [s => s.classRecord.recordedNumbers.push(17), s => s.classRecord.recordedNumbers[0] = 17, s => s.puzzles[0].answer = '18']) {
    const story = await loadStory(); change(story); assert.throws(() => validateRoster(story));
  }
});
test('T-A04 姓名有兩份同人線索，可唯一還原', async () => validateName(await loadStory()));
test('T-A05 缺少姓名字元、座號錯置或文字與遮罩不符會被拒絕', async () => {
  for (const change of [s => s.nameClues[1].mask = '□□□', s => s.nameClues[1].number = 18, s => s.evidence.find(e => e.id === 'E03').text = '無姓名線索']) {
    const story = await loadStory(); change(story); assert.throws(() => validateName(story));
  }
});
test('T-A06 交接單與還書、廣播、轉學順序一致', async () => validateSequence(await loadStory()));
test('T-A07 交換錄音稿順序會被拒絕', async () => {
  const story = await loadStory();
  story.puzzles.find(p => p.id === 'P03').answer = ['read_farewell', 'return_book', 'transfer_school'];
  assert.throws(() => validateSequence(story));
});
test('T-A08 身分、轉學與逐題揭露一致', async () => {
  const story = await loadStory();
  assert.equal(story.student.status, 'transferred');
  assert.equal(story.student.name, '林予安');
  assert.ok(!story.puzzles[0].revealText.includes(story.student.name));
  assert.ok(story.puzzles[1].revealText.includes(story.student.name));
  assert.ok(story.puzzles[1].revealText.includes('轉學'));
  assert.ok(story.puzzles[2].revealText.includes('告別'));
  assert.ok(story.endings[0].text.includes('轉學'));
});
test('T-A09 每題三層提示，完整答案不直接寫入提示', async () => {
  const story = await loadStory();
  for (const puzzle of story.puzzles) {
    assert.equal(puzzle.hints.length, 3);
    assert.equal(new Set(puzzle.hints).size, 3);
    assert.ok(puzzle.hints.every(nonempty));
    assert.ok(puzzle.hints.every(h => !h.includes(puzzle.spoilerText)));
  }
});
test('T-A10 題目、道具與場景可依序取得，沒有循環依賴', async () => validateFlow(await loadStory()));
test('T-A11 循環或藏在題目後面的必要線索會被拒絕', async () => {
  for (const change of [s => s.puzzles[0].requiresPuzzles = ['P03'], s => s.evidence.find(e => e.id === 'E04').sceneId = 'S03']) {
    const story = await loadStory(); change(story); assert.throws(() => validateFlow(story));
  }
});
test('T-A12 八次鐘聲皆一次性，無倒數或不可逆錯誤懲罰', async () => {
  const story = await loadStory();
  assert.deepEqual(story.bellEvents.map(e => e.number), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(new Set(story.bellEvents.map(e => e.trigger)).size, 8);
  assert.ok(story.bellEvents.every(e => e.once === true));
  assert.equal(story.rules.realTimeCountdown, false);
  assert.equal(story.rules.consumeRequiredItemsOnError, false);
  assert.equal(story.rules.failureEnding, false);
  assert.equal(story.rules.hintsAdvanceBells, false);
  assert.equal(story.rules.wrongAnswersAdvanceBells, false);
  assert.equal(story.rules.sceneRevisitsAdvanceBells, false);
});
test('T-A13 必要音訊都有文字稿', async () => {
  const story = await loadStory();
  assert.ok(story.audio.length >= 3);
  assert.ok(story.audio.every(a => nonempty(a.transcript)));
  assert.equal(story.rules.audioRequiredToSolve, false);
});
test('T-A14 照片與告別稿先取得，先放照片再回應才通往結局', async () => {
  const story = await loadStory();
  const final = story.puzzles.find(p => p.id === 'P04');
  assert.deepEqual(final.requiresPuzzles, ['P03']);
  assert.ok(final.requiredItemIds.includes('I02') && final.requiredItemIds.includes('I05'));
  assert.deepEqual(final.answer, ['restore_group_photo', 'answer_roll_call']);
  assert.equal(final.endingId, 'END01');
  assert.equal(story.endings.length, 1);
  assert.equal(story.endings[0].exitOpen, true);
  assert.equal(story.endings[0].bellNumber, 8);
  assert.ok(story.endings[0].text.includes('34'));
  assert.equal(story.audio.find(a => a.id === 'A05').transcript, '十七號，林予安。');
  assert.ok(story.audio.find(a => a.id === 'A06').transcript.startsWith('到。'));
});
test('T-A15 內容 ID、引用與必需文字完整', async () => validateReferences(await loadStory()));
test('T-A17 測試會抓到錯誤而不修改來源資料', async () => {
  const original = await loadStory();
  const copy = structuredClone(original);
  copy.puzzles.find(p => p.id === 'P02').answer = '林子安';
  assert.throws(() => validateName(copy));
  assert.deepEqual(await loadStory(), original);
});
