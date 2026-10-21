'use strict';
/* ====================================================================
   CRYSTAL FOREST - logica do jogo
   ==================================================================== */
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

/* ---------- Salvamento ---------- */
const SAVE_KEY = 'crystal_forest_save_v1';
let save = { unlocked: 1, stars: [0, 0, 0], music: 40, sfx: 70 };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };

/* ---------- Audio (WebAudio, sem arquivos) ---------- */
let AC = null;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(f, d, type = 'square', vol = .15, slide = 0, delay = 0, bus = 'sfx') {
  const a = ac(); if (!a) return;
  const v = vol * (bus === 'sfx' ? save.sfx : save.music) / 100; if (v <= 0.0005) return;
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + .03);
}
const sfx = {
  jump: () => tone(380, .16, 'square', .12, 380),
  dj: () => tone(520, .18, 'square', .12, 520),
  coin: () => { tone(880, .08, 'triangle', .2); tone(1320, .14, 'triangle', .2, 0, .07); },
  stomp: () => { tone(260, .14, 'square', .18, -160); tone(520, .1, 'triangle', .14, 200, .05); },
  hurt: () => tone(220, .35, 'sawtooth', .2, -160),
  dash: () => tone(500, .16, 'sawtooth', .09, -300),
  spring: () => tone(300, .3, 'square', .15, 700),
  check: () => { tone(660, .1, 'triangle', .2); tone(990, .2, 'triangle', .2, 0, .1); },
  heart: () => { tone(523, .1, 'triangle', .2); tone(659, .1, 'triangle', .2, 0, .1); tone(784, .2, 'triangle', .2, 0, .2); },
  star: () => [0, 1, 2, 3].forEach(i => tone(660 + i * 220, .2, 'triangle', .2, 0, i * .08)),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', .22, 0, i * .12)),
  boom: () => { tone(120, .5, 'sawtooth', .25, -80); tone(70, .6, 'square', .2, -30); },
  shoot: () => tone(700, .15, 'square', .08, -400),
  die: () => { tone(400, .5, 'sawtooth', .2, -350); }
};
/* musica procedural simples */
const SCALES = [[0, 2, 4, 7, 9, 12, 9, 7], [0, 3, 5, 7, 10, 12, 10, 7], [0, 4, 7, 11, 12, 11, 7, 4]];
const ROOTS = [196, 164.8, 261.6];
let musicStep = 0, musicOn = false, musicTheme = 0;
setInterval(() => {
  if (!musicOn || !AC) return;
  const sc = SCALES[musicTheme], r = ROOTS[musicTheme], s = musicStep++;
  const n = sc[s % 8] + (Math.floor(s / 8) % 2 ? 5 : 0);
  tone(r * Math.pow(2, n / 12), .28, 'triangle', .07, 0, 0, 'music');
  if (s % 4 === 0) tone(r / 2 * Math.pow(2, (Math.floor(s / 8) % 2 ? 5 : 0) / 12), .5, 'sine', .12, 0, 0, 'music');
}, 230);

/* ---------- Entrada ---------- */
const keys = {}, pressed = {}, vk = {}, vkp = {};
const isJump = c => c === 'Space' || c === 'ArrowUp' || c === 'KeyW';
addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true; ac();
  if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) togglePause();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (G.state === 'play') togglePause(); });
const inp = {
  left: () => keys.ArrowLeft || keys.KeyA || vk.left,
  right: () => keys.ArrowRight || keys.KeyD || vk.right,
  jumpHeld: () => keys.Space || keys.ArrowUp || keys.KeyW || vk.jump,
  jumpPress: () => pressed.Space || pressed.ArrowUp || pressed.KeyW || vkp.jump,
  dashPress: () => pressed.ShiftLeft || pressed.ShiftRight || pressed.KeyX || pressed.KeyK || vkp.dash
};
document.querySelectorAll('#touch button').forEach(b => {
  const k = b.dataset.k;
  const down = e => { e.preventDefault(); ac(); if (!vk[k]) vkp[k] = true; vk[k] = true; b.classList.add('on'); };
  const up = e => { e.preventDefault(); vk[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
});
if ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0) document.body.classList.add('touch');

/* ---------- Escala da tela ---------- */
function fit() {
  const touch = document.body.classList.contains('touch');
  const s = Math.min(innerWidth / VW, (innerHeight - (touch ? 0 : 0)) / VH);
  $('stage').style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize', fit); fit();

/* ---------- Estado ---------- */
const G = {
  state: 'menu', L: null, li: 0, p: null, cam: 0, t: 0, time: 0, shake: 0,
  enemies: [], items: [], plats: [], springs: [], checks: [], goal: null, parts: [], shots: [], rocks: [],
  boss: null, bossDef: null, check: null, lives: 3, deadT: 0, intro: 0,
  gems: 0, totalGems: 0, star: false, deaths: 0, levelTime: 0, goalOpen: true, sealed: false
};

/* ---------- Colisao com tiles ---------- */
function tileAt(L, tx, ty) {
  if (tx < 0 || tx >= L.W) return 1;
  if (ty < 0 || ty >= ROWS) return 0;
  return L.g[ty][tx];
}
function moveX(b, L, dt) {
  b.x += b.vx * dt;
  const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - .01) / T);
  const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - .01) / T);
  let hit = false;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tileAt(L, tx, ty) === 1) {
      if (b.vx > 0) b.x = tx * T - b.w; else if (b.vx < 0) b.x = (tx + 1) * T;
      hit = true;
    }
  }
  return hit;
}
function moveY(b, L, dt) {
  const prevBottom = b.y + b.h;
  b.y += b.vy * dt; b.onGround = false;
  const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - .01) / T);
  const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - .01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = tileAt(L, tx, ty);
    if (t === 1) {
      if (b.vy > 0) { b.y = ty * T - b.h; b.onGround = true; b.vy = 0; }
      else if (b.vy < 0) { b.y = (ty + 1) * T; b.vy = 0; }
    } else if (t === 2 && b.vy >= 0 && prevBottom <= ty * T + 1 && b.y + b.h > ty * T) {
      b.y = ty * T - b.h; b.onGround = true; b.vy = 0;
    }
  }
}

