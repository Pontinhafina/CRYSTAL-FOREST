'use strict';
/* ===== Helpers de desenho (estilo vetorial flat, contorno 2px #2A1B3D) ===== */
function poly(c, pts, fill, lw = 2, stroke = C.dark) {
  c.beginPath();
  pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); }
}
function ell(c, x, y, rx, ry, fill, lw = 2, rot = 0) {
  c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = C.dark; c.stroke(); }
}
function rr(c, x, y, w, h, r, fill, lw = 2) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = C.dark; c.stroke(); }
}
function glow(c, x, y, r, col, a = 0.5) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1;
}

/* ===== Cenarios (parallax) ===== */
const BGPAL = [
  { sky: [[0, '#160a2a'], [.5, '#34195c'], [1, '#2a7580']], far: '#2a1650', mid: '#1f3b5c', near: '#173d45', tree: '#12423f' },
  { sky: [[0, '#0d0419'], [.6, '#231238'], [1, '#3a1f5e']], far: '#2b1748', mid: '#35205a', near: '#1d0f33' },
  { sky: [[0, '#2b2a85'], [.55, '#c653a6'], [1, '#ffd09a']], far: '#8f4fb0', mid: '#b4609f', near: '#d98a9c' }
];
function ridge(c, cam, f, base, amp, col) {
  c.beginPath(); c.moveTo(0, VH);
  for (let x = 0; x <= VW + 20; x += 20) {
    const w = x + cam * f;
    c.lineTo(x, base - (Math.sin(w * .004) * amp + Math.sin(w * .011 + 1.7) * amp * .5 + Math.sin(w * .0237 + .3) * amp * .2));
  }
  c.lineTo(VW, VH); c.closePath(); c.fillStyle = col; c.fill();
}
function drawBG(c, th, cam, t) {
  const P = BGPAL[th];
  const g = c.createLinearGradient(0, 0, 0, VH);
  P.sky.forEach(s => g.addColorStop(s[0], s[1]));
  c.fillStyle = g; c.fillRect(0, 0, VW, VH);
  if (th !== 1) {
    c.fillStyle = C.cream;
    for (let i = 0; i < 50; i++) {
      const sx = (((hash(i) * VW - cam * .03) % VW) + VW) % VW, sy = hash(i + 99) * VH * (th === 0 ? .5 : .3);
      c.globalAlpha = .35 + .65 * Math.abs(Math.sin(t * 1.5 + i)); c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;
  }
  if (th === 0) { glow(c, 740, 110, 130, '#eedcff', .35); ell(c, 740, 110, 40, 40, '#eedcff', 0); }
  if (th === 2) { glow(c, 700, 340, 220, '#FFD54A', .6); ell(c, 700, 340, 56, 56, '#fff1b8', 0); }
  if (th === 0) {
    ridge(c, cam, .1, 380, 50, P.far);
    ridge(c, cam, .2, 425, 40, P.mid);
    const f = .35, i0 = Math.floor(cam * f / 70) - 1;
    for (let i = i0; i < i0 + VW / 70 + 3; i++) {
      const x = i * 70 - cam * f + hash(i) * 25, h = 70 + hash(i + 5) * 60, b = 470;
      rr(c, x - 4, b - 18, 8, 22, 2, '#2b1a2e', 0);
      for (let k = 0; k < 3; k++) poly(c, [[x - 26 + k * 4, b - 12 - k * h * .26], [x, b - 4 - h * (.45 + k * .22)], [x + 26 - k * 4, b - 12 - k * h * .26]], P.tree, 0);
      if (i % 5 === 0) { glow(c, x + 30, b - 10, 36, C.teal, .55); poly(c, [[x + 24, b], [x + 30, b - 22], [x + 36, b]], C.teal, 0); }
    }
    for (let i = Math.floor(cam * .6 / 120) - 1; i < Math.floor(cam * .6 / 120) + 10; i++) {
      const x = i * 120 - cam * .6 + hash(i + 40) * 60; ell(c, x, 548, 70, 40 + hash(i) * 14, '#0d2b30', 0);
    }
  } else if (th === 1) {
    ridge(c, cam, .1, 400, 60, P.far);
    const f = .3, i0 = Math.floor(cam * f / 90) - 1;
    for (let i = i0; i < i0 + VW / 90 + 3; i++) {
      const x = i * 90 - cam * f + hash(i) * 30, h = 60 + hash(i + 3) * 90;
      poly(c, [[x - 24, 0], [x + 24, 0], [x + hash(i + 7) * 12, h]], P.mid, 0);
    }
    const f2 = .45, j0 = Math.floor(cam * f2 / 150) - 1;
    for (let i = j0; i < j0 + VW / 150 + 3; i++) {
      const x = i * 150 - cam * f2 + hash(i + 9) * 70, col = i % 2 ? C.mag : C.teal, h = 40 + hash(i + 2) * 60;
      glow(c, x, 500 - h * .5, 70, col, .35 + .15 * Math.sin(t * 2 + i));
      poly(c, [[x - 12, 510], [x - 2, 510 - h], [x + 10, 510]], col, 0);
      poly(c, [[x + 6, 510], [x + 20, 510 - h * .6], [x + 28, 510]], col, 0);
    }
    ridge(c, cam, .55, 505, 30, P.near);
  } else {
    for (let i = Math.floor(cam * .25 / 300) - 1; i < Math.floor(cam * .25 / 300) + 5; i++) {
      const x = i * 300 - cam * .25 + hash(i) * 120, y = 330 + hash(i + 1) * 90;
      poly(c, [[x - 60, y + 4], [x + 60, y + 4], [x + 10, y + 70 + hash(i) * 30], [x - 10, y + 70 + hash(i) * 30]], P.far, 0);
      ell(c, x, y, 70, 14, '#e48ac0', 0);
    }
    ridge(c, cam, .1, 480, 22, 'rgba(255,214,232,.55)');
    c.fillStyle = 'rgba(255,248,231,.75)';
    for (let i = Math.floor(cam * .15 / 220) - 1; i < Math.floor(cam * .15 / 220) + 6; i++) {
      const x = i * 220 - cam * .15 + hash(i + 11) * 80, y = 70 + hash(i + 12) * 220;
      ell(c, x, y, 50, 14, null, 0); ell(c, x + 30, y - 10, 30, 14, null, 0);
      c.beginPath(); c.ellipse(x, y, 50, 14, 0, 0, 7); c.ellipse(x + 30, y - 10, 30, 14, 0, 0, 7); c.ellipse(x - 28, y - 6, 24, 12, 0, 0, 7); c.fill();
    }
    ridge(c, cam, .5, 520, 18, 'rgba(255,248,231,.35)');
  }
}
function drawVignette(c) {
  const g = c.createRadialGradient(VW / 2, VH / 2, VH * .55, VW / 2, VH / 2, VH * 1.05);
  g.addColorStop(0, 'rgba(27,17,40,0)'); g.addColorStop(1, 'rgba(27,17,40,.5)');
  c.fillStyle = g; c.fillRect(0, 0, VW, VH);
}

/* ===== Tiles (cache da fase inteira) ===== */
const TPAL = [
  { base: '#4a2c1a', top: '#3DBE6B', topD: '#2a8f4e', det: '#5e3a22' },
  { base: '#3d2e51', top: '#7a62b0', topD: '#5a4478', det: '#4b3a66' },
  { base: '#f0dfae', top: '#FFF8E7', topD: '#bfe3ff', det: '#d9c58a' }
];
function isSolid(L, i, j, oobDefault = 1) {
  if (i < 0 || i >= L.W) return true;
  if (j < 0) return true;
  if (j >= ROWS) return oobDefault === 1;
  return L.g[j][i] === 1;
}
function drawSolidTile(x, L, i, j) {
  const P = TPAL[L.theme], px = i * T, py = j * T, th = L.theme;
  x.fillStyle = P.base; x.fillRect(px, py, T, T);
  const hs = hash(i * 31 + j * 17);
  x.fillStyle = P.det;
  x.fillRect(px + 4 + hs * 14, py + 8 + hash(i + j * 3) * 14, 7, 4);
  x.fillRect(px + 18 - hs * 8, py + 20, 5, 3);
  if (th === 1 && hs > .72 && !isSolid(L, i, j - 1, 0) === false) {
    const col = hs > .86 ? C.mag : C.teal;
    poly(x, [[px + 10, py + 28], [px + 16, py + 12], [px + 22, py + 28]], col, 2);
  }
  const up = isSolid(L, i, j - 1, 0);
  if (!up) {
    x.fillStyle = P.top; x.fillRect(px, py, T, 11);
    x.fillStyle = P.topD;
    if (th === 0) for (let k = 0; k < 4; k++) { const tx = px + 3 + k * 8; poly(x, [[tx, py + 11], [tx + 3, py + 11 + 4 + hash(i * 4 + k) * 5], [tx + 6, py + 11]], P.top, 0); }
    x.fillRect(px, py + 9, T, 2);
    if (th === 1) { x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(px + 2, py + 2, T - 4, 2); }
    if (th === 2) { x.fillStyle = 'rgba(110,200,255,.35)'; x.fillRect(px, py + 8, T, 3); }
  }
  x.fillStyle = C.dark;
  if (!up) x.fillRect(px, py, T, 2);
  if (!isSolid(L, i, j + 1, 1)) x.fillRect(px, py + T - 2, T, 2);
  if (!isSolid(L, i - 1, j, 1)) x.fillRect(px, py, 2, T);
  if (!isSolid(L, i + 1, j, 1)) x.fillRect(px + T - 2, py, 2, T);
  if (th === 2 && !isSolid(L, i, j + 1, 1) && j < ROWS - 1) {
    const h = 14 + hash(i * 7 + j) * 26;
    poly(x, [[px + 3, py + T - 1], [px + T - 3, py + T - 1], [px + T / 2 + (hs - .5) * 8, py + T + h]], P.base, 2);
  }
}
function drawOneWayTile(x, L, i, j) {
  const px = i * T, py = j * T, th = L.theme;
  const l = L.g[j][i - 1] === 2, r = L.g[j][i + 1] === 2;
  if (th === 0) {
    x.fillStyle = '#a8662c'; x.fillRect(px, py, T, 11);
    x.fillStyle = '#c98240'; x.fillRect(px, py, T, 3);
    x.fillStyle = C.dark; x.fillRect(px + 8, py + 5, 3, 3); x.fillRect(px + 21, py + 5, 3, 3);
  } else if (th === 1) {
    x.fillStyle = C.teal; x.fillRect(px, py, T, 11);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(px + 2, py + 2, T - 4, 3);
    x.fillStyle = '#17b89d'; x.fillRect(px, py + 8, T, 3);
  } else {
    x.fillStyle = C.cream; x.fillRect(px, py, T, 11);
    x.fillStyle = '#bfe3ff'; x.fillRect(px, py + 7, T, 4);
  }
  x.fillStyle = C.dark; x.fillRect(px, py, T, 2); x.fillRect(px, py + 9, T, 2);
  if (!l) x.fillRect(px, py, 2, 11); if (!r) x.fillRect(px + T - 2, py, 2, 11);
}
function drawSpikeTile(x, L, i, j) {
  const px = i * T, py = j * T, col = L.theme === 1 ? C.teal : C.mag;
  for (let k = 0; k < 2; k++) poly(x, [[px + 2 + k * 15, py + T], [px + 9 + k * 15, py + 10], [px + 16 + k * 15, py + T]], col, 2);
  x.fillStyle = 'rgba(255,255,255,.45)';
  for (let k = 0; k < 2; k++) x.fillRect(px + 8 + k * 15, py + 15, 2, 8);
}
function buildCache(L) {
  const c = document.createElement('canvas'); c.width = L.W * T; c.height = VH + 60;
  const x = c.getContext('2d');
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < L.W; i++) {
    const t = L.g[j][i];
    if (t === 1) drawSolidTile(x, L, i, j);
  }
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < L.W; i++) {
    const t = L.g[j][i];
    if (t === 2) drawOneWayTile(x, L, i, j); else if (t === 3) drawSpikeTile(x, L, i, j);
  }
  L.cache = c;
}

