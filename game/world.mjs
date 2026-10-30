// Coordinates use a 1000 × 667 world; images, hit targets and collision share it.
export const SIZE = { width: 1000, height: 667 };
const point = (id, name, kind, x, y, stand, extra = {}) => ({ id, name, kind, x, y, stand, range: 88, ...extra });
export const WORLD = {
  S01: {
    name: '舊教室', subtitle: '三年二班 · 放學之後', number: '01',
    image: 'assets/maps/campus-01-classroom-v1.png', spawn: [500, 530],
    floor: [[50, 155, 900, 450], [460, 590, 80, 67]],
    obstacles: [[281, 224, 75, 80], [463, 224, 75, 80], [640, 224, 75, 80], [281, 331, 75, 80], [463, 331, 75, 80], [640, 331, 75, 80], [188, 120, 122, 78], [50, 330, 50, 65], [50, 500, 65, 90], [855, 520, 90, 75]],
    points: [
      point('blackboard', '黑板上的字', 'read', 485, 133, [485, 190]),
      point('roster', '班級資料與名單', 'read', 320, 348, [255, 350], { range: 96 }),
      point('drawer', '待歸還物品抽屜', 'puzzle', 868, 165, [868, 215]),
      point('photo', '留白的班級合照', 'use', 827, 100, [800, 177], { range: 105 }),
      point('lectern', '講台與稿架', 'use', 230, 150, [220, 215], { range: 96 }),
      point('class-door', '通往走廊', 'door', 500, 625, [500, 580], { to: 'S02', arrival: [500, 550], range: 90 })
    ]
  },
  S02: {
    name: '走廊資料區', subtitle: '熟悉的門牌 · 陌生的名字', number: '02',
    image: 'assets/maps/campus-02-corridor-v1.png', spawn: [500, 550],
    floor: [[45, 150, 910, 445], [460, 580, 80, 80], [450, 110, 70, 70], [935, 310, 65, 90]],
    obstacles: [[748, 183, 155, 100], [47, 253, 38, 120], [46, 444, 50, 66], [825, 552, 92, 35]],
    points: [
      point('science', '科展公布欄', 'read', 835, 106, [825, 160], { range: 108 }),
      point('register', '班級紀念名冊', 'puzzle', 817, 215, [810, 307], { range: 112 }),
      point('cabinet', '廣播室資料櫃', 'pickup', 937, 106, [925, 175], { range: 100 }),
      point('class-door', '返回舊教室', 'door', 500, 625, [500, 575], { to: 'S01', arrival: [500, 540] }),
      point('broadcast-door', '通往廣播室', 'door', 480, 130, [480, 185], { to: 'S03', arrival: [500, 550] }),
      point('exit', '校舍出口', 'door', 974, 350, [918, 350], { to: 'END01', range: 95 })
    ]
  },
  S03: {
    name: '廣播室', subtitle: '一段還沒說完的告別', number: '03',
    image: 'assets/generated/broadcast-room-v1.png', spawn: [500, 550],
    floor: [[88, 210, 824, 375], [445, 565, 115, 95]],
    obstacles: [[455, 168, 76, 62], [870, 220, 60, 160]],
    points: [
      point('recordings', '散落的錄音稿', 'read', 224, 125, [225, 220], { range: 118 }),
      point('player', '錄音播放機', 'puzzle', 385, 165, [385, 232], { range: 105 }),
      point('script', '告別稿拾取處', 'pickup', 638, 165, [638, 235], { range: 105 }),
      point('corridor-door', '返回走廊', 'door', 500, 625, [500, 575], { to: 'S02', arrival: [480, 215] })
    ]
  }
};

export function getPoint(scene, id) { return WORLD[scene]?.points.find(p => p.id === id); }
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function walkable(scene, x, y) {
  const world = WORLD[scene];
  if (!world || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const inside = world.floor.some(([a, b, w, h]) => x >= a && x <= a + w && y >= b && y <= b + h);
  return inside && !world.obstacles.some(([a, b, w, h]) => x > a - 10 + .001 && x < a + w + 10 - .001 && y > b - 9 + .001 && y < b + h + 9 - .001);
}

// A small BFS grid supplies collision-aware click/touch movement, without teleporting.
export function findPath(scene, start, goal) {
  const step = 15, cols = 68, rows = 46;
  const key = (x, y) => y * cols + x;
  const cell = ([x, y]) => [Math.round(x / step), Math.round(y / step)];
  const allowed = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && walkable(scene, x * step, y * step);
  let [sx, sy] = cell(start), [gx, gy] = cell(goal);
  if (!walkable(scene, ...goal)) return [];
  const nearest = (x, y) => {
    for (let r = 0; r < 5; r++) for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (allowed(x + a, y + b)) return [x + a, y + b];
    return null;
  };
  const source = nearest(sx, sy), destination = nearest(gx, gy);
  if (!source || !destination) return [];
  [sx, sy] = source; [gx, gy] = destination;
  const queue = [[sx, sy]], previous = new Map([[key(sx, sy), null]]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (x === gx && y === gy) {
      const path = [];
      let cursor = [x, y];
      while (cursor) { path.push([cursor[0] * step, cursor[1] * step]); cursor = previous.get(key(...cursor)); }
      path.reverse(); path.push(goal); return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, next = key(nx, ny);
      if (allowed(nx, ny) && !previous.has(next)) { previous.set(next, [x, y]); queue.push([nx, ny]); }
    }
  }
  return [];
}
