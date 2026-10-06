'use strict';
/* ---------- Content (data-driven; swap for another Kural later) ---------- */
const CONTENT = {
  assets: { child: 'assets/child-studying.png', valluvar: 'assets/thiruvalluvar.jpg' },
  things: [ // x,y in % of the scene; sense index maps to SENSES
    { icon: '📱', sense: 0, x: 12, y: 22, ta: 'ஃபோன் ஒளிர்கிறது. கண்கள் திரும்புகின்றன.', en: 'The phone lights up. The eyes turn.' },
    { icon: '🎵', sense: 1, x: 88, y: 22, ta: 'இசை கேட்கிறது. செவிகள் இழுக்கப்படுகின்றன.', en: 'Music drifts in. The ears are pulled.' },
    { icon: '🍪', sense: 2, x: 6, y: 48, ta: 'நல்ல மணம்! மூக்கு தேடுகிறது.', en: 'A lovely smell. The nose follows it.' },
    { icon: '🍫', sense: 3, x: 94, y: 48, ta: 'சாக்லெட்! நாவில் சுவை ஊறுகிறது.', en: 'Chocolate. The tongue already tastes it.' },
    { icon: '🛋️', sense: 4, x: 50, y: 94,  ta: 'சுகமான இருக்கை. உடல் ஓய்வு கேட்கிறது.', en: 'A cosy sofa. The body wants comfort.' }
  ],
  senses: [ // [name, english, Tamil explanation, English explanation]
    ['கண்', 'sight', 'கண் – பார்க்கும் புலன். ஒளிரும் திரையும் வண்ணங்களும் கண்ணை இழுக்கும்.', 'Eyes see. Bright screens and colours pull our gaze.'],
    ['செவி', 'hearing', 'செவி – கேட்கும் புலன். இனிய இசை காதை இழுக்கும்; எதைக் கேட்பது என்பது என் தேர்வு.', 'Ears hear. Music pulls us, but what to listen to is my choice.'],
    ['மூக்கு', 'smell', 'மூக்கு – நுகரும் புலன். நல்ல மணம் நம்மை அதை நோக்கி இழுக்கும்.', 'The nose smells. A lovely aroma draws us toward it.'],
    ['நா', 'taste', 'நா – சுவைக்கும் புலன். இனிப்பின் சுவை “இப்போதே வேண்டும்” என்று கேட்கும்.', 'The tongue tastes. Sweetness says "I want it now".'],
    ['மெய்', 'touch', 'மெய் – தொடு உணர்வு. சுகமும் ஓய்வும் உடலை இழுக்கும்.', 'The body feels. Comfort and rest pull the body.']
  ],
  chain: ['ஆசை', 'நில்', 'யோசி', 'தேர்வு', 'ஐந்தடக்கல்'],
  options: [
    { ta: 'இப்போதே விளையாடு', en: 'Play right now', ok: false,
      outTa: 'படிப்பு நழுவியது. ஆசை முடிவெடுத்தது.', outEn: 'The impulse decided, and the study slipped away. Try pausing first.' },
    { ta: 'நில். யோசி. படித்து முடித்து விளையாடு', en: 'Pause, think, then play after studying', ok: true },
    { ta: 'விளையாட்டையே வெறுத்து ஒதுக்கு', en: 'Hate games and never play', ok: false,
      outTa: 'விளையாட்டு பகை அல்ல. எப்போது என்பதே தேர்வு.', outEn: 'Games are not the enemy. Wisdom is choosing when.' }
  ]
};
/* ---------- State ---------- */
const S = { phase: 'calm', hooked: new Set(), withdrawn: new Set(), timers: [] };
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const later = (fn, ms) => S.timers.push(setTimeout(fn, reduce ? Math.min(ms, 50) : ms));
const clearTimers = () => { S.timers.forEach(clearTimeout); S.timers = []; };