/* ===== Lumi (heroi) ===== */
function drawFox(c, x, y, p, t) {
  c.save(); c.translate(x, y); c.scale(p.face, 1);
  let sx = 1, sy = 1;
  if (p.dash > 0) { sx = 1.25; sy = .8; }
  else if (!p.onGround) { const s = clamp(Math.abs(p.vy) / 900, 0, .2); sx = 1 - s * .6; sy = 1 + s; }
  else { const st = clamp(p.squash, 0, 1); sx = 1 + st * .25; sy = 1 - st * .25; }
  c.scale(sx * .85, sy * .85);
  if (p.spin > 0) { c.translate(0, -18); c.rotate((1 - p.spin / .4) * Math.PI * 2); c.translate(0, 18); }
  const run = p.onGround && Math.abs(p.vx) > 20, air = !p.onGround;
  const a = run ? Math.sin(p.anim * 14) * 7 : 0, bob = (!run && p.onGround) ? Math.sin(t * 3) * 0.8 : 0;
  const wag = Math.sin(t * 6) * 3;
  // cauda
  c.lineCap = 'round'; c.beginPath(); c.moveTo(-8, -12); c.quadraticCurveTo(-27, -14 + wag, -22, -34 + wag);
  c.lineWidth = 13; c.strokeStyle = C.dark; c.stroke(); c.lineWidth = 9; c.strokeStyle = C.orange; c.stroke();
  ell(c, -22, -34 + wag, 5, 5, C.cream, 2);
  // mochila
  rr(c, -15, -26 + bob, 10, 15, 4, C.gold, 2);
  const leg = (lx, off) => {
    let fx = lx + off, ly = 0;
    if (air) { fx = lx + (p.vy < 0 ? -2 : 3 * Math.sign(lx || 1)); ly = p.vy < 0 ? -5 : -1; }
    rr(c, fx - 3.5, -11 + ly, 7, 9, 3, C.orange, 2); ell(c, fx + 1.5, -2 + ly, 5.5, 3.2, C.teal, 2);
  };
  leg(-4, -a);
  // corpo
  rr(c, -9, -27 + bob, 18, 18, 7, C.orange, 2);
  ell(c, 3, -17 + bob, 5, 7, C.cream, 0);
  // lenco
  const sw = Math.sin(t * 9) * 3 + (run ? 3 : 0);
  poly(c, [[-9, -28 + bob], [-24, -26 + sw + bob], [-19, -22 + sw + bob], [-9, -22 + bob]], C.teal, 2);
  rr(c, -10, -30 + bob, 20, 7, 3, C.teal, 2);
  leg(5, a);
  // cabeca
  const hy = -35 + bob;
  poly(c, [[-6, hy - 4], [-4, hy - 19], [4, hy - 7]], C.orange, 2); poly(c, [[-4, hy - 7], [-3, hy - 14], [1, hy - 8]], C.cream, 0);
  poly(c, [[3, hy - 7], [9, hy - 19], [13, hy - 3]], C.orange, 2); poly(c, [[6, hy - 7], [9, hy - 14], [11, hy - 6]], C.cream, 0);
  ell(c, 2, hy, 12, 10, C.orange, 2);
  ell(c, 8, hy + 4, 6, 4, C.cream, 0);
  poly(c, [[0, hy - 8], [3, hy - 12], [6, hy - 8], [3, hy - 4]], C.teal, 1.5);
  ell(c, 7, hy - 1, 3.3, 4.6, C.teal, 2); c.fillStyle = C.cream; c.beginPath(); c.arc(6, hy - 3, 1.4, 0, 7); c.fill();
  ell(c, 13, hy + 2, 1.8, 1.5, C.dark, 0);
  c.restore();
}