/* ---------- Particulas ---------- */
function burst(x, y, n, cols, spd = 160, life = .6, size = 4) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, s = spd * (.3 + Math.random() * .7);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life, max: life, col: cols[i % cols.length], s: size * (.6 + Math.random() * .8), g: 400 });
  }
}
function dust(x, y, n = 4) {
  for (let i = 0; i < n; i++) G.parts.push({ x: x + (Math.random() - .5) * 14, y, vx: (Math.random() - .5) * 60, vy: -Math.random() * 40, life: .35, max: .35, col: 'rgba(255,248,231,.7)', s: 3 + Math.random() * 3, g: 0 });
}
function updateParticles(dt) {
  for (const q of G.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; }
  G.parts = G.parts.filter(q => q.life > 0);
}

/* ---------- Criacao de entidades ---------- */
function spawn(d) {
  const cx = d.x * T + T / 2, fy = d.y * T;
  switch (d.type) {
    case 'crystal': G.items.push({ k: 'crystal', x: d.x * T + 8, y: d.y * T + 8, w: 16, h: 16, ph: Math.random() * 6 }); break;
    case 'heart': G.items.push({ k: 'heart', x: d.x * T + 6, y: d.y * T + 6, w: 20, h: 20 }); break;
    case 'star': G.items.push({ k: 'star', x: d.x * T + 2, y: d.y * T + 2, w: 28, h: 28 }); break;
    case 'blobby': G.enemies.push({ t0: 'blobby', w: 30, h: 24, x: cx - 15, y: fy - 24, vx: 0, vy: 0, dir: -1, speed: 50, hp: 1, t: Math.random() * 5, hitCd: 0 }); break;
    case 'spiky': G.enemies.push({ t0: 'spiky', w: 34, h: 26, x: cx - 17, y: fy - 26, vx: 0, vy: 0, dir: -1, speed: 70, hp: 1, t: Math.random() * 5, hitCd: 0 }); break;
    case 'golem': G.enemies.push({ t0: 'golem', w: 38, h: 42, x: cx - 19, y: fy - 42, vx: 0, vy: 0, dir: -1, speed: 34, hp: 2, t: Math.random() * 5, hitCd: 0 }); break;
    case 'buzz': G.enemies.push({ t0: 'buzz', w: 24, h: 22, x: cx - 12, y: d.y * T, bx: cx, by: d.y * T, vx: 0, vy: 0, dir: -1, hp: 1, t: Math.random() * 6, hitCd: 0 }); break;
    case 'spring': G.springs.push({ x: d.x * T + 2, y: fy - 14, w: 28, h: 14, comp: 0 }); break;
    case 'check': G.checks.push({ x: d.x * T + 8, y: fy - 64, w: 16, h: 64, on: false, px: d.x * T + 16, py: fy }); break;
    case 'goal': G.goal = { x: cx - 24, y: fy - 74, w: 48, h: 74 }; break;
    case 'mplat': G.plats.push({ x: d.x * T, y: d.y * T, w: d.w || 64, h: 14, ox: d.x * T, oy: d.y * T, axis: d.axis, range: d.range, s: 0, dir: 1, speed: 55, dx: 0, dy: 0 }); break;
    case 'boss': G.bossDef = d; break;
  }
}
function makeBoss() {
  const d = G.bossDef;
  return { x: d.x * T - 50, y: -160, w: 100, h: 100, state: 'wait', t: 0, hp: 6, max: 6, vx: 0, vy: 0, inv: 0, cycle: 0, atkT: 1.5, rockT: 3, homeY: 3 * T, tx: 0, active: false };
}

