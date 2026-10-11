// ORDVÆRKET — game data: weapons, passives, heroes, seals, workshop upgrades

const WEAPONS = {
  fjer: {
    name: 'Fjerpennen', icon: '🪶', color: '#7fd8ff',
    new: 'Skyder blæk mod den nærmeste fjende.',
    lv: [
      { n: 1, dmg: 14, cd: 0.75, pierce: 1 },
      { n: 2, dmg: 14, cd: 0.70, pierce: 1 },
      { n: 2, dmg: 21, cd: 0.65, pierce: 1 },
      { n: 3, dmg: 22, cd: 0.60, pierce: 2 },
      { n: 4, dmg: 30, cd: 0.50, pierce: 2 },
    ],
    up: ['', '+1 pil', '+50% skade', '+1 pil · gennemborer', '+1 pil · hurtigere · +skade'],
  },
  klokke: {
    name: 'Klokken', icon: '🔔', color: '#ffd36b',
    new: 'Ringer og sender en bølge rundt om dig.',
    lv: [
      { r: 90, dmg: 18, cd: 2.0 },
      { r: 100, dmg: 18, cd: 2.2 },
      { r: 115, dmg: 24, cd: 2.0 },
      { r: 130, dmg: 30, cd: 1.8 },
      { r: 155, dmg: 42, cd: 1.5 },
    ],
    up: ['', 'Større bølge · +skade', 'Større bølge · +skade', 'Større · hurtigere', 'Kæmpe bølge · +40% skade'],
  },
  pendul: {
    name: 'Pendulet', icon: '🌀', color: '#b892ff',
    new: 'Messingkugler kredser rundt om dig.',
    lv: [
      { n: 2, dmg: 11, rad: 64, spd: 2.8 },
      { n: 2, dmg: 11, rad: 70, spd: 3.0 },
      { n: 3, dmg: 13, rad: 76, spd: 3.2 },
      { n: 3, dmg: 16, rad: 86, spd: 3.5 },
      { n: 4, dmg: 21, rad: 94, spd: 3.9 },
    ],
    up: ['', '+skade · større', '+1 kugle', '+skade · hurtigere', '+1 kugle · +skade'],
  },
  lyn: {
    name: 'Stjernelyn', icon: '⚡', color: '#9fe7ff',
    new: 'Lyn fra stjernerne rammer tilfældige fjender.',
    lv: [
      { n: 1, dmg: 26, cd: 1.3 },
      { n: 2, dmg: 28, cd: 1.5 },
      { n: 2, dmg: 36, cd: 1.4 },
      { n: 3, dmg: 42, cd: 1.25 },
      { n: 4, dmg: 56, cd: 1.1 },
    ],
    up: ['', '+1 lyn', '+skade', '+1 lyn · hurtigere', '+1 lyn · +skade'],
  },
  hjul: {
    name: 'Tandhjulet', icon: '⚙️', color: '#e0a94a',
    new: 'Tandhjul hopper rundt på skærmen.',
    lv: [
      { n: 1, dmg: 16, dur: 3.5, cd: 2.8 },
      { n: 1, dmg: 19, dur: 3.5, cd: 3.0 },
      { n: 2, dmg: 20, dur: 3.5, cd: 2.8 },
      { n: 2, dmg: 27, dur: 4.0, cd: 2.6 },
      { n: 3, dmg: 31, dur: 4.5, cd: 2.4 },
    ],
    up: ['', '+skade · længere', '+1 tandhjul', '+skade · længere', '+1 tandhjul · +skade'],
  },
  pool: {
    name: 'Blækpølen', icon: '💧', color: '#5a7dff',
    new: 'Efterlader pøler af blæk, der skader og bremser.',
    lv: [
      { n: 1, dmg: 5, r: 46, dur: 3.0, cd: 3.6 },
      { n: 1, dmg: 7, r: 52, dur: 3.5, cd: 3.4 },
      { n: 2, dmg: 8, r: 56, dur: 3.5, cd: 3.2 },
      { n: 2, dmg: 10, r: 62, dur: 4.0, cd: 3.0 },
      { n: 3, dmg: 13, r: 70, dur: 4.5, cd: 2.6 },
    ],
    up: ['', '+skade · større', '+1 pøl', '+skade · større', '+1 pøl · +skade'],
  },
};

const PASSIVES = {
  stoevler: { name: 'Støvlerne', icon: '👢', desc: '+10% fart' },
  brille:   { name: 'Brillerne', icon: '👓', desc: '+25% rækkevidde (XP)' },
  hjerte:   { name: 'Hjertet',   icon: '❤️', desc: '+20 max liv · helbred 20' },
  timeglas: { name: 'Timeglasset', icon: '⏳', desc: '−8% ventetid på våben' },
  kraft:    { name: 'Krafthandsken', icon: '🧤', desc: '+12% skade' },
  lykke:    { name: 'Firkløveret', icon: '🍀', desc: '+12% chips på sætninger' },
};