/* ===== Inimigos ===== */
function drawBlobby(c, e, t) {
  const sq = Math.sin(t * 6 + e.x) * .08;
  c.save(); c.translate(e.x + e.w / 2, e.y + e.h); c.scale(1 + sq, 1 - sq);
  if (e.dying) { c.scale(1.3, Math.max(.1, .35 - e.dt)); c.globalAlpha = 1 - e.dt * 2; }
  ell(c, 0, -11, 17, 12, C.green, 3); ell(c, 0, -14, 11, 8, '#4fe083', 0);
  poly(c, [[0, -34], [5, -22], [-5, -22]], C.teal, 2);
  const ex = e.dir * 2;
  ell(c, -6 + ex, -13, 3, 4.5, C.dark, 0); ell(c, 6 + ex, -13, 3, 4.5, C.dark, 0);
  c.fillStyle = C.cream; c.fillRect(-7 + ex, -16, 2, 2); c.fillRect(5 + ex, -16, 2, 2);
  ell(c, ex, -6, 3, 2, C.dark, 0);
  c.restore();
}
function drawSpiky(c, e, t) {
  c.save(); c.translate(e.x + e.w / 2, e.y + e.h); c.scale(e.dir, 1);
  if (e.dying) { c.scale(1.2, Math.max(.1, .5 - e.dt)); c.globalAlpha = 1 - e.dt * 2; }
  const w = Math.sin(t * 12) * 2;
  poly(c, [[-14, -16], [-20, -34], [-6, -22]], C.mag, 2); poly(c, [[-6, -22], [-2, -40], [8, -24]], C.mag, 2); poly(c, [[6, -22], [16, -38], [18, -20]], C.mag, 2);
  ell(c, 0, -13, 19, 13, C.purple, 3);
  rr(c, -10 + w, -3, 7, 5, 2, C.dark, 0); rr(c, 4 - w, -3, 7, 5, 2, C.dark, 0);
  poly(c, [[16, -12], [28, -10], [17, -4]], '#FFB0CC', 2); ell(c, 26, -10, 2, 2, C.dark, 0);
  ell(c, 11, -17, 3.4, 3.4, C.cream, 1.5); ell(c, 12, -17, 1.6, 1.6, C.dark, 0);
  c.restore();
}
function drawBuzz(c, e, t) {
  c.save(); c.translate(e.x + e.w / 2, e.y + e.h / 2); c.scale(e.dir, 1);
  if (e.dying) { c.rotate(e.dt * 8); c.globalAlpha = 1 - e.dt * 2; }
  const fl = Math.sin(t * 40) * .5;
  c.globalAlpha *= .75;
  ell(c, -3, -10, 11, 5, C.sky, 2, -.5 + fl); ell(c, 5, -10, 11, 5, C.sky, 2, .5 - fl);
  c.globalAlpha = e.dying ? 1 - e.dt * 2 : 1;
  glow(c, -14, 4, 22, C.teal, .7);
  ell(c, -14, 4, 7, 7, C.teal, 2);
  ell(c, 0, 0, 11, 10, C.gold, 3);
  c.fillStyle = C.dark; c.fillRect(-4, -9, 3, 18); c.fillRect(3, -8, 3, 16);
  ell(c, 6, -2, 3, 3.4, C.cream, 1.5); ell(c, 7, -2, 1.5, 1.5, C.dark, 0);
  c.restore();
}
function drawGolem(c, e, t) {
  c.save(); c.translate(e.x + e.w / 2, e.y + e.h);
  if (e.dying) { c.scale(1, Math.max(.1, 1 - e.dt * 2)); c.globalAlpha = 1 - e.dt * 2; }
  const st = Math.sin(t * 5 + e.x) * 2;
  rr(c, -26, -26 + st, 11, 15, 4, '#4B3A5E', 2); rr(c, 15, -26 - st, 11, 15, 4, '#4B3A5E', 2);
  rr(c, -14, -4, 10, 5, 2, C.dark, 0); rr(c, 4, -4, 10, 5, 2, C.dark, 0);
  rr(c, -19, -42, 38, 40, 8, '#68567A', 3);
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-14, -36, 6, 14);
  poly(c, [[-19, -33], [-10, -44], [0, -40], [10, -46], [19, -33]], C.green, 2);
  glow(c, 0, -26, 20, C.teal, .6);
  rr(c, -8, -29, 16, 7, 3, C.teal, 2);
  if (e.hitCd > 0) { c.globalAlpha = .6; rr(c, -19, -42, 38, 40, 8, '#fff', 0); }
  c.restore();
}

