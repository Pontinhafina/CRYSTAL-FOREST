'use strict';
/* ===== Constantes globais ===== */
const T = 32, VW = 960, VH = 544, ROWS = 17;
const C = {
  dark: '#2A1B3D', deep: '#1B1128', teal: '#2EE6C5', mag: '#FF4FA3', gold: '#FFD54A',
  green: '#3DBE6B', sky: '#6EC8FF', cream: '#FFF8E7', orange: '#FF8A3D', purple: '#58357B'
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ===== Construtor de fases =====
   Grade: 0 vazio | 1 solido | 2 plataforma fina | 3 espinhos
   Entidades usam coordenadas de tile. Para "pe no chao" y = linha do topo do chao. */
class Level {
  constructor(W, theme, name, sub) {
    this.W = W; this.theme = theme; this.name = name; this.sub = sub;
    this.g = Array.from({ length: ROWS }, () => new Array(W).fill(0));
    this.e = []; this.start = [2, 14]; this.cache = null;
  }
  solid(x, y, w, h) {
    h = h == null ? ROWS - y : h;
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++)
      if (j >= 0 && j < ROWS && i >= 0 && i < this.W) this.g[j][i] = 1;
    return this;
  }
  oneway(x, y, w) { for (let i = x; i < x + w; i++) this.g[y][i] = 2; return this; }
  spikes(x, y, w) { for (let i = x; i < x + w; i++) this.g[y][i] = 3; return this; }
  add(type, x, y, o) { this.e.push(Object.assign({ type, x, y }, o || {})); return this; }
  crystals(x, y, n, dx = 1, dy = 0) { for (let k = 0; k < n; k++) this.add('crystal', x + k * dx, y + k * dy); return this; }
  arc(x, y, n, h) {
    for (let k = 0; k < n; k++) this.add('crystal', x + k, y - Math.sin((k / Math.max(1, n - 1)) * Math.PI) * h);
    return this;
  }
}

function level1() {
  const L = new Level(120, 0, 'Floresta Sussurrante', 'Fase 1');
  [[0, 16], [19, 33], [36, 52], [56, 72], [76, 90], [93, 120]].forEach(([a, b]) => L.solid(a, 14, b - a));
  L.start = [2, 14];
  L.crystals(6, 12, 3);
  L.oneway(10, 11, 4); L.crystals(10, 10, 4);
  L.arc(15, 11, 5, 2.2);
  L.add('spring', 21, 14); L.oneway(20, 8, 5); L.crystals(20, 7, 5); L.add('star', 22, 6);
  L.solid(25, 12, 3, 2); L.crystals(25, 11, 3);
  L.add('blobby', 30, 14);
  L.arc(32, 11, 5, 2);
  L.crystals(37, 12, 3);
  L.add('spiky', 40, 14);
  L.spikes(44, 13, 2); L.arc(43, 11, 4, 2.3); L.add('buzz', 48, 9);
  L.add('mplat', 52, 13, { axis: 'x', range: 64, w: 64 });
  L.add('check', 58, 14); L.add('spiky', 61, 14); L.add('blobby', 63, 14);
  L.solid(66, 12, 4, 2); L.crystals(66, 11, 4); L.add('buzz', 68, 8);
  L.arc(71, 11, 6, 2); L.oneway(73, 12, 2);
  L.add('blobby', 80, 14); L.add('golem', 85, 14);
  L.oneway(78, 10, 3); L.crystals(78, 9, 3); L.add('heart', 88, 12);
  L.arc(89, 11, 5, 2);
  L.add('check', 95, 14); L.add('spiky', 99, 14); L.add('blobby', 103, 14); L.add('buzz', 106, 9);
  L.crystals(100, 11, 5);
  L.add('goal', 114, 14);
  return L;
}

