'use strict';
/* ---------- Content (data-driven; swap for another Kural later) ---------- */
const CONTENT = {
  assets: { child: 'assets/child-studying.png', valluvar: 'assets/thiruvalluvar.png' },
  things: [ // x,y in % of the scene; sense index maps to SENSES
    { icon: '📱', sense: 0, x: 12, y: 18, ta: 'ஃபோன் ஒளிர்கிறது. கண்கள் திரும்புகின்றன.', en: 'The phone lights up. The eyes turn.' },
    { icon: '🎵', sense: 1, x: 88, y: 20, ta: 'இசை கேட்கிறது. செவிகள் இழுக்கப்படுகின்றன.', en: 'Music drifts in. The ears are pulled.' },
    { icon: '🍪', sense: 2, x: 8,  y: 62, ta: 'நல்ல மணம்! மூக்கு தேடுகிறது.', en: 'A lovely smell. The nose follows it.' },
    { icon: '🍫', sense: 3, x: 92, y: 62, ta: 'சாக்லெட்! நாவில் சுவை ஊறுகிறது.', en: 'Chocolate. The tongue already tastes it.' },
    { icon: '🛋️', sense: 4, x: 50, y: 6,  ta: 'சுகமான இருக்கை. உடல் ஓய்வு கேட்கிறது.', en: 'A cosy sofa. The body wants comfort.' }
  ],
  senses: [['கண்', 'sight'], ['செவி', 'hearing'], ['மூக்கு', 'smell'], ['நா', 'taste'], ['மெய்', 'touch']],
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
function show(id) { ['world', 'turtle', 'choice', 'finale'].forEach(s => $(s).hidden = s !== id); }

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
  $('focus').style.setProperty('--f', 1); $('focus').style.opacity = 1;
  buildWorld(); show('world'); setPhase('calm', 0);
  say('ஒரு சிறிய தருணம். ஒரு பெரிய தேர்வு.', 'He really wants to study tonight.');
  later(() => say('படிக்க வேண்டும் என்று அவன் உறுதியாக இருக்கிறான்.', 'Watch what happens to his attention.'), 3200);
  later(() => { setPhase('pull', 1); say('ஏதோ ஒன்று அழைக்கிறது…', 'Tap what is calling him.'); document.querySelectorAll('.thing').forEach((b, i) => later(() => b.classList.add('in'), i * 700)); }, 6200);
}
function hook(i, btn) {
  if (S.phase !== 'pull' || S.hooked.has(i)) return;
  const t = CONTENT.things[i]; S.hooked.add(i); btn.classList.add('hooked');
  const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  ln.setAttribute('class', 'thread'); ln.setAttribute('vector-effect', 'non-scaling-stroke');
  ln.setAttribute('x1', 50); ln.setAttribute('y1', 58); ln.setAttribute('x2', t.x); ln.setAttribute('y2', t.y); $('threads').appendChild(ln);
  $('senses').children[t.sense].classList.add('on');
  $('focus').style.setProperty('--f', (1 - S.hooked.size * 0.16).toFixed(2));
  say(t.ta, t.en);
  if (S.hooked.size === 5) later(() => {
    say('ஐந்து புலன்கள். ஐந்து இழுப்புகள்.', 'Five senses, five pulls, and his focus is almost gone.', { label: 'ஒரு கணம் நில்', fn: pause });
  }, 2600);
}