/* ===== Chefe: Dragao de Cristal (baseado na folha do Stitch, 256x256 -> 0.5) ===== */
function drawBoss(c, b, t, floorY) {
  c.save();
  const cx = b.x + b.w / 2, stun = b.state === 'stun';
  if (stun) { c.translate(cx, b.y + b.h); c.scale(1.12, .8); c.translate(0, 0); c.translate(-64, -108); }
  else c.translate(cx - 64 + (b.state === 'tele' ? Math.sin(t * 70) * 3 : 0), b.y + b.h / 2 - 64 + (b.state === 'dying' ? Math.sin(t * 60) * 4 : 0));
  c.scale(.5, .5);
  if (b.inv > 0 && Math.floor(t * 20) % 2) c.globalAlpha = .55;
  const flap = Math.sin(t * 5) * .12;
  // asas
  c.save(); c.translate(128, 120); c.rotate(-flap); c.translate(-128, -120);
  poly(c, [[128, 120], [40, 40], [60, 110], [30, 120], [70, 160], [120, 150]], '#68397D', 4);
  poly(c, [[55, 60], [85, 115], [50, 110]], C.mag, 0); c.restore();
  c.save(); c.translate(128, 120); c.rotate(flap); c.translate(-128, -120);
  poly(c, [[128, 120], [216, 40], [196, 110], [226, 120], [186, 160], [136, 150]], '#68397D', 4);
  poly(c, [[201, 60], [171, 115], [206, 110]], C.mag, 0); c.restore();
  ell(c, 128, 160, 46, 54, '#3D205E', 4);
  poly(c, [[128, 130], [148, 150], [128, 170], [108, 150]], C.teal, 3);
  poly(c, [[128, 168], [144, 184], [128, 200], [112, 184]], C.teal, 3);
  glow(c, 128, 150, 40, C.teal, b.state === 'stun' ? .9 : .4);
  c.beginPath(); c.moveTo(112, 130); c.quadraticCurveTo(112, 90, 128, 70); c.quadraticCurveTo(144, 90, 144, 130); c.closePath();
  c.fillStyle = '#3D205E'; c.fill(); c.lineWidth = 4; c.strokeStyle = C.dark; c.stroke();
  poly(c, [[105, 75], [75, 25], [95, 65]], C.gold, 3); poly(c, [[151, 75], [181, 25], [161, 65]], C.gold, 3);
  poly(c, [[128, 55], [128, 20], [138, 50]], C.teal, 3);
  poly(c, [[100, 75], [128, 55], [156, 75], [150, 105], [128, 120], [106, 105]], '#572C7E', 4);
  if (stun) {
    c.strokeStyle = C.cream; c.lineWidth = 4;
    [[112, 82], [138, 82]].forEach(([ex, ey]) => { c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + 10, ey + 10); c.moveTo(ex + 10, ey); c.lineTo(ex, ey + 10); c.stroke(); });
  } else {
    const col = b.state === 'tele' ? C.mag : C.teal;
    poly(c, [[112, 82], [122, 86], [114, 92]], col, 2); poly(c, [[144, 82], [134, 86], [142, 92]], col, 2);
  }
  poly(c, [[120, 104], [136, 104], [128, 114]], C.dark, 0);
  poly(c, [[128, 120], [122, 148], [134, 148]], C.cream, 0);
  ell(c, 95, 198, 12, 12, C.dark, 0); ell(c, 161, 198, 12, 12, C.dark, 0);
  poly(c, [[86, 210], [92, 198], [98, 210]], C.cream, 0); poly(c, [[152, 210], [158, 198], [164, 210]], C.cream, 0);
  c.restore();
  if (stun) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + i * 2.1; c.fillStyle = C.gold;
      poly(c, [[cx + Math.cos(a) * 34, b.y - 12 + Math.sin(a) * 7 - 5], [cx + Math.cos(a) * 34 + 4, b.y - 12 + Math.sin(a) * 7], [cx + Math.cos(a) * 34, b.y - 12 + Math.sin(a) * 7 + 5], [cx + Math.cos(a) * 34 - 4, b.y - 12 + Math.sin(a) * 7]], C.gold, 1);
    }
  }
}

