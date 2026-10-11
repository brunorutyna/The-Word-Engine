// ORDVÆRKET — hub screens: title, preparation (heroes + seals), workshop, grimoire, story, end of run
'use strict';

const UI = (() => {
  const $ = id => document.getElementById(id);
  const scr = $('screens');
  const sd = () => Save.data;

  function show(html, cls = '') {
    scr.className = 'show ' + cls; scr.innerHTML = html; scr.scrollTop = 0;
    scr.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { Sfx.init(); Voice.prime(); Sfx.click(); go(b.dataset.go); }));
  }
  function hide() { scr.className = ''; scr.innerHTML = ''; }
  function go(where) {
    ({ title, prep, shop, grim, settings, story: storyList }[where] || title)();
  }
  const inkChip = () => `<span class="ink">🖋️ <b>${sd().ink}</b></span>`;
  const header = (t) => `<header class="bar"><button class="btn icon" data-go="title">←</button><h2>${t}</h2>${inkChip()}</header>`;

  function allItems() {
    return [
      ...PROMPTS.map(p => ({ id: p.id, t: p.t, full: p.full, pic: p.pic, kind: 'sætning' })),
      ...QUICK.map(q => ({ id: q.id, t: q.t, full: q.full, pic: q.pic || '', kind: 'spørgsmål' })),
      ...FIXES.map(f => ({ id: f.id, t: 'fejl', full: f.c, pic: '✍️', kind: 'rettelse' })),
    ];
  }
  function masteredCount() {
    const it = allItems();
    return { m: it.filter(i => Mastery.stars(i.id) >= 3).length, t: it.length, seen: it.filter(i => sd().mastery[i.id]).length };
  }

  // ------------------------------------------------------------- title
  function title() {
    Game.toMenu();
    if (!sd().seenIntro) { story('intro', () => { sd().seenIntro = true; Save.save(); title(); }); return; }
    const m = masteredCount();
    show(`<div class="title-wrap">
      <div class="logo">
        <div class="logo-gear">⚙</div>
        <h1>ORDVÆRKET</h1>
        <div class="tag">Byg sætninger. Red byen.</div>
      </div>
      <div class="menu">
        <button class="btn big" data-go="prep">▶ Spil</button>
        <button class="btn" data-go="shop">🔧 Værkstedet</button>
        <button class="btn" data-go="grim">📖 Grimoiret <small>${m.m} / ${m.t} mestret</small></button>
        <button class="btn ghost" data-go="story">📜 Historien</button>
        <button class="btn ghost" data-go="settings">⚙ Indstillinger</button>
      </div>
      <div class="foot">${inkChip()} · Ture ${sd().runs} · Sejre ${sd().wins}</div>
    </div>`, 'title');
  }

  // ------------------------------------------------------------- preparation
  function slots() { return 2 + (sd().upgrades.segl || 0); }
  function prep() {
    const d = sd();
    if (!d.districts.includes(d.district)) d.district = 1;
    if (!d.heroes.includes(d.hero)) d.hero = 'kronik';
    d.loadout = d.loadout.filter(id => d.seals.includes(id)).slice(0, slots());
    const dist = DISTRICTS.map(x => {
      const open = d.districts.includes(x.id), beaten = d.beaten.includes(x.id), sel = d.district === x.id;
      const prev = DISTRICTS.find(y => y.id === x.id - 1);
      const best = d.best[x.id];
      return `<button class="dcard ${sel ? 'sel' : ''} ${open ? '' : 'locked'}" data-d="${x.id}" ${open ? '' : 'disabled'} style="--tint:${x.tint}">
        <div class="dkap">${x.kap}${beaten ? ' · ✓' : ''}</div>
        <div class="dname">${open ? x.name : '🔒 ' + x.name}</div>
        <div class="dsub">${open ? x.sub : 'Besejr ' + (prev ? prev.boss.name : '') + ' først'}</div>
        ${best && open ? `<div class="dbest">Rekord ${best.score}</div>` : ''}
      </button>`;
    }).join('');
    const heroes = Object.entries(HEROES).map(([id, h]) => {
      const own = d.heroes.includes(id), sel = d.hero === id;
      const W_ = WEAPONS[h.weapon];
      return `<button class="hcard ${sel ? 'sel' : ''} ${own ? '' : 'locked'}" data-h="${id}">
        <div class="hicon">${h.icon}</div>
        <div class="hbody"><div class="hname">${h.name}</div>
        <div class="hperk">${h.perk}</div>
        <div class="hweap">${W_.icon} ${W_.name}</div></div>
        ${own ? '' : `<div class="hcost ${d.ink >= h.cost ? 'can' : ''}">🖋️ ${h.cost}</div>`}
      </button>`;
    }).join('');
    const owned = Object.keys(SEALS).filter(id => d.seals.includes(id));
    const unknown = Object.keys(SEALS).length - owned.length;
    const seals = owned.map(id => {
      const s = SEALS[id], on = d.loadout.includes(id);
      return `<button class="scard ${on ? 'on' : ''}" data-s="${id}"><div class="sicon">${s.icon}</div>
        <div class="sbody"><div class="sname">${s.name}</div><div class="sdesc">${s.desc}</div></div></button>`;
    }).join('') + (unknown ? `<div class="scard unknown"><div class="sicon">❔</div><div class="sbody"><div class="sname">${unknown} ukendte segl</div><div class="sdesc">Besejr fejl-eliter og ret deres sætninger for at finde flere.</div></div></div>` : '');

    show(`${header('Forberedelse')}
      <section><h3>Distrikt</h3><div class="row scroll">${dist}</div></section>
      <section><h3>Skriver</h3><div class="grid hgrid">${heroes}</div></section>
      <section><h3>Segl <span class="muted">${d.loadout.length} / ${slots()}</span></h3><div class="grid sgrid">${seals}</div></section>
      <div class="sticky"><button class="btn big" id="goRun">⚔ Afsted!</button></div>`, 'prep');

    scr.querySelectorAll('.dcard').forEach(b => b.addEventListener('click', () => { d.district = +b.dataset.d; Save.save(); Sfx.click(); prep(); }));
    scr.querySelectorAll('.hcard').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.h, h = HEROES[id];
      if (!d.heroes.includes(id)) {
        if (d.ink < h.cost) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); Sfx.bad(); return; }
        d.ink -= h.cost; d.heroes.push(id); Sfx.chest();
      } else Sfx.click();
      d.hero = id; Save.save(); prep();
    }));
    scr.querySelectorAll('.scard[data-s]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.s;
      if (d.loadout.includes(id)) d.loadout = d.loadout.filter(x => x !== id);
      else if (d.loadout.length < slots()) d.loadout.push(id);
      else { d.loadout.shift(); d.loadout.push(id); }
      Save.save(); Sfx.click(); prep();
    }));
    $('goRun').addEventListener('click', () => { Sfx.init(); Voice.prime(); Sfx.click(); startRun(); });
  }
  function startRun() {
    const d = sd();
    hide();
    Game.start(d.district, d.hero, d.loadout.slice());
  }

  // ------------------------------------------------------------- workshop
  function shop() {
    const d = sd();
    const rows = UPGRADES.map(u => {
      const l = d.upgrades[u.id] || 0, max = l >= u.max, cost = max ? 0 : u.cost(l);
      const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('');
      return `<div class="urow"><div class="uicon">${u.icon}</div>
        <div class="ubody"><div class="uname">${u.name}</div><div class="udesc">${u.desc}</div><div class="pips">${pips}</div></div>
        <button class="btn small ${!max && d.ink >= cost ? '' : 'off'}" data-u="${u.id}" ${max ? 'disabled' : ''}>${max ? 'MAX' : '🖋️ ' + cost}</button></div>`;
    }).join('');
    show(`${header('Værkstedet')}
      <p class="lead">Blæk fra dine ture bliver til varige forbedringer.</p>
      <div class="ulist">${rows}</div>`, 'shop');
    scr.querySelectorAll('[data-u]').forEach(b => b.addEventListener('click', () => {
      const u = UPGRADES.find(x => x.id === b.dataset.u), l = d.upgrades[u.id] || 0;
      if (l >= u.max) return;
      const c = u.cost(l);
      if (d.ink < c) { Sfx.bad(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
      d.ink -= c; d.upgrades[u.id] = l + 1; Save.save(); Sfx.level(); shop();
    }));
  }

  // ------------------------------------------------------------- grimoire
  let grimTag = 'alle';
  function grim() {
    const items = allItems();
    const m = masteredCount();
    const tags = ['alle', ...Object.keys(TAGS), 'fejl'];
    const tagName = t => t === 'alle' ? 'Alle' : t === 'fejl' ? 'Rettelser' : TAGS[t].name;
    const list = items.filter(i => grimTag === 'alle' || i.t === grimTag);
    const rows = list.map(i => {
      const seen = !!sd().mastery[i.id];
      const st = Mastery.stars(i.id);
      if (!seen) return `<div class="grow unseen"><div class="gpic">❔</div><div class="gtext">· · · · ·</div></div>`;
      return `<div class="grow ${st >= 3 ? 'mast' : ''}"><div class="gpic">${i.pic || '•'}</div>
        <div class="gtext">${esc(i.full)}<div class="gstars">${'★'.repeat(st)}${'☆'.repeat(5 - st)}</div></div>
        <button class="btn icon say" data-say="${esc(i.full)}">🔊</button></div>`;
    }).join('');
    show(`${header('Grimoiret')}
      <div class="gsum"><div><b>${m.m}</b> mestret</div><div><b>${m.seen}</b> set</div><div><b>${m.t}</b> i alt</div></div>
      <div class="chips">${tags.map(t => `<button class="chip ${t === grimTag ? 'sel' : ''}" data-t="${t}">${tagName(t)}</button>`).join('')}</div>
      <div class="glist">${rows || '<p class="muted">Intet her endnu.</p>'}</div>`, 'grim');
    scr.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { grimTag = b.dataset.t; Sfx.click(); grim(); }));
    scr.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => { Voice.prime(); Voice.say(b.dataset.say, 'sentence', 0.88); }));
  }

  // ------------------------------------------------------------- settings
  function settings() {
    const s = sd().settings;
    const voiceName = Voice.v ? Voice.v.name : null;
    show(`${header('Indstillinger')}
      <div class="ulist">
        <div class="urow"><div class="uicon">🔊</div><div class="ubody"><div class="uname">Lydeffekter</div></div>
          <button class="btn small" id="tSfx">${s.sfx ? 'Til' : 'Fra'}</button></div>
        <div class="urow"><div class="uicon">🗣</div><div class="ubody"><div class="uname">Dansk stemme</div>
          <div class="udesc">${{ all: 'Personerne taler, og sætningerne bliver læst op', sentence: 'Kun færdige sætninger', off: 'Ingen stemme' }[s.voice]}</div>
          <div class="udesc muted">${voiceName ? 'Stemme: ' + esc(voiceName) : 'Ingen dansk stemme fundet på enheden — prøver alligevel med da-DK.'}</div></div>
          <button class="btn small" id="tVoice">${{ all: 'Alt', sentence: 'Sætninger', off: 'Fra' }[s.voice]}</button></div>
        <div class="urow"><div class="uicon">🎧</div><div class="ubody"><div class="uname">Test stemmen</div></div>
          <button class="btn small" id="tTest">▶</button></div>
        <div class="urow"><div class="uicon">🧹</div><div class="ubody"><div class="uname">Slet alt fremskridt</div><div class="udesc">Blæk, segl, Grimoiret — alt.</div></div>
          <button class="btn small danger" id="tReset">Slet</button></div>
      </div>`, 'settings');
    $('tSfx').onclick = () => { s.sfx = !s.sfx; Save.save(); Sfx.init(); Sfx.click(); settings(); };
    $('tVoice').onclick = () => { const o = ['all', 'sentence', 'off']; s.voice = o[(o.indexOf(s.voice) + 1) % 3]; Save.save(); Sfx.click(); settings(); };
    $('tTest').onclick = () => { Voice.prime(); Voice.say('Hej! Velkommen til Ordby. Jeg taler langsomt, så du kan forstå.', 'sentence', 0.88); };
    let armed = false;
    $('tReset').onclick = (e) => {
      if (!armed) { armed = true; e.target.textContent = 'Er du sikker?'; return; }
      Save.reset(); Sfx.lose(); title();
    };
  }

  // ------------------------------------------------------------- story
  function storyList() {
    const keys = ['intro', ...sd().beaten.slice().sort()];
    const rows = keys.map(k => `<button class="urow story" data-k="${k}"><div class="uicon">${STORY[k].pic}</div>
      <div class="ubody"><div class="uname">${STORY[k].title}</div></div><span>›</span></button>`).join('');
    const locked = DISTRICTS.filter(d => !sd().beaten.includes(d.id)).map(d => `<div class="urow off"><div class="uicon">🔒</div><div class="ubody"><div class="uname">???</div><div class="udesc">Befri ${d.name}</div></div></div>`).join('');
    show(`${header('Historien')}<div class="ulist">${rows}${locked}</div>`, 'storylist');
    scr.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { Sfx.click(); story(b.dataset.k, storyList); }));
  }
  function story(key, onDone) {
    const s = STORY[key];
    show(`<div class="story-wrap">
      <div class="spic">${s.pic}</div>
      <h2>${s.title}</h2>
      <div class="stext">${s.text.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="sbtns"><button class="btn ghost" id="sListen">🔊 Lyt</button><button class="btn" id="sNext">Videre ›</button></div>
    </div>`, 'story');
    $('sListen').onclick = () => { Sfx.init(); Voice.prime(); Voice.say(s.text.join(' '), 'sentence', 0.82); };
    $('sNext').onclick = () => { Sfx.init(); Sfx.click(); try { speechSynthesis.cancel(); } catch (e) {} onDone(); };
  }

  // ------------------------------------------------------------- end of run
  function fmt(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }
  function showEnd(r) {
    const d = DISTRICTS.find(x => x.id === r.dId);
    const head = r.win ? `✨ ${d.name} er befriet!` : r.quit ? '🏳 Du gav op' : '💀 Du faldt …';
    const stat = (k, v) => `<div class="st"><span>${k}</span><b>${v}</b></div>`;
    const seals = r.newSeals.map(id => `<span class="chip sel">${SEALS[id].icon} ${SEALS[id].name}</span>`).join('');
    const un = r.unlocked ? DISTRICTS.find(x => x.id === r.unlocked) : null;
    show(`<div class="end-wrap ${r.win ? 'win' : 'lose'}">
      <h2>${head}</h2>
      <div class="inkwin">+${r.ink} 🖋️</div>
      ${un ? `<div class="unlock">🔓 Nyt distrikt: <b>${un.name}</b> · ${un.kap}</div>` : ''}
      ${seals ? `<div class="newseals"><div class="muted">Nye segl</div>${seals}</div>` : ''}
      <div class="stats">
        ${stat('Tid', fmt(r.time))}${stat('Niveau', r.lvl)}
        ${stat('Sætninger', r.sentences)}${stat('Ordpræcision', r.acc + '%')}
        ${stat('PERFEKT', r.perfects)}${stat('Pareringer', r.parries)}
        ${stat('Bedste kæde', r.bestKaede)}${stat('Største besværgelse', r.bestCast)}
        ${stat('Spørgsmål', r.quick[0] + ' / ' + r.quick[1])}${stat('Rettelser', r.fixOk)}
        ${stat('Fjender', r.kills)}${stat('Point', r.score)}
      </div>
      <div class="sbtns"><button class="btn ghost" id="eHome">🏠 Skriptoriet</button><button class="btn" id="eAgain">↻ Igen</button></div>
    </div>`, 'end');
    const after = (next) => {
      if (r.win && !sd().storySeen.includes(r.dId)) {
        sd().storySeen.push(r.dId); Save.save();
        story(r.dId, next);
      } else next();
    };
    $('eHome').onclick = () => { Sfx.click(); after(title); };
    $('eAgain').onclick = () => { Sfx.click(); after(() => { if (r.unlocked) sd().district = r.unlocked; Save.save(); prep(); }); };
  }

  return { title, prep, showEnd, hide };
})();

UI.title();