/* ---------- Iniciar fase ---------- */
function startLevel(i) {
  const L = LEVELS[i](); G.L = L; G.li = i;
  if (!L.cache) buildCache(L);
  Object.assign(G, { enemies: [], items: [], plats: [], springs: [], checks: [], goal: null, parts: [], shots: [], rocks: [], boss: null, bossDef: null,
    lives: 3, deadT: 0, gems: 0, star: false, deaths: 0, levelTime: 0, shake: 0, sealed: false, goalOpen: true });
  L.e.forEach(spawn);
  G.totalGems = G.items.filter(it => it.k === 'crystal').length;
  if (G.bossDef) { G.goalOpen = false; G.boss = makeBoss(); G.goal = null; }
  G.check = { x: L.start[0] * T + 5, y: L.start[1] * T - 30 };
  G.p = newPlayer(G.check.x, G.check.y);
  G.cam = clamp(G.p.x - VW / 2, 0, L.W * T - VW);
  G.state = 'play'; G.intro = 2.6; musicTheme = L.theme; musicOn = true; musicStep = 0;
  ['menu', 'levels', 'settings', 'pause', 'over', 'complete'].forEach(s => $(s).classList.add('hidden'));
  $('hud').classList.remove('hidden'); $('bossbar').classList.add('hidden');
  $('lvname').textContent = L.sub + ' - ' + L.name;
  hudKey = ''; updateHUD();
}
function newPlayer(x, y) {
  return { x, y, w: 22, h: 30, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, jumps: 0, dash: 0, dashCd: 0, inv: 0, hurt: 0,
    plat: null, anim: 0, spin: 0, squash: 0, dead: false, hp: 3, cutOK: false, dustT: 0 };
}

/* ---------- Jogador ---------- */
function hurtPlayer(srcX) {
  const p = G.p;
  if (p.inv > 0 || p.dash > 0 || p.dead) return;
  p.hp--; p.inv = 1.6; p.hurt = .35; p.vy = -340; p.vx = (p.x + p.w / 2 < srcX ? -1 : 1) * 230; p.dash = 0;
  G.shake = 8; sfx.hurt(); burst(p.x + 11, p.y + 12, 8, [C.mag, C.cream], 150);
  if (p.hp <= 0) killPlayer();
}
function killPlayer() {
  const p = G.p; if (p.dead) return;
  p.dead = true; G.lives--; G.deaths++; G.deadT = 1.2; sfx.die();
  burst(p.x + 11, p.y + 14, 22, [C.teal, C.mag, C.gold, C.cream], 260, .9, 5);
  if (G.boss && G.boss.active) G.shake = 12;
}
function respawn() {
  if (G.lives <= 0) { gameOver(); return; }
  const p = G.p = newPlayer(G.check.x, G.check.y); p.inv = 1.5;
  if (G.boss && G.boss.active) { // reinicia a luta
    G.boss = makeBoss(); G.shots = []; G.rocks = [];
    if (G.sealed) { for (let j = 0; j < 14; j++) G.L.g[j][124] = 0; G.sealed = false; G.L.cache = null; buildCache(G.L); }
    $('bossbar').classList.add('hidden');
  }
  hudKey = '';
}
function updatePlayer(dt) {
  const p = G.p, L = G.L;
  if (p.dead) return;
  if (inp.jumpPress()) p.jumpBuf = .12;
  const dir = (inp.right() ? 1 : 0) - (inp.left() ? 1 : 0);
  p.coyote = p.onGround ? .1 : Math.max(0, p.coyote - dt);
  p.jumpBuf = Math.max(0, p.jumpBuf - dt); p.dashCd = Math.max(0, p.dashCd - dt);
  p.inv = Math.max(0, p.inv - dt); p.hurt = Math.max(0, p.hurt - dt); p.spin = Math.max(0, p.spin - dt);
  p.squash = Math.max(0, p.squash - dt * 5);
  if (p.plat) p.x += p.plat.dx; p.plat = null;
  if (dir && p.hurt <= 0) p.face = dir;

  if (inp.dashPress() && p.dashCd <= 0 && p.hurt <= 0 && p.dash <= 0) {
    p.dash = .2; p.dashCd = .9; p.vy = 0; sfx.dash();
  }
  if (p.dash > 0) {
    p.dash -= dt; p.vx = p.face * 560; p.vy = 0;
    if (Math.random() < .8) G.parts.push({ x: p.x + 11 - p.face * 8, y: p.y + 8 + Math.random() * 16, vx: 0, vy: 0, life: .3, max: .3, col: Math.random() < .5 ? C.teal : C.sky, s: 6, g: 0 });
  } else {
    if (p.hurt <= 0) {
      const target = dir * 255, acc = p.onGround ? 2400 : 1500;
      if (dir) p.vx += clamp(target - p.vx, -acc * dt, acc * dt);
      else p.vx -= clamp(p.vx, -2800 * dt, 2800 * dt);
    }
    if (!p.onGround && p.jumps === 0 && p.coyote <= 0) p.jumps = 1;
    if (p.jumpBuf > 0) {
      if (p.coyote > 0) { p.vy = -620; p.jumps = 1; p.coyote = 0; p.jumpBuf = 0; p.cutOK = true; sfx.jump(); dust(p.x + 11, p.y + p.h, 5); }
      else if (p.jumps < 2) { p.vy = -560; p.jumps = 2; p.jumpBuf = 0; p.spin = .4; p.cutOK = true; sfx.dj(); burst(p.x + 11, p.y + p.h, 6, [C.teal, C.cream], 90, .4, 3); }
    }
    if (p.vy < 0 && !inp.jumpHeld() && p.cutOK) { p.vy *= .5; p.cutOK = false; }
    p.vy = Math.min(p.vy + 1800 * dt, 900);
  }
  if (moveX(p, L, dt)) p.vx = 0;
  const wasGround = p.onGround, pvy = p.vy;
  const prevBottom = p.y + p.h;
  moveY(p, L, dt);
  // plataformas moveis
  for (const m of G.plats) {
    if (p.vy >= 0 && p.x + p.w > m.x + 2 && p.x < m.x + m.w - 2 && prevBottom <= m.y - m.dy + 6 && p.y + p.h >= m.y) {
      p.y = m.y - p.h; p.vy = 0; p.onGround = true; p.plat = m;
    }
  }
  // molas
  for (const s of G.springs) {
    s.comp = Math.max(0, s.comp - dt * 4);
    if (p.vy >= 0 && p.x + p.w > s.x && p.x < s.x + s.w && p.y + p.h >= s.y && prevBottom <= s.y + 8) {
      p.vy = -880; p.y = s.y - p.h; p.jumps = 1; p.cutOK = false; s.comp = 1; sfx.spring(); burst(s.x + 14, s.y, 8, [C.mag, C.gold], 120, .4, 3); p.onGround = false;
    }
  }
  if (p.onGround) {
    if (!wasGround && pvy > 200) { dust(p.x + 11, p.y + p.h, 6); p.squash = Math.min(1, pvy / 700); }
    p.jumps = 0;
    p.dustT -= dt;
    if (Math.abs(p.vx) > 150 && p.dustT <= 0) { dust(p.x + 11 - p.face * 8, p.y + p.h, 1); p.dustT = .1; }
  }
  p.anim += dt * (Math.abs(p.vx) / 255);
  // espinhos
  const tx0 = Math.floor((p.x + 4) / T), tx1 = Math.floor((p.x + p.w - 4) / T), ty = Math.floor((p.y + p.h - 4) / T);
  for (let tx = tx0; tx <= tx1; tx++) if (tileAt(L, tx, ty) === 3 && p.y + p.h > ty * T + 12) hurtPlayer(tx * T + 16);
  if (p.y > (ROWS + 2) * T) killPlayer();
}