/* ===== Itens e objetos ===== */
function drawCrystalItem(c, it, t) {
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2 + Math.sin(t * 3 + it.ph) * 3, w = Math.abs(Math.cos(t * 3 + it.ph)) * 6 + 4;
  glow(c, cx, cy, 22, C.teal, .45);
  poly(c, [[cx, cy - 11], [cx + w, cy], [cx, cy + 11], [cx - w, cy]], C.teal, 2);
  poly(c, [[cx, cy - 8], [cx + w * .4, cy - 1], [cx - w * .5, cy - 1]], '#c9fff4', 0);
}
function drawStarItem(c, it, t) {
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2 + Math.sin(t * 2.5) * 4;
  glow(c, cx, cy, 36, C.gold, .7);
  const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 15, a = -Math.PI / 2 + i * Math.PI / 5 + Math.sin(t * 2) * .15; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  poly(c, pts, C.gold, 2.5);
}
function drawHeartItem(c, it, t) {
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2 + Math.sin(t * 3) * 3, s = 1 + Math.sin(t * 6) * .06;
  glow(c, cx, cy, 24, C.mag, .5);
  c.save(); c.translate(cx, cy); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(-14, -2, -8, -12, 0, -5); c.bezierCurveTo(8, -12, 14, -2, 0, 8);
  c.fillStyle = C.mag; c.fill(); c.lineWidth = 2; c.strokeStyle = C.dark; c.stroke(); c.restore();
}
function drawSpring(c, s) {
  const comp = s.comp, h = 14 - comp * 6, x = s.x, y = s.y + (14 - h);
  rr(c, x + 3, s.y + 10, 22, 4, 2, C.dark, 0);
  c.strokeStyle = C.dark; c.lineWidth = 5; c.beginPath(); c.moveTo(x + 6, s.y + 11); c.lineTo(x + 22, y + 7); c.lineTo(x + 6, y + 4); c.stroke();
  c.strokeStyle = C.gold; c.lineWidth = 2.5; c.stroke();
  rr(c, x, y - 2, 28, 6, 3, C.mag, 2);
}
function drawCheck(c, k, t) {
  const x = k.x + 8, y = k.y;
  rr(c, x - 3, y, 6, 64, 2, C.cream, 2);
  ell(c, x, y, 5, 5, k.on ? C.gold : '#84948f', 2);
  const w = Math.sin(t * 5) * 3;
  if (k.on) glow(c, x + 14, y + 14, 34, C.teal, .55);
  poly(c, [[x + 3, y + 4], [x + 28 + w, y + 10], [x + 3, y + 24]], k.on ? C.teal : '#84948f', 2);
}
function drawGoal(c, g, t) {
  const cx = g.x + g.w / 2, by = g.y + g.h;
  glow(c, cx, by - 36, 70, C.mag, .5);
  rr(c, cx - 28, by - 74, 56, 74, [28, 28, 4, 4], '#68567A', 3);
  c.save(); c.beginPath(); c.roundRect(cx - 20, by - 66, 40, 66, [20, 20, 0, 0]); c.clip();
  c.fillStyle = '#1B1128'; c.fillRect(cx - 20, by - 66, 40, 66);
  for (let i = 0; i < 5; i++) {
    const r = 6 + i * 6 + (t * 14) % 6;
    c.strokeStyle = i % 2 ? C.mag : C.teal; c.globalAlpha = .9 - i * .12; c.lineWidth = 3;
    c.beginPath(); c.ellipse(cx, by - 34, Math.min(r, 30) * .8, Math.min(r, 30) * 1.3, t + i, 0, 5); c.stroke();
  }
  c.restore(); c.globalAlpha = 1;
  poly(c, [[cx - 6, by - 82], [cx, by - 94], [cx + 6, by - 82], [cx, by - 74]], C.gold, 2);
}
function drawMplat(c, m) {
  rr(c, m.x, m.y, m.w, 14, 5, C.gold, 2);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(m.x + 6, m.y + 3, m.w - 12, 3);
  ell(c, m.x + 10, m.y + 8, 3, 3, C.dark, 0); ell(c, m.x + m.w - 10, m.y + 8, 3, 3, C.dark, 0);
  poly(c, [[m.x + m.w / 2 - 8, m.y + 14], [m.x + m.w / 2 + 8, m.y + 14], [m.x + m.w / 2, m.y + 24]], C.teal, 2);
}
function drawShard(c, s, t) {
  c.save(); c.translate(s.x, s.y); c.rotate(Math.atan2(s.vy, s.vx) + Math.PI / 2);
  glow(c, 0, 0, 22, C.teal, .55);
  poly(c, [[0, -13], [6, 0], [0, 10], [-6, 0]], C.teal, 2);
  poly(c, [[0, -9], [2, -1], [-3, -1]], '#c9fff4', 0);
  c.restore();
}
function drawRock(c, r) {
  poly(c, [[r.x - 14, r.y - 22], [r.x + 14, r.y - 22], [r.x + 4, r.y + 16], [r.x - 4, r.y + 16]], '#68397D', 2.5);
  poly(c, [[r.x - 8, r.y - 20], [r.x - 2, r.y - 20], [r.x - 2, r.y + 6]], 'rgba(255,255,255,.25)', 0);
}