const HEROES = {
  kronik: {
    name: 'Krønikeskriveren', icon: '📜', weapon: 'fjer', cost: 0,
    focus: ['datid'], perk: '+30% chips på datid · flere datid-sætninger',
  },
  herold: {
    name: 'Herolden', icon: '📯', weapon: 'klokke', cost: 150,
    focus: ['inv', 'konj', 'adv'], perk: '+2 mult på ordstilling · flere V2-sætninger',
  },
  tid: {
    name: 'Tidsvogteren', icon: '⏳', weapon: 'pendul', cost: 250,
    focus: ['tid'], perk: '+2 mult på tid · større PERFEKT-vindue',
  },
  kraemmer: {
    name: 'Kræmmeren', icon: '⚖️', weapon: 'hjul', cost: 350,
    focus: ['sted', 'mad', 'job', 'toej', 'ting'], perk: '+1 mult på ordforråd · +25% blæk',
  },
  diplomat: {
    name: 'Diplomaten', icon: '🕊️', weapon: 'lyn', cost: 450,
    focus: ['chunk', 'pron', 'adj'], perk: '+3 mult på chunks, pronominer og personlighed',
  },
};

// Seals = Balatro-style jokers. Found in elite chests (permanent unlock), equipped before a run.
const SEALS = {
  s_oere:    { name: 'Øret', icon: '👂', desc: 'Hvert ord bliver læst højt. +15 chips pr. sætning.' },
  s_hjerte:  { name: 'Stålhjertet', icon: '🛡️', desc: '+40 max liv.' },
  s_v2:      { name: 'V2-seglet', icon: '2️⃣', desc: '×1,5 mult på inversion, konjunktioner og adverbier.' },
  s_kronik:  { name: 'Krønikens segl', icon: '📜', desc: '+40 chips på datid-sætninger.' },
  s_ur:      { name: 'Urværkets segl', icon: '🕰️', desc: '×1,5 mult på tid. PERFEKT-vinduet +30%.' },
  s_navn:    { name: 'Navngiverens segl', icon: '🏷️', desc: '×1,5 mult på ordforråd (steder, mad, job, tøj, ting).' },
  s_chunk:   { name: 'Klumpen', icon: '🧩', desc: '+3 mult på chunks og personlighed.' },
  s_taal:    { name: 'Tålmodighed', icon: '🧘', desc: 'Første fejl i hver sætning bryder ikke kæden.' },
  s_perfekt: { name: 'Perfektionisten', icon: '💎', desc: 'PERFEKT giver ×3 i stedet for ×2.' },
  s_ekko:    { name: 'Ekkoet', icon: '🔁', desc: 'Hver besværgelse gentages med 50% kraft.' },
  s_magnet:  { name: 'Magneten', icon: '🧲', desc: '+60% rækkevidde for XP.' },
  s_guld:    { name: 'Blækhornet', icon: '🖋️', desc: '+30% blæk efter turen.' },
  s_parer:   { name: 'Spejlskjoldet', icon: '🪞', desc: 'PARÉR-vinduet +60%. Kontra gør dobbelt skade.' },
  s_kaede:   { name: 'Kædesmeden', icon: '⛓️', desc: '+1 mult for hver 3. ord i kæden (i stedet for 5.).' },
  s_heal:    { name: 'Urtehaven', icon: '🌿', desc: 'Hver sætning helbreder 5 liv.' },
  s_fejl:    { name: 'Fejlfinderen', icon: '🔎', desc: 'Kister fra fejl-eliter giver 4 segl at vælge imellem og +40 blæk.' },
  s_pron:    { name: 'Spejlet', icon: '🪟', desc: '×1,5 mult på pronominer og min/mit/mine.' },
  s_storm:   { name: 'Stormklokken', icon: '🌩️', desc: 'Besværgelser rammer hele skærmen og bedøver fjender.' },
};

const UPGRADES = [
  { id: 'hjerte', name: 'Hjerte', icon: '❤️', desc: '+10 max liv', max: 5, cost: l => 40 + l * 45 },
  { id: 'kraft', name: 'Kraft', icon: '💪', desc: '+8% skade', max: 5, cost: l => 50 + l * 55 },
  { id: 'fart', name: 'Fart', icon: '👢', desc: '+5% fart', max: 5, cost: l => 40 + l * 40 },
  { id: 'magnet', name: 'Magnet', icon: '🧲', desc: '+15% XP-rækkevidde', max: 5, cost: l => 30 + l * 35 },
  { id: 'visdom', name: 'Visdom', icon: '🦉', desc: '+8% XP', max: 5, cost: l => 50 + l * 50 },
  { id: 'blaek', name: 'Blækhorn', icon: '🖋️', desc: '+10% blæk', max: 5, cost: l => 60 + l * 60 },
  { id: 'segl', name: 'Seglplads', icon: '🔏', desc: '+1 segl i forberedelsen', max: 3, cost: l => 150 + l * 150 },
  { id: 'omkast', name: 'Omkast', icon: '🎲', desc: '+1 omkast pr. tur', max: 3, cost: l => 80 + l * 80 },
  { id: 'liv', name: 'Andet liv', icon: '🕯️', desc: 'Rejs dig én gang pr. tur', max: 1, cost: () => 400 },
];