/* ---------- Narrator + progress ---------- */
function say(ta, en, btn) {
  const t = $('ta'), e = $('en'), b = $('go');
  [t, e].forEach(x => x.classList.add('swap'));
  setTimeout(() => { t.textContent = ta; e.textContent = en || ''; [t, e].forEach(x => x.classList.remove('swap')); }, reduce ? 0 : 350);
  b.hidden = !btn;
  if (btn) { b.textContent = btn.label; b.onclick = btn.fn; b.classList.add('pulse'); }
}
function setPhase(p, step) {
  S.phase = p; document.body.dataset.phase = p;
  document.querySelectorAll('.trail i').forEach((d, i) => d.classList.toggle('on', i <= step));
}
function show(id) { ['world', 'turtle', 'choice', 'game', 'finale'].forEach(s => $(s).hidden = s !== id); }

/* ---------- Scene 1: calm → the pull ---------- */
function buildWorld() {
  const th = $('threads'); th.setAttribute('viewBox', '0 0 100 100'); th.setAttribute('preserveAspectRatio', 'none'); th.innerHTML = '';
  $('things').innerHTML = ''; $('senses').innerHTML = CONTENT.senses.map(s => `<li>${s[0]}<small>${s[1]}</small></li>`).join('');
  CONTENT.things.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'thing'; b.textContent = t.icon; b.style.left = t.x + '%'; b.style.top = t.y + '%';
    b.setAttribute('aria-label', t.en); b.onclick = () => hook(i, b); b.style.setProperty('--pull-x', (t.x < 50 ? 8 : -8) + 'px');
    $('things').appendChild(b);
  });
}
function startStory() {
  clearTimers(); S.hooked.clear(); S.withdrawn.clear();
  $('focus').style.setProperty('--v', 0);
  buildWorld(); show('world'); setPhase('calm', 0);
  say('அவன் படிக்கத் தொடங்குகிறான்…', 'He really wants to study tonight.');
  later(() => say('படிக்க வேண்டும் என்று அவன் உறுதியாக இருக்கிறான்.', 'Watch what happens to his attention.'), 3200);
  later(() => { setPhase('pull', 1); say('ஏதோ ஒன்று அழைக்கிறது…', 'Tap what is calling him.'); document.querySelectorAll('.thing').forEach((b, i) => later(() => b.classList.add('in'), i * 700)); }, 6200);
}
function hook(i, btn) {
  if (S.phase !== 'pull' || S.hooked.has(i)) return;
  const t = CONTENT.things[i]; S.hooked.add(i); btn.classList.add('hooked');
  const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  ln.setAttribute('class', 'thread'); ln.setAttribute('vector-effect', 'non-scaling-stroke');
  ln.setAttribute('x1', 50); ln.setAttribute('y1', 52); ln.setAttribute('x2', t.x); ln.setAttribute('y2', t.y); $('threads').appendChild(ln);
  $('senses').children[t.sense].classList.add('on');
  $('focus').style.setProperty('--v', (S.hooked.size * 0.2).toFixed(2));
  say(t.ta, t.en);
  if (S.hooked.size === 5) later(() => {
    say('ஐந்து புலன்கள். ஐந்து இழுப்புகள்.', 'Five senses, five pulls, and his focus is almost gone.', { label: 'ஒரு கணம் நில்', fn: pause });
  }, 2600);
}

/* ---------- Scene 2: the pause → tortoise ---------- */
function pause() {
  setPhase('pause', 2); $('go').hidden = true;
  $('focus').style.setProperty('--v', 0);
  say('நில்.', 'Everything stops. He can feel the pull, and he does not have to follow it.');
  later(tortoise, 3600);
}
function tortoise() {
  setPhase('turtle', 3); show('turtle'); buildTortoise();
  say('ஆமை போல… ஐந்து உறுப்புகளையும் தொடு.', 'Danger comes and the tortoise draws in its five parts. Touch each one to learn its sense.');
}
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
const leg = (x, far) => `<path class="${far ? 'far' : 'skin'}" d="M${x} 262h66l-4 74q-2 16-29 16t-29-16z"/>` +
  `<path d="M${x + 12} 300q20 8 42 0M${x + 14} 318q18 7 38 0" stroke="#33401f" stroke-width="2" fill="none" opacity=".45"/>` +
  [0, 1, 2].map(i => `<ellipse cx="${x + 17 + i * 16}" cy="344" rx="5" ry="6" fill="#efe3c0" stroke="#33401f" stroke-width="1.5"/>`).join('');