/* ---------- Plataformas moveis ---------- */
function updatePlats(dt) {
  for (const m of G.plats) {
    const ox = m.x, oy = m.y;
    m.s += m.speed * dt * m.dir;
    if (m.s > m.range) { m.s = m.range; m.dir = -1; } else if (m.s < 0) { m.s = 0; m.dir = 1; }
    if (m.axis === 'x') m.x = m.ox + m.s; else m.y = m.oy - m.s;
    m.dx = m.x - ox; m.dy = m.y - oy;
  }
}

/* ---------- Inimigos ---------- */
function killEnemy(e, burstCols) {
  e.dying = true; e.dt = 0; sfx.stomp();
  burst(e.x + e.w / 2, e.y + e.h / 2, 12, burstCols || [C.teal, C.cream, C.gold], 190, .6, 4);
}
function damageEnemy(e) {
  if (e.hitCd > 0) return false;
  e.hp--;
  if (e.hp <= 0) { killEnemy(e); return true; }
  e.hitCd = .6; sfx.stomp(); burst(e.x + e.w / 2, e.y + 8, 8, [C.cream, C.gold], 140, .4, 3); e.dir = -e.dir;
  return true;
}
function updateEnemies(dt) {
  const L = G.L, p = G.p;
  for (const e of G.enemies) {
    if (e.dying) { e.dt += dt; if (e.dt > .5) e.rm = true; continue; }
    e.t += dt; e.hitCd = Math.max(0, e.hitCd - dt);
    if (e.t0 === 'buzz') {
      const ox = e.x;
      e.x = e.bx + Math.sin(e.t * 1.2) * 85 - e.w / 2; e.y = e.by + Math.sin(e.t * 2.4) * 22;
      e.dir = e.x >= ox ? 1 : -1;
    } else {
      e.vx = e.dir * e.speed; e.vy = Math.min(e.vy + 1800 * dt, 900);
      if (moveX(e, L, dt)) e.dir *= -1;
      moveY(e, L, dt);
      if (e.onGround) {
        const ax = e.dir > 0 ? e.x + e.w + 3 : e.x - 3, at = tileAt(L, Math.floor(ax / T), Math.floor((e.y + e.h + 4) / T));
        if (at !== 1 && at !== 2) e.dir *= -1;
      }
    }
    if (p.dead || e.hitCd > 0) continue;
    const pr = { x: p.x + 2, y: p.y + 2, w: p.w - 4, h: p.h - 3 };
    if (!rectHit(pr, e)) continue;
    const stomp = p.vy > 0 && (p.y + p.h - e.y) < 18 && e.t0 !== 'spiky';
    if (p.dash > 0) { if (e.t0 === 'golem') damageEnemy(e); else killEnemy(e); }
    else if (stomp) { damageEnemy(e); p.vy = inp.jumpHeld() ? -640 : -460; p.jumps = 1; p.cutOK = false; p.squash = 0; dust(p.x + 11, p.y + p.h, 4); }
    else hurtPlayer(e.x + e.w / 2);
  }
  G.enemies = G.enemies.filter(e => !e.rm);
}