function level2() {
  const L = new Level(130, 1, 'Cavernas Cintilantes', 'Fase 2');
  L.solid(0, 0, 130, 2);
  [[0, 14], [17, 28], [31, 40], [44, 58], [62, 70], [74, 90], [94, 108], [112, 130]].forEach(([a, b]) => L.solid(a, 14, b - a));
  L.start = [2, 14];
  L.crystals(5, 12, 3); L.solid(8, 12, 3, 2); L.crystals(8, 11, 3);
  L.arc(13, 11, 5, 2);
  L.add('blobby', 21, 14); L.add('buzz', 24, 9);
  L.oneway(22, 10, 4); L.crystals(22, 9, 4); L.spikes(25, 13, 2);
  L.oneway(28, 12, 3); L.crystals(28, 11, 3);
  L.add('check', 32, 14); L.spikes(34, 13, 3); L.arc(33, 10, 5, 2.5); L.add('golem', 38, 14);
  L.add('mplat', 40, 13, { axis: 'x', range: 64, w: 64 });
  L.add('spiky', 47, 14);
  L.solid(50, 11, 3, 1); L.crystals(50, 12, 3);
  L.add('blobby', 52, 14); L.add('buzz', 50, 9); L.add('buzz', 55, 8); L.spikes(55, 13, 2);
  L.arc(57, 11, 5, 2); L.oneway(59, 11, 2);
  L.add('golem', 65, 14); L.add('heart', 68, 12);
  L.add('mplat', 70, 14, { axis: 'y', range: 96, w: 64 });
  L.spikes(78, 13, 2); L.add('blobby', 81, 14); L.spikes(84, 13, 2);
  L.oneway(79, 9, 5); L.crystals(79, 8, 5); L.add('star', 81, 7); L.add('buzz', 87, 9);
  L.arc(89, 11, 6, 2.2);
  L.add('check', 95, 14); L.add('spiky', 97, 14); L.add('blobby', 100, 14); L.add('golem', 103, 14);
  L.spikes(106, 13, 2); L.arc(107, 11, 6, 2);
  L.crystals(113, 12, 4);
  L.add('buzz', 116, 9); L.add('blobby', 118, 14); L.add('buzz', 121, 8);
  L.add('goal', 126, 14);
  return L;
}

function level3() {
  const L = new Level(150, 2, 'Ilhas Celestiais', 'Fase 3');
  [[0, 13, 10], [13, 12, 6], [22, 11, 5], [30, 12, 4], [37, 10, 6], [46, 12, 6], [55, 13, 5], [63, 11, 6],
   [72, 12, 4], [79, 10, 5], [87, 12, 6], [96, 13, 8], [108, 12, 5], [116, 13, 7]]
    .forEach(([x, y, w]) => L.solid(x, y, w, 2));
  L.solid(125, 14, 25, 3); L.solid(149, 0, 1, 17);
  L.start = [2, 13];
  L.crystals(4, 11, 4); L.add('blobby', 7, 13);
  L.arc(9, 10, 6, 2);
  L.crystals(14, 10, 4);
  L.arc(18, 9, 5, 2);
  L.add('blobby', 24, 11); L.crystals(22, 9, 4);
  L.add('buzz', 28, 9);
  L.crystals(30, 10, 4);
  L.add('heart', 38, 9); L.add('star', 41, 6); L.crystals(40, 8, 3);
  L.add('spiky', 49, 12); L.arc(43, 9, 4, 2);
  L.add('check', 57, 13); L.crystals(55, 11, 4);
  L.add('buzz', 61, 9);
  L.add('golem', 66, 11); L.crystals(64, 9, 4);
  L.crystals(72, 10, 4);
  L.add('blobby', 81, 10); L.crystals(79, 8, 5);
  L.add('spiky', 90, 12); L.add('buzz', 85, 8);
  L.add('golem', 100, 13); L.add('buzz', 98, 9); L.crystals(97, 11, 6);
  L.add('mplat', 105, 12, { axis: 'y', range: 64, w: 64 });
  L.crystals(109, 10, 3);
  L.add('check', 118, 13); L.crystals(117, 11, 4);
  L.oneway(129, 11, 4); L.oneway(142, 11, 4); L.oneway(135, 8, 4);
  L.add('boss', 137, 14);
  return L;
}

const LEVELS = [level1, level2, level3];