/* ---------- Scene 2: the pause → tortoise ---------- */
function pause() {
  setPhase('pause', 2); $('go').hidden = true;
  $('focus').style.setProperty('--f', 1);
  say('நில்.', 'Everything stops. He can feel the pull, and he does not have to follow it.');
  later(tortoise, 3600);
}
function tortoise() {
  setPhase('turtle', 3); show('turtle'); buildTortoise();
  say('ஆமை போல…', 'Danger comes, and the tortoise draws its five parts in. Tap each one.');
}
const LIMBS = [ // [shape attrs, label pos, dx, dy, pull]
  { sense: 0, el: '<circle cx="330" cy="150" r="26"/><rect x="300" y="138" width="36" height="24" rx="10"/><circle cx="338" cy="144" r="3" fill="#2a1d12" stroke="none"/>', dx: -110, dy: 20, px: 14, lx: 330, ly: 112 },
  { sense: 1, el: '<rect x="108" y="170" width="34" height="58" rx="16"/>', dx: 80, dy: -30, px: -10, lx: 125, ly: 250 },
  { sense: 2, el: '<rect x="162" y="176" width="34" height="56" rx="16"/>', dx: 30, dy: -34, px: -8, lx: 179, ly: 252 },
  { sense: 3, el: '<rect x="214" y="176" width="34" height="56" rx="16"/>', dx: -20, dy: -34, px: 8, lx: 231, ly: 252 },
  { sense: 4, el: '<rect x="266" y="170" width="34" height="58" rx="16"/>', dx: -70, dy: -30, px: 10, lx: 283, ly: 250 }
];
function buildTortoise() {
  const g = $('limbs'); g.innerHTML = ''; $('turtle').classList.remove('safe');
  LIMBS.forEach((l, i) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.setAttribute('class', 'limb'); el.setAttribute('tabindex', 0); el.setAttribute('role', 'button');
    el.setAttribute('aria-label', CONTENT.senses[l.sense][1] + ' – draw in');
    el.style.setProperty('--dx', l.dx + 'px'); el.style.setProperty('--dy', l.dy + 'px'); el.style.setProperty('--px', l.px + 'px');
    el.innerHTML = l.el; el.onclick = () => draw(i, el);
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); draw(i, el); } };
    g.appendChild(el);
    const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tx.setAttribute('x', l.lx); tx.setAttribute('y', l.ly); tx.setAttribute('class', 'lbl'); tx.setAttribute('text-anchor', 'middle'); tx.id = 'lb' + i;
    tx.textContent = CONTENT.senses[l.sense][0]; g.appendChild(tx);
  });
}
function draw(i, el) {
  if (S.withdrawn.has(i)) return; S.withdrawn.add(i); el.classList.add('in'); $('lb' + i).style.opacity = 0;
  if (S.withdrawn.size < 5) { say(`${5 - S.withdrawn.size} மீதம்…`, 'Calmly, one at a time.'); return; }
  $('turtle').classList.add('safe');
  say('இதுதான் ஐந்தடக்கல்.', 'Five senses drawn in. Safe and calm, because the tortoise chose.', { label: 'அவன் என்ன செய்வான்?', fn: startChoice });
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
  $('focus').style.setProperty('--f', 1.15);
  say('ஆசை இருந்தது. ஆனால் தேர்வு அவனுடையது.', 'The wish was there, but the choice was his. The room grows calm and he studies on.');
  later(finale, 4200);
}

/* ---------- Finale ---------- */
function finale() {
  show('finale'); setPhase('won', 4);
  $('chain').innerHTML = CONTENT.chain.map((w, i) => `<li style="animation-delay:${i * .45}s">${w}</li>`).join('');
  $('learn').textContent = 'ஆசையை உணர்வதும், அதற்குக் கீழ்ப்படியாமல் தேர்வு செய்வதும் ஐந்தடக்கல். இந்த அடக்கம் காலமெல்லாம் காக்கும் கவசம்.';
  say('ஆசை வந்தாலும், தேர்வு உன்னுடையது.', 'I can feel an impulse without having to obey it. The tortoise shows us how, and the shell is our self-control.');
}

/* ---------- Boot ---------- */
function probe(src, img, hideEl) {
  const p = new Image(); p.onload = () => { img.src = src; img.hidden = false; if (hideEl) hideEl.style.display = 'none'; }; p.src = src; // silent fallback to SVG
}
probe(CONTENT.assets.child, $('childImg'), $('childSvg'));
probe(CONTENT.assets.valluvar, $('vImg'), $('vFallback'));
$('again').onclick = startStory;
startStory();