/* ---------- Itens, checkpoints, objetivo ---------- */
function updateItems(dt) {
  const p = G.p; if (p.dead) return;
  const pr = { x: p.x - 2, y: p.y - 4, w: p.w + 4, h: p.h + 4 };
  for (const it of G.items) {
    if (it.got || !rectHit(pr, it)) continue;
    it.got = true; const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
    if (it.k === 'crystal') { G.gems++; sfx.coin(); burst(cx, cy, 6, [C.teal, C.cream], 110, .4, 3); }
    else if (it.k === 'star') { G.star = true; sfx.star(); burst(cx, cy, 22, [C.gold, C.cream], 220, .8, 5); }
    else if (it.k === 'heart') { if (p.hp < 3) p.hp++; else G.lives = Math.min(5, G.lives + 1); sfx.heart(); burst(cx, cy, 12, [C.mag, C.cream], 150, .6, 4); }
    hudKey = '';
  }
  G.items = G.items.filter(it => !it.got);
  for (const k of G.checks) if (!k.on && rectHit(pr, k)) {
    k.on = true; G.check = { x: k.px - 11, y: k.py - 31 }; sfx.check(); burst(k.px, k.py - 50, 14, [C.teal, C.gold, C.cream], 160, .7, 4);
  }
  if (G.goal && G.goalOpen && rectHit(pr, G.goal)) completeLevel();
  for (const m of G.plats) m.dx = m.dx; // noop (mantem dx para o frame)
}

/* ---------- Chefe ---------- */
function updateBoss(dt) {
  const b = G.boss, p = G.p, L = G.L; if (!b) return;
  const floor = 14 * T;
  if (!b.active) {
    if (!p.dead && p.x > 127 * T) {
      b.active = true; b.state = 'enter'; b.x = 137 * T - 50; b.y = -140;
      for (let j = 0; j < 14; j++) L.g[j][124] = 1; G.sealed = true; L.cache = null; buildCache(L);
      $('bossbar').classList.remove('hidden'); G.shake = 10; sfx.boom(); musicTheme = 1; hudKey = '';
    }
    return;
  }
  b.t += dt; b.inv = Math.max(0, b.inv - dt);
  const phase = b.hp > 4 ? 1 : b.hp > 2 ? 2 : 3, spd = [0, 90, 130, 175][phase];
  const minX = 126 * T, maxX = 148 * T - b.w;
  if (b.state === 'enter') {
    b.y += 140 * dt; if (b.y >= b.homeY) { b.y = b.homeY; b.state = 'hover'; b.t = 0; b.atkT = 1.4; b.cycle = 0; }
  } else if (b.state === 'hover') {
    const tx = clamp(p.x - 40, minX, maxX);
    b.x += clamp(tx - b.x, -spd * dt, spd * dt);
    b.y = b.homeY + Math.sin(b.t * 2) * 12;
    b.atkT -= dt;
    if (b.atkT <= 0) {
      const n = [0, 5, 6, 7][phase], bx = b.x + b.w / 2, by = b.y + b.h * .6;
      const base = Math.atan2(p.y + 15 - by, p.x + 11 - bx), sp = [0, 220, 260, 300][phase];
      for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * .22; G.shots.push({ x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 6 }); }
      sfx.shoot(); b.cycle++; b.atkT = [0, 2.3, 1.9, 1.5][phase];
      if (b.cycle >= 2) { b.state = 'tele'; b.t = 0; b.cycle = 0; b.tx = clamp(p.x - 40, minX, maxX); }
    }
    if (phase >= 2) {
      b.rockT -= dt;
      if (b.rockT <= 0) {
        b.rockT = phase === 2 ? 4.2 : 3.2;
        const n = phase === 2 ? 3 : 4;
        for (let i = 0; i < n; i++) G.rocks.push({ x: minX + 40 + Math.random() * (maxX - minX - 60), y: -30, warn: 1.1, fall: false, vy: 0 });
      }
    }
  } else if (b.state === 'tele') {
    b.x += clamp(b.tx - b.x, -260 * dt, 260 * dt);
    if (b.t > .9) { b.state = 'dive'; b.vy = 150; }
  } else if (b.state === 'dive') {
    b.vy = Math.min(b.vy + 2600 * dt, 950); b.y += b.vy * dt;
    if (b.y + b.h >= floor) {
      b.h = 70; b.y = floor - b.h; b.state = 'stun'; b.t = 0; G.shake = 14; sfx.boom();
      burst(b.x + 50, floor, 18, [C.cream, C.gold, C.mag], 260, .6, 5);
      G.shots.push({ x: b.x + 10, y: floor - 12, vx: -230, vy: 0, life: 4, ground: true }, { x: b.x + b.w - 10, y: floor - 12, vx: 230, vy: 0, life: 4, ground: true });
    }
  } else if (b.state === 'stun') {
    if (b.t > 3.4) { b.state = 'rise'; b.t = 0; }
  } else if (b.state === 'rise') {
    b.h = 100; b.y -= 260 * dt; if (b.y <= b.homeY) { b.y = b.homeY; b.state = 'hover'; b.t = 0; b.atkT = 1.2; }
  } else if (b.state === 'dying') {
    if (Math.random() < .5) burst(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 6, [C.teal, C.mag, C.gold, C.cream], 200, .7, 5);
    G.shake = 6;
    if (b.t > 2.2) {
      G.boss = null; G.goalOpen = true; G.goal = { x: 145 * T + 16 - 24, y: 14 * T - 74, w: 48, h: 74 };
      sfx.star(); $('bossbar').classList.add('hidden');
      for (let i = 0; i < 14; i++) G.items.push({ k: 'crystal', x: b.x + 20 + i * 4, y: b.y + 40, w: 16, h: 16, ph: i });
      G.totalGems += 14;
    }
    return;
  }
  // interacao jogador x chefe
  if (!p.dead && b.state !== 'enter' && b.state !== 'dying' && b.inv <= 0) {
    const pr = { x: p.x + 2, y: p.y + 2, w: p.w - 4, h: p.h - 3 };
    if (rectHit(pr, b)) {
      if (b.state === 'stun') {
        if (p.dash > 0 || (p.vy > 0 && (p.y + p.h - b.y) < 26)) {
          b.hp--; b.inv = 1.1; sfx.boom(); G.shake = 10; p.vy = -620; p.jumps = 1; p.cutOK = false; hudKey = '';
          burst(b.x + 50, b.y + 10, 20, [C.mag, C.gold, C.cream, C.teal], 240, .7, 5);
          if (b.hp <= 0) { b.state = 'dying'; b.t = 0; G.shots = []; G.rocks = []; } else { b.state = 'rise'; b.t = 0; }
        }
      } else if (b.state !== 'rise') hurtPlayer(b.x + b.w / 2);
    }
  }
}
function updateProjectiles(dt) {
  const p = G.p, L = G.L;
  for (const s of G.shots) {
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (tileAt(L, Math.floor(s.x / T), Math.floor(s.y / T)) === 1 && !s.ground) { s.life = 0; burst(s.x, s.y, 5, [C.teal], 90, .3, 3); }
    if (s.ground && (s.x < 125 * T || s.x > 149 * T)) s.life = 0;
    if (!p.dead && Math.abs(s.x - (p.x + 11)) < 14 && Math.abs(s.y - (p.y + 15)) < 18) { hurtPlayer(s.x); if (p.inv > 0) s.life = 0; }
  }
  G.shots = G.shots.filter(s => s.life > 0);
  for (const r of G.rocks) {
    if (!r.fall) { r.warn -= dt; if (r.warn <= 0) { r.fall = true; r.y = -30; r.vy = 200; } continue; }
    r.vy += 1500 * dt; r.y += r.vy * dt;
    if (r.y + 16 >= 14 * T) { r.dead = true; burst(r.x, 14 * T, 10, [C.purple, C.cream], 180, .5, 4); G.shake = 5; }
    if (!p.dead && Math.abs(r.x - (p.x + 11)) < 18 && r.y + 16 > p.y && r.y - 22 < p.y + p.h) { hurtPlayer(r.x); r.dead = true; burst(r.x, r.y, 8, [C.purple, C.cream], 150, .4, 3); }
  }
  G.rocks = G.rocks.filter(r => !r.dead);
}

