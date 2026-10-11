// ORDVÆRKET — core helpers: save data, mastery, sound effects, Danish voice

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
const dist = (a, b) => Math.sqrt(dist2(a, b));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function weightedPick(items, wfn) {
  let tot = 0; const ws = items.map(i => { const w = Math.max(0, wfn(i)); tot += w; return w; });
  let r = Math.random() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

// ---------------------------------------------------------------------------
// SAVE
// ---------------------------------------------------------------------------
const Save = {
  key: 'ordvaerket.v1',
  data: null,
  defaults() {
    return {
      ink: 0, totalInk: 0, runs: 0, wins: 0,
      upgrades: {},
      heroes: ['kronik'], hero: 'kronik',
      seals: ['s_oere', 's_hjerte'], loadout: ['s_oere'],
      districts: [1], beaten: [], district: 1,
      mastery: {},
      seenIntro: false, seenHowTo: false, storySeen: [],
      settings: { sfx: true, voice: 'all' },
      best: {},
    };
  },
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      const d = this.defaults();
      this.data = raw ? Object.assign(d, JSON.parse(raw)) : d;
      this.data.settings = Object.assign(d.settings, this.data.settings || {});
    } catch (e) { this.data = this.defaults(); }
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* private mode */ } },
  reset() { this.data = this.defaults(); this.save(); },
};
Save.load();

const Mastery = {
  get(id) { return Save.data.mastery[id] || { c: 0, w: 0 }; },
  record(id, ok) {
    const m = Save.data.mastery[id] || (Save.data.mastery[id] = { c: 0, w: 0 });
    if (ok) m.c++; else m.w++;
  },
  stars(id) { const m = this.get(id); return clamp(m.c - Math.floor(m.w / 2), 0, 5); },
  // weight for picking: weak and unseen items come more often
  weight(id) { const m = this.get(id); return (1 + m.w * 0.8) / (1 + m.c * 0.45); },
};

// ---------------------------------------------------------------------------
// SOUND EFFECTS (synthesised, no files)
// ---------------------------------------------------------------------------
const Sfx = {
  ctx: null, master: null, last: {},
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  },
  ok(name, gap) {
    if (!this.ctx || !Save.data.settings.sfx) return false;
    const now = performance.now();
    if (gap && this.last[name] && now - this.last[name] < gap) return false;
    this.last[name] = now; return true;
  },
  tone(f, d = 0.1, type = 'sine', v = 0.15, slide = 0, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + 0.02);
  },
  noise(d = 0.15, v = 0.2, freq = 1200, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = v;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
  },
  hit() { if (this.ok('hit', 45)) this.tone(rand(180, 240), 0.05, 'square', 0.04, -80); },
  kill() { if (this.ok('kill', 35)) this.tone(rand(500, 700), 0.06, 'triangle', 0.05, 300); },
  xp() { if (this.ok('xp', 30)) this.tone(rand(1200, 1500), 0.04, 'sine', 0.035); },
  word(n) { if (this.ok('word')) { const f = 440 * Math.pow(2, Math.min(n, 14) / 12); this.tone(f, 0.12, 'triangle', 0.16); this.tone(f * 2, 0.1, 'sine', 0.06, 0, 0.03); } },
  wrong() { if (this.ok('wrong')) { this.tone(220, 0.18, 'sawtooth', 0.09, -90); this.tone(160, 0.22, 'square', 0.05, -60, 0.05); } },
  level() { if (this.ok('level')) [0, 4, 7, 12].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.16, 'triangle', 0.12, 0, i * 0.06)); },
  ring() { if (this.ok('ring')) this.tone(880, 0.25, 'sine', 0.08, 220); },
  cast(big) { if (this.ok('cast')) { this.noise(0.5, big ? 0.35 : 0.22, 900); this.tone(110, 0.5, 'sawtooth', 0.12, -60); [0, 7, 12, 19].forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.3, 'triangle', 0.08, 0, i * 0.05)); } },
  perfect() { if (this.ok('perfect')) { [12, 19, 24].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.25, 'sine', 0.12, 0, i * 0.04)); } },
  parry() { if (this.ok('parry')) { this.tone(1760, 0.18, 'square', 0.1, -900); this.noise(0.12, 0.3, 4000); this.tone(2637, 0.3, 'sine', 0.08, 0, 0.02); } },
  hurt() { if (this.ok('hurt', 120)) { this.tone(140, 0.2, 'sawtooth', 0.12, -70); this.noise(0.15, 0.2, 600); } },
  slamWarn() { if (this.ok('slamw', 200)) this.tone(300, 0.3, 'sine', 0.07, 300); },
  slam() { if (this.ok('slam', 80)) { this.noise(0.3, 0.35, 500); this.tone(70, 0.3, 'sine', 0.2, -30); } },
  chest() { if (this.ok('chest')) [0, 4, 7, 11, 14].forEach((s, i) => this.tone(392 * Math.pow(2, s / 12), 0.2, 'triangle', 0.1, 0, i * 0.07)); },
  boss() { if (this.ok('boss')) { this.tone(55, 1.2, 'sawtooth', 0.15, 20); this.tone(82, 1.2, 'square', 0.06, -10, 0.1); } },
  click() { if (this.ok('click', 30)) this.tone(660, 0.05, 'triangle', 0.08); },
  good() { if (this.ok('good')) { this.tone(660, 0.1, 'triangle', 0.12); this.tone(990, 0.16, 'triangle', 0.1, 0, 0.07); } },
  bad() { if (this.ok('bad')) this.tone(200, 0.25, 'triangle', 0.1, -60); },
  shatter() { if (this.ok('shatter')) { this.noise(0.25, 0.25, 6000); this.tone(1400, 0.2, 'square', 0.04, -1000); } },
  win() { if (this.ok('win')) [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(392 * Math.pow(2, s / 12), 0.35, 'triangle', 0.1, 0, i * 0.09)); },
  lose() { if (this.ok('lose')) [0, -3, -7, -12].forEach((s, i) => this.tone(330 * Math.pow(2, s / 12), 0.4, 'sine', 0.1, 0, i * 0.15)); },
};

// ---------------------------------------------------------------------------
// DANISH VOICE (browser text-to-speech)
// ---------------------------------------------------------------------------
const Voice = {
  v: null, ready: false,
  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const vs = speechSynthesis.getVoices();
      this.v = vs.find(v => /^da(-|_|$)/i.test(v.lang)) || null;
      this.ready = true;
    };
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  prime() { // iOS needs a first utterance inside a user gesture
    if (!('speechSynthesis' in window) || this.primed) return;
    this.primed = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  },
  // level: 'sentence' (always when voice on) or 'npc' (only when voice = all)
  say(text, level = 'sentence', rate = 0.9) {
    const s = Save.data.settings.voice;
    if (s === 'off' || !('speechSynthesis' in window)) return;
    if (level === 'npc' && s !== 'all') return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[»«—]/g, ' '));
      u.lang = 'da-DK'; if (this.v) u.voice = this.v; u.rate = rate;
      speechSynthesis.speak(u);
    } catch (e) {}
  },
  word(text) {
    if (Save.data.settings.voice === 'off' || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'da-DK'; if (this.v) u.voice = this.v; u.rate = 1.0;
      speechSynthesis.speak(u);
    } catch (e) {}
  },
};
Voice.init();
