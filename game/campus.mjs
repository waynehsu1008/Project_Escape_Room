// Optional campus stories never grant required items, solve puzzles or ring bells.
const asset = file => `assets/generated/campus/${file}-v1.png`;
export const NPCS = {
  'npc-caretaker': {
    name: '周伯', role: '校舍管理員', image: asset('npc-caretaker'),
    greeting: '你也是來整理校史的？我才把掃具放好，外頭的門就推不開了。別急，先把事情一件件看清楚。',
    afterName: '原來她是畢業前轉走的。名冊少了一行，不代表那張課桌從來沒有人坐過。',
    afterEnding: '門開了，這回真的可以收工。明天我會把這裡掃乾淨，但該留下的東西，一樣都不會丟。',
    topics: [
      ['你怎麼也在這裡？', '我在這裡工作很多年了。今天幫你們整理封存的教室，掃到一半，廣播忽然開始點名。別把我當成什麼神祕人物，我只是想準時回家吃飯。'],
      ['這裡的鐘準嗎？', '牆上的鐘停過好幾回。我整理時沒裝電池，所以別拿它計時。要找班上的人，還是看當年留下的資料。'],
      ['有沒有什麼可疑的東西？', '每一屆學生都會留下些小東西：雨傘、保溫瓶、借來沒還的球。看起來神祕，很多時候只是忘了帶回家。']
    ]
  },
  'npc-alumnus': {
    name: '許學長', role: '回校幫忙的校友', image: asset('npc-alumnus'),
    greeting: '我也來找當年的照片。走廊怎麼又繞回同一塊門牌……像有人不想讓今天的整理草草結束。',
    afterName: '你把名字找回來了。轉學的人也和我們一起上過課，只看最後一本畢業名冊，確實會漏掉一些回憶。',
    afterEnding: '紀念頁留的是一起度過的日子，不是只有最後一起拿證書的人。這一次，整理得完整多了。',
    topics: [
      ['你記得以前的三年二班嗎？', '記得下課時走廊很吵，有人練球，有人排廣播值日。可是我的記憶不夠可靠，年月一久，連同班和隔壁班都可能記混。資料上的班級和座號，才有辦法互相比對。'],
      ['那張失物招領單是線索嗎？', '我剛才也盯著上面的號碼看。後來才發現是器材室的物品編號。不是每一串數字都用來開鎖。'],
      ['你為什麼回來？', '我想找回一張運動會照片。那天我們跑了最後一名，卻笑得最大聲。有時候留下來的，不一定是最風光的事。']
    ]
  },
  'npc-broadcast': {
    name: '小禾', role: '廣播社校史志工', image: asset('npc-broadcast'),
    greeting: '我負責整理舊錄音。剛剛設備自己亮了，不過放心，我檢查過電線，沒有漏電。這裡留下的每段聲音，都有一份文字稿。',
    afterName: '交接單說的是一個人離校前做過的事。聽錄音很有氣氛，但順序還是要回到文字裡找依據。',
    afterEnding: '最後那聲「到」，我有聽見。修好機器很容易，讓一句沒說完的告別被聽見，才是今天最重要的事。',
    topics: [
      ['這些卡帶都要聽嗎？', '不用每一卷都聽。這裡有晨操音樂、午休廣播和空白帶。和今天有關的錄音已經整理在播放設備裡，其他是校園的日常。'],
      ['設備旁的線能拔嗎？', '那是已停用的延長線，我已經綁好。不是什麼解謎機關，別拆開它；你可以專心看稿件。'],
      ['你最喜歡哪段廣播？', '不是得獎名單，是以前的點歌節目。有個人每週都點同一首歌，卻從來不寫收件人。很多心事就是這樣，被藏在普通的一天裡。']
    ]
  }
};
export const PROPS = {
  'old-basketball': { name: '器材籃裡的籃球', image: asset('prop-basketball'), text: '球皮已磨平，籃上掛著「體育課後請歸還」的牌子。籃底只有粉筆灰，沒有鑰匙。這是一段校園日常，不是必需的通關道具。' },
  'old-thermos': { name: '忘記帶走的保溫瓶', image: asset('prop-thermos'), text: '瓶底貼著「08」的班級清潔輪值貼紙。瓶蓋轉得開，裡面是空的。數字只是物品管理標記，並非抽屜的答案。' },
  'chalk-box': { name: '粉筆與值日生字條', image: 'assets/objects/campus-01-chalkboard-v1.png', text: '「最後離開的人，記得擦黑板。」盒裡只剩一小截白粉筆。字條背面是一局沒下完的井字棋，沒有隱藏密碼。' },
  'lost-umbrella': { name: '雨傘與滴乾的水痕', image: 'assets/objects/campus-10-classroom-door-v1.png', text: '傘柄的姓名貼已經看不清楚。周伯把它靠在牆邊，免得絆到整理資料的人。雨早就停了，這把傘不需要拿走。' },
  'lost-notice': { name: '失物招領單', image: 'assets/objects/campus-06-science-bulletin-board-v1.png', text: '「球袋 08、保溫瓶 12、雨傘 06。請至器材室認領。」末尾有人畫了一隻打呵欠的貓。這是物品編號，和座號名單是不同的紀錄。' },
  'old-bench': { name: '長椅上的塗鴉', image: 'assets/objects/campus-02-student-desk-v1.png', text: '椅背刻著：「放學一起去吃冰。」旁邊又補了一句：「考完再說。」也許對找人沒有幫助，卻讓空蕩的走廊忽然有了聲音。' },
  'spare-cassette': { name: '寫著午休的卡帶', image: asset('prop-cassette'), text: '標籤寫著「午休用，請勿覆錄」。小禾說這卷只剩老舊的測試音，不是今天要排序的三段錄音稿。它留在原處就好。' },
  'power-cord': { name: '收好的舊延長線', image: 'assets/objects/campus-09-cassette-player-v1.png', text: '線已拔除並綁上停用標籤。旁邊貼著新的檢修紀錄。這不是需要剪斷或拆開的機關。' },
  'archive-box': { name: '校慶節目單紙箱', image: 'assets/objects/campus-08-archive-cabinet-v1.png', text: '一疊校慶節目單：合唱、短劇、點歌時間。有人把錯字改了又改，留下好幾層筆跡。紙箱裡沒有新的通關道具，只有被認真準備過的日子。' }
};
const point = (id, x, y, stand) => ({ id, name: (NPCS[id] || PROPS[id]).name, kind: NPCS[id] ? 'npc' : 'flavor', x, y, stand, range: 85, sprite: NPCS[id]?.image || (['old-basketball','old-thermos','spare-cassette'].includes(id) ? PROPS[id].image : null) });
export const CAMPUS_POINTS = {
  S01: [point('npc-caretaker',150,450,[200,450]),point('old-basketball',780,470,[730,470]),point('old-thermos',110,290,[160,290]),point('chalk-box',650,145,[650,190]),point('lost-umbrella',145,565,[190,550])],
  S02: [point('npc-alumnus',320,350,[370,350]),point('lost-notice',190,125,[190,180]),point('old-bench',350,140,[350,185])],
  S03: [point('npc-broadcast',750,400,[700,400]),point('spare-cassette',660,300,[660,350]),point('power-cord',270,250,[270,300]),point('archive-box',800,160,[800,220])]
};
export function npcGreeting(id, state) {
  const npc = NPCS[id];
  if (!npc) return '';
  return state.flags.exitOpen ? npc.afterEnding : state.solved.includes('P02') ? npc.afterName : npc.greeting;
}
export function campusText(id, state) { return NPCS[id] ? npcGreeting(id,state) : PROPS[id]?.text || ''; }
