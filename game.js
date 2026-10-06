'use strict';
/* "The Road" — a small side-scrolling journey. Canvas 2D, no libraries. Exposes Game.open(onExit) / Game.close(). */
const Game = (() => {
  const GOAL = 5200, RH = 100, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ITEMS = [[700,.08,'📱'],[1100,.92,'🎮'],[1500,.5,'🍫'],[1900,.08,'🎵'],[2300,.92,'🧸'],[2700,.5,'📺'],
                 [3200,.88,'📱'],[3600,.12,'🎮'],[4000,.5,'🍫'],[4350,.1,'🧸'],[4700,.9,'📺']];
  const FONT = '"Noto Serif Tamil", Georgia, serif';
  let cv, cx, W = 560, H = 400, sc = 1, hz, rt, rb, raf, last, onExit, active = false;
  let mode = 'ready', t = 0, ts = 1, cam = 0, shake = 0, tint = 0, wt = 0, inv = 0;
  let boy, items, parts, keys = new Set(), joy = null, trees = [], palms = [], lastSign = 1;
  const $ = id => document.getElementById(id);
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;

  /* ---------- setup ---------- */
  function build() {
    const r = rng(7); trees = []; palms = [];
    for (let i = 0; i < 90; i++) trees.push({ x: i * 150 + r() * 90, h: 46 + r() * 34, palm: r() < .3, v: r() });
    for (let i = 0; i < 60; i++) palms.push({ x: i * 240 + r() * 120, h: 70 + r() * 40, palm: r() < .45, v: r() });
  }
  function reset() {
    boy = { x: 70, y: rt + RH * .5, vx: 0, vy: 0, ph: 0, face: 1, a: 1 };
    items = ITEMS.map(([x, f, e], i) => ({ f, hx: x, hy: rt + f * RH, x, y: rt + f * RH, e, ph: i * 1.7, prox: 0 }));
    parts = []; cam = 0; mode = 'ready'; ts = 1; tint = 0; shake = 0; wt = 0; inv = 0; t = 0;
  }
  function resize() {
    const b = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(b.width * dpr); cv.height = Math.round(b.height * dpr);
    H = 400; W = b.width / b.height * 400; if (W < 560) { W = 560; H = b.height / b.width * 560; }
    sc = cv.width / W; hz = H - 172; rt = H - 122; rb = rt + RH;
    if (boy) { items.forEach(i => { i.hy = rt + i.f * RH; i.y = i.hy; }); boy.y = clamp(boy.y, rt + 4, rb); }
  }

  /* ---------- input ---------- */
  const KEYMAP = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' };
  const kd = e => { const k = KEYMAP[e.key]; if (!k || !active) return; e.preventDefault(); keys.add(k); };
  const ku = e => { const k = KEYMAP[e.key]; if (k) keys.delete(k); };
  function pdown(e) { const b = cv.getBoundingClientRect(); joy = { id: e.pointerId, ox: e.clientX - b.left, oy: e.clientY - b.top, x: 0, y: 0 }; cv.setPointerCapture(e.pointerId); }
  function pmove(e) { if (!joy || joy.id !== e.pointerId) return; const b = cv.getBoundingClientRect(); let dx = (e.clientX - b.left - joy.ox) / 45, dy = (e.clientY - b.top - joy.oy) / 45, m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } joy.x = m < .15 ? 0 : dx; joy.y = m < .15 ? 0 : dy; }
  const pup = () => { joy = null; };
  function axis() {
    let x = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0), y = (keys.has('d') ? 1 : 0) - (keys.has('u') ? 1 : 0);
    if (joy) { x += joy.x; y += joy.y; } const m = Math.hypot(x, y); return m > 1 ? [x / m, y / m] : [x, y];
  }

  /* ---------- simulation ---------- */
  function update(rdt) {
    ts = lerp(ts, mode === 'caught' ? .04 : 1, 1 - Math.exp(-(mode === 'caught' ? 7 : 5) * rdt));
    const dt = rdt * ts; t += rdt; shake *= Math.exp(-6 * rdt); inv = Math.max(0, inv - rdt);
    tint = lerp(tint, mode === 'caught' ? .28 : 0, 1 - Math.exp(-4 * rdt));
    if (mode === 'ready' && (keys.size || (joy && (joy.x || joy.y)))) mode = 'play';
    if (mode === 'play' || mode === 'ready' || mode === 'caught') {
      const [ix, iy] = mode === 'play' || mode === 'ready' ? axis() : [0, 0], MAX = 215, ACC = 700, FR = 900;
      const tx = ix * MAX, ty = iy * MAX * .55;
      boy.vx = approach(boy.vx, tx, (tx ? ACC : FR) * dt); boy.vy = approach(boy.vy, ty, (ty ? ACC : FR) * dt);
      boy.x = clamp(boy.x + boy.vx * dt, 30, GOAL + 40); boy.y = clamp(boy.y + boy.vy * dt, rt + 4, rb);
      if (boy.y <= rt + 4 || boy.y >= rb) boy.vy *= .5;
      if (boy.vx > 8) boy.face = 1; else if (boy.vx < -8) boy.face = -1;
    }
    const sp = Math.hypot(boy.vx, boy.vy); boy.ph += sp * dt * .055;
    const sg = Math.sin(boy.ph) > 0 ? 1 : -1; if (sg !== lastSign && sp > 90) dust(boy.x - boy.face * 6, boy.y, 3); lastSign = sg;
    items.forEach(it => {
      const dx = boy.x - it.x, dy = (boy.y - it.y) * 2, d = Math.hypot(dx, dy), R = 100;
      const p = mode === 'win' ? 0 : clamp(1 - d / R, 0, 1); it.prox = lerp(it.prox, p, 1 - Math.exp(-8 * rdt));
      if (p > 0 && mode === 'play') { it.x += dx / (d || 1) * 34 * p * dt; it.y += dy / 2 / (d || 1) * 34 * p * dt; if (!RM && Math.random() < p * .08) parts.push({ x: it.x, y: it.y - 20, vx: dx / d * 20, vy: -8, l: .7, m: .7, r: 2.5, c: '184,100,63' }); }
      else { it.x = lerp(it.x, it.hx, 1 - Math.exp(-1.5 * dt)); it.y = lerp(it.y, it.hy, 1 - Math.exp(-1.5 * dt)); }
      it.y = clamp(it.y, rt, rb);
      if (mode === 'play' && !inv && d < 40) caught(it);
    });
    if (mode === 'play' && boy.x > GOAL - 50) { mode = 'win'; wt = 0; ts = 1; }
    if (mode === 'win') winStep(rdt);
    parts.forEach(p => { p.x += p.vx * rdt; p.y += p.vy * rdt; p.vy += (p.g || 0) * rdt; p.l -= rdt; }); parts = parts.filter(p => p.l > 0);
    const target = boy.x - W * .36 + boy.vx * .35; cam = lerp(cam, clamp(target, 0, GOAL + 330 - W), 1 - Math.exp(-4 * rdt));
  }
  const approach = (v, to, d) => v < to ? Math.min(v + d, to) : Math.max(v - d, to);
  const dust = (x, y, n) => { if (RM) return; for (let i = 0; i < n; i++) parts.push({ x, y, vx: -boy.face * (10 + Math.random() * 20), vy: -6 - Math.random() * 10, l: .5, m: .5, r: 2 + Math.random() * 2, c: '170,140,95', g: 30 }); };
  function caught(it) {
    mode = 'caught'; boy.hit = it; shake = RM ? 0 : 7;
    for (let i = 0; i < 14 && !RM; i++) parts.push({ x: it.x, y: it.y - 20, vx: (Math.random() - .5) * 120, vy: -Math.random() * 80, l: .8, m: .8, r: 3, c: '184,100,63', g: 90 });
    setTimeout(() => active && mode === 'caught' && overlay({ t: 'கவனம் சிதறியது!', s: 'Your attention was distracted.', k: 'ஒரு கணம் நில். யோசி. மீண்டும் முயற்சி செய்.', b: [['தொடர்', cont], ['மீண்டும் தொடங்கு', retry]] }), 850);
  }
  function cont() { hide(); boy.x = Math.max(40, boy.x - 150); boy.vx = boy.vy = 0; inv = 1.6; mode = 'play'; }
  function retry() { hide(); reset(); start(); }
  function winStep(rdt) {
    wt += rdt; const dx = GOAL + 10 - boy.x, tyy = rt + RH * .35;
    if (wt < 1.7) { boy.vx = approach(boy.vx, Math.min(150, Math.abs(dx) * 3 + 40), 500 * rdt); boy.x += boy.vx * rdt; boy.y += (tyy - boy.y) * Math.min(1, 3 * rdt); boy.face = 1; }
    else { boy.vx = approach(boy.vx, 0, 600 * rdt); boy.a = Math.max(0, boy.a - rdt * 2.2); }
    if (wt > 1.7 && !boy.cel) { boy.cel = 1; for (let i = 0; i < (RM ? 20 : 90); i++) parts.push({ x: GOAL + 10, y: rt - 30, vx: (Math.random() - .5) * 220, vy: -60 - Math.random() * 160, l: 1.8, m: 1.8, r: 2 + Math.random() * 2.5, c: Math.random() < .5 ? '176,138,62' : '184,100,63', g: 140 }); }
    if (wt > 4.9 && !boy.done) { boy.done = 1; overlay({ t: 'வெற்றி!', s: 'நீ கவனம் சிதறாமல் இலக்கை அடைந்தாய்.', win: 1, b: [['மீண்டும் விளையாடு', retry], ['முடி', close]] }); }
  }

  /* ---------- drawing ---------- */
  const sx = (x, p = 1) => x - cam * p;
  function draw() {
    cx.setTransform(sc, 0, 0, sc, 0, 0);
    if (shake > .2) cx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    sky(); hills(.12, '#d6c99c', 26, .006, hz - 4); gopuram(); hills(.26, '#b9bd8c', 22, .009, hz + 6);
    treeRow(trees, .45, hz + 10, .62, '#8c9b5d', '#79884b'); ground(); treeRow(palms, .8, rt - 20, 1, '#6f7d4a', '#5a6a3a');
    road(); goal(); entities(); grassFg(); particles(); tortoise(); hud();
    if (tint > .01) { cx.fillStyle = `rgba(70,45,25,${tint})`; cx.fillRect(-20, -20, W + 40, H + 40); }
    if (joy) { cx.globalAlpha = .35; cx.strokeStyle = '#3b2a1a'; cx.lineWidth = 2; cx.beginPath(); cx.arc(joy.ox / cv.getBoundingClientRect().width * W, joy.oy / cv.getBoundingClientRect().height * H, 24, 0, 7); cx.stroke(); cx.fillStyle = '#b08a3e'; cx.beginPath(); cx.arc(joy.ox / cv.getBoundingClientRect().width * W + joy.x * 22, joy.oy / cv.getBoundingClientRect().height * H + joy.y * 22, 10, 0, 7); cx.fill(); cx.globalAlpha = 1; }
  }
  function sky() {
    let g = cx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#efd9a3'); g.addColorStop(1, '#f6ecd3'); cx.fillStyle = g; cx.fillRect(-20, -20, W + 40, hz + 30);
    const x = W * .72 - cam * .02; g = cx.createRadialGradient(x, hz - 100, 4, x, hz - 100, 120); g.addColorStop(0, 'rgba(255,236,160,.95)'); g.addColorStop(.3, 'rgba(255,226,140,.45)'); g.addColorStop(1, 'rgba(255,226,140,0)'); cx.fillStyle = g; cx.fillRect(x - 130, hz - 230, 260, 260);
  }
  function hills(p, col, amp, f, base) {
    cx.fillStyle = col; cx.beginPath(); cx.moveTo(-20, hz + 10);
    for (let x = -20; x <= W + 20; x += 14) { const w = x + cam * p; cx.lineTo(x, base - amp - (Math.sin(w * f) * amp + Math.sin(w * f * 2.3 + 1.7) * amp * .5)); }
    cx.lineTo(W + 20, hz + 10); cx.fill();
  }
  function gopuram() { // distant temple tower, a quiet nod to Tamil architecture
    cx.fillStyle = 'rgba(160,132,90,.38)'; for (const wx of [500, 2300, 4300]) { const x = sx(wx, .12) , b = hz - 6; if (x < -80 || x > W + 80) continue; for (let i = 0; i < 5; i++) { const w = 46 - i * 8, y = b - i * 10; cx.fillRect(x - w / 2, y - 10, w, 10); } cx.fillRect(x - 2, b - 62, 4, 12); }
  }
  function treeShape(x, base, h, palm, v, c1, c2) {
    if (palm) { cx.strokeStyle = c2; cx.lineWidth = Math.max(2, h * .06); cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x, base); cx.quadraticCurveTo(x + 5 * (v - .5) * 4, base - h * .55, x + 3, base - h); cx.stroke();
      cx.lineWidth = Math.max(1.5, h * .035); for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6; cx.beginPath(); cx.moveTo(x + 3, base - h); cx.quadraticCurveTo(x + 3 + Math.cos(a) * h * .3, base - h + Math.sin(a) * h * .2 - 4, x + 3 + Math.cos(a) * h * .42, base - h + Math.sin(a) * h * .1 + h * .14); cx.stroke(); } }
    else { cx.fillStyle = '#6b4a2b'; cx.fillRect(x - h * .035, base - h * .5, h * .07, h * .5); cx.fillStyle = c2; cx.beginPath(); cx.arc(x - h * .17, base - h * .62, h * .22, 0, 7); cx.arc(x + h * .17, base - h * .6, h * .22, 0, 7); cx.fill(); cx.fillStyle = c1; cx.beginPath(); cx.arc(x, base - h * .74, h * .27, 0, 7); cx.arc(x - h * .06, base - h * .58, h * .2, 0, 7); cx.fill(); }
  }
  function treeRow(arr, p, base, k, c1, c2) { for (const tr of arr) { const x = sx(tr.x, p); if (x < -60 || x > W + 60) continue; treeShape(x, base + tr.v * 6, tr.h * k, tr.palm, tr.v, c1, c2); } }
  function ground() { const g = cx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#8d9c5e'); g.addColorStop(1, '#6a7846'); cx.fillStyle = g; cx.fillRect(-20, hz, W + 40, H - hz + 20); }
  function road() {
    const y0 = rt - 14, y1 = rb + 12; cx.fillStyle = '#b58a52'; cx.fillRect(-20, y0 - 3, W + 40, y1 - y0 + 6);
    const g = cx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#c9a46d'); g.addColorStop(1, '#d8b985'); cx.fillStyle = g; cx.fillRect(-20, y0, W + 40, y1 - y0);
    const r = rng(3); cx.fillStyle = 'rgba(110,80,45,.28)'; for (let i = 0; i < 300; i++) { const wx = r() * (GOAL + 700), y = y0 + 4 + r() * (y1 - y0 - 8), x = sx(wx); if (x > -4 && x < W + 4) cx.fillRect(x, y, 2 + r() * 2, 1.5); }
    cx.strokeStyle = 'rgba(120,70,40,.28)'; cx.fillStyle = 'rgba(120,70,40,.28)'; cx.lineWidth = 1.2; for (let wx = 400; wx < GOAL; wx += 650) { const x = sx(wx), y = (rt + rb) / 2; if (x < -50 || x > W + 50) continue; cx.beginPath(); cx.moveTo(x - 22, y); cx.lineTo(x, y - 12); cx.lineTo(x + 22, y); cx.lineTo(x, y + 12); cx.closePath(); cx.stroke(); for (const [dx, dy] of [[0, 0], [-11, 0], [11, 0], [0, -6], [0, 6]]) { cx.beginPath(); cx.arc(x + dx, y + dy, 1.4, 0, 7); cx.fill(); } }
  }
  function goal() {
    const x = sx(GOAL), b = rt - 8, lit = mode === 'win' ? clamp(wt / 1.5, 0, 1) : 0; if (x < -150 || x > W + 150) return;
    cx.fillStyle = '#e7d4a5'; cx.fillRect(x - 100, b - 84, 200, 84); cx.fillStyle = '#b8643f'; for (let i = 0; i < 10; i++) if (i % 2 === 0) cx.fillRect(x - 100 + i * 20, b - 12, 20, 12);
    [[96, 22], [76, 20], [56, 18], [36, 16]].forEach(([w, h], i) => { cx.fillStyle = i % 2 ? '#c9754a' : '#b8643f'; cx.fillRect(x - w, b - 84 - (i + 1) * h + 4, w * 2, h - 2); cx.fillStyle = '#8a4a2a'; cx.fillRect(x - w, b - 84 - (i + 1) * h + 2, w * 2, 3); });
    cx.fillStyle = '#b08a3e'; cx.fillRect(x - 2, b - 84 - 94, 4, 16); cx.beginPath(); cx.arc(x, b - 84 - 98, 5, 0, 7); cx.fill();
    cx.fillStyle = '#4a3320'; cx.beginPath(); cx.moveTo(x - 22, b); cx.lineTo(x - 22, b - 40); cx.arc(x, b - 40, 22, Math.PI, 0); cx.lineTo(x + 22, b); cx.fill();
    if (lit) { const g = cx.createRadialGradient(x, b - 30, 2, x, b - 30, 90); g.addColorStop(0, `rgba(255,224,130,${.95 * lit})`); g.addColorStop(1, 'rgba(255,224,130,0)'); cx.fillStyle = g; cx.fillRect(x - 100, b - 130, 200, 140); }
    cx.fillStyle = '#6b4a2b'; cx.fillRect(x - 46, b - 76, 92, 20); cx.fillStyle = '#f6ecd3'; cx.font = `700 14px ${FONT}`; cx.textAlign = 'center'; cx.fillText('இலக்கு', x, b - 61);
    const fx = x + 70, fy = b - 84 - 70; cx.strokeStyle = '#3b2a1a'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(fx, fy + 40); cx.lineTo(fx, fy); cx.stroke(); cx.fillStyle = '#b8643f'; cx.beginPath(); cx.moveTo(fx, fy); for (let i = 0; i <= 20; i++) cx.lineTo(fx + i * 1.2, fy + 3 + Math.sin(t * 5 + i * .4) * 2 * i / 20); for (let i = 20; i >= 0; i--) cx.lineTo(fx + i * 1.2, fy + 17 + Math.sin(t * 5 + i * .4) * 2 * i / 20); cx.fill();
    for (let i = 0; i < 5; i++) { cx.fillStyle = '#d9c391'; cx.fillRect(x - 40 - i * 4, b + i * 3, 80 + i * 8, 3); }
  }
  function entities() {
    const list = items.map(i => ({ y: i.y, f: () => item(i) })); list.push({ y: boy.y, f: bodyBoy }); list.push({ y: rt - 12, f: startSign }); list.sort((a, b) => a.y - b.y); list.forEach(o => o.f());
  }
  const dscale = y => .85 + .3 * clamp((y - rt) / RH, 0, 1);
  function startSign() { const x = sx(90); if (x < -80 || x > W + 80) return; const y = rt - 6; cx.fillStyle = '#5a3a20'; cx.fillRect(x - 3, y - 50, 6, 50); cx.fillStyle = '#8a5a30'; cx.fillRect(x - 36, y - 62, 72, 24); cx.strokeStyle = '#3b2a1a'; cx.lineWidth = 2; cx.strokeRect(x - 36, y - 62, 72, 24); cx.fillStyle = '#f6ecd3'; cx.font = `700 12px ${FONT}`; cx.textAlign = 'center'; cx.fillText('தொடக்கம்', x, y - 46); }
  function item(it) {
    const x = sx(it.x); if (x < -60 || x > W + 60) return; const s = dscale(it.y), p = it.prox, k = (1 + .4 * p) * s, bob = Math.sin(t * 2 + it.ph) * 4;
    cx.fillStyle = 'rgba(40,25,10,.22)'; cx.beginPath(); cx.ellipse(x, it.y + 2, 17 * k, 5 * k, 0, 0, 7); cx.fill();
    const g = cx.createRadialGradient(x, it.y - 24 + bob, 2, x, it.y - 24 + bob, 34 * k); g.addColorStop(0, `rgba(255,214,120,${.35 + .4 * p})`); g.addColorStop(1, 'rgba(255,214,120,0)'); cx.fillStyle = g; cx.fillRect(x - 40 * k, it.y - 64 + bob, 80 * k, 80 * k);
    if (p > .05) { const r = ((t * 1.4 + it.ph) % 1); cx.strokeStyle = `rgba(184,100,63,${(1 - r) * .6 * p})`; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(x, it.y, (20 + r * 36) * k, (6 + r * 11) * k, 0, 0, 7); cx.stroke(); }
    cx.font = `${30 * k}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText(it.e, x + Math.sin(t * 30) * p * 1.2, it.y - 14 + bob);
  }
  function bodyBoy() {
    if (boy.a <= 0) return; const x = sx(boy.x), s = dscale(boy.y) , sp = clamp(Math.hypot(boy.vx, boy.vy) / 200, 0, 1), ph = boy.ph;
    cx.save(); cx.globalAlpha = boy.a; cx.fillStyle = 'rgba(40,25,10,.28)'; cx.beginPath(); cx.ellipse(x, boy.y + 2, 22 * s, 6 * s, 0, 0, 7); cx.fill();
    cx.translate(x, boy.y); cx.scale(boy.face * s, s); cx.lineCap = 'round'; cx.lineJoin = 'round';
    const bob = -Math.abs(Math.cos(ph)) * 3.5 * sp + Math.sin(t * 2) * (1 - sp), lean = clamp(boy.vx / 215, -1, 1) * .22 * boy.face, hipY = -36 + bob;
    const leg = (p, col) => { const a = Math.sin(p) * .75 * sp, fl = Math.max(0, -Math.cos(p)) * 1.05 * sp, kx = Math.sin(a) * 19, ky = hipY + Math.cos(a) * 19, b = a - fl, fx = kx + Math.sin(b) * 19, fy = ky + Math.cos(b) * 19;
      cx.strokeStyle = col; cx.lineWidth = 8; cx.beginPath(); cx.moveTo(0, hipY); cx.lineTo(kx, ky); cx.stroke(); cx.strokeStyle = '#8a5a3c'; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(kx, ky); cx.lineTo(fx, fy); cx.stroke(); cx.fillStyle = '#3b2a1a'; cx.beginPath(); cx.ellipse(fx + 3, fy + 1, 7, 3.6, 0, 0, 7); cx.fill(); };
    const arm = (p, col, sk) => { const sh = [lean * 30, -60 + bob], a = -Math.sin(p) * .8 * sp, ex = sh[0] + Math.sin(a) * 14, ey = sh[1] + Math.cos(a) * 14, b = a + .5 + .5 * sp, hx = ex + Math.sin(b) * 13, hy = ey + Math.cos(b) * 13;
      cx.strokeStyle = col; cx.lineWidth = 7.5; cx.beginPath(); cx.moveTo(sh[0], sh[1]); cx.lineTo(ex, ey); cx.stroke(); cx.strokeStyle = sk; cx.lineWidth = 5.5; cx.beginPath(); cx.moveTo(ex, ey); cx.lineTo(hx, hy); cx.stroke(); };
    leg(ph + Math.PI, '#4a4030'); arm(ph, '#a89a45', '#7a4f33');
    cx.strokeStyle = '#c0ae4c'; cx.lineWidth = 17; cx.beginPath(); cx.moveTo(0, hipY + 2); cx.lineTo(lean * 30, -58 + bob); cx.stroke(); cx.strokeStyle = '#a89a45'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(lean * 30 + 6, -58 + bob); cx.lineTo(lean * 30 + 6, -44 + bob); cx.stroke();
    const hx = lean * 38 + 2, hy = -74 + bob; cx.fillStyle = '#8a5a3c'; cx.fillRect(hx - 3, hy + 6, 6, 8); cx.beginPath(); cx.arc(hx, hy, 11.5, 0, 7); cx.fill(); cx.beginPath(); cx.arc(hx - 10, hy + 1, 3.6, 0, 7); cx.fill();
    cx.fillStyle = '#2c1b10'; cx.beginPath(); cx.arc(hx - 1, hy - 3, 12, Math.PI * 1.02, Math.PI * 2.1); cx.quadraticCurveTo(hx + 8, hy - 8, hx + 1, hy - 4); cx.fill(); cx.beginPath(); cx.arc(hx - 5, hy - 8, 6, 0, 7); cx.fill();
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(hx + 5, hy, 2.6, 0, 7); cx.fill(); cx.fillStyle = '#1c1008'; cx.beginPath(); cx.arc(hx + 5.8, hy + .4, 1.4, 0, 7); cx.fill();
    cx.strokeStyle = '#5b3a21'; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(hx + 4, hy + 4, 3.5, .2, 1.3); cx.stroke();
    leg(ph, '#5a4a33'); arm(ph + Math.PI, '#c0ae4c', '#8a5a3c'); cx.restore();
  }
  function grassFg() { cx.strokeStyle = 'rgba(90,106,58,.75)'; cx.lineWidth = 1.5; for (let wx = 0; wx < GOAL + 600; wx += 46) { const x = sx(wx, 1.25) + Math.sin(wx) * 8; if (x < -10 || x > W + 10) continue; const y = H - 4; for (let i = -1; i < 2; i++) { cx.beginPath(); cx.moveTo(x + i * 4, y); cx.quadraticCurveTo(x + i * 5 + Math.sin(t * 2 + wx) * 2, y - 8, x + i * 7, y - 15 - (wx % 5)); cx.stroke(); } } }
  function particles() { parts.forEach(p => { cx.fillStyle = `rgba(${p.c},${clamp(p.l / p.m, 0, 1) * .8})`; cx.beginPath(); cx.arc(sx(p.x), p.y, p.r, 0, 7); cx.fill(); }); }
  function tortoise() {
    if (mode !== 'win' || wt < 1.4) return; const k = wt - 1.4, x = lerp(-70, W * .5, clamp(k / 2, 0, 1)), w = clamp((wt - 3.5) / 1, 0, 1), y = H - 40, walking = k < 2 ? 1 : 0, e = 1 - w;
    cx.save(); cx.translate(x, y); cx.scale(1.15, 1.15); cx.fillStyle = 'rgba(40,25,10,.25)'; cx.beginPath(); cx.ellipse(0, 6, 34, 6, 0, 0, 7); cx.fill();
    if (w > .8) { const g = cx.createRadialGradient(0, -14, 4, 0, -14, 60); g.addColorStop(0, 'rgba(255,224,130,.8)'); g.addColorStop(1, 'rgba(255,224,130,0)'); cx.fillStyle = g; cx.fillRect(-70, -80, 140, 100); }
    cx.fillStyle = '#7f9050'; cx.strokeStyle = '#2f3a1c'; cx.lineWidth = 2;
    [[-18, 0], [-4, 1], [8, 0], [20, 1]].forEach(([lx, o]) => { const sw = Math.sin(k * 6 + o * Math.PI) * 4 * walking; cx.fillRect(lx + sw - 3, -8 + 9 * w * -1 * -1 - 9 * w, 7, 12 * e + 1); });
    cx.beginPath(); cx.arc(30 - 22 * w, -10, 8 * e + 1, 0, 7); cx.fill(); cx.fillRect(18 - 10 * w, -13, 14 * e, 7 * e);
    const g2 = cx.createRadialGradient(-8, -30, 4, 0, -10, 40); g2.addColorStop(0, '#a5b074'); g2.addColorStop(1, '#4a5a2c'); cx.fillStyle = g2; cx.beginPath(); cx.moveTo(-32, -4); cx.bezierCurveTo(-32, -42, 32, -42, 32, -4); cx.closePath(); cx.fill(); cx.stroke();
    cx.strokeStyle = 'rgba(47,58,28,.6)'; cx.beginPath(); cx.moveTo(0, -32); cx.lineTo(0, -4); cx.moveTo(-16, -28); cx.lineTo(-20, -4); cx.moveTo(16, -28); cx.lineTo(20, -4); cx.stroke(); cx.restore();
  }
  function hud() {
    const bw = Math.min(W * .5, 300), x0 = (W - bw) / 2, y = 16, f = clamp(boy.x / GOAL, 0, 1);
    cx.fillStyle = 'rgba(59,42,26,.2)'; cx.fillRect(x0, y, bw, 4); cx.fillStyle = '#b08a3e'; cx.fillRect(x0, y, bw * f, 4);
    cx.fillStyle = '#3b2a1a'; cx.beginPath(); cx.arc(x0 + bw * f, y + 2, 6, 0, 7); cx.fill(); cx.fillStyle = '#b8643f'; cx.fillRect(x0 + bw, y - 8, 2, 14); cx.fillRect(x0 + bw + 2, y - 8, 9, 6);
    if (mode === 'ready') { cx.fillStyle = 'rgba(59,42,26,.75)'; cx.font = `600 14px ${FONT}`; cx.textAlign = 'center'; cx.fillText('நடக்கத் தொடங்கு →', W / 2, H - 150 + Math.sin(t * 3) * 3); }
  }

  /* ---------- overlay + lifecycle ---------- */
  function overlay(o) {
    const el = $('gOvl'); $('gT').textContent = o.t; $('gS').textContent = o.s;
    $('gK').innerHTML = o.win ? '<span class="l1">இதுதான் ஐந்தடக்கல்.</span><span class="l2">ஆசைகள் வந்தாலும், நம்மை நாமே கட்டுப்படுத்தி சரியான இலக்கை அடைவது.</span><span class="l3">ஒருமையுள் ஆமைபோல் ஐந்தடக்கல் ஆற்றின்…</span>' : (o.k || '');
    el.classList.toggle('win', !!o.win); const row = $('gB'); row.innerHTML = '';
    o.b.forEach(([label, fn], i) => { const b = document.createElement('button'); b.className = 'btn' + (i ? ' ghost' : ''); b.textContent = label; b.onclick = fn; row.appendChild(b); });
    if (o.win) say('ஆமை போல… அடக்கம் உன் கவசம்.', 'Like the tortoise, self-control is your shell.');
    el.hidden = false; row.firstChild && row.firstChild.focus({ preventScroll: true });
  }
  const hide = () => { $('gOvl').hidden = true; };
  function start() { hide(); mode = 'ready'; }
  function loop(now) {
    if (!active) return; const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; update(dt); draw(); raf = requestAnimationFrame(loop);
  }
  function open(exit) {
    onExit = exit; cv = $('gc'); cx = cv.getContext('2d'); show('game'); setPhase('game', 4);
    say('இலக்கை நோக்கி நட…', 'Steer around what pulls you. Arrow keys or WASD, or drag on the screen.');
    build(); resize(); reset(); resize(); active = true; last = performance.now();
    addEventListener('keydown', kd); addEventListener('keyup', ku); addEventListener('resize', resize);
    cv.onpointerdown = pdown; cv.onpointermove = pmove; cv.onpointerup = cv.onpointercancel = pup;
    overlay({ t: 'இலக்கை அடை', s: 'Reach the school without being pulled away.', k: 'ஆசைகள் இழுக்கும். தொடாமல் சுற்றி நட.', b: [['தொடங்கு', start]] });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function close() { active = false; cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', resize); keys.clear(); hide(); onExit && onExit(); }
  return { open, close, debug: { get boy() { return boy; }, get items() { return items; }, set mode(m) { mode = m; wt = 0; }, get mode() { return mode; } } };
})();