const HEAD = `<path class="skin" d="M500 214C528 204 540 188 562 186l26 8c26 5 38 22 30 38-8 16-30 18-48 20-20 2-40 14-70 14z"/>
  <path d="M520 226q10 6 22 2M524 242q12 6 26 0" stroke="#33401f" stroke-width="2" fill="none" opacity=".5"/>
  <path d="M610 218q-14 6-32 4" stroke="#33401f" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="591" cy="206" r="7" fill="#1c1408"/><circle cx="593" cy="204" r="2.2" fill="#fff"/><circle cx="612" cy="208" r="2" fill="#33401f"/>
  <path d="M580 196q10-6 20 0" stroke="#33401f" stroke-width="2.5" fill="none"/>`;
const LIMBS = [ // draw order: far legs behind, then near legs, then head
  { sense: 1, svg: leg(212, true),  cls: 'far',  dx: 30,  dy: -90, px: -9,  lx: 245, ly: 392 },
  { sense: 3, svg: leg(386, true),  cls: 'far',  dx: -40, dy: -90, px: 9,   lx: 419, ly: 392 },
  { sense: 4, svg: leg(440, false), cls: 'near', dx: -70, dy: -90, px: 10,  lx: 473, ly: 392 },
  { sense: 2, svg: leg(138, false), cls: 'near', dx: 90,  dy: -90, px: -10, lx: 171, ly: 392 },
  { sense: 0, svg: HEAD,            cls: 'head', dx: -140, dy: 14, px: 14,  lx: 584, ly: 160 }
];
function buildTortoise() {
  $('turtle').classList.remove('safe'); $('limbs').innerHTML = '';
  const sc = $('scutes'); sc.innerHTML = ''; $('rim').innerHTML = '';
  const hex = (cx, cy, r) => [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 180 * (60 * i - 30); return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a) * .92).toFixed(1); }).join(' ');
  for (let k = 0, y = 112; y < 300; k++, y += 62) for (let x = 40 + (k % 2) * 38; x < 600; x += 76) {
    const sq = 1 - Math.abs(x - 316) / 900; // scutes narrow toward the sides, like a curved shell
    mk('polygon', { points: hex(x, y, 43 * sq), fill: '#7d8d4f', 'fill-opacity': .55, stroke: '#2f3a1c', 'stroke-width': 3 }, sc);
    mk('polygon', { points: hex(x, y, 24 * sq), fill: 'none', stroke: '#2f3a1c', 'stroke-width': 1.5, opacity: .35 }, sc);
  }
  for (let x = 104; x < 530; x += 38) mk('rect', { x, y: 262, width: 38, height: 28, rx: 7, fill: '#56632f', stroke: '#2f3a1c', 'stroke-width': 3 }, $('rim'));
  LIMBS.forEach((l, i) => {
    const g = mk('g', { class: 'limb', tabindex: 0, role: 'button', 'aria-label': CONTENT.senses[l.sense][0] + ' – ' + CONTENT.senses[l.sense][1] }, $('limbs'));
    g.style.setProperty('--dx', l.dx + 'px'); g.style.setProperty('--dy', l.dy + 'px'); g.style.setProperty('--px', l.px + 'px');
    g.innerHTML = l.svg; g.onclick = () => draw(i, g);
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); draw(i, g); } };
    const t = mk('text', { x: l.lx, y: l.ly, class: 'lbl', 'text-anchor': 'middle', id: 'lb' + i, tabindex: 0, role: 'button' }, $('limbs'));
    t.textContent = CONTENT.senses[l.sense][0]; t.onclick = () => explain(i);
    t.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explain(i); } };
  });
}
function explain(i) {
  const s = CONTENT.senses[LIMBS[i].sense], left = 5 - S.withdrawn.size;
  say(s[2], s[3] + (left ? `  (${left} more to touch)` : ''));
}
function draw(i, el) {
  if (S.withdrawn.has(i)) return; S.withdrawn.add(i); el.classList.add('in'); $('lb' + i).classList.add('done');
  explain(i);
  if (S.withdrawn.size === 5) later(() => {
    $('turtle').classList.add('safe');
    say('இதுதான் ஐந்தடக்கல்.', 'All five drawn in. Safe and calm, because the tortoise chose.', { label: 'அவன் என்ன செய்வான்?', fn: startChoice });
  }, 4200);
}

