// ORDVÆRKET — the run: bullet heaven + word gems + Balatro scoring + Expedition-33 timing
'use strict';

const Game = (() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);

  let W = 0, H = 0, DPR = 1, S = 1;
  let state = 'menu';          // menu | play | levelup | chest | pause | howto | end
  let R = null;                // current run
  let realT = 0, lastFrame = 0;
  let camX = 0, camY = 0, viewCY = 0, topInset = 0;
  let bg = { pat: null, d: 0 };
  const motes = [];
  const FONT = '"Alegreya Sans", "Segoe UI", system-ui, sans-serif';
  const GLYPHS = 'ABDEFGHIJKLMNOPRSTUVÆØÅ';

  // ---------------------------------------------------------------- input
  const inp = { jid: null, ox: 0, oy: 0, cx: 0, cy: 0, keys: {}, vx: 0, vy: 0, mag: 0 };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    S = clamp(Math.min(W, H * 0.62) / 400, 0.8, 1.35);
    measureInsets();
  }
  function measureInsets() {
    const p = $('promptWrap');
    const visible = state !== 'menu' && p && p.offsetParent;
    const pb = visible ? p.getBoundingClientRect().bottom : 0;
    if (visible) $('kaede').style.top = (pb + 5) + 'px';
    topInset = visible ? pb + 22 : 0;
    viewCY = topInset + (H - topInset) / 2;
  }
  function toScreen(x, y) { return [(x - camX) * S + W / 2, (y - camY) * S + viewCY]; }
  function viewRect(m = 0) {
    return {
      l: camX - W / 2 / S + m, r: camX + W / 2 / S - m,
      t: camY - (viewCY - topInset) / S + m, b: camY + (H - viewCY) / S - m,
    };
  }

  cv.addEventListener('pointerdown', e => {
    Sfx.init(); Voice.prime();
    if (state !== 'play') return;
    if (inp.jid === null) {
      inp.jid = e.pointerId; inp.ox = inp.cx = e.clientX; inp.oy = inp.cy = e.clientY;
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    } else action();
  });
  cv.addEventListener('pointermove', e => { if (e.pointerId === inp.jid) { inp.cx = e.clientX; inp.cy = e.clientY; } });
  const endPtr = e => { if (e.pointerId === inp.jid) { inp.jid = null; } };
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', endPtr);
  window.addEventListener('keydown', e => {
    inp.keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'j') { if (state === 'play') { e.preventDefault(); action(); } }
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') { if (state === 'play') pause(); else if (state === 'pause') resume(); }
  });
  window.addEventListener('keyup', e => { inp.keys[e.key.toLowerCase()] = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pause(); });

  function readMove() {
    let x = 0, y = 0, mag = 0;
    const k = inp.keys;
    if (k['a'] || k['arrowleft']) x -= 1;
    if (k['d'] || k['arrowright']) x += 1;
    if (k['w'] || k['arrowup']) y -= 1;
    if (k['s'] || k['arrowdown']) y += 1;
    if (x || y) { const l = Math.hypot(x, y); x /= l; y /= l; mag = 1; }
    if (inp.jid !== null) {
      let dx = inp.cx - inp.ox, dy = inp.cy - inp.oy; const l = Math.hypot(dx, dy);
      if (l > 58) { inp.ox = inp.cx - dx / l * 58; inp.oy = inp.cy - dy / l * 58; }
      if (l > 6) { x = dx / l; y = dy / l; mag = clamp(l / 38, 0, 1); }
    }
    inp.vx = x; inp.vy = y; inp.mag = mag;
  }

  // ---------------------------------------------------------------- run setup
  const has = id => R && R.seals.has(id);
  const ul = id => Save.data.upgrades[id] || 0;
  const VOCAB = ['sted', 'mad', 'job', 'toej', 'ting'];
  const ORDER = ['inv', 'konj', 'adv'];

  function xpNeed(l) { return Math.floor(5 + l * 4.2 + Math.pow(l, 1.6)); }

  function newRun(dId, heroId, loadout) {
    const d = DISTRICTS.find(x => x.id === dId);
    const seals = new Set(loadout);
    const P = {
      x: 0, y: 0, r: 13, face: 0,
      maxHp: 100 + ul('hjerte') * 10 + (seals.has('s_hjerte') ? 40 : 0),
      speed: 150 * (1 + ul('fart') * 0.05),
      magnet: 64 * (1 + ul('magnet') * 0.15) * (seals.has('s_magnet') ? 1.6 : 1),
      dmgMul: 1 + ul('kraft') * 0.08, cdMul: 1, chipMul: 1, xpMul: 1 + ul('visdom') * 0.08,
      inv: 0, lvl: 1, xp: 0, need: xpNeed(1), walk: 0,
    };
    P.hp = P.maxHp;
    R = {
      d, dId, hero: heroId, H: HEROES[heroId], seals, P,
      t: 0, weapons: [], passives: {},
      enemies: [], shots: [], eshots: [], xps: [], words: [], pickups: [], parts: [], texts: [],
      waves: [], pools: [], cogs: [], bolts: [], slams: [], lines: [],
      prompt: null, nextPromptAt: 1.5, kaede: 0, bestKaede: 0,
      sentences: 0, perfects: 0, parries: 0, mistakes: 0, wordsOk: 0, kills: 0, score: 0, bestCast: 0,
      levelQ: 0, rerolls: ul('omkast'), revive: ul('liv'), counter: 0, cast: null, echo: null,
      boss: null, bossSpawned: false, elites: [55, 120, 185, 245], spawnAcc: 0, swarms: [150, 235],
      lastKill: null, wordCheck: 0, newSeals: [], shake: 0, hitstop: 0, flash: 0, hurtFlash: 0,
      timeScale: 1, usedP: [], usedQ: [], usedF: [], quickOk: 0, quickBad: 0, fixOk: 0,
      parryLock: 0, ended: false, winT: 0, foundSeals: 0, inkBonus: 0,
    };
    addWeapon(R.H.weapon);
    makeBg(d);
    camX = 0; camY = 0;
  }

  // ---------------------------------------------------------------- background
  function makeBg(d) {
    const c = document.createElement('canvas'); c.width = c.height = 192;
    const g = c.getContext('2d');
    g.fillStyle = d.ground[2]; g.fillRect(0, 0, 192, 192);
    const sz = 32;
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const ox = x * sz + (y % 2 ? sz / 2 : 0), oy = y * sz;
      for (const dx of [0, -192]) {
        g.fillStyle = Math.random() < 0.5 ? d.ground[0] : d.ground[1];
        g.beginPath();
        if (g.roundRect) g.roundRect(ox + dx + 2, oy + 2, sz - 4, sz - 4, 7); else g.rect(ox + dx + 2, oy + 2, sz - 4, sz - 4);
        g.fill();
      }
    }
    // faint brass circuitry: the city is built on the machine
    g.strokeStyle = d.tint + '22'; g.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      g.beginPath(); let x = rand(0, 192), y = rand(0, 192); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { if (Math.random() < 0.5) x += rand(-60, 60); else y += rand(-60, 60); g.lineTo(x, y); }
      g.stroke();
      g.fillStyle = d.tint + '33'; g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill();
    }
    bg.pat = ctx.createPattern(c, 'repeat'); bg.d = d.id; bg.tint = d.tint;
    motes.length = 0;
    for (let i = 0; i < 46; i++) motes.push({ x: Math.random(), y: Math.random(), z: rand(0.2, 1), p: rand(0, TAU) });
  }

  // ---------------------------------------------------------------- weapons & passives
  function addWeapon(id) {
    const w = R.weapons.find(x => x.id === id);
    if (w) { w.lvl = Math.min(5, w.lvl + 1); return; }
    R.weapons.push({ id, lvl: 1, timer: 0.4, ang: 0 });
  }
  function addPassive(id) {
    const l = (R.passives[id] || 0) + 1; R.passives[id] = l;
    const P = R.P;
    if (id === 'stoevler') P.speed *= 1.10;
    if (id === 'brille') P.magnet *= 1.25;
    if (id === 'hjerte') { P.maxHp += 20; P.hp = Math.min(P.maxHp, P.hp + 20); }
    if (id === 'timeglas') P.cdMul *= 0.92;
    if (id === 'kraft') P.dmgMul += 0.12;
    if (id === 'lykke') P.chipMul += 0.12;
  }

  function nearestEnemies(n, maxD) {
    const P = R.P, md2 = maxD * maxD;
    const arr = [];
    for (const e of R.enemies) { if (e.dead) continue; const d2 = dist2(e, P); if (d2 < md2) arr.push([d2, e]); }
    arr.sort((a, b) => a[0] - b[0]);
    return arr.slice(0, n).map(a => a[1]);
  }

  function updateWeapons(dt) {
    const P = R.P;
    for (const w of R.weapons) {
      const L = WEAPONS[w.id].lv[w.lvl - 1];
      w.timer -= dt;
      if (w.id === 'fjer' && w.timer <= 0) {
        const tg = nearestEnemies(L.n, 460);
        if (tg.length) {
          w.timer = L.cd * P.cdMul;
          for (let i = 0; i < L.n; i++) {
            const e = tg[i % tg.length];
            let a = Math.atan2(e.y - P.y, e.x - P.x) + (i >= tg.length ? rand(-0.25, 0.25) : 0);
            R.shots.push({ x: P.x, y: P.y, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, dmg: L.dmg, pierce: L.pierce, life: 1.1, hit: new Set(), col: '#7fd8ff' });
          }
          P.face = Math.atan2(tg[0].y - P.y, tg[0].x - P.x);
        } else w.timer = 0.15;
      }
      if (w.id === 'klokke' && w.timer <= 0) {
        w.timer = L.cd * P.cdMul;
        R.waves.push({ x: P.x, y: P.y, r: 10, max: L.r, dmg: L.dmg, hit: new Set(), col: '#ffd36b', life: 0.32, t: 0, knock: 70 });
        Sfx.ring();
      }
      if (w.id === 'pendul') {
        w.ang += L.spd * dt;
        for (let i = 0; i < L.n; i++) {
          const a = w.ang + i * TAU / L.n;
          const ox = P.x + Math.cos(a) * L.rad, oy = P.y + Math.sin(a) * L.rad;
          for (const e of R.enemies) {
            if (e.dead) continue;
            const rr = e.r + 9;
            if ((e.x - ox) ** 2 + (e.y - oy) ** 2 < rr * rr && (e.cd.p || 0) <= R.t) {
              e.cd.p = R.t + 0.4; hurtEnemy(e, L.dmg, { kx: Math.cos(a) * 40, ky: Math.sin(a) * 40 });
            }
          }
        }
      }
      if (w.id === 'lyn' && w.timer <= 0) {
        const vr = viewRect(10);
        const cand = R.enemies.filter(e => !e.dead && e.x > vr.l && e.x < vr.r && e.y > vr.t && e.y < vr.b);
        if (cand.length) {
          w.timer = L.cd * P.cdMul;
          shuffle(cand);
          for (let i = 0; i < Math.min(L.n, cand.length); i++) {
            const e = cand[i];
            R.bolts.push({ x: e.x, y: e.y, life: 0.22, seed: Math.random() });
            hurtEnemy(e, L.dmg, {});
            burst(e.x, e.y, '#9fe7ff', 6, 120);
          }
        } else w.timer = 0.2;
      }
      if (w.id === 'hjul' && w.timer <= 0) {
        w.timer = L.cd * P.cdMul + L.dur * 0.3;
        for (let i = 0; i < L.n; i++) {
          const a = rand(0, TAU);
          R.cogs.push({ x: P.x, y: P.y, vx: Math.cos(a) * 270, vy: Math.sin(a) * 270, life: L.dur, dmg: L.dmg, rot: 0 });
        }
      }
      if (w.id === 'pool' && w.timer <= 0) {
        w.timer = L.cd * P.cdMul;
        const tg = nearestEnemies(8, 300);
        for (let i = 0; i < L.n; i++) {
          const e = tg.length ? pick(tg) : null;
          const x = e ? e.x : P.x + rand(-120, 120), y = e ? e.y : P.y + rand(-120, 120);
          R.pools.push({ x, y, r: L.r, life: L.dur, max: L.dur, dmg: L.dmg, tick: 0 });
        }
      }
    }
  }

  // ---------------------------------------------------------------- enemies
  const ET = {
    skaar:   { hp: 12, spd: 58, r: 12, dmg: 7, xp: 1, fill: '#2a2230' },
    loeber:  { hp: 8, spd: 100, r: 10, dmg: 6, xp: 1, fill: '#322036' },
    tung:    { hp: 70, spd: 36, r: 21, dmg: 14, xp: 4, fill: '#1f2a2f' },
    spytter: { hp: 18, spd: 52, r: 12, dmg: 6, xp: 2, fill: '#2b1f1f' },
    elite:   { hp: 520, spd: 46, r: 27, dmg: 16, xp: 22, fill: '#3a1218' },
  };
  function hpScale() {
    const m = R.t / 60;
    return (1 + m * 0.45 + m * m * 0.06) * (1 + (R.dId - 1) * 0.35);
  }
  function spawnPos(extra = 40) {
    const vr = viewRect();
    const cx = (vr.l + vr.r) / 2, cy = (vr.t + vr.b) / 2;
    const rad = Math.hypot(vr.r - vr.l, vr.b - vr.t) / 2 + extra;
    const a = rand(0, TAU);
    return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad };
  }
  function spawnEnemy(type, pos, opts = {}) {
    const T = ET[type]; const p = pos || spawnPos();
    const e = {
      type, x: p.x, y: p.y, r: T.r, spd: T.spd * rand(0.9, 1.1) * (1 + (R.dId - 1) * 0.06),
      hp: T.hp * hpScale() * (opts.hpMul || 1), dmg: (type === 'elite' ? 12 + 3 * (R.dId - 1) : T.dmg * (1 + (R.dId - 1) * 0.15)), xp: T.xp,
      fill: T.fill, glyph: GLYPHS[randi(0, GLYPHS.length - 1)], flash: 0, cd: {}, kx: 0, ky: 0,
      stun: 0, slow: 0, shoot: rand(1.5, 3), wob: rand(0, TAU),
    };
    e.maxHp = e.hp;
    if (type === 'elite') {
      e.fix = pickFix(); e.slamT = 2.2; e.wind = 0;
      banner('⚠ En fejl er på vej!<small>Besejr den — og ret sætningen</small>', 'warn');
    }
    R.enemies.push(e);
    return e;
  }
  function pickFix() {
    const f = weightedPick(FIXES, f => Mastery.weight(f.id) * (R.usedF.includes(f.id) ? 0.05 : 1));
    R.usedF.push(f.id); if (R.usedF.length > 8) R.usedF.shift();
    return f;
  }

  function spawnBoss() {
    R.bossSpawned = true;
    const B = R.d.boss;
    const hp = 7000 * (1 + (R.dId - 1) * 0.7);
    const p = spawnPos(-20);
    R.boss = {
      type: 'boss', x: p.x, y: p.y, r: 46, spd: 40, hp, maxHp: hp, dmg: 22, xp: 0, flash: 0, cd: {}, kx: 0, ky: 0,
      stun: 0, slow: 0, atk: 2.5, step: 0, rot: 0, name: B.name, icon: B.icon, color: B.color, seq: [],
    };
    R.enemies.push(R.boss);
    banner(B.icon + ' ' + B.name + '<small>' + esc(B.taunt) + '</small>', 'boss', 3.2);
    Voice.say(B.taunt, 'npc', 0.85);
    Sfx.boss(); R.shake = 12;
    $('bossbar').classList.remove('hidden');
    $('bossname').textContent = B.icon + ' ' + B.name;
  }

  function bossAI(b, dt) {
    if (b.stun > 0) return;
    b.atk -= dt;
    // queued slams (sequences)
    if (b.seq.length) {
      b.seq[0].t -= dt;
      if (b.seq[0].t <= 0) { const s = b.seq.shift(); makeSlam(R.P.x, R.P.y, s.r, b, s.dur); }
    }
    if (b.atk > 0) return;
    const enraged = b.hp < b.maxHp * 0.5;
    b.atk = (enraged ? 1.9 : 2.6) - (R.dId - 1) * 0.15;
    const patterns = {
      1: ['slam', 'radial', 'slam', 'summon', 'slam', 'radial'],
      2: ['slam3', 'radial', 'summon', 'slam', 'radial2', 'slam3'],
      3: ['lines', 'slam', 'radial2', 'lines', 'slam3', 'summon'],
    }[R.dId] || ['slam', 'radial'];
    const p = patterns[b.step++ % patterns.length];
    if (p === 'slam') makeSlam(R.P.x, R.P.y, 64, b, 1.05);
    if (p === 'slam3') { makeSlam(R.P.x, R.P.y, 58, b, 1.0); b.seq.push({ t: 0.55, r: 58, dur: 0.95 }, { t: 0.55, r: 58, dur: 0.9 }); }
    if (p === 'radial' || p === 'radial2') {
      const n = p === 'radial' ? 14 : 22, off = rand(0, TAU), sp = p === 'radial' ? 150 : 175;
      for (let i = 0; i < n; i++) { const a = off + i * TAU / n; R.eshots.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 7, dmg: 10, life: 4.5, col: b.color }); }
      Sfx.slamWarn();
    }
    if (p === 'summon') { for (let i = 0; i < 8; i++) { const a = i * TAU / 8; spawnEnemy(i % 2 ? 'loeber' : 'skaar', { x: R.P.x + Math.cos(a) * 260, y: R.P.y + Math.sin(a) * 260 }); } }
    if (p === 'lines') {
      for (let i = 0; i < 3; i++) {
        const a = rand(0, Math.PI), off = (i - 1) * rand(50, 90);
        R.lines.push({ x: R.P.x - Math.sin(a) * off, y: R.P.y + Math.cos(a) * off, a, t: 0, dur: 1.15, done: false, dmg: 14, col: b.color });
      }
      Sfx.slamWarn();
    }
  }

  // ---------------------------------------------------------------- slams & parry (Expedition 33)
  function makeSlam(x, y, r, src, dur) {
    R.slams.push({ x, y, r, t: 0, dur, src, done: false, warned: false });
    Sfx.slamWarn();
  }
  function parryWin() { return 0.2 * (has('s_parer') ? 1.6 : 1); }
  function slamThreat() {
    const P = R.P;
    for (const s of R.slams) if (!s.done && dist(s, P) < s.r + P.r * 0.5) return s;
    return null;
  }
  function tryParry() {
    if (R.parryLock > R.t) return;
    const P = R.P; let ok = false;
    for (const s of R.slams) {
      if (s.done) continue;
      const inside = dist(s, P) < s.r + P.r * 0.5;
      if (inside && s.t >= s.dur - parryWin() && s.t <= s.dur + 0.09) { parrySuccess(s); ok = true; }
    }
    if (!ok) {
      R.parryLock = R.t + 0.35;
      // early press with a slam on you: feedback
      if (slamThreat()) floatText(P.x, P.y - 34, 'For tidligt!', '#ff9b9b', 14);
    }
  }
  function parrySuccess(s) {
    s.done = true; s.parried = true;
    R.parries++;
    const src = s.src;
    if (src && !src.dead) {
      const frac = src.type === 'boss' ? 0.045 : 0.14;
      hurtEnemy(src, src.maxHp * frac * (has('s_parer') ? 2 : 1), { raw: true });
      src.stun = Math.max(src.stun, 1.2);
    }
    R.counter = Math.min(R.counter + 2, 8);
    R.hitstop = 0.12; R.flash = 0.25; R.shake = 8;
    Sfx.parry();
    floatText(R.P.x, R.P.y - 42, 'PARERET!', '#ffffff', 26, 1.1);
    floatText(R.P.x, R.P.y - 18, 'Kontra +' + R.counter + ' mult', '#ff6b6b', 15, 1.1);
    burst(R.P.x, R.P.y, '#ffffff', 22, 260);
    R.waves.push({ x: R.P.x, y: R.P.y, r: 10, max: 140, dmg: 30, hit: new Set(), col: '#ffffff', life: 0.3, t: 0, knock: 120 });
    updateKaede();
  }
  function updateSlams(dt) {
    const P = R.P;
    for (const s of R.slams) {
      if (s.done) { s.fade = (s.fade || 0) + dt; continue; }
      s.t += dt;
      if (s.t >= s.dur + 0.09) {
        s.done = true;
        const inside = dist(s, P) < s.r + P.r * 0.5;
        Sfx.slam(); R.shake = Math.max(R.shake, 6);
        burst(s.x, s.y, '#ff5a5a', 14, 200);
        if (inside) hurtPlayer(s.src && s.src.type === 'boss' ? 24 : 20, true);
        else floatText(P.x, P.y - 30, 'Undveget', '#c9f', 13);
      }
    }
    R.slams = R.slams.filter(s => !s.done || (s.fade || 0) < 0.3);
    for (const l of R.lines) {
      l.t += dt;
      if (!l.done && l.t >= l.dur) {
        l.done = true;
        // distance from player to line
        const dx = P.x - l.x, dy = P.y - l.y;
        const d = Math.abs(dx * Math.sin(l.a) - dy * Math.cos(l.a));
        if (d < 16 + P.r) hurtPlayer(l.dmg, true);
        Sfx.slam();
      }
    }
    R.lines = R.lines.filter(l => l.t < l.dur + 0.3);
  }

  // ---------------------------------------------------------------- combat helpers
  function hurtEnemy(e, dmg, o = {}) {
    if (e.dead) return;
    const d = o.raw ? dmg : dmg * R.P.dmgMul;
    e.hp -= d; e.flash = 0.09;
    if (o.kx && e.type !== 'boss') { e.kx += o.kx; e.ky += o.ky; }
    if (d >= 30 || o.show) floatText(e.x + rand(-8, 8), e.y - e.r - 4, Math.round(d), o.col || '#fff', d >= 200 ? 18 : 13, 0.6);
    Sfx.hit();
    if (e.hp <= 0) killEnemy(e);
  }
  function killEnemy(e) {
    e.dead = true; R.kills++;
    R.lastKill = { x: e.x, y: e.y, t: R.t, used: false };
    burst(e.x, e.y, R.d.tint, e.type === 'tung' ? 12 : 6, 140);
    Sfx.kill();
    if (e.type === 'boss') { bossDown(e); return; }
    dropXp(e.x, e.y, e.xp);
    if (e.type === 'elite') {
      R.pickups.push({ kind: 'chest', x: e.x, y: e.y, fix: e.fix, bob: 0 });
      burst(e.x, e.y, '#ffd36b', 30, 260); R.shake = 6;
      banner('📦 Kiste! Ret fejlen', 'good', 1.8);
    } else {
      const r = Math.random();
      if (r < (e.type === 'tung' ? 0.07 : 0.006)) R.pickups.push({ kind: 'heal', x: e.x, y: e.y, bob: rand(0, 6) });
      else if (r < (e.type === 'tung' ? 0.08 : 0.0085)) R.pickups.push({ kind: 'magnet', x: e.x, y: e.y, bob: rand(0, 6) });
    }
  }
  function dropXp(x, y, v) {
    if (R.xps.length > 260) { // merge into a random existing shard
      const s = R.xps[randi(0, R.xps.length - 1)]; s.v += v; return;
    }
    R.xps.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), v, pull: false });
  }
  function hurtPlayer(d, big) {
    const P = R.P;
    if (P.inv > 0 && !big) return;
    P.hp -= d; P.inv = 0.75; R.hurtFlash = 0.35; R.shake = Math.max(R.shake, big ? 10 : 5);
    Sfx.hurt();
    floatText(P.x, P.y - 26, '−' + Math.round(d), '#ff6b6b', 15);
    if (P.hp <= 0) {
      if (R.revive > 0) {
        R.revive--; P.hp = P.maxHp * 0.6; P.inv = 2;
        banner('🕯️ Du rejser dig igen!', 'good', 2);
        for (const e of R.enemies) if (e.type !== 'boss' && e.type !== 'elite' && dist(e, P) < 300) killEnemy(e);
        R.flash = 0.6;
      } else endRun(false);
    }
  }

  // ---------------------------------------------------------------- particles & text
  function burst(x, y, col, n, sp) {
    if (R.parts.length > 500) return;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(sp * 0.3, sp);
      R.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.25, 0.6), max: 0.6, col, s: rand(1.5, 3.5) });
    }
  }
  function floatText(x, y, txt, col, size = 14, life = 0.8) {
    if (R.texts.length > 60) R.texts.shift();
    R.texts.push({ x, y, txt: String(txt), col, size, life, max: life });
  }
  let bannerTimer = null;
  function banner(html, kind = '', dur = 2.2) {
    const b = $('banner');
    b.innerHTML = html; b.className = 'show ' + kind;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { b.className = ''; }, dur * 1000);
  }

  // ---------------------------------------------------------------- prompts (word gems)
  function pickPrompt() {
    const pool = PROMPTS.filter(p => p.d <= R.dId);
    const p = weightedPick(pool, p => {
      let w = p.d === R.dId ? 1 : 0.3;
      if (R.H.focus.includes(p.t)) w *= 3;
      w *= Mastery.weight(p.id);
      if (R.usedP.includes(p.id)) w *= 0.03;
      return w;
    });
    R.usedP.push(p.id); if (R.usedP.length > 14) R.usedP.shift();
    const st = Mastery.stars(p.id);
    R.prompt = { p, idx: 0, mistakes: 0, saved: false, showPic: st < 3, showTag: st < 2, hint: null };
    R.words.length = 0;
    R.wordCheck = 0;
    renderPrompt(true);
    Voice.say(p.say, 'npc', 0.85);
  }

  function measureWord(t) { ctx.font = '700 16px ' + FONT; return ctx.measureText(t).width + 22; }

  function spawnWord(text, dis) {
    const P = R.P, vr = viewRect(30);
    let pos = null;
    const lk = R.lastKill;
    if (lk && !lk.used && R.t - lk.t < 0.6 && dist(lk, P) > 100 && dist(lk, P) < 360 &&
      lk.x > vr.l && lk.x < vr.r && lk.y > vr.t + 10 && lk.y < vr.b) { pos = { x: lk.x, y: lk.y }; lk.used = true; }
    const half = measureWord(text) / 2 + 10;
    if (pos) { pos.x = clamp(pos.x, vr.l + half, vr.r - half); }
    for (let k = 0; k < 16 && !pos; k++) {
      const a = rand(0, TAU), d = rand(120, 250);
      const x = clamp(P.x + Math.cos(a) * d, vr.l + half, vr.r - half), y = clamp(P.y + Math.sin(a) * d, vr.t + 20, vr.b - 30);
      const c = { x, y };
      if (dist(c, P) < 100) continue;
      if (R.words.some(g => dist(g, c) < 80)) continue;
      pos = c;
    }
    if (!pos) pos = { x: P.x + rand(-160, 160), y: P.y + (Math.random() < 0.5 ? -150 : 150) };
    R.words.push({ text, x: pos.x, y: pos.y, w: measureWord(text), h: 28, born: R.t, life: 24, dis, pulse: 0, bob: rand(0, TAU) });
    burst(pos.x, pos.y, '#ffd36b', 8, 90);
  }

  function wordsMaintain(dt) {
    if (!R.prompt || R.cast) return;
    R.wordCheck -= dt; if (R.wordCheck > 0) return; R.wordCheck = 0.3;
    const pr = R.prompt, P = R.P;
    R.words = R.words.filter(g => dist(g, P) < 650 && R.t - g.born < g.life);
    const rem = pr.p.answers.slice(pr.idx);
    for (const t of new Set(rem)) if (!R.words.some(g => g.text === t)) spawnWord(t, false);
    const xs = pr.p.x || [];
    const disOn = R.words.filter(g => g.dis).length;
    if (disOn < Math.min(xs.length, 2)) {
      const avail = xs.filter(t => !R.words.some(g => g.text === t));
      if (avail.length) spawnWord(pick(avail), true);
    }
  }

  function collectWords() {
    const P = R.P, pr = R.prompt;
    if (!pr || R.cast) return;
    for (const g of R.words) {
      if (g.gone || R.t - g.born < 0.35) continue;
      if (Math.abs(P.x - g.x) < g.w / 2 + P.r - 4 && Math.abs(P.y - g.y) < g.h / 2 + P.r - 4) {
        g.gone = true;
        const expected = pr.p.answers[pr.idx];
        if (g.text === expected) {
          pr.idx++; R.kaede++; R.wordsOk++; R.bestKaede = Math.max(R.bestKaede, R.kaede);
          pr.hint = null;
          Sfx.word(R.kaede);
          if (has('s_oere')) Voice.word(g.text);
          floatText(g.x, g.y - 20, '✓ ' + g.text, '#ffe08a', 16, 0.9);
          burst(g.x, g.y, '#ffd36b', 16, 200);
          R.words.forEach(o => o.pulse = 0);
          if (pr.idx >= pr.p.answers.length) completeSentence();
          else renderPrompt();
        } else {
          pr.mistakes++; R.mistakes++;
          if (has('s_taal') && !pr.saved) { pr.saved = true; floatText(P.x, P.y - 40, '🧘 Tålmodighed', '#bdf', 14); }
          else { if (R.kaede >= 5) floatText(P.x, P.y - 40, 'Kæden brød!', '#ff8a8a', 15); R.kaede = 0; }
          Sfx.wrong(); R.shake = 4;
          burst(g.x, g.y, '#ff6b6b', 14, 160);
          floatText(g.x, g.y - 20, '✗ ' + g.text, '#ff8a8a', 16, 0.9);
          pr.hint = (TAGS[pr.p.t] || {}).fix || 'Prøv igen!';
          pr.showTag = true;
          R.words.forEach(o => { if (o.text === expected) o.pulse = 4; });
          renderPrompt();
        }
        updateKaede();
      }
    }
    R.words = R.words.filter(g => !g.gone);
  }

  function scoreFor(pr) {
    const t = pr.p.t; const notes = [];
    let chips = 0;
    pr.p.answers.forEach(a => chips += 6 + 3 * a.replace(/\s/g, '').length);
    chips += 5 * pr.p.answers.length;
    if (R.hero === 'kronik' && t === 'datid') { chips *= 1.3; notes.push('📜'); }
    if (has('s_kronik') && t === 'datid') { chips += 40; notes.push('📜'); }
    if (has('s_oere')) { chips += 15; notes.push('👂'); }
    chips *= R.P.chipMul;
    let mult = 1 + Math.floor(R.kaede / (has('s_kaede') ? 3 : 5));
    if (pr.mistakes === 0) mult += 2;
    if (R.counter > 0) { mult += R.counter; notes.push('⚔'); }
    if (R.hero === 'herold' && ORDER.includes(t)) { mult += 2; notes.push('📯'); }
    if (R.hero === 'tid' && t === 'tid') { mult += 2; notes.push('⏳'); }
    if (R.hero === 'kraemmer' && VOCAB.includes(t)) { mult += 1; notes.push('⚖️'); }
    if (R.hero === 'diplomat' && ['chunk', 'pron', 'adj'].includes(t)) { mult += 3; notes.push('🕊️'); }
    if (has('s_chunk') && ['chunk', 'adj'].includes(t)) { mult += 3; notes.push('🧩'); }
    if (has('s_v2') && ORDER.includes(t)) { mult *= 1.5; notes.push('2️⃣'); }
    if (has('s_ur') && t === 'tid') { mult *= 1.5; notes.push('🕰️'); }
    if (has('s_navn') && VOCAB.includes(t)) { mult *= 1.5; notes.push('🏷️'); }
    if (has('s_pron') && ['pron', 'ting'].includes(t)) { mult *= 1.5; notes.push('🪟'); }
    return { chips: Math.round(chips), mult: Math.round(mult * 10) / 10, notes };
  }

  function completeSentence() {
    const pr = R.prompt;
    const sc = scoreFor(pr);
    let win = 0.085;
    if (R.hero === 'tid') win *= 1.45;
    if (has('s_ur')) win *= 1.3;
    R.cast = { t: 0, dur: 1.25, target: 0.68, win, sc, pr, pressed: false };
    R.timeScale = 0.3;
    R.words.length = 0;
    renderPrompt();
    Voice.say(pr.p.full, 'sentence', 0.92);
    Sfx.good();
  }

  function castPress() {
    const c = R.cast; if (!c || c.pressed) return;
    c.pressed = true;
    const diff = Math.abs(c.t - c.target * c.dur);
    let tm = 1, label = '';
    if (diff <= c.win) { tm = has('s_perfekt') ? 3 : 2; label = 'PERFEKT!'; R.perfects++; Sfx.perfect(); }
    else if (diff <= c.win * 2.6) { tm = 1.5; label = 'GODT!'; }
    else { label = c.t < c.target * c.dur ? 'For tidligt' : 'For sent'; }
    fireCast(tm, label);
  }

  function fireCast(tm, label) {
    const c = R.cast; R.cast = null; R.timeScale = 1;
    const pr = c.pr, sc = c.sc;
    const score = Math.round(sc.chips * sc.mult * tm);
    R.score += score; R.sentences++; R.bestCast = Math.max(R.bestCast, score);
    Mastery.record(pr.p.id, pr.mistakes === 0);
    spell(score, label);
    if (has('s_ekko')) R.echo = { t: 0.75, dmg: Math.round(score * 0.5) };
    if (has('s_heal')) { R.P.hp = Math.min(R.P.maxHp, R.P.hp + 5); }
    showScore(sc, tm, score, label);
    R.counter = 0;
    R.prompt = null; R.nextPromptAt = R.t + 0.9;
    renderPrompt();
    updateKaede();
  }

  function spell(dmg, label) {
    const P = R.P;
    const storm = has('s_storm');
    const vr = viewRect(-30);
    for (const e of R.enemies) {
      if (e.dead) continue;
      const inView = e.x > vr.l && e.x < vr.r && e.y > vr.t && e.y < vr.b;
      if (storm || inView || dist(e, P) < 420) {
        hurtEnemy(e, dmg, { raw: true, show: e.type === 'boss' || e.type === 'elite', col: '#ffd36b' });
        if (storm) e.stun = Math.max(e.stun, 1.0);
      }
    }
    // the spell also sweeps every XP shard nearby towards you — the payoff
    setTimeout(() => { if (R) for (const x of R.xps) if (dist(x, P) < 700) x.pull = true; }, 250);
    R.waves.push({ x: P.x, y: P.y, r: 10, max: 520, dmg: 0, hit: new Set(), col: '#ffd36b', life: 0.55, t: 0, knock: 0, big: true });
    burst(P.x, P.y, '#ffd36b', 40, 420);
    R.flash = Math.max(R.flash, label === 'PERFEKT!' ? 0.45 : 0.25);
    R.shake = Math.max(R.shake, label === 'PERFEKT!' ? 12 : 7);
    Sfx.cast(label === 'PERFEKT!');
  }

  // ---------------------------------------------------------------- main update
  function update(dt) {
    const P = R.P;
    if (R.hitstop > 0) { R.hitstop -= dt; return; }
    const sdt = dt * R.timeScale;  // scaled game time
    R.t += sdt;

    if (R.cast) {
      R.cast.t += dt; // real time for the timing ring
      if (R.cast.t >= R.cast.dur) fireCast(1, 'For sent');
    }
    if (R.echo) { R.echo.t -= sdt; if (R.echo.t <= 0) { spell(R.echo.dmg, 'Ekko'); floatText(P.x, P.y - 60, '🔁 ' + R.echo.dmg, '#ffe08a', 18); R.echo = null; } }
    if (R.winT > 0) { R.winT -= dt; if (R.winT <= 0) endRun(true); }

    // movement
    readMove();
    const sp = P.speed * inp.mag;
    P.x += inp.vx * sp * sdt; P.y += inp.vy * sp * sdt;
    if (inp.mag > 0.1) { P.walk += sdt * 10; if (!nearestEnemies(1, 460).length) P.face = Math.atan2(inp.vy, inp.vx); }
    P.inv -= sdt;

    // camera
    camX += (P.x - camX) * Math.min(1, dt * 10);
    camY += (P.y - camY) * Math.min(1, dt * 10);

    // director
    if (!R.bossSpawned) {
      if (R.elites.length && R.t >= R.elites[0]) { R.elites.shift(); spawnEnemy('elite'); }
      if (R.swarms.length && R.t >= R.swarms[0]) {
        R.swarms.shift();
        banner('🌀 En sværm!', 'warn', 1.6);
        for (let i = 0; i < 26; i++) { const a = i * TAU / 26; spawnEnemy(i % 3 ? 'skaar' : 'loeber', { x: P.x + Math.cos(a) * 330, y: P.y + Math.sin(a) * 330 }); }
      }
      if (R.t >= 300) spawnBoss();
    }
    let rate = (0.6 + R.t * 0.012 + Math.pow(R.t / 100, 2) * 0.25) * (1 + (R.dId - 1) * 0.1);
    if (R.bossSpawned) rate *= 0.35;
    if (R.t < 4) rate = 0;
    R.spawnAcc += rate * sdt;
    while (R.spawnAcc >= 1) {
      R.spawnAcc -= 1;
      if (R.enemies.length >= 170) { R.spawnAcc = 0; break; }
      const r = Math.random();
      let type = 'skaar';
      if (R.t > 40 && r < 0.25) type = 'loeber';
      if (R.t > 90 && r > 0.88) type = 'tung';
      if (R.t > 120 && r > 0.8 && r <= 0.88) type = 'spytter';
      spawnEnemy(type);
    }

    // prompts
    if (!R.prompt && !R.cast && R.t >= R.nextPromptAt && !R.ended) pickPrompt();
    wordsMaintain(sdt);
    collectWords();
    for (const g of R.words) { g.bob += sdt * 3; if (g.pulse > 0) g.pulse -= sdt; }

    updateWeapons(sdt);

    // enemies
    for (const e of R.enemies) {
      if (e.dead) continue;
      e.flash -= sdt;
      if (e.stun > 0) { e.stun -= sdt; e.kx *= 0.85; e.ky *= 0.85; continue; }
      let sp = e.spd * (e.slow > 0 ? 0.5 : 1); e.slow -= sdt;
      const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.type === 'spytter') {
        e.shoot -= sdt;
        if (d < 200) sp = -sp * 0.6;
        if (e.shoot <= 0 && d < 420) {
          e.shoot = rand(2.2, 3.2);
          R.eshots.push({ x: e.x, y: e.y, vx: dx / d * 165, vy: dy / d * 165, r: 6, dmg: 8, life: 3.5, col: '#ff7a7a' });
        }
      }
      if (e.type === 'elite') {
        e.slamT -= sdt;
        if (e.wind > 0) { e.wind -= sdt; sp = 0; }
        if (e.slamT <= 0 && d < 380) { e.slamT = rand(3.4, 4.4) - (R.dId - 1) * 0.3; e.wind = 1.1; makeSlam(P.x, P.y, 62, e, 1.1); }
      }
      if (e.type === 'boss') { bossAI(e, sdt); e.rot += sdt * 0.8; if (d < 140) sp *= 0.3; }
      e.x += (dx / d * sp + e.kx) * sdt; e.y += (dy / d * sp + e.ky) * sdt;
      e.kx *= 0.86; e.ky *= 0.86;
      e.wob += sdt * 4;
      // contact
      if (d < e.r + P.r) hurtPlayer(e.dmg);
      // despawn very far (not elites/boss)
      if (d > 1400 && e.type !== 'elite' && e.type !== 'boss') { e.dead = true; }
    }
    separate();
    R.enemies = R.enemies.filter(e => !e.dead);

    // shots
    for (const s of R.shots) {
      s.x += s.vx * sdt; s.y += s.vy * sdt; s.life -= sdt;
      for (const e of R.enemies) {
        if (e.dead || s.hit.has(e)) continue;
        const rr = e.r + 5;
        if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 < rr * rr) {
          s.hit.add(e); hurtEnemy(e, s.dmg, { kx: s.vx * 0.05, ky: s.vy * 0.05 });
          if (--s.pierce <= 0) { s.life = 0; break; }
        }
      }
    }
    R.shots = R.shots.filter(s => s.life > 0);
    for (const s of R.eshots) {
      s.x += s.vx * sdt; s.y += s.vy * sdt; s.life -= sdt;
      if ((s.x - P.x) ** 2 + (s.y - P.y) ** 2 < (s.r + P.r - 2) ** 2) { hurtPlayer(s.dmg); s.life = 0; }
    }
    R.eshots = R.eshots.filter(s => s.life > 0);

    // waves (bell, parry, spell)
    for (const w of R.waves) {
      w.t += sdt; w.r = 10 + (w.max - 10) * Math.min(1, w.t / w.life);
      if (w.dmg > 0) for (const e of R.enemies) {
        if (e.dead || w.hit.has(e)) continue;
        if (dist(e, w) < w.r + e.r) {
          w.hit.add(e);
          const dx = e.x - w.x, dy = e.y - w.y, d = Math.hypot(dx, dy) || 1;
          hurtEnemy(e, w.dmg, { kx: dx / d * w.knock, ky: dy / d * w.knock });
        }
      }
    }
    R.waves = R.waves.filter(w => w.t < w.life + 0.15);

    // cogs
    const vr = viewRect(12);
    for (const c of R.cogs) {
      c.x += c.vx * sdt; c.y += c.vy * sdt; c.life -= sdt; c.rot += sdt * 9;
      if (c.x < vr.l) { c.x = vr.l; c.vx = Math.abs(c.vx); } if (c.x > vr.r) { c.x = vr.r; c.vx = -Math.abs(c.vx); }
      if (c.y < vr.t) { c.y = vr.t; c.vy = Math.abs(c.vy); } if (c.y > vr.b) { c.y = vr.b; c.vy = -Math.abs(c.vy); }
      for (const e of R.enemies) {
        if (e.dead) continue;
        const rr = e.r + 13;
        if ((e.x - c.x) ** 2 + (e.y - c.y) ** 2 < rr * rr && (e.cd.c || 0) <= R.t) { e.cd.c = R.t + 0.35; hurtEnemy(e, c.dmg, {}); }
      }
    }
    R.cogs = R.cogs.filter(c => c.life > 0);

    // pools
    for (const p of R.pools) {
      p.life -= sdt; p.tick -= sdt;
      const doTick = p.tick <= 0; if (doTick) p.tick = 0.3;
      for (const e of R.enemies) {
        if (e.dead) continue;
        if (dist(e, p) < p.r + e.r * 0.5) { e.slow = 0.2; if (doTick) hurtEnemy(e, p.dmg, {}); }
      }
    }
    R.pools = R.pools.filter(p => p.life > 0);
    for (const b of R.bolts) b.life -= sdt;
    R.bolts = R.bolts.filter(b => b.life > 0);

    updateSlams(sdt);

    // xp
    for (const x of R.xps) {
      const d = dist(x, P);
      if (x.pull || d < P.magnet) {
        x.pull = true;
        const sp = 420 + (x.boost || 0);
        x.x += (P.x - x.x) / (d || 1) * sp * sdt; x.y += (P.y - x.y) / (d || 1) * sp * sdt;
        x.boost = (x.boost || 0) + sdt * 600;
      }
      if (d < P.r + 8) { x.got = true; gainXp(x.v); }
    }
    R.xps = R.xps.filter(x => !x.got);

    // pickups
    for (const p of R.pickups) {
      p.bob += sdt * 3;
      if (dist(p, P) < P.r + 16) {
        p.got = true;
        if (p.kind === 'heal') { P.hp = Math.min(P.maxHp, P.hp + 25); floatText(P.x, P.y - 30, '+25 🥐', '#8f8', 15); Sfx.good(); }
        if (p.kind === 'magnet') { R.xps.forEach(x => x.pull = true); floatText(P.x, P.y - 30, '🧲', '#8cf', 22); Sfx.good(); }
        if (p.kind === 'chest') { openChest(p.fix); }
      }
    }
    R.pickups = R.pickups.filter(p => !p.got);

    // particles & texts
    for (const p of R.parts) { p.x += p.vx * sdt; p.y += p.vy * sdt; p.vx *= 0.92; p.vy *= 0.92; p.life -= sdt; }
    R.parts = R.parts.filter(p => p.life > 0);
    for (const t of R.texts) { t.y -= 28 * dt; t.life -= dt; }
    R.texts = R.texts.filter(t => t.life > 0);

    R.shake *= 0.86; R.flash -= dt; R.hurtFlash -= dt;

    if (R.levelQ > 0 && !R.cast && state === 'play' && !R.ended) openLevelUp();
    updateHud();
  }

  function separate() {
    // cheap spatial hash separation so swarms don't collapse into one blob
    const cell = 34, grid = new Map();
    for (const e of R.enemies) {
      if (e.dead) continue;
      const k = ((e.x / cell) | 0) + ',' + ((e.y / cell) | 0);
      let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(e);
    }
    for (const e of R.enemies) {
      if (e.dead || e.type === 'boss') continue;
      const cx = (e.x / cell) | 0, cy = (e.y / cell) | 0;
      for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) {
        const a = grid.get((cx + ix) + ',' + (cy + iy)); if (!a) continue;
        for (const o of a) {
          if (o === e) continue;
          const dx = e.x - o.x, dy = e.y - o.y, rr = e.r + o.r;
          const d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 0.01) {
            const d = Math.sqrt(d2), push = (rr - d) * 0.25;
            e.x += dx / d * push; e.y += dy / d * push;
          }
        }
      }
    }
  }

  function gainXp(v) {
    const P = R.P;
    P.xp += v * P.xpMul; Sfx.xp();
    while (P.xp >= P.need) { P.xp -= P.need; P.lvl++; P.need = xpNeed(P.lvl); R.levelQ++; }
  }

  // ---------------------------------------------------------------- action button
  function action() {
    if (state !== 'play' || !R) return;
    if (R.cast) castPress(); else tryParry();
  }

  // ---------------------------------------------------------------- level-up (quiz + cards)
  function pickQuick() {
    const pool = QUICK.filter(q => q.d <= R.dId);
    const q = weightedPick(pool, q => {
      let w = q.d === R.dId ? 1 : 0.4;
      if (R.H.focus.includes(q.t)) w *= 2.5;
      w *= Mastery.weight(q.id);
      if (R.usedQ.includes(q.id)) w *= 0.02;
      return w;
    });
    R.usedQ.push(q.id); if (R.usedQ.length > 20) R.usedQ.shift();
    return q;
  }

  function upgradeOptions(n) {
    const opts = [];
    for (const id in WEAPONS) {
      const w = R.weapons.find(x => x.id === id);
      if (w) { if (w.lvl < 5) opts.push({ kind: 'w', id, lvl: w.lvl + 1, wt: 1.6 }); }
      else if (R.weapons.length < 4) opts.push({ kind: 'w', id, lvl: 1, wt: 1 });
    }
    const pc = Object.keys(R.passives).length;
    for (const id in PASSIVES) {
      const l = R.passives[id] || 0;
      if (l < 5 && (l > 0 || pc < 4)) opts.push({ kind: 'p', id, lvl: l + 1, wt: l > 0 ? 1.1 : 0.8 });
    }
    const out = [];
    while (out.length < n && opts.length) {
      const o = weightedPick(opts, o => o.wt);
      out.push(o); opts.splice(opts.indexOf(o), 1);
    }
    while (out.length < n) out.push(out.length % 2 ? { kind: 'ink' } : { kind: 'heal' });
    return out;
  }

  function cardHtml(o, i, gold) {
    let icon, name, lv, desc;
    if (o.kind === 'w') { const W_ = WEAPONS[o.id]; icon = W_.icon; name = W_.name; lv = o.lvl === 1 ? 'NY' : 'Niv. ' + o.lvl; desc = o.lvl === 1 ? W_.new : W_.up[o.lvl - 1]; }
    else if (o.kind === 'p') { const P_ = PASSIVES[o.id]; icon = P_.icon; name = P_.name; lv = o.lvl === 1 ? 'NY' : 'Niv. ' + o.lvl; desc = P_.desc; }
    else if (o.kind === 'heal') { icon = '🥐'; name = 'Rugbrød'; lv = ''; desc = 'Helbred 40 liv'; }
    else { icon = '🖋️'; name = 'Blæk'; lv = ''; desc = '+25 blæk'; }
    return `<button class="ucard${gold ? ' gold' : ''}" data-i="${i}">
      <div class="uicon">${icon}</div><div class="ubody"><div class="uname">${esc(name)} <span class="ulv">${lv}</span></div>
      <div class="udesc">${esc(desc)}${gold ? ' <b>· ×2</b>' : ''}</div></div></button>`;
  }

  function applyOption(o, times) {
    for (let k = 0; k < times; k++) {
      if (o.kind === 'w') addWeapon(o.id);
      else if (o.kind === 'p') { if ((R.passives[o.id] || 0) < 5) addPassive(o.id); }
      else if (o.kind === 'heal') R.P.hp = Math.min(R.P.maxHp, R.P.hp + 40);
      else R.inkBonus += 25;
    }
  }

  function quizHtml(q) {
    const opts = shuffle(q.o.slice());
    const qtext = esc(q.q).replace('___', '<span class="gap">＿＿＿</span>');
    return `<div class="qcard">
      ${q.pic ? `<div class="qpic">${q.pic}</div>` : ''}
      <div class="qtext">${qtext}</div>
      <div class="qopts">${opts.map(o => `<button class="qopt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="qfb"></div></div>`;
  }

  function openLevelUp() {
    state = 'levelup';
    R.levelQ--;
    inp.jid = null;
    Sfx.level();
    const q = pickQuick();
    const ov = $('overlay');
    ov.className = 'show lv';
    ov.innerHTML = `<div class="panel">
      <div class="lvTitle">NIVEAU ${R.P.lvl - R.levelQ}</div>
      <div class="lvSub">Svar rigtigt — så skinner kortene</div>
      ${quizHtml(q)}
      <div class="cards"></div>
      <div class="lvFoot"></div></div>`;
    ov.querySelectorAll('.qopt').forEach(b => b.addEventListener('click', () => answerQuick(q, b.dataset.o, b)));
  }

  function answerQuick(q, chosen, btn) {
    const ov = $('overlay');
    if (ov.dataset.answered === '1') return;
    ov.dataset.answered = '1';
    const ok = chosen === q.o[0];
    Mastery.record(q.id, ok);
    ov.querySelectorAll('.qopt').forEach(b => { b.disabled = true; if (b.dataset.o === q.o[0]) b.classList.add('right'); });
    const fb = ov.querySelector('.qfb');
    ov.querySelector('.gap').textContent = q.o[0];
    ov.querySelector('.gap').classList.add(ok ? 'gapok' : 'gapfix');
    if (ok) { R.quickOk++; btn.classList.add('right'); fb.innerHTML = '<span class="ok">Rigtigt!</span>'; Sfx.good(); }
    else { R.quickBad++; btn.classList.add('wrong'); fb.innerHTML = `<span class="no">Næsten.</span> Det hedder: <b>${esc(q.full)}</b>`; Sfx.bad(); }
    Voice.say(q.full, 'sentence', 0.92);
    showCards(ok);
  }

  function showCards(ok, rerolled) {
    const ov = $('overlay');
    const opts = upgradeOptions(3);
    const goldI = ok && Math.random() < 0.22 ? randi(0, 2) : -1;
    const brokenI = ok ? -1 : randi(0, 2);
    const box = ov.querySelector('.cards');
    box.innerHTML = opts.map((o, i) => cardHtml(o, i, i === goldI)).join('');
    if (brokenI >= 0) {
      const c = box.children[brokenI];
      c.classList.add('broken'); c.disabled = true;
      if (!rerolled) Sfx.shatter();
    }
    box.querySelectorAll('.ucard').forEach(c => c.addEventListener('click', () => {
      if (c.disabled) return;
      const i = +c.dataset.i;
      applyOption(opts[i], i === goldI ? 2 : 1);
      Sfx.click();
      closeOverlay();
    }));
    const foot = ov.querySelector('.lvFoot');
    foot.innerHTML = R.rerolls > 0 ? `<button class="btn small" id="rerollBtn">🎲 Omkast (${R.rerolls})</button>` : '';
    const rb = $('rerollBtn');
    if (rb) rb.addEventListener('click', () => { R.rerolls--; Sfx.click(); showCards(ok, true); });
  }

  function closeOverlay() {
    const ov = $('overlay');
    ov.className = ''; ov.innerHTML = ''; ov.dataset.answered = '';
    state = 'play';
    lastFrame = performance.now();
  }

  // ---------------------------------------------------------------- chest (correct the classmate's mistake)
  function openChest(fix) {
    state = 'chest'; inp.jid = null;
    Sfx.chest();
    const opts = shuffle([fix.c, ...fix.o]);
    const ov = $('overlay');
    ov.className = 'show chest';
    ov.innerHTML = `<div class="panel">
      <div class="lvTitle">📦 RET FEJLEN</div>
      <div class="lvSub">En Skriver fra klassen skrev:</div>
      <div class="fixWrong">${esc(fix.w)}</div>
      <div class="fixHint">💡 ${esc(fix.h)}</div>
      <div class="qopts col">${opts.map(o => `<button class="qopt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="qfb"></div>
      <div class="cards"></div></div>`;
    ov.querySelectorAll('.qopt').forEach(b => b.addEventListener('click', () => answerFix(fix, b.dataset.o, b)));
  }

  function answerFix(fix, chosen, btn) {
    const ov = $('overlay');
    if (ov.dataset.answered === '1') return;
    ov.dataset.answered = '1';
    const ok = chosen === fix.c;
    Mastery.record(fix.id, ok);
    ov.querySelectorAll('.qopt').forEach(b => { b.disabled = true; if (b.dataset.o === fix.c) b.classList.add('right'); });
    const fb = ov.querySelector('.qfb');
    Voice.say(fix.c, 'sentence', 0.9);
    if (ok) {
      R.fixOk++; btn.classList.add('right'); Sfx.good();
      fb.innerHTML = '<span class="ok">Flot rettet!</span> Vælg et segl:';
      showSealChoice();
    } else {
      btn.classList.add('wrong'); Sfx.bad();
      R.inkBonus += 20;
      fb.innerHTML = `<span class="no">Ikke helt.</span> Rigtigt: <b>${esc(fix.c)}</b><br>Du får +20 blæk.`;
      ov.querySelector('.cards').innerHTML = `<button class="btn" id="chestOk">Videre</button>`;
      $('chestOk').addEventListener('click', () => { Sfx.click(); closeOverlay(); });
    }
  }

  function showSealChoice() {
    const ov = $('overlay');
    const n = has('s_fejl') ? 4 : 3;
    if (has('s_fejl')) R.inkBonus += 40;
    const all = Object.keys(SEALS).filter(id => !R.seals.has(id));
    const owned = new Set(Save.data.seals);
    // prefer new seals
    const pool = shuffle(all.slice()).sort((a, b) => (owned.has(a) ? 1 : 0) - (owned.has(b) ? 1 : 0));
    const ch = pool.slice(0, n);
    const box = ov.querySelector('.cards');
    if (!ch.length) {
      box.innerHTML = `<button class="btn" id="chestOk">+60 blæk · Videre</button>`;
      $('chestOk').addEventListener('click', () => { R.inkBonus += 60; closeOverlay(); });
      return;
    }
    box.innerHTML = ch.map((id, i) => {
      const s = SEALS[id];
      return `<button class="ucard seal" data-id="${id}"><div class="uicon">${s.icon}</div><div class="ubody">
        <div class="uname">${esc(s.name)} ${owned.has(id) ? '' : '<span class="ulv new">NYT</span>'}</div>
        <div class="udesc">${esc(s.desc)}</div></div></button>`;
    }).join('');
    box.querySelectorAll('.ucard').forEach(c => c.addEventListener('click', () => {
      const id = c.dataset.id;
      R.seals.add(id);
      if (id === 's_hjerte') { R.P.maxHp += 40; R.P.hp += 40; }
      if (id === 's_magnet') R.P.magnet *= 1.6;
      if (!owned.has(id)) { Save.data.seals.push(id); R.newSeals.push(id); }
      Sfx.chest(); closeOverlay();
    }));
  }

  // ---------------------------------------------------------------- pause, how-to, end
  function pause() {
    if (state !== 'play') return;
    state = 'pause'; inp.jid = null;
    const ov = $('overlay');
    ov.className = 'show pause';
    const sealList = [...R.seals].map(id => `<span class="chip" title="${esc(SEALS[id].desc)}">${SEALS[id].icon} ${esc(SEALS[id].name)}</span>`).join('');
    ov.innerHTML = `<div class="panel">
      <div class="lvTitle">PAUSE</div>
      <div class="pstats">⏱ ${fmtT(R.t)} · ☠ ${R.kills} · ✦ ${R.sentences} sætninger</div>
      <div class="sealRow">${sealList || '<span class="muted">Ingen segl</span>'}</div>
      <button class="btn" id="pResume">▶ Fortsæt</button>
      <button class="btn ghost" id="pSfx">${Save.data.settings.sfx ? '🔊 Lyd: til' : '🔇 Lyd: fra'}</button>
      <button class="btn ghost" id="pVoice">${voiceLabel()}</button>
      <button class="btn ghost danger" id="pQuit">🏳 Giv op</button></div>`;
    $('pResume').onclick = () => { Sfx.click(); resume(); };
    $('pSfx').onclick = () => { Save.data.settings.sfx = !Save.data.settings.sfx; Save.save(); $('pSfx').textContent = Save.data.settings.sfx ? '🔊 Lyd: til' : '🔇 Lyd: fra'; };
    $('pVoice').onclick = () => { cycleVoice(); $('pVoice').textContent = voiceLabel(); };
    $('pQuit').onclick = () => { closeOverlay(); endRun(false, true); };
    Save.save();
  }
  function resume() { if (state === 'pause') closeOverlay(); }
  function voiceLabel() { return { all: '🗣 Stemme: alt', sentence: '🗣 Stemme: kun sætninger', off: '🤐 Stemme: fra' }[Save.data.settings.voice]; }
  function cycleVoice() { const o = ['all', 'sentence', 'off']; const s = Save.data.settings; s.voice = o[(o.indexOf(s.voice) + 1) % 3]; Save.save(); }

  function showHowTo() {
    state = 'howto';
    const ov = $('overlay');
    ov.className = 'show howto';
    ov.innerHTML = `<div class="panel">
      <div class="lvTitle">SÅDAN SPILLER DU</div>
      <div class="how"><span>👆</span><div>Træk med fingeren for at gå. Våbnene skyder selv.</div></div>
      <div class="how"><span>✨</span><div>Saml de gyldne ord i den <b>rigtige rækkefølge</b> og byg sætningen.</div></div>
      <div class="how"><span>⭕</span><div>Når sætningen er færdig, lukker en ring sig. Tryk <b>⚔</b>, når den rammer — <b>PERFEKT!</b></div></div>
      <div class="how"><span>🔴</span><div>Rød cirkel under dig? Gå væk — eller tryk <b>⚔</b> præcis i tide for at <b>PARERE</b>.</div></div>
      <button class="btn" id="howGo">Afsted!</button></div>`;
    $('howGo').onclick = () => { Save.data.seenHowTo = true; Save.save(); Sfx.click(); closeOverlay(); };
  }

  function bossDown(b) {
    R.boss = null;
    $('bossbar').classList.add('hidden');
    R.flash = 1; R.shake = 20; R.hitstop = 0.4;
    burst(b.x, b.y, '#ffd36b', 80, 500); burst(b.x, b.y, '#ffffff', 40, 300);
    banner('✨ ' + esc(b.name) + ' er besejret!', 'good', 3);
    Sfx.win();
    for (const e of R.enemies) if (!e.dead && e.type !== 'boss') { e.dead = true; burst(e.x, e.y, R.d.tint, 4, 100); }
    R.ended = true; R.prompt = null; R.words.length = 0; renderPrompt();
    R.winT = 2.4;
  }

  function endRun(win, quit) {
    if (state === 'end') return;
    state = 'end'; inp.jid = null;
    R.ended = true;
    if (!win) Sfx.lose();
    let ink = R.score / 150 + R.kills * 0.15 + R.sentences * 2 + R.inkBonus + (win ? 80 + 60 * R.dId : 0);
    ink *= 1 + ul('blaek') * 0.1;
    if (has('s_guld')) ink *= 1.3;
    if (R.hero === 'kraemmer') ink *= 1.25;
    ink = Math.round(ink);
    const sd = Save.data;
    sd.ink += ink; sd.totalInk += ink; sd.runs++;
    let unlocked = null;
    if (win) {
      sd.wins++;
      if (!sd.beaten.includes(R.dId)) sd.beaten.push(R.dId);
      const next = R.dId + 1;
      if (DISTRICTS.find(d => d.id === next) && !sd.districts.includes(next)) { sd.districts.push(next); unlocked = next; }
    }
    const b = sd.best[R.dId] || {};
    sd.best[R.dId] = { score: Math.max(b.score || 0, R.score), time: Math.max(b.time || 0, R.t) };
    Save.save();
    $('hud').classList.add('hidden');
    $('bossbar').classList.add('hidden');
    const tot = R.wordsOk + R.mistakes;
    UI.showEnd({
      win, quit, dId: R.dId, time: R.t, kills: R.kills, score: R.score, sentences: R.sentences,
      perfects: R.perfects, parries: R.parries, bestKaede: R.bestKaede, bestCast: R.bestCast,
      acc: tot ? Math.round(R.wordsOk / tot * 100) : 0, quick: [R.quickOk, R.quickOk + R.quickBad],
      fixOk: R.fixOk, ink, newSeals: R.newSeals.slice(), unlocked, lvl: R.P.lvl,
    });
  }

  // ---------------------------------------------------------------- HUD / DOM
  const hudCache = {};
  function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function setW(id, v) { const k = id + 'w'; if (hudCache[k] !== v) { hudCache[k] = v; $(id).style.width = v; } }
  function fmtT(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }

  function updateHud() {
    const P = R.P;
    setW('xpfill', (P.xp / P.need * 100).toFixed(1) + '%');
    setW('hpfill', clamp(P.hp / P.maxHp * 100, 0, 100).toFixed(1) + '%');
    setText('hptext', Math.max(0, Math.ceil(P.hp)) + ' / ' + Math.round(P.maxHp));
    setText('timer', R.bossSpawned ? '☠ ' + fmtT(R.t) : fmtT(Math.max(0, 300 - R.t)));
    setText('lvl', 'Niv. ' + P.lvl);
    setText('kills', '☠ ' + R.kills);
    if (R.boss) setW('bossfill', clamp(R.boss.hp / R.boss.maxHp * 100, 0, 100).toFixed(1) + '%');
    // action button
    const ab = $('actBtn');
    let mode = '';
    if (R.cast) mode = 'cast';
    else if (slamThreat()) mode = 'parry';
    if (hudCache.act !== mode) {
      hudCache.act = mode;
      ab.className = mode;
      ab.innerHTML = mode === 'cast' ? '<span>✦</span><small>KAST</small>' : mode === 'parry' ? '<span>⚔</span><small>PARÉR</small>' : '<span>⚔</span>';
    }
  }

  function updateKaede() {
    const k = $('kaede');
    const mult = 1 + Math.floor(R.kaede / (has('s_kaede') ? 3 : 5));
    k.innerHTML = (R.kaede > 0 ? `⛓ Kæde <b>${R.kaede}</b> · +${mult - 1} mult` : '') + (R.counter > 0 ? ` <span class="ctr">⚔ Kontra +${R.counter}</span>` : '');
    k.classList.remove('bump'); void k.offsetWidth; if (R.kaede > 0) k.classList.add('bump');
  }

  function renderPrompt(fresh) {
    const wrap = $('promptWrap');
    const pr = R && R.prompt;
    if (!pr) {
      if (R && R.cast) return; // keep the finished sentence on screen while casting
      wrap.classList.add('idle');
      $('pFrame').innerHTML = R && R.ended ? '' : '<span class="muted">Ordene samler sig …</span>';
      $('pSay').textContent = ''; $('pSpeaker').textContent = ''; $('pPic').textContent = ''; $('pTag').textContent = ''; $('pHint').textContent = '';
      measureInsets();
      return;
    }
    wrap.classList.remove('idle');
    if (fresh) { wrap.classList.remove('pop'); void wrap.offsetWidth; wrap.classList.add('pop'); }
    const p = pr.p;
    $('pSpeaker').textContent = p.sp;
    $('pSay').textContent = '»' + p.say + '«';
    $('pPic').textContent = pr.showPic ? p.pic : '';
    $('pTag').textContent = pr.showTag ? (TAGS[p.t] || {}).hint || '' : '';
    $('pHint').textContent = pr.hint || '';
    $('pHint').className = pr.hint ? 'show' : '';
    const done = pr.idx >= p.answers.length;
    $('pFrame').innerHTML = p.parts.map(part => {
      if (part.txt !== undefined) return esc(part.txt);
      const i = part.gap;
      if (i < pr.idx) return `<span class="filled">${esc(p.answers[i])}</span>`;
      if (i === pr.idx && !done) return `<span class="blank next">${'＿'.repeat(Math.max(2, Math.min(5, Math.ceil(p.answers[i].length / 2))))}</span>`;
      return `<span class="blank">${'＿'.repeat(Math.max(2, Math.min(5, Math.ceil(p.answers[i].length / 2))))}</span>`;
    }).join('');
    wrap.classList.toggle('complete', done);
    measureInsets();
  }

  function showScore(sc, tm, score, label) {
    const el = $('scorePop');
    const tmTxt = tm > 1 ? ` <span class="tm">×${tm}</span>` : '';
    el.innerHTML = `<div class="lbl ${label === 'PERFEKT!' ? 'perf' : ''}">${esc(label)}</div>
      <div class="calc"><span class="chips">${sc.chips}</span><span class="x">×</span><span class="mult">${sc.mult}</span>${tmTxt}</div>
      <div class="total ${score >= 1500 ? 'fire' : score >= 600 ? 'hot' : ''}">${score}</div>
      ${sc.notes.length ? `<div class="notes">${sc.notes.join(' ')}</div>` : ''}`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    // count up
    const tot = el.querySelector('.total'); const t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 450); tot.textContent = Math.round(score * k * (2 - k)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // ---------------------------------------------------------------- render
  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#0d0a10'; ctx.fillRect(0, 0, W, H);
    if (!R) { renderIdle(); return; }
    let sx = 0, sy = 0;
    if (R.shake > 0.5) { sx = rand(-R.shake, R.shake); sy = rand(-R.shake, R.shake); }
    ctx.save();
    ctx.translate(sx, sy);
    // ground
    ctx.save();
    const ox = (-camX * S + W / 2) % (192 * S), oy = (-camY * S + viewCY) % (192 * S);
    ctx.translate(ox, oy); ctx.scale(S, S);
    ctx.fillStyle = bg.pat; ctx.fillRect(-192, -192, W / S + 384, H / S + 384);
    ctx.restore();
    // star motes (sci-fi light leaking from the machine)
    for (const m of motes) {
      const x = ((m.x * W - camX * S * m.z * 0.3) % W + W) % W, y = ((m.y * H - camY * S * m.z * 0.3) % H + H) % H;
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(realT * 2 + m.p);
      ctx.fillStyle = m.z > 0.7 ? '#bfe9ff' : bg.tint;
      ctx.fillRect(x, y, 1.5 * m.z + 0.5, 1.5 * m.z + 0.5);
    }
    ctx.globalAlpha = 1;

    const P = R.P;
    // pools
    for (const p of R.pools) {
      const [x, y] = toScreen(p.x, p.y);
      ctx.globalAlpha = 0.45 * Math.min(1, p.life / 0.5);
      ctx.fillStyle = '#2a3d9a'; ctx.beginPath(); ctx.ellipse(x, y, p.r * S, p.r * S * 0.8, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha *= 0.8; ctx.strokeStyle = '#5a7dff'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // slam telegraphs (under everything)
    for (const s of R.slams) drawSlam(s);
    for (const l of R.lines) drawLine(l);
    // xp shards
    for (const x of R.xps) {
      const [sx_, sy_] = toScreen(x.x, x.y);
      const big = x.v >= 4;
      ctx.fillStyle = big ? '#7dffb2' : '#7fc8ff';
      ctx.save(); ctx.translate(sx_, sy_); ctx.rotate(Math.PI / 4);
      const s = (big ? 5 : 3.5) * S; ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore();
    }
    // pickups
    for (const p of R.pickups) {
      const [x, y] = toScreen(p.x, p.y + Math.sin(p.bob) * 3);
      ctx.font = `${Math.round((p.kind === 'chest' ? 30 : 22) * S)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (p.kind === 'chest') { glow(x, y, 34 * S, 'rgba(255,211,107,0.45)'); }
      ctx.fillText(p.kind === 'chest' ? '📦' : p.kind === 'heal' ? '🥐' : '🧲', x, y);
    }
    // enemies
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const e of R.enemies) { if (e.type === 'boss') drawBoss(e); else drawEnemy(e); }
    // cogs
    for (const c of R.cogs) drawCog(c);
    // word gems (above enemies so they stay readable)
    for (const g of R.words) drawWord(g);
    // pendulum orbs
    const pw = R.weapons.find(w => w.id === 'pendul');
    if (pw) {
      const L = WEAPONS.pendul.lv[pw.lvl - 1];
      for (let i = 0; i < L.n; i++) {
        const a = pw.ang + i * TAU / L.n;
        const [x, y] = toScreen(P.x + Math.cos(a) * L.rad, P.y + Math.sin(a) * L.rad);
        glow(x, y, 16 * S, 'rgba(184,146,255,0.5)');
        ctx.fillStyle = '#d9c6ff'; ctx.beginPath(); ctx.arc(x, y, 7 * S, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#8a5cff'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    // player
    drawPlayer();
    // shots
    for (const s of R.shots) {
      const [x, y] = toScreen(s.x, s.y);
      ctx.strokeStyle = s.col; ctx.lineWidth = 3 * S; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.03 * S, y - s.vy * 0.03 * S); ctx.stroke();
    }
    for (const s of R.eshots) {
      const [x, y] = toScreen(s.x, s.y);
      glow(x, y, s.r * 2.2 * S, 'rgba(255,90,90,0.4)');
      ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(x, y, s.r * S, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, s.r * 0.4 * S, 0, TAU); ctx.fill();
    }
    // waves
    for (const w of R.waves) {
      const [x, y] = toScreen(w.x, w.y);
      const k = Math.min(1, w.t / w.life);
      ctx.globalAlpha = (1 - k) * (w.big ? 0.9 : 0.7);
      ctx.strokeStyle = w.col; ctx.lineWidth = (w.big ? 10 : 4) * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(x, y, w.r * S, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // lightning
    for (const b of R.bolts) {
      const [x, y] = toScreen(b.x, b.y);
      ctx.strokeStyle = '#d6f6ff'; ctx.lineWidth = 2.5; ctx.globalAlpha = b.life / 0.22;
      ctx.beginPath(); let yy = y - 220, xx = x + (b.seed - 0.5) * 60; ctx.moveTo(xx, yy);
      for (let i = 0; i < 6; i++) { yy += 220 / 6; xx = x + (i === 5 ? 0 : rand(-14, 14)); ctx.lineTo(xx, yy); }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    // particles
    for (const p of R.parts) {
      const [x, y] = toScreen(p.x, p.y);
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      ctx.fillStyle = p.col; ctx.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    // cast ring
    if (R.cast) drawCastRing();
    // texts
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const t of R.texts) {
      const [x, y] = toScreen(t.x, t.y);
      ctx.globalAlpha = Math.min(1, t.life / t.max * 2);
      ctx.font = `800 ${t.size}px ${FONT}`;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(t.txt, x, y);
      ctx.fillStyle = t.col; ctx.fillText(t.txt, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    drawEdgeMarkers();
    // joystick
    if (inp.jid !== null && state === 'play') {
      ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(inp.ox, inp.oy, 52, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffd36b';
      const dx = inp.cx - inp.ox, dy = inp.cy - inp.oy, l = Math.hypot(dx, dy), m = Math.min(l, 52);
      ctx.beginPath(); ctx.arc(inp.ox + (l ? dx / l * m : 0), inp.oy + (l ? dy / l * m : 0), 22, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // screen flashes
    if (R.flash > 0) { ctx.fillStyle = `rgba(255,236,190,${Math.min(0.5, R.flash)})`; ctx.fillRect(0, 0, W, H); }
    if (R.hurtFlash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(200,0,0,${R.hurtFlash})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (R.timeScale < 1) { ctx.fillStyle = 'rgba(20,10,40,0.18)'; ctx.fillRect(0, 0, W, H); }
  }

  function glow(x, y, r, col) {
    if (!(r > 0.5)) { if (r < 0 && errShown++ < 3) console.error('glow r<0', r, new Error().stack); return; }
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  function drawPlayer() {
    const P = R.P;
    const [x, y] = toScreen(P.x, P.y);
    const blink = P.inv > 0 && Math.floor(realT * 20) % 2 === 0;
    glow(x, y, 34 * S, 'rgba(255,211,107,0.28)');
    if (P.magnet && R.P.lvl < 3) { ctx.strokeStyle = 'rgba(127,200,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, P.magnet * S, 0, TAU); ctx.stroke(); }
    if (blink) ctx.globalAlpha = 0.4;
    const r = P.r * S, bobY = Math.sin(P.walk) * 1.5;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.9, r * 0.9, r * 0.35, 0, 0, TAU); ctx.fill();
    // cloak
    ctx.fillStyle = '#3a2a6e';
    ctx.beginPath(); ctx.moveTo(x - r, y + r * 0.8 + bobY); ctx.quadraticCurveTo(x - r * 0.9, y - r * 0.6, x, y - r * 1.25 + bobY);
    ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.6, x + r, y + r * 0.8 + bobY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; ctx.stroke();
    // face in hood
    ctx.fillStyle = '#140e22'; ctx.beginPath(); ctx.arc(x, y - r * 0.3 + bobY, r * 0.45, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9fe7ff';
    const fx = Math.cos(P.face) * r * 0.15;
    ctx.fillRect(x - r * 0.2 + fx - 1.5, y - r * 0.35 + bobY, 3, 3); ctx.fillRect(x + r * 0.2 + fx - 1.5, y - r * 0.35 + bobY, 3, 3);
    // quill
    const qa = P.face;
    ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(qa) * r * 0.7, y + Math.sin(qa) * r * 0.7 + bobY);
    ctx.lineTo(x + Math.cos(qa) * r * 1.6, y + Math.sin(qa) * r * 1.6 - 6 + bobY); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawEnemy(e) {
    const [x, y] = toScreen(e.x, e.y);
    if (x < -60 || x > W + 60 || y < -60 || y > H + 60) return;
    const r = e.r * S * (1 + Math.sin(e.wob) * 0.04);
    if (e.type === 'elite') {
      glow(x, y, r * 2.4, 'rgba(255,40,60,0.35)');
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.9, r * 0.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.fill;
    ctx.beginPath();
    if (e.type === 'tung') { // hexagon slab
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + e.wob * 0.05; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.closePath();
    } else if (e.type === 'loeber') {
      ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r, y + r * 0.8); ctx.lineTo(x - r, y + r * 0.8); ctx.closePath();
    } else ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    const tint = e.type === 'elite' ? '#ff4a5e' : e.type === 'spytter' ? '#ff8a6b' : R.d.tint;
    ctx.strokeStyle = e.stun > 0 ? '#9fe7ff' : tint; ctx.lineWidth = e.type === 'elite' ? 3 : 2; ctx.stroke();
    ctx.fillStyle = e.flash > 0 ? '#000' : tint;
    ctx.font = `800 ${Math.round(r * (e.type === 'elite' ? 1.0 : 1.15))}px ${FONT}`;
    ctx.fillText(e.type === 'elite' ? '✗' : e.glyph, x, y + 1);
    if (e.type === 'elite') {
      // the wrong sentence it carries
      ctx.font = `700 ${Math.round(11.5 * Math.max(1, S))}px ${FONT}`;
      const t = e.fix.w; const tw = ctx.measureText(t).width + 12;
      const ly = y - r - 22;
      ctx.fillStyle = 'rgba(40,0,8,0.85)'; roundRect(x - tw / 2, ly - 10, tw, 20, 6); ctx.fill();
      ctx.strokeStyle = '#ff4a5e'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffb3bd'; ctx.fillText(t, x, ly + 1);
      // hp
      const hw = r * 2.2; ctx.fillStyle = '#300'; ctx.fillRect(x - hw / 2, y + r + 6, hw, 4);
      ctx.fillStyle = '#ff4a5e'; ctx.fillRect(x - hw / 2, y + r + 6, hw * clamp(e.hp / e.maxHp, 0, 1), 4);
      if (e.wind > 0) { ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(20 * S)}px ${FONT}`; ctx.fillText('!', x + r, y - r); }
    }
  }

  function drawBoss(b) {
    const [x, y] = toScreen(b.x, b.y);
    const r = b.r * S;
    glow(x, y, r * 2.6, 'rgba(255,200,120,0.25)');
    ctx.save(); ctx.translate(x, y);
    // outer gear
    ctx.rotate(b.rot);
    ctx.fillStyle = b.flash > 0 ? '#fff' : '#2a1f14';
    ctx.beginPath();
    const teeth = 14;
    for (let i = 0; i < teeth * 2; i++) { const a = i * Math.PI / teeth; const rr = i % 2 ? r : r * 1.18; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = b.color; ctx.lineWidth = 3; ctx.stroke();
    ctx.rotate(-b.rot * 2.2);
    ctx.strokeStyle = b.color + '99'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, TAU); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25); ctx.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); ctx.stroke(); }
    ctx.restore();
    // core
    glow(x, y, r * 0.6, b.stun > 0 ? 'rgba(160,230,255,0.9)' : 'rgba(255,240,200,0.9)');
    ctx.font = `${Math.round(r * 0.8)}px serif`; ctx.fillText(b.icon, x, y + 2);
  }

  function drawWord(g) {
    const [x, y0] = toScreen(g.x, g.y);
    const y = y0 + Math.sin(g.bob) * 2.5;
    const age = R.t - g.born, life = g.life - age;
    const sc = Math.min(1, age / 0.25) * S;
    const w = g.w * sc, h = g.h * sc;
    ctx.globalAlpha = life < 3 ? (Math.floor(realT * 8) % 2 ? 0.45 : 0.9) : 1;
    glow(x, y, w * 0.75, 'rgba(255,200,90,0.32)');
    if (g.pulse > 0) {
      const k = (realT * 2) % 1;
      ctx.strokeStyle = `rgba(140,255,170,${1 - k})`; ctx.lineWidth = 3;
      roundRect(x - w / 2 - 6 - k * 14, y - h / 2 - 6 - k * 14, w + 12 + k * 28, h + 12 + k * 28, 12); ctx.stroke();
    }
    const grd = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    grd.addColorStop(0, '#fff1c4'); grd.addColorStop(1, '#f2b84b');
    ctx.fillStyle = grd; roundRect(x - w / 2, y - h / 2, w, h, 9 * sc); ctx.fill();
    ctx.strokeStyle = g.pulse > 0 ? '#8cffaa' : '#fff8e0'; ctx.lineWidth = g.pulse > 0 ? 2.5 : 1.5; ctx.stroke();
    ctx.fillStyle = '#2b1a05';
    ctx.font = `700 ${Math.round(16 * sc)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(g.text, x, y + 1);
    ctx.globalAlpha = 1;
  }

  function drawCog(c) {
    const [x, y] = toScreen(c.x, c.y);
    const r = 12 * S;
    ctx.save(); ctx.translate(x, y); ctx.rotate(c.rot);
    ctx.fillStyle = '#e0a94a'; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; const rr = i % 2 ? r : r * 1.3; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3b2610'; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawSlam(s) {
    const [x, y] = toScreen(s.x, s.y);
    const r = s.r * S;
    if (s.done) {
      const k = (s.fade || 0) / 0.3;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = s.parried ? 'rgba(255,255,255,0.6)' : 'rgba(255,60,60,0.55)';
      ctx.beginPath(); ctx.arc(x, y, r * (1 + k * 0.3), 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; return;
    }
    const k = Math.min(1, s.t / s.dur);
    const inWin = s.t >= s.dur - parryWin();
    ctx.fillStyle = `rgba(255,40,60,${0.12 + k * 0.18})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,90,90,0.9)'; ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
    // closing ring
    const rr = r * (1 + (1 - k) * 1.6);
    ctx.strokeStyle = inWin ? '#ffffff' : '#ff5a5a'; ctx.lineWidth = inWin ? 5 : 3;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke();
    if (inWin) { ctx.font = `900 ${Math.round(18 * S)}px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('NU!', x, y - r - 14); }
  }

  function drawLine(l) {
    const [x, y] = toScreen(l.x, l.y);
    const k = Math.min(1, l.t / l.dur);
    const L = 900;
    const dx = Math.cos(l.a) * L, dy = Math.sin(l.a) * L;
    if (!l.done) {
      ctx.strokeStyle = `rgba(200,180,230,${0.25 + k * 0.5})`; ctx.lineWidth = 2 + k * 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(200,180,230,${0.15})`; ctx.lineWidth = 32 * S * k;
      ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(240,230,255,${1 - (l.t - l.dur) / 0.3})`; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    }
  }

  function drawCastRing() {
    const c = R.cast, P = R.P;
    const [x, y] = toScreen(P.x, P.y);
    const target = 50, start = 160;
    const k = c.t / c.dur;
    const tk = c.target;
    const r = start - (start - target) * (k / tk);
    const inWin = Math.abs(c.t - c.target * c.dur) <= c.win;
    // target ring
    ctx.strokeStyle = inWin ? '#ffffff' : 'rgba(255,211,107,0.9)'; ctx.lineWidth = inWin ? 6 : 4;
    ctx.beginPath(); ctx.arc(x, y, target, 0, TAU); ctx.stroke();
    // perfect band
    ctx.strokeStyle = 'rgba(255,211,107,0.25)'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(x, y, target, 0, TAU); ctx.stroke();
    // closing ring
    if (r > 0) {
      ctx.strokeStyle = 'rgba(159,231,255,0.95)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, Math.max(2, r), 0, TAU); ctx.stroke();
    }
    ctx.font = `900 ${inWin ? 20 : 16}px ${FONT}`; ctx.fillStyle = inWin ? '#fff' : '#ffd36b'; ctx.textAlign = 'center';
    ctx.fillText(inWin ? 'NU!' : 'TRYK ⚔', x, y + target + 26);
  }

  // arrows at the screen edge for word gems and chests that are out of view
  function drawEdgeMarkers() {
    const m = 26, top = topInset + 30, bot = H - 30;
    const cx = W / 2, cy = viewCY;
    const mark = (wx, wy, label, col, txtCol) => {
      const [x, y] = toScreen(wx, wy);
      if (x > m && x < W - m && y > top && y < bot) return;
      const dx = x - cx, dy = y - cy;
      const sx = dx ? ((dx > 0 ? W - m : m) - cx) / dx : Infinity;
      const sy = dy ? ((dy > 0 ? bot : top) - cy) / dy : Infinity;
      const s = Math.min(Math.abs(sx), Math.abs(sy));
      const ex = cx + dx * s, ey = cy + dy * s, a = Math.atan2(dy, dx);
      ctx.save();
      ctx.font = `800 13px ${FONT}`;
      const tw = ctx.measureText(label).width + 14;
      const bx = clamp(ex - Math.cos(a) * (tw / 2 + 4), tw / 2 + 4, W - tw / 2 - 4), by = clamp(ey - Math.sin(a) * 14, top, bot);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = col; roundRect(bx - tw / 2, by - 11, tw, 22, 8); ctx.fill();
      ctx.fillStyle = txtCol; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, bx, by + 1);
      ctx.translate(ex, ey); ctx.rotate(a);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    for (const g of R.words) mark(g.x, g.y, g.text, 'rgba(242,184,75,0.95)', '#2b1a05');
    for (const p of R.pickups) if (p.kind === 'chest') mark(p.x, p.y, '📦', 'rgba(125,255,178,0.9)', '#06210f');
    if (R.boss) mark(R.boss.x, R.boss.y, R.boss.icon, 'rgba(255,90,107,0.9)', '#fff');
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // menu background: drifting words and gears
  const idleWords = ['datid', 'inversion', 'for … siden', 'gik', 'så jeg', 'apoteket', 'hende', 'i lige måde', 'blåt', 'om vinteren', 'fordi', 'det kommer an på'];
  const idle = idleWords.map(t => ({ t, x: Math.random(), y: Math.random(), v: rand(0.01, 0.03), a: rand(0.08, 0.2) }));
  function renderIdle() {
    const g = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, Math.max(W, H) * 0.8);
    g.addColorStop(0, '#2a1d3a'); g.addColorStop(1, '#0b0810');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H * 0.32);
    ctx.strokeStyle = 'rgba(224,169,74,0.13)'; ctx.lineWidth = 2;
    for (let j = 0; j < 3; j++) {
      ctx.save(); ctx.rotate(realT * (j % 2 ? -0.08 : 0.06) * (j + 1));
      const r = 90 + j * 70; ctx.beginPath();
      for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24; const rr = i % 2 ? r : r + 10; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    ctx.textAlign = 'center';
    for (const w of idle) {
      w.y -= w.v * 0.016; if (w.y < -0.05) { w.y = 1.05; w.x = Math.random(); }
      ctx.globalAlpha = w.a; ctx.fillStyle = '#ffd36b'; ctx.font = `600 16px ${FONT}`;
      ctx.fillText(w.t, w.x * W, w.y * H);
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- loop
  let errShown = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = clamp((now - lastFrame) / 1000 || 0, 0, 0.05);
    lastFrame = now; realT += dt;
    try {
      if (state === 'play' && R) update(dt);
      render();
    } catch (err) {
      if (errShown++ < 3) console.error('frame error', err && err.stack || err);
    }
  }

  // ---------------------------------------------------------------- public
  function start(dId, heroId, loadout) {
    newRun(dId, heroId, loadout);
    $('hud').classList.remove('hidden');
    $('bossbar').classList.add('hidden');
    $('scorePop').classList.remove('show');
    for (const k in hudCache) delete hudCache[k];
    state = 'play';
    renderPrompt();
    updateKaede();
    measureInsets();
    banner(R.d.name + '<small>' + R.d.kap + ' · ' + R.d.sub + '</small>', 'intro', 2.6);
    lastFrame = performance.now();
    if (!Save.data.seenHowTo) showHowTo();
  }
  function toMenu() { state = 'menu'; R = null; $('hud').classList.add('hidden'); measureInsets(); }

  $('actBtn').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Sfx.init(); action(); });
  $('pauseBtn').addEventListener('click', e => { e.stopPropagation(); pause(); });
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(t => { lastFrame = t; frame(t); });

  return { start, toMenu, get state() { return state; }, get run() { return R; }, _debug: { action, update: dt => update(dt) } };
})();