/* ---------- Fim de fase ---------- */
function completeLevel() {
  if (G.state !== 'play') return;
  G.state = 'complete'; sfx.win();
  const ratio = G.totalGems ? G.gems / G.totalGems : 1;
  let stars = 1; if (ratio >= .7) stars++; if (G.star) stars++;
  save.stars[G.li] = Math.max(save.stars[G.li] || 0, stars);
  if (G.li + 1 < LEVELS.length) save.unlocked = Math.max(save.unlocked, G.li + 2);
  persist();
  $('cStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('');
  const last = G.li === LEVELS.length - 1;
  $('cTitle').textContent = last ? 'VOCÊ VENCEU!' : 'FASE COMPLETA!';
  $('cStats').innerHTML = `Cristais: <b>${G.gems}/${G.totalGems}</b><br>Estrela secreta: <b>${G.star ? 'Sim' : 'Não'}</b><br>Tempo: <b>${G.levelTime.toFixed(1)}s</b> &nbsp; Quedas: <b>${G.deaths}</b>` + (last ? '<br>A Floresta Cristalina está salva!' : '');
  $('bNext').classList.toggle('hidden', last);
  $('complete').classList.remove('hidden'); $('hud').classList.add('hidden');
}
function gameOver() {
  G.state = 'over'; $('over').classList.remove('hidden'); $('hud').classList.add('hidden'); musicOn = false;
}
function togglePause() {
  if (G.state === 'play') { G.state = 'paused'; $('pause').classList.remove('hidden'); }
  else if (G.state === 'paused') { G.state = 'play'; $('pause').classList.add('hidden'); }
}
function toMenu() {
  G.state = 'menu'; ['levels', 'settings', 'pause', 'over', 'complete', 'hud'].forEach(s => $(s).classList.add('hidden'));
  $('menu').classList.remove('hidden'); G.L = LEVELS[0](); if (!G.L.cache) buildCache(G.L); musicTheme = 0; musicOn = true; G.cam = 0;
  G.parts = [];
}

/* ---------- HUD ---------- */
let hudKey = '';
const HEART = f => `<svg viewBox="0 0 24 24"><path d="M12 21C4 14 2 10 2 7a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3-2 7-10 14z" fill="${f ? '#FF4FA3' : '#3d2e51'}" stroke="#2A1B3D" stroke-width="2" stroke-linejoin="round"/></svg>`;
const GEM = '<svg viewBox="0 0 24 24"><path d="M12 2l8 10-8 10L4 12z" fill="#2EE6C5" stroke="#2A1B3D" stroke-width="2" stroke-linejoin="round"/></svg>';
function updateHUD() {
  const p = G.p; if (!p) return;
  const b = G.boss;
  const key = [p.hp, G.lives, G.gems, G.totalGems, b ? b.hp : -1].join('|');
  if (key !== hudKey) {
    hudKey = key;
    $('hearts').innerHTML = [0, 1, 2].map(i => HEART(i < p.hp)).join('');
    $('lives').innerHTML = `<span style="font-size:13px">VIDAS</span> <b style="color:#FFD54A">x${Math.max(0, G.lives)}</b>`;
    $('gems').innerHTML = `${GEM}<span>${G.gems}/${G.totalGems}</span>`;
    if (b) $('bossSegs').innerHTML = Array.from({ length: b.max }, (_, i) => `<i class="${i < b.hp ? 'on' : ''}"></i>`).join('');
  }
  $('dashfill').style.width = (100 - clamp(p.dashCd / .9, 0, 1) * 100) + '%';
}

/* ---------- Atualizacao geral ---------- */
function update(dt) {
  G.levelTime += dt; G.t += dt;
  updatePlats(dt); updatePlayer(dt); updateEnemies(dt); updateBoss(dt); updateProjectiles(dt); updateItems(dt); updateParticles(dt);
  G.shake = Math.max(0, G.shake - dt * 30); G.intro = Math.max(0, G.intro - dt);
  const p = G.p, L = G.L;
  const target = clamp(p.x + p.w / 2 - VW / 2 + p.face * 50, 0, L.W * T - VW);
  G.cam = lerp(G.cam, target, 1 - Math.pow(.0005, dt));
  if (p.dead) { G.deadT -= dt; if (G.deadT <= 0) respawn(); }
}

/* ---------- Render ---------- */
function render(t) {
  const L = G.L; if (!L) return;
  drawBG(ctx, L.theme, G.cam, t);
  ctx.save();
  let sx = 0, sy = 0; if (G.shake > 0) { sx = (Math.random() - .5) * G.shake; sy = (Math.random() - .5) * G.shake; }
  ctx.translate(-Math.round(G.cam) + sx, sy);
  if (L.cache) ctx.drawImage(L.cache, 0, 0);
  if (G.state === 'menu') { drawMenuScene(t); }
  else {
    for (const m of G.plats) drawMplat(ctx, m);
    for (const s of G.springs) drawSpring(ctx, s);
    for (const k of G.checks) drawCheck(ctx, k, t);
    if (G.goal) { drawGoal(ctx, G.goal, t); }
    for (const it of G.items) { if (it.k === 'crystal') drawCrystalItem(ctx, it, t); else if (it.k === 'star') drawStarItem(ctx, it, t); else drawHeartItem(ctx, it, t); }
    for (const e of G.enemies) {
      if (e.t0 === 'blobby') drawBlobby(ctx, e, t); else if (e.t0 === 'spiky') drawSpiky(ctx, e, t);
      else if (e.t0 === 'buzz') drawBuzz(ctx, e, t); else drawGolem(ctx, e, t);
    }
    for (const r of G.rocks) {
      if (!r.fall) {
        const a = .3 + .4 * Math.abs(Math.sin(t * 14));
        ctx.globalAlpha = a; ctx.fillStyle = C.mag; ctx.beginPath(); ctx.ellipse(r.x, 14 * T - 2, 22, 6, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = C.mag; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(r.x, 0); ctx.lineTo(r.x, 14 * T); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      } else drawRock(ctx, r);
    }
    if (G.boss && G.boss.active) drawBoss(ctx, G.boss, t, 14 * T);
    for (const s of G.shots) drawShard(ctx, s, t);
    const p = G.p;
    if (!p.dead) {
      if (p.inv > 0 && Math.floor(t * 16) % 2) ctx.globalAlpha = .45;
      drawFox(ctx, p.x + p.w / 2, p.y + p.h, p, t); ctx.globalAlpha = 1;
    }
  }
  for (const q of G.parts) {
    ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.col;
    ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (.5 + .5 * q.life / q.max), 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // vagalumes
  if (L.theme !== 2) {
    for (let i = 0; i < 18; i++) {
      const x = (hash(i) * VW + Math.sin(t * .5 + i) * 30 - G.cam * .8 % VW + VW * 2) % VW, y = hash(i + 7) * VH * .8 + Math.sin(t + i * 2) * 20;
      glow(ctx, x, y, 14, i % 2 ? C.gold : C.teal, .55 + .3 * Math.sin(t * 3 + i));
    }
  }
  drawVignette(ctx);
  if (G.state === 'play' && G.intro > 0) {
    const a = clamp(G.intro / .6, 0, 1) * clamp((2.6 - G.intro) / .4, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.font = '900 56px Rubik, sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = C.dark; ctx.lineJoin = 'round';
    ctx.strokeText(L.sub.toUpperCase(), VW / 2, VH / 2 - 10); ctx.fillStyle = C.gold; ctx.fillText(L.sub.toUpperCase(), VW / 2, VH / 2 - 10);
    ctx.font = '800 26px Rubik, sans-serif'; ctx.lineWidth = 6;
    ctx.strokeText(L.name, VW / 2, VH / 2 + 30); ctx.fillStyle = C.cream; ctx.fillText(L.name, VW / 2, VH / 2 + 30);
    ctx.globalAlpha = 1;
  }
}
function drawMenuScene(t) {
  // Lumi parada numa colina
  const x = 250, y = 14 * T;
  const fake = { face: 1, dash: 0, onGround: true, vy: 0, vx: 0, squash: 0, spin: 0, anim: 0 };
  ctx.save(); ctx.translate(0, 0);
  drawFox(ctx, G.cam + x, y, fake, t);
  ctx.restore();
}

/* ---------- Loop principal ---------- */
let last = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  const t = ts / 1000;
  if (G.state === 'play') {
    const n = Math.ceil(dt / (1 / 60)) || 1;
    for (let i = 0; i < n; i++) { update(dt / n); for (const k in pressed) delete pressed[k]; for (const k in vkp) delete vkp[k]; }
    updateHUD();
  } else if (G.state === 'menu') {
    G.cam += dt * 40; if (G.cam > 20000) G.cam = 0;
    G.L.theme = Math.floor(t / 12) % 3;
    updateParticles(dt);
  }
  for (const k in pressed) delete pressed[k]; for (const k in vkp) delete vkp[k];
  if (G.state === 'menu') {
    // cenario da menu usa fase 1 com camera propria
    const L = G.L, savedCam = G.cam;
    drawBG(ctx, L.theme, savedCam, t);
    ctx.save(); ctx.fillStyle = TPAL[L.theme].base; ctx.fillRect(0, 14 * T, VW, VH);
    ctx.fillStyle = TPAL[L.theme].top; ctx.fillRect(0, 14 * T, VW, 11);
    ctx.fillStyle = C.dark; ctx.fillRect(0, 14 * T, VW, 2);
    ctx.restore();
    const fake = { face: 1, dash: 0, onGround: true, vy: 0, vx: 0, squash: 0, spin: 0, anim: 0 };
    drawFox(ctx, 250, 14 * T, fake, t);
    drawVignette(ctx);
  } else render(t);
}

/* ---------- UI ---------- */
function show(id) { ['menu', 'levels', 'settings'].forEach(s => $(s).classList.add('hidden')); $(id).classList.remove('hidden'); }
function buildCards() {
  const names = ['Floresta Sussurrante', 'Cavernas Cintilantes', 'Ilhas Celestiais'], icons = ['🌲', '💎', '☁'];
  $('cards').innerHTML = names.map((n, i) => {
    const lock = i + 1 > save.unlocked, st = save.stars[i] || 0;
    return `<div class="card t${i} ${lock ? 'locked' : ''}" data-i="${i}"><div class="art">${lock ? '🔒' : icons[i]}</div><div class="info"><b>Fase ${i + 1}</b><div style="font-size:12px;opacity:.8">${n}</div><span>${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span></div></div>`;
  }).join('');
  $('cards').querySelectorAll('.card').forEach(c => c.onclick = () => { if (!c.classList.contains('locked')) { ac(); startLevel(+c.dataset.i); } });
}
$('bPlay').onclick = () => { ac(); startLevel(clamp(save.unlocked, 1, LEVELS.length) - 1); };
$('bLevels').onclick = () => { ac(); buildCards(); show('levels'); };
$('bSettings').onclick = () => { ac(); $('volMusic').value = save.music; $('volSfx').value = save.sfx; show('settings'); };
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => show('menu'));
$('volMusic').oninput = e => { save.music = +e.target.value; persist(); };
$('volSfx').oninput = e => { save.sfx = +e.target.value; persist(); sfx.coin(); };
$('bReset').onclick = () => { save.unlocked = 1; save.stars = [0, 0, 0]; persist(); };
$('btnPause').onclick = togglePause;
$('bResume').onclick = togglePause;
$('bRestart').onclick = () => startLevel(G.li);
$('bToMenu').onclick = toMenu;
$('bRetry').onclick = () => startLevel(G.li);
$('bOverMenu').onclick = toMenu;
$('bNext').onclick = () => startLevel(G.li + 1);
$('bAgain').onclick = () => startLevel(G.li);
$('bCompMenu').onclick = toMenu;

toMenu();
requestAnimationFrame(frame);