/* ---------- Scene 3: the learner's choice ---------- */
function startChoice() {
  show('choice'); setPhase('pause', 4);
  say('நண்பனிடமிருந்து செய்தி: “வா, விளையாடலாம்!”', 'A friend invites him to play. You are him now. What do you choose?');
  const box = $('options'); box.innerHTML = '';
  [...CONTENT.options].sort(() => Math.random() - .5).forEach(o => {
    const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = `${o.ta}<small>${o.en}</small>`;
    b.onclick = () => choose(o, b); box.appendChild(b);
  });
}
function choose(o, b) {
  if (!o.ok) { b.classList.add('slip'); say(o.outTa, o.outEn); return; }
  document.querySelectorAll('.opt').forEach(x => x.disabled = true);
  show('world'); buildWorld(); setPhase('won', 4);
  $('focus').style.setProperty('--v', 0);
  say('ஆசை இருந்தது. ஆனால் தேர்வு அவனுடையது.', 'The wish was there, but the choice was his. The room grows calm and he studies on.');
  later(finale, 4200);
}

/* ---------- Finale ---------- */
function finale() {
  show('finale'); setPhase('won', 4);
  $('chain').innerHTML = CONTENT.chain.map((w, i) => `<li style="animation-delay:${i * .45}s">${w}</li>`).join('');
  const K = ['ஒருமையுள் ஆமைபோல் ஐந்தடக்கல் ஆற்றின்', 'எழுமையும் ஏமாப்பு உடைத்து.']; let wi = 0;
  document.querySelectorAll('.kural p').forEach((p, li) => {
    p.setAttribute('aria-label', K[li]); p.innerHTML = '';
    K[li].split(' ').forEach((w, k) => {
      if (k) p.appendChild(document.createTextNode(' '));
      const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = w; sp.setAttribute('aria-hidden', 'true');
      sp.style.animationDelay = (1.7 + wi++ * 0.32).toFixed(2) + 's'; p.appendChild(sp);
    });
  });
  $('learn').textContent = 'ஆசையை உணர்வதும், அதற்குக் கீழ்ப்படியாமல் தேர்வு செய்வதும் ஐந்தடக்கல். இந்த அடக்கம் காலமெல்லாம் காக்கும் கவசம்.';
  say('ஆசை வந்தாலும், தேர்வு உன்னுடையது.', 'I can feel an impulse without having to obey it. The tortoise shows us how, and the shell is our self-control.');
}

/* ---------- Boot ---------- */
function probe(src, img, hideEl) {
  const p = new Image(); p.onload = () => { img.src = src; img.hidden = false; if (hideEl) hideEl.style.display = 'none'; }; p.src = src; // silent fallback to SVG
}
probe(CONTENT.assets.valluvar, $('vImg'), $('vFallback'));
$('vImg').addEventListener('load', () => { $('vCap').hidden = false; $('vImg').closest('.seal').style.display = 'block'; });
$('again').onclick = startStory;
$('play').onclick = () => Game.open(finale);
function intro() { // wait for the learner before the narration begins
  clearTimers(); buildWorld(); show('world'); setPhase('calm', 0);
  say('ஒரு சிறிய தருணம். ஒரு பெரிய தேர்வு.', 'A short story about five senses and a tortoise.', { label: 'கதையைத் தொடங்கு', fn: startStory });
  $('go').focus({ preventScroll: true });
}
intro();
