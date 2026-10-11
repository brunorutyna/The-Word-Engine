// ORDVÆRKET — content
// Source: Leo Todaro's modul 2 class mails (Studieskolen, Sep–Oct 2026).
// Everything is Danish. No translations: meaning comes from context, pictures and situations,
// the way a native speaker helps a foreigner.
//
// HOW TO ADD A NEW CHAPTER
// 1. Add a district to DISTRICTS (id = next number).
// 2. Add prompts with d: <that id>. Frame syntax: words in [brackets] are gems the player collects in order.
//    x: distractor gems (wrong forms). sp: speaker, say: what they say to you, pic: emoji support.
// 3. Add quick questions (level-ups) with d: <that id>. o[0] is always the correct option.

const TAGS = {
  inv:   { name: 'Inversion',   hint: 'V2 · verbet står på plads 2', fix: 'Husk: verbet står på plads 2 — så kommer subjektet.' },
  konj:  { name: 'Konjunktioner', hint: 'og/men/så/for · fordi/for at', fix: 'Efter og/men/så/for: S–V–A. Efter fordi/da/hvis: S–A–V.' },
  adv:   { name: 'Adverbier',   hint: 'ikke · også · altid · gerne', fix: 'I hovedsætningen: ikke/også/altid står efter verbet.' },
  datid: { name: 'Datid',       hint: 'datid · -ede · -te · uregelmæssig', fix: 'Det skete i fortiden. Brug datid!' },
  tid:   { name: 'Tid',         hint: 'i · for … siden · om · siden', fix: 'for … siden = hvornår · i = hvor længe · om = fremtid' },
  sted:  { name: 'Steder',      hint: 'et sted, hvor man …', fix: 'Se på billedet. Hvor kan man gøre det?' },
  mad:   { name: 'Mad',         hint: 'en/et · flertal · adjektiv', fix: 'Se på billedet — en eller et? En eller flere?' },
  job:   { name: 'Job',         hint: 'gæt jobbet', fix: 'Hvad laver personen? Se på billedet.' },
  adj:   { name: 'Personlighed', hint: 'adjektiver om personer', fix: 'Hvordan er personen? Lyt til historien.' },
  pron:  { name: 'Pronominer',  hint: 'ham · hende · den · det · dem · sin', fix: 'Hvem eller hvad taler vi om? n-ord, t-ord, flertal?' },
  chunk: { name: 'Chunks',      hint: 'faste udtryk', fix: 'Det er et fast udtryk — husk det som en helhed.' },
  toej:  { name: 'Tøj & farver', hint: 'tøj · farver · -t · -e', fix: 'n-ord, t-ord eller flertal? Adjektivet skal passe.' },
  ting:  { name: 'Hverdagsting', hint: 'min/mit/mine', fix: 'min (n-ord) · mit (t-ord) · mine (flertal)' },
};

const DISTRICTS = [
  { id: 1, name: 'Torvet', kap: 'Kapitel 1',
    sub: 'Butikker · datid · tid · ordstilling',
    tint: '#e0a94a', ground: ['#231b14', '#2c2219', '#1d1610'],
    boss: { name: 'Urmageren', icon: '🕰️', taunt: '»Tik-tak, lille udlænding! Din tid er gået!«', color: '#e0a94a' } },
  { id: 2, name: 'Lavsgården', kap: 'Kapitel 2',
    sub: 'Job · personlighed · pronominer · chunks',
    tint: '#6fb7d6', ground: ['#141c22', '#19232b', '#10171c'],
    boss: { name: 'Lavsmesteren', icon: '⚒️', taunt: '»Hvad laver du her? Hvad er dit job?!«', color: '#6fb7d6' } },
  { id: 3, name: 'Skrædderstræde', kap: 'Kapitel 3',
    sub: 'Tøj · farver · hverdagsting',
    tint: '#c47ad6', ground: ['#1d1422', '#24192b', '#170f1b'],
    boss: { name: 'Den Grå Væver', icon: '🕸️', taunt: '»Jeg væver dine ord ind i grå tråd …«', color: '#b9a8c9' } },
];

// ---------------------------------------------------------------------------
// WORD-GEM PROMPTS (the heart of a run)
// ---------------------------------------------------------------------------
const PROMPTS = [
  // ===== DISTRICT 1 — TORVET (Kapitel 1) =====
  // inversion
  { d:1, t:'inv', sp:'👴 Holger', say:'Jeg kommer fra Sicilien. Hvad lavede du, da du boede i Rom?', pic:'⚽', f:'Da jeg boede i Rom, [så] [jeg] fodbold hver søndag.', x:['ser'] },
  { d:1, t:'inv', sp:'🧑‍🍳 Mette', say:'Hvad laver du om morgenen?', pic:'☕', f:'Om morgenen [drikker] [jeg] altid kaffe.', x:['drik'] },
  { d:1, t:'inv', sp:'🧑‍🍳 Mette', say:'Hvad lavede du i går morges?', pic:'🍳', f:'I går [spiste] [jeg] morgenmad med min kæreste.', x:['spisede'] },
  { d:1, t:'inv', sp:'🧕 Amira', say:'Hvad gør du efter arbejde?', pic:'🛒', f:'Efter arbejde [køber] [jeg] som regel ind.', x:['køb'] },
  { d:1, t:'inv', sp:'🧕 Amira', say:'Hvornår går du til dansk om lørdagen?', pic:'🕘', f:'Klokken ni [går] [jeg] til dansk.', x:['gå'] },
  { d:1, t:'inv', sp:'👴 Holger', say:'Hvor boede du, før du kom til Danmark?', pic:'🏙️🏙️', f:'Før jeg kom til Danmark, [boede] [jeg] i fire forskellige byer.', x:['bode','bor'] },
  { d:1, t:'inv', sp:'👧 Sofie', say:'Hvad gør du, hvis det regner?', pic:'🌧️🏠', f:'Hvis det regner, [bliver] [jeg] hjemme.', x:['blive'] },
  { d:1, t:'inv', sp:'👴 Holger', say:'Hvornår mødte du din mand?', pic:'💍🎓', f:'I 2017 [mødte] [jeg] min mand på universitetet.', x:['møder','mødt'] },
  { d:1, t:'inv', sp:'🧕 Amira', say:'Hvad skete der, da I flyttede til New York?', pic:'🗽😷', f:'Da vi flyttede til New York, [begyndte] [pandemien].', x:['begynte'] },
  { d:1, t:'inv', sp:'👴 Holger', say:'Hvad lavede du i din fritid?', pic:'🎲', f:'I min fritid [spillede] [jeg] brætspil.', x:['spillete'] },
  // datid
  { d:1, t:'datid', sp:'🧑‍🍳 Mette', say:'Fortæl om din morgen.', pic:'☕🚲', f:'Jeg [drak] en kop kaffe, og så [tog] jeg af sted.', x:['drikkede','tager'] },
  { d:1, t:'datid', sp:'👴 Holger', say:'Hvordan mødte de hinanden?', pic:'💃🕺', f:'De [mødtes] til en fest, og de [dansede] hele natten.', x:['mødte','danser'] },
  { d:1, t:'datid', sp:'👴 Holger', say:'Og hvad skete der så?', pic:'🏠💑', f:'De [flyttede] sammen, og et år efter [blev] de gift.', x:['flytte','blivede'] },
  { d:1, t:'datid', sp:'🧕 Amira', say:'Hvordan var det at bo i Sverige?', pic:'🇸🇪', f:'Jeg [kendte] ikke landet, og jeg [kunne] ikke tale svensk.', x:['kende','kunde'] },
  { d:1, t:'datid', sp:'🧕 Amira', say:'Hvordan var dit første job?', pic:'✈️🏨', f:'Jeg [rejste] meget, og jeg [sov] tit på hotellet.', x:['rejsede','sovede'] },
  { d:1, t:'datid', sp:'👧 Sofie', say:'Hvad lavede du som ung?', pic:'🎤', f:'Jeg [sang] i et kor, og jeg [spillede] fodbold.', x:['syngede','spillete'] },
  { d:1, t:'datid', sp:'🧑‍🍳 Mette', say:'Hvad spiste I i Italien?', pic:'🍝', f:'Vi [spiste] på mange restauranter.', x:['spisede','spist'] },
  { d:1, t:'datid', sp:'👴 Holger', say:'Hvad lavede du i går aftes?', pic:'📺', f:'Vi [så] tv, og klokken elleve [gik] vi i seng.', x:['ser','gåede'] },
  // tid
  { d:1, t:'tid', sp:'🧕 Amira', say:'Hvornår flyttede du hertil?', pic:'📦', f:'Jeg flyttede hertil [for] et halvt år [siden].', x:['i','om'] },
  { d:1, t:'tid', sp:'🧕 Amira', say:'Hvor længe har du boet her?', pic:'🏠', f:'Jeg har boet her [i] to år.', x:['for','om','siden'] },
  { d:1, t:'tid', sp:'👴 Holger', say:'Hvornår skal du tilbage til Canada?', pic:'✈️', f:'Jeg skal tilbage [om] et års tid.', x:['i','for'] },
  { d:1, t:'tid', sp:'👧 Sofie', say:'Hvornår regner det meget?', pic:'🌧️', f:'[Om] vinteren [regner] [det] meget i Danmark.', x:['I','regne'] },
  { d:1, t:'tid', sp:'🧑‍🍳 Mette', say:'Hvornår slutter din kontrakt?', pic:'📄', f:'Min kontrakt udløber [om] et år.', x:['i','for'] },
  { d:1, t:'tid', sp:'🧕 Amira', say:'Hvor længe har du gået til dansk?', pic:'📚', f:'Jeg har gået til dansk [i] fem måneder.', x:['for','siden'] },
  { d:1, t:'tid', sp:'👴 Holger', say:'Hvornår kom du til København?', pic:'🚆', f:'Jeg kom til København [i] 2024.', x:['siden','for'] },
  { d:1, t:'tid', sp:'🧕 Amira', say:'Hvor længe boede din søster hos jer?', pic:'👩🧳', f:'Min søster boede hos os [i] elleve måneder.', x:['for','om'] },
  { d:1, t:'tid', sp:'👴 Holger', say:'Hvor længe har du boet i Danmark?', pic:'🇩🇰', f:'Jeg har boet i Danmark [siden] 2024.', x:['for','om'] },
  // konjunktioner
  { d:1, t:'konj', sp:'💂 Vægteren', say:'Du ser træt ud. Hvorfor?', pic:'😴', f:'Jeg er træt, [fordi] [jeg] [altid] [arbejder] om lørdagen.', x:['for at'] },
  { d:1, t:'konj', sp:'💂 Vægteren', say:'Er du træt?', pic:'🌅', f:'Jeg var tidligt oppe, men [jeg] [er] [ikke] træt.', x:['var'] },
  { d:1, t:'konj', sp:'🧑‍🍳 Mette', say:'Du gaber! Er du træt?', pic:'😪', f:'Ja, jeg er ret træt, [for] jeg sov kun fire timer i nat.', x:['fordi','for at'] },
  { d:1, t:'konj', sp:'👴 Holger', say:'Hvorfor går du til dansk?', pic:'🎓', f:'Jeg går til dansk [for at] lære sproget.', x:['fordi','på grund af'] },
  { d:1, t:'konj', sp:'💂 Vægteren', say:'Hvorfor kom du for sent?', pic:'🚆❄️', f:'Toget var forsinket [på grund af] sneen.', x:['fordi','for at'] },
  { d:1, t:'konj', sp:'🧕 Amira', say:'Hvorfor flyttede du tilbage?', pic:'🏠', f:'Det var en svær tid, så [jeg] [kom] tilbage til Lissabon.', x:['kommer'] },
  { d:1, t:'konj', sp:'🧕 Amira', say:'Arbejdede du der længe?', pic:'💸', f:'Lønnen var ikke så god, så [jeg] [arbejdede] der kun i seks måneder.', x:['arbejde'] },
  // adverbier
  { d:1, t:'adv', sp:'👧 Sofie', say:'Cyklede du meget?', pic:'🚲', f:'Jeg havde en cykel, men [jeg] [cyklede] [ikke] ofte.', x:['cykler'] },
  { d:1, t:'adv', sp:'👴 Holger', say:'Du lærte tysk. Hvad mere?', pic:'🇬🇧', f:'Jeg [lærte] [også] engelsk.', x:['lærede'] },
  { d:1, t:'adv', sp:'🧑‍🍳 Mette', say:'Arbejder du om søndagen?', pic:'📅', f:'Nej, jeg [arbejder] [ikke] om søndagen.', x:['arbejdede'] },
  { d:1, t:'adv', sp:'🧕 Amira', say:'Hvorfor flyttede du til Danmark?', pic:'❤️', f:'Jeg flyttede, fordi jeg [gerne] [ville] bo sammen med ham.', x:['vil'] },
  { d:1, t:'adv', sp:'👴 Holger', say:'Spiser du morgenmad?', pic:'🥣', f:'Jeg [spiser] [aldrig] morgenmad.', x:['spist'] },
  // steder
  { d:1, t:'sted', sp:'💂 Vægteren', say:'Du har ondt i hovedet? Du skal købe medicin.', pic:'💊', f:'Gå hen til [apoteket] på hjørnet.', x:['bageriet','slagteren'] },
  { d:1, t:'sted', sp:'💂 Vægteren', say:'Du vil købe brød og kager?', pic:'🥐🍰', f:'Så skal du gå til [bageriet].', x:['apoteket','banken'] },
  { d:1, t:'sted', sp:'💂 Vægteren', say:'Du skal købe kød til i aften?', pic:'🥩', f:'Så skal du gå til [slagteren].', x:['bageren','frisøren'] },
  { d:1, t:'sted', sp:'👧 Sofie', say:'Min cykel er gået i stykker!', pic:'🚲🔧', f:'Gå hen til [cykelhandleren].', x:['grønthandleren','blomsterhandleren'] },
  { d:1, t:'sted', sp:'👧 Sofie', say:'Hvor kan jeg lege udendørs?', pic:'🛝', f:'På [legepladsen] i parken.', x:['svømmehallen','stationen'] },
  { d:1, t:'sted', sp:'👧 Sofie', say:'Jeg vil gerne svømme, men det er koldt udenfor.', pic:'🏊', f:'Så kan du gå i [svømmehallen].', x:['kirken','legepladsen'] },
  { d:1, t:'sted', sp:'🧕 Amira', say:'Hvor er de små børn, mens forældrene arbejder?', pic:'🧸', f:'De er i [børnehaven].', x:['banken','kirken'] },
  { d:1, t:'sted', sp:'💂 Vægteren', say:'Hvor kan man tage toget?', pic:'🚉', f:'Man kan tage toget fra [stationen].', x:['hotellet','apoteket'] },
  { d:1, t:'sted', sp:'🧕 Amira', say:'Hvor kan man købe sneakers og støvler?', pic:'👟👢', f:'I en [skobutik].', x:['sandwichbar','grønthandler'] },
  { d:1, t:'sted', sp:'🧑‍🌾 Grønthandleren', say:'Ved du, hvad en grønthandler er?', pic:'🥬🍅', f:'Et sted, hvor man [køber] [frugt] og grøntsager.', x:['kød','købte'] },
  { d:1, t:'sted', sp:'🧕 Amira', say:'Hvad er der i dit kvarter?', pic:'🏘️🥐🛝', f:'I mit kvarter [er] [der] et bageri og en stor legeplads.', x:['har'] },
  { d:1, t:'sted', sp:'🧕 Amira', say:'Hvad kan du godt lide ved dit kvarter?', pic:'☕', f:'Jeg [kan] [godt] [lide] de hyggelige caféer.', x:['kunne'] },
  { d:1, t:'sted', sp:'🧕 Amira', say:'Er der noget, du er træt af?', pic:'🚗💨', f:'Jeg er [træt] [af] al trafikken.', x:['på','for'] },
  { d:1, t:'sted', sp:'💂 Vægteren', say:'Hvor kan man bo, når man er på ferie?', pic:'🧳🛏️', f:'Man kan bo på et [hotel].', x:['apotek','bibliotek'] },
  // mad
  { d:1, t:'mad', sp:'🧑‍🌾 Grønthandleren', say:'Hej, hej! Hvad skal det være?', pic:'🍎🍎🍎', f:'Jeg vil gerne have tre [røde] [æbler].', x:['rød','rødt','æble'] },
  { d:1, t:'mad', sp:'🧑‍🍳 Mette', say:'Godmorgen! Hvad må det være?', pic:'🍞🥯🥯', f:'Jeg vil gerne have [et] [rugbrød] og to [boller].', x:['en','bolle'] },
  { d:1, t:'mad', sp:'🥩 Slagter Bent', say:'Hvad skal du bruge i dag?', pic:'🍗', f:'Jeg skal bruge [en] [kylling] til i aften.', x:['et','kyllingen'] },
  { d:1, t:'mad', sp:'🧑‍🍳 Mette', say:'Vil du have noget at drikke?', pic:'🥛', f:'Ja tak, [et] [stort] glas mælk.', x:['en','stor'] },
  { d:1, t:'mad', sp:'🧑‍🌾 Grønthandleren', say:'Hvad kan man købe hos mig?', pic:'🍌🥕🥬', f:'Man kan købe [bananer], [gulerødder] og salat.', x:['banan','gulerod'] },

  // ===== DISTRICT 2 — LAVSGÅRDEN (Kapitel 2) =====
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han slukker ild og redder mennesker.', pic:'🔥🚒', f:'Han er [brandmand], og han arbejder på [en] [brandstation].', x:['frisør','et'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Hun klipper hår.', pic:'✂️💇', f:'Hun er [frisør], og hun har [sin] egen salon.', x:['tømrer','hendes'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han tegner huse og bygninger.', pic:'📐🏛️', f:'Han er [arkitekt].', x:['murer','fotograf'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Hun hjælper syge dyr.', pic:'🐕🩺', f:'Hun er [dyrlæge].', x:['læge','landmand'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han bringer post og pakker.', pic:'📬📦', f:'Han er [postbud].', x:['steward','tømrer'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han laver møbler af træ.', pic:'🪚🪑', f:'Han er [tømrer].', x:['murer','gartner'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Hun skriver artikler og laver interviews.', pic:'📰🎤', f:'Hun er [journalist].', x:['sekretær','lærer'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han reparerer computere.', pic:'💻🔧', f:'Han er [IT-tekniker].', x:['elektriker','barista'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Hun sælger blomster og passer butikken.', pic:'💐', f:'Hun er [blomsterhandler].', x:['gartner','frisør'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han laver kaffe og cappuccino.', pic:'☕', f:'Han er [barista], og han arbejder på [en] [café].', x:['et','kok'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han arbejder i en børnehave.', pic:'🧸👶', f:'Han er [pædagog].', x:['lærer','sygeplejerske'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Hun undersøger patienter og giver medicin.', pic:'🩺🏥', f:'Hun er [læge].', x:['dyrlæge','frisør'] },
  { d:2, t:'job', sp:'🧑‍🔧 Ali', say:'Gæt jobbet! Han bygger vægge med mursten.', pic:'🧱', f:'Han er [murer].', x:['tømrer','maler'] },
  // chunks & empati
  { d:2, t:'chunk', sp:'👩‍💼 Sara', say:'Hvad kunne du godt tænke dig at være?', pic:'📷', f:'Jeg kunne godt [tænke] [mig] at være fotograf, [fordi] jeg godt kan lide at tage billeder.', x:['tænker','for at'] },
  { d:2, t:'chunk', sp:'👩‍💼 Sara', say:'Hvad laver du for tiden?', pic:'📚', f:'Jeg er [i] [gang] [med] en ny uddannelse.', x:['på','gå'] },
  { d:2, t:'chunk', sp:'👩‍💼 Sara', say:'Cykler du på arbejde?', pic:'🚲☔', f:'Det [kommer] [an] [på] vejret.', x:['af','går'] },
  { d:2, t:'chunk', sp:'👩‍💼 Sara', say:'Jeg har lige fået nyt job!', pic:'🎉', f:'Tillykke! Det [lyder] [spændende]!', x:['ser','spændt'] },
  { d:2, t:'chunk', sp:'👩‍💼 Sara', say:'Jeg er så træt. Min baby sov ikke i nat.', pic:'👶🌙', f:'Åh, det kan jeg godt [forstå].', x:['forstår','vide'] },
  { d:2, t:'chunk', sp:'🧑‍🔧 Ali', say:'Mandage er altid så lange …', pic:'😩', f:'Ja, det [kender] [jeg] godt!', x:['ved'] },
  { d:2, t:'chunk', sp:'🧑‍🔧 Ali', say:'Hav en god weekend!', pic:'👋', f:'Tak, [i] [lige] [måde]!', x:['samme','også'] },
  { d:2, t:'chunk', sp:'👩‍💼 Sara', say:'Jeg kommer fra Sicilien.', pic:'🌍', f:'Jeg kommer fra Brasilien. Hvad [med] [dig]?', x:['om','du'] },
  { d:2, t:'chunk', sp:'👩‍💼 Sara', say:'Jeg skal flytte til Aarhus.', pic:'📦🚚', f:'Nåh, ja? Hvornår [skal] [du] flytte?', x:['flytter'] },
  // personlighed
  { d:2, t:'adj', sp:'👩‍💼 Sara', say:'Min kollega hilser kun på mig en gang imellem.', pic:'😒', f:'Hun er [lunefuld] og lidt [irriterende].', x:['empatisk','hjælpsom'] },
  { d:2, t:'adj', sp:'👩‍💼 Sara', say:'Min chef er meget forstående og lyttende.', pic:'🤗', f:'Hun er [sød] og [empatisk].', x:['doven','lunefuld'] },
  { d:2, t:'adj', sp:'🧑‍🔧 Ali', say:'Min ven kommer altid for sent og glemmer vores aftaler.', pic:'⏰❓', f:'Han er [glemsom] og [forvirret].', x:['punktlig','tålmodig'] },
  { d:2, t:'adj', sp:'🧑‍🔧 Ali', say:'Hun hjælper altid sine kolleger.', pic:'🤝', f:'Hun er meget [hjælpsom].', x:['doven','sur'] },
  { d:2, t:'adj', sp:'👩‍💼 Sara', say:'Han siger næsten ingenting til fester.', pic:'🙈', f:'Han er lidt [genert].', x:['snakkesalig','sjov'] },
  { d:2, t:'adj', sp:'🧑‍🔧 Ali', say:'Han fortæller jokes hele tiden, og han snakker meget.', pic:'😂', f:'Han er [sjov] og [snakkesalig].', x:['genert','stille'] },
  { d:2, t:'adj', sp:'👩‍💼 Sara', say:'Hun bliver aldrig sur, når bussen er forsinket.', pic:'🚌⌛', f:'Hun er meget [tålmodig].', x:['utålmodig','lunefuld'] },
  // pronominer
  { d:2, t:'pron', sp:'🧑‍🔧 Ali', say:'Kender du Peter?', pic:'🧔', f:'Ja, jeg kender [ham] godt.', x:['han','hans'] },
  { d:2, t:'pron', sp:'🧑‍🔧 Ali', say:'Kan du lide Maria?', pic:'👩', f:'Ja, jeg kan godt lide [hende].', x:['hun','hendes'] },
  { d:2, t:'pron', sp:'👩‍💼 Sara', say:'Har du set min jakke?', pic:'🧥', f:'Ja, [den] hænger på stolen.', x:['det','dem'] },
  { d:2, t:'pron', sp:'👩‍💼 Sara', say:'Hvor er mine nøgler?', pic:'🔑🔑', f:'Jeg så [dem] på bordet.', x:['de','den'] },
  { d:2, t:'pron', sp:'🧑‍🔧 Ali', say:'Hvor er brødet?', pic:'🍞', f:'[Det] ligger i køkkenet.', x:['Den','Han'] },
  { d:2, t:'pron', sp:'👩‍💼 Sara', say:'Hvem bor Jonas sammen med?', pic:'👨‍👩‍👦', f:'Jonas bor sammen med [sine] forældre.', x:['hans','sin'] },
  { d:2, t:'pron', sp:'👩‍💼 Sara', say:'Hvorfor er Anna sur?', pic:'🚲❓', f:'Anna kan ikke finde [sin] cykel.', x:['hendes','sit'] },
  { d:2, t:'pron', sp:'🧑‍🔧 Ali', say:'Hvad lavede Peter i weekenden?', pic:'🚆👬', f:'Peter besøgte [sin] bror. [Hans] bror bor i Aarhus.', x:['hans','Sin'] },
  { d:2, t:'pron', sp:'👩‍💼 Sara', say:'Hvordan er dit nye job?', pic:'💼😊', f:'Jeg er glad for [mit] [nye] job.', x:['min','nyt'] },
  { d:2, t:'pron', sp:'🧑‍🔧 Ali', say:'Hvornår kom jeres børn?', pic:'👶👶', f:'Vores første barn kom i 2018, og vores [andet] [barn] kom i 2020.', x:['anden','børn'] },
  { d:2, t:'pron', sp:'👩‍💼 Sara', say:'Hvor bor Anna?', pic:'💑', f:'Anna og [hendes] kæreste bor på Nørrebro.', x:['sin','hende'] },

  // ===== DISTRICT 3 — SKRÆDDERSTRÆDE (Kapitel 3) =====
  { d:3, t:'toej', sp:'🌦️ Vejrmanden', say:'Det regner meget i dag.', pic:'🌧️', f:'Husk din [regnjakke] og dine [gummistøvler]!', x:['solbriller','sandaler'] },
  { d:3, t:'toej', sp:'🌦️ Vejrmanden', say:'Brr! Det er koldt udenfor.', pic:'🥶', f:'Tag [en] [varm] [trøje] på.', x:['et','varmt'] },
  { d:3, t:'toej', sp:'🌦️ Vejrmanden', say:'Solen skinner!', pic:'☀️😎', f:'Jeg tager [mine] [solbriller] med.', x:['min','regnjakke'] },
  { d:3, t:'toej', sp:'🧵 Skrædder Ib', say:'Hvad har du købt?', pic:'🟥👕', f:'Jeg har købt en [rød] t-shirt.', x:['rødt','røde'] },
  { d:3, t:'toej', sp:'🧒 Malte', say:'Hvor bor dine venner?', pic:'🟨🏠', f:'De bor i et [gult] hus.', x:['gul','gule'] },
  { d:3, t:'toej', sp:'👗 Lene', say:'Hvilke sko vil du have?', pic:'⬜👟', f:'Jeg vil gerne have de [hvide] sko.', x:['hvid','hvidt'] },
  { d:3, t:'toej', sp:'👗 Lene', say:'Hvilken jakke kan du bedst lide?', pic:'🟦🧥', f:'Jeg kan bedst lide den [blå] jakke.', x:['blåt','blåe'] },
  { d:3, t:'toej', sp:'🧒 Malte', say:'Hvad har din søster på?', pic:'🟩👗', f:'Hun har en [grøn] kjole på.', x:['grønt','grønne'] },
  { d:3, t:'toej', sp:'🧵 Skrædder Ib', say:'Føl på halstørklædet!', pic:'🧣', f:'Halstørklædet er [blødt] og [varmt].', x:['blød','varme'] },
  { d:3, t:'toej', sp:'👗 Lene', say:'Hej! Kan jeg hjælpe dig?', pic:'👗🎉', f:'Ja tak, jeg leder [efter] [en] [kjole] til en fest.', x:['på','et'] },
  { d:3, t:'toej', sp:'👗 Lene', say:'Passer den?', pic:'📏', f:'Nej, den er for [lille]. Har I [den] i en større størrelse?', x:['små','det'] },
  { d:3, t:'toej', sp:'👗 Lene', say:'Kan du lide de bukser?', pic:'👖', f:'Ja! Hvad koster [de]?', x:['den','det'] },
  { d:3, t:'toej', sp:'🧵 Skrædder Ib', say:'Se min nye frakke!', pic:'🧥✨', f:'Hvor har du købt [den] [flotte] frakke?', x:['det','flot'] },
  { d:3, t:'ting', sp:'🧒 Malte', say:'Hvad har du i tasken?', pic:'🔑📱👛', f:'Jeg har [mine] [nøgler], [min] telefon og en pung.', x:['mit','nøglerne'] },
  { d:3, t:'ting', sp:'🌦️ Vejrmanden', say:'Har du en paraply?', pic:'☂️🏠', f:'Nej, jeg har glemt [min] [paraply] derhjemme.', x:['mit','paraplyen'] },
  { d:3, t:'ting', sp:'🧒 Malte', say:'Hvad er klokken?', pic:'⌚❓', f:'Det ved jeg ikke. Jeg har glemt [mit] [ur].', x:['min','uret'] },
  { d:3, t:'ting', sp:'🧒 Malte', say:'Hvor er dine briller?', pic:'👓', f:'[De] ligger på [bordet].', x:['Den','bord'] },
  { d:3, t:'ting', sp:'🧒 Malte', say:'Hvad skal du have med på ferie?', pic:'🪥🧳', f:'Jeg skal have [en] [tandbørste], et håndklæde og min oplader med.', x:['tandbørsten'] },
  { d:3, t:'ting', sp:'🧵 Skrædder Ib', say:'Hvad mangler du?', pic:'✂️🪡', f:'Jeg mangler [en] [saks] og [nål] og tråd.', x:['et','saksen'] },
  { d:3, t:'datid', sp:'🧒 Malte', say:'Hvad havde du på i går?', pic:'👔', f:'I går [havde] [jeg] en blå skjorte på.', x:['har'] },
  { d:3, t:'inv', sp:'👗 Lene', say:'Hvornår køber du nyt tøj?', pic:'🌸🛍️', f:'Om foråret [køber] [jeg] som regel nyt tøj.', x:['købe'] },
  { d:3, t:'datid', sp:'👗 Lene', say:'Hvad købte du i weekenden?', pic:'🛍️', f:'Jeg [købte] et par bukser, men de [var] for store.', x:['købede','er'] },
];

// ---------------------------------------------------------------------------
// LEVEL-UP QUESTIONS (one tap; o[0] is correct; ___ marks the gap)
// ---------------------------------------------------------------------------
const QUICK = [
  // datid
  { d:1, t:'datid', q:'I går ___ jeg til yoga.', o:['gik','gå','gåede'], pic:'🧘' },
  { d:1, t:'datid', q:'Sidste år ___ vi til Spanien.', o:['rejste','rejsede','rejser'], pic:'✈️' },
  { d:1, t:'datid', q:'Da jeg var barn, ___ jeg i en lille by.', o:['boede','bode','bor'], pic:'🏡' },
  { d:1, t:'datid', q:'Hun ___ ikke landet.', o:['kendte','kende','kendede'] },
  { d:1, t:'datid', q:'Jeg ___ ikke tale svensk.', o:['kunne','kunde','kan'], pic:'🇸🇪' },
  { d:1, t:'datid', q:'Vi ___ på en restaurant i aftes.', o:['spiste','spisede','spiser'], pic:'🍽️' },
  { d:1, t:'datid', q:'Han ___ tit på hotellet.', o:['sov','sovede','sover'], pic:'🏨' },
  { d:1, t:'datid', q:'Jeg ___ en kop kaffe i morges.', o:['drak','drikkede','drukket'], pic:'☕' },
  { d:1, t:'datid', q:'Hvad ___ du i weekenden?', o:['lavede','lavde','laved'] },
  { d:1, t:'datid', q:'Min mor ___ mad til mig hver dag.', o:['lavede','lave','laved'], pic:'🍲' },
  { d:1, t:'datid', q:'Hun ___ i et kor i ti år.', o:['sang','syngede','sunget'], pic:'🎤' },
  { d:1, t:'datid', q:'Jeg ___ et nyt job i 2023.', o:['fik','fåede','får'], pic:'💼' },
  { d:1, t:'datid', q:'Hvornår ___ du til Danmark?', o:['kom','kommede','kommer'], pic:'🇩🇰' },
  { d:1, t:'datid', q:'De ___ gift i 2021.', o:['blev','blivede','bliver'], pic:'💍' },
  { d:1, t:'datid', q:'Vi ___ en film i biografen i går.', o:['så','seede','ser'], pic:'🎬' },
  { d:1, t:'datid', q:'Jeg ___ med min kæreste i morges.', o:['talte','talede','taler'], pic:'💬' },
  { d:1, t:'datid', q:'Jeg ___ min kone, da vi gik i gymnasiet.', o:['mødte','havde mødte','møder'], pic:'💑' },
  { d:1, t:'datid', q:'Vi ___ spillet sammen i ti år, og vi er stadig venner.', o:['har','havde','er'], pic:'🏏' },
  { d:1, t:'datid', q:'Jeg ___ boet i Danmark i to år nu.', o:['har','er','blev'], pic:'🇩🇰' },
  // tid
  { d:1, t:'tid', q:'Jeg flyttede til København ___ 2024.', o:['i','siden','for'] },
  { d:1, t:'tid', q:'Hun kom hertil ___ tre år siden.', o:['for','i','om'] },
  { d:1, t:'tid', q:'Jeg har læst dansk ___ fem måneder.', o:['i','for','om'] },
  { d:1, t:'tid', q:'Kurset slutter ___ en uge.', o:['om','i','for'] },
  { d:1, t:'tid', q:'___ sommeren bader vi i havnen.', o:['Om','I','På'], pic:'🏊☀️' },
  { d:1, t:'tid', q:'Jeg har boet her ___ 2022.', o:['siden','for','om'] },
  { d:1, t:'tid', q:'___ har du boet her? — I to år.', o:['Hvor længe','Hvornår','Hvor tit'] },
  { d:1, t:'tid', q:'___ kom du til Danmark? — For to år siden.', o:['Hvornår','Hvor længe','Hvorfor'] },
  { d:1, t:'tid', q:'Min kontrakt udløber ___ et år.', o:['om','i','for'], pic:'📄' },
  { d:1, t:'tid', q:'Jeg boede i Paris ___ et års tid.', o:['i','for','om'], pic:'🗼' },
  // inversion
  { d:1, t:'inv', q:'I 2017 ___ min mand.', o:['mødte jeg','jeg mødte','mødte'] },
  { d:1, t:'inv', q:'Da jeg boede i Paris, ___ fransk.', o:['læste jeg','jeg læste','læser jeg'], pic:'🗼' },
  { d:1, t:'inv', q:'Efter arbejde ___ som regel ind.', o:['køber jeg','jeg køber','købe jeg'], pic:'🛒' },
  { d:1, t:'inv', q:'Klokken ni ___ til dansk.', o:['går jeg','jeg går','gå jeg'], pic:'🕘' },
  { d:1, t:'inv', q:'Hvis det regner, ___ hjemme.', o:['bliver jeg','jeg bliver','bliver'], pic:'🌧️' },
  { d:1, t:'inv', q:'Bagefter ___ en øl sammen.', o:['drak vi','vi drak','vi drikkede'], pic:'🍺' },
  { d:1, t:'inv', q:'Før jeg kom til Danmark, ___ i fire byer.', o:['boede jeg','jeg boede','jeg har boet'] },
  { d:1, t:'inv', q:'Om vinteren ___ det meget.', o:['regner','det regner','regnede'], pic:'🌧️' },
  { d:1, t:'inv', q:'I min fritid ___ brætspil.', o:['spillede jeg','jeg spillede','jeg spillete'], pic:'🎲' },
  // konjunktioner
  { d:1, t:'konj', q:'Lønnen var dårlig, så ___ der kun i seks måneder.', o:['jeg arbejdede','arbejdede jeg','jeg arbejde'], pic:'💸' },
  { d:1, t:'konj', q:'Jeg havde en cykel, men ___ ikke ofte.', o:['jeg cyklede','cyklede jeg','jeg ikke cyklede'], pic:'🚲' },
  { d:1, t:'konj', q:'Det var en svær tid, så ___ tilbage til Lissabon.', o:['jeg kom','kom jeg','jeg kommer'] },
  { d:1, t:'konj', q:'Jeg lærer dansk, ___ jeg bor i Danmark.', o:['fordi','for at','på grund af'] },
  { d:1, t:'konj', q:'Jeg lærer dansk ___ få et job.', o:['for at','fordi','på grund af'], pic:'💼' },
  { d:1, t:'konj', q:'Vi blev hjemme ___ regnen.', o:['på grund af','fordi','for at'], pic:'🌧️' },
  { d:1, t:'konj', q:'Jeg er træt, fordi jeg ___ om lørdagen.', o:['altid arbejder','arbejder altid','altid arbejde'] },
  // adverbier
  { d:1, t:'adv', q:'Jeg ___ engelsk.', o:['lærte også','også lærte','lærte og'] },
  { d:1, t:'adv', q:'Hun ___ om søndagen.', o:['arbejder ikke','ikke arbejder','arbejde ikke'] },
  { d:1, t:'adv', q:'Jeg flyttede, fordi jeg ___ bo sammen med ham.', o:['gerne ville','ville gerne','gerne vil'], pic:'❤️' },
  { d:1, t:'adv', q:'Jeg ___ glad for mit nye job.', o:['var også','også var','var og'], pic:'💼' },
  { d:1, t:'adv', q:'Jeg ___ morgenmad.', o:['spiser aldrig','aldrig spiser','spiser aldrigt'], pic:'🥣' },
  // en/et, præpositioner (fra rettelserne)
  { d:1, t:'mad', q:'Jeg fik ___ job inden for nyhedsformidling.', o:['et','en','ett'], pic:'📰' },
  { d:1, t:'mad', q:'Han studerede på ___ universitet.', o:['et','en','ett'], pic:'🎓' },
  { d:1, t:'sted', q:'Han boede i en lille by tæt ___ Lissabon.', o:['på','af','ved af'] },
  { d:1, t:'sted', q:'Jeg læste ___ ingeniør.', o:['til','på','som'] },
  { d:1, t:'sted', q:'Jeg gik ___ universitetet i Firenze.', o:['på','til','i'], pic:'🎓' },
  // steder
  { d:1, t:'sted', q:'Et sted, hvor man køber medicin: ___', o:['et apotek','et bageri','en slagter'], pic:'💊' },
  { d:1, t:'sted', q:'Et sted, hvor man køber kød: ___', o:['en slagter','en grønthandler','et apotek'], pic:'🥩' },
  { d:1, t:'sted', q:'Et sted, hvor man kan svømme indendørs: ___', o:['en svømmehal','en legeplads','en station'], pic:'🏊' },
  { d:1, t:'sted', q:'Et sted, hvor de små bliver passet: ___', o:['en børnehave','et hotel','en kirke'], pic:'🧸' },
  { d:1, t:'sted', q:'Et sted med mange butikker: ___', o:['et indkøbscenter','en sandwichbar','en station'], pic:'🛍️' },
  { d:1, t:'sted', q:'Et sted, hvor man kan få hjælp med sin privatøkonomi: ___', o:['en bank','en café','et pizzeria'], pic:'🏦' },
  { d:1, t:'sted', q:'Et sted, hvor man kan købe planter: ___', o:['en blomsterhandler','en cykelhandler','en skobutik'], pic:'🌷' },
  { d:1, t:'sted', q:'Et sted, hvor man spiser et måltid lavet af en kok: ___', o:['en restaurant','et apotek','en legeplads'], pic:'🍽️' },
  // mad
  { d:1, t:'mad', q:'Jeg vil gerne have to ___ æbler.', o:['røde','rød','rødt'], pic:'🍎🍎' },
  { d:1, t:'mad', q:'Et ___ rugbrød, tak.', o:['stort','stor','store'], pic:'🍞' },
  { d:1, t:'mad', q:'Kan jeg få ___ kop kaffe?', o:['en','et','ene'], pic:'☕' },
  { d:1, t:'mad', q:'Jeg køber tre ___ hos bageren.', o:['boller','bolle','bollen'], pic:'🥯🥯🥯' },

  // ===== kapitel 2 =====
  { d:2, t:'job', q:'Hun underviser børn i skolen. Hun er ___.', o:['lærer','læge','landmand'], pic:'🏫' },
  { d:2, t:'job', q:'Han bringer post og pakker. Han er ___.', o:['postbud','tømrer','fotograf'], pic:'📬' },
  { d:2, t:'job', q:'Hun tager billeder til bryllupper. Hun er ___.', o:['fotograf','journalist','frisør'], pic:'📷💍' },
  { d:2, t:'job', q:'Han dyrker vin og arbejder på marken. Han er ___.', o:['landmand','gartner','murer'], pic:'🍇🚜' },
  { d:2, t:'job', q:'Hun hjælper passagerer i et fly. Hun er ___.', o:['stewardesse','sekretær','dyrlæge'], pic:'✈️' },
  { d:2, t:'job', q:'Han sætter lamper og stikkontakter op. Han er ___.', o:['elektriker','IT-tekniker','tømrer'], pic:'💡🔌' },
  { d:2, t:'job', q:'Hun svarer på telefonen og skriver e-mails. Hun er ___.', o:['sekretær','journalist','lærer'], pic:'📞📧' },
  { d:2, t:'job', q:'Han passer blomster og planter i haven. Han er ___.', o:['gartner','blomsterhandler','landmand'], pic:'🌿' },
  { d:2, t:'adj', q:'Han glemmer altid vores aftaler. Han er ___.', o:['glemsom','punktlig','hjælpsom'], pic:'⏰' },
  { d:2, t:'adj', q:'Hun hjælper altid sine kolleger. Hun er ___.', o:['hjælpsom','doven','sur'], pic:'🤝' },
  { d:2, t:'adj', q:'Han siger næsten ingenting til fester. Han er ___.', o:['genert','snakkesalig','arrogant'], pic:'🙈' },
  { d:2, t:'adj', q:'Hun bliver aldrig sur, når vi kommer for sent. Hun er ___.', o:['tålmodig','utålmodig','lunefuld'], pic:'⌛' },
  { d:2, t:'adj', q:'Han ligger på sofaen hele dagen. Han er ___.', o:['doven','flittig','punktlig'], pic:'🛋️' },
  { d:2, t:'adj', q:'Hun kommer altid til tiden. Hun er ___.', o:['punktlig','glemsom','forvirret'], pic:'🕐' },
  { d:2, t:'pron', q:'Ser du Maria? Ja, jeg ser ___.', o:['hende','hun','hendes'], pic:'👩' },
  { d:2, t:'pron', q:'Hvor er bøgerne? Jeg har lagt ___ på bordet.', o:['dem','de','deres'], pic:'📚' },
  { d:2, t:'pron', q:'Kan du lide huset? Ja, jeg kan godt lide ___.', o:['det','den','dem'], pic:'🏠' },
  { d:2, t:'pron', q:'Hvor er min jakke? Jeg har ___.', o:['den','det','dem'], pic:'🧥' },
  { d:2, t:'pron', q:'Peter ringede til ___ mor.', o:['sin','hans','sit'], pic:'📞' },
  { d:2, t:'pron', q:'Anna og ___ kæreste bor på Nørrebro.', o:['hendes','sin','hende'], pic:'💑' },
  { d:2, t:'pron', q:'Han bor ikke med ___ forældre.', o:['sine','hans','sin'], pic:'👨‍👩‍👦' },
  { d:2, t:'pron', q:'Har du talt med Jonas? Ja, jeg talte med ___ i går.', o:['ham','han','hans'], pic:'🧔' },
  { d:2, t:'pron', q:'Vores ___ barn kom i 2020.', o:['andet','anden','andre'], pic:'👶' },
  { d:2, t:'pron', q:'Jeg er glad for ___ nye job.', o:['mit','min','mine'], pic:'💼' },
  { d:2, t:'chunk', q:'Hav en god weekend! — Tak, i ___ måde!', o:['lige','samme','god'], pic:'👋' },
  { d:2, t:'chunk', q:'Jeg har fået nyt job! — Det ___ spændende!', o:['lyder','hører','siger'], pic:'🎉' },
  { d:2, t:'chunk', q:'Cykler du på arbejde? — Det kommer ___ på vejret.', o:['an','af','op'], pic:'🚲☔' },
  { d:2, t:'chunk', q:'Hvad laver du nu? — Jeg er i ___ med en uddannelse.', o:['gang','gå','gangen'], pic:'📚' },
  { d:2, t:'chunk', q:'Jeg kunne godt ___ mig at være fotograf.', o:['tænke','tænker','synes'], pic:'📷' },
  { d:2, t:'chunk', q:'Jeg er så træt i dag. — Det ___ jeg godt.', o:['kender','ved','kan'], pic:'😩' },
  { d:2, t:'chunk', q:'Jeg kommer fra Brasilien. Hvad ___ dig?', o:['med','om','til'], pic:'🌍' },

  // ===== kapitel 3 =====
  { d:3, t:'toej', q:'Det regner. Tag ___ på!', o:['regnjakken','solbrillerne','badetøjet'], pic:'🌧️' },
  { d:3, t:'toej', q:'Det er koldt. Jeg tager en ___ trøje på.', o:['varm','varmt','varme'], pic:'🥶' },
  { d:3, t:'toej', q:'Hun har et ___ halstørklæde.', o:['rødt','rød','røde'], pic:'🟥🧣' },
  { d:3, t:'toej', q:'Jeg kan godt lide de ___ sko.', o:['sorte','sort','sortt'], pic:'⬛👞' },
  { d:3, t:'toej', q:'Bukserne er for ___. Har du dem i en mindre størrelse?', o:['store','stor','stort'], pic:'👖' },
  { d:3, t:'toej', q:'Hvad koster den ___ jakke?', o:['blå','blåt','blåe'], pic:'🟦🧥' },
  { d:3, t:'toej', q:'Hun har en ___ kjole på.', o:['grøn','grønt','grønne'], pic:'🟩👗' },
  { d:3, t:'toej', q:'Huset er ___.', o:['gult','gul','gule'], pic:'🟨🏠' },
  { d:3, t:'toej', q:'Bilerne er ___.', o:['hvide','hvid','hvidt'], pic:'⬜🚗🚗' },
  { d:3, t:'toej', q:'Om sommeren går jeg i ___.', o:['sandaler','gummistøvler','vanter'], pic:'☀️' },
  { d:3, t:'toej', q:'Om vinteren har jeg ___ på hænderne.', o:['vanter','sokker','briller'], pic:'❄️🧤' },
  { d:3, t:'ting', q:'Jeg har glemt ___ nøgler.', o:['mine','min','mit'], pic:'🔑🔑' },
  { d:3, t:'ting', q:'Hvor er ___ telefon?', o:['min','mit','mine'], pic:'📱' },
  { d:3, t:'ting', q:'Har du set ___ ur?', o:['mit','min','mine'], pic:'⌚' },
  { d:3, t:'ting', q:'Jeg børster tænder med en ___.', o:['tandbørste','kam','saks'], pic:'🪥' },
  { d:3, t:'ting', q:'Når det regner, bruger jeg en ___.', o:['paraply','pung','taske'], pic:'☂️' },
  { d:3, t:'ting', q:'Mine penge ligger i ___.', o:['pungen','paraplyen','skoene'], pic:'👛' },
];

// ---------------------------------------------------------------------------
// ELITE CORRECTIONS — real sentences from "Mit liv før Danmark" (fælles rettelse, 26/9)
// c = correct, o = two wrong alternatives, h = Leo's hint
// ---------------------------------------------------------------------------
const FIXES = [
  { w:'Bagefter jeg fik en job.', h:'ordstilling · en/et', c:'Bagefter fik jeg et job.', o:['Bagefter jeg fik et job.','Bagefter fik jeg en job.'] },
  { w:'I 2017 jeg mødte min mand.', h:'ordstilling', c:'I 2017 mødte jeg min mand.', o:['I 2017 mødte min mand jeg.','I 2017 jeg har mødt min mand.'] },
  { w:'Da vi flyttede til New York, pandemien begyndte.', h:'ordstilling', c:'Da vi flyttede til New York, begyndte pandemien.', o:['Da flyttede vi til New York, pandemien begyndte.','Da vi flyttede til New York, pandemien begynder.'] },
  { w:'Vi spisede på mange restauranter.', h:'datid', c:'Vi spiste på mange restauranter.', o:['Vi spisde på mange restauranter.','Vi har spiste på mange restauranter.'] },
  { w:'Jeg boede der for næsten syv år.', h:'præposition', c:'Jeg boede der i næsten syv år.', o:['Jeg boede der siden næsten syv år.','Jeg boede der om næsten syv år.'] },
  { w:'Min søster boede hos os for elleve måneder.', h:'præposition', c:'Min søster boede hos os i elleve måneder.', o:['Min søster boede hos os om elleve måneder.','Min søster boede hos os siden elleve måneder.'] },
  { w:'Lønnen var ikke god, så arbejdede jeg der kun i seks måneder.', h:'ordstilling', c:'Lønnen var ikke god, så jeg arbejdede der kun i seks måneder.', o:['Lønnen var ikke god, så jeg kun arbejdede der i seks måneder.','Lønnen var ikke god, så arbejdede der jeg kun i seks måneder.'] },
  { w:'Jeg havde en cykel, men cyklede jeg ikke ofte.', h:'ordstilling', c:'Jeg havde en cykel, men jeg cyklede ikke ofte.', o:['Jeg havde en cykel, men jeg ikke cyklede ofte.','Jeg havde en cykel, men cyklede ikke jeg ofte.'] },
  { w:'Da startede jeg et nyt job, jeg flyttede til Danmark.', h:'ordstilling ×2', c:'Da jeg startede i et nyt job, flyttede jeg til Danmark.', o:['Da jeg startede i et nyt job, jeg flyttede til Danmark.','Da startede jeg i et nyt job, flyttede jeg til Danmark.'] },
  { w:'Før jeg flyttede til Danmark, jeg boede i mange byer.', h:'ordstilling', c:'Før jeg flyttede til Danmark, boede jeg i mange byer.', o:['Før flyttede jeg til Danmark, boede jeg i mange byer.','Før jeg flyttede til Danmark, jeg har boet i mange byer.'] },
  { w:'Jeg flyttede til København siden 2024.', h:'præposition', c:'Jeg flyttede til København i 2024.', o:['Jeg flyttede til København for 2024.','Jeg flyttede til København om 2024.'] },
  { w:'Jeg har boet her for to år siden.', h:'præposition', c:'Jeg har boet her i to år.', o:['Jeg har boet her siden to år.','Jeg har boet her om to år.'] },
  { w:'Også jeg lærte engelsk.', h:'ordstilling', c:'Jeg lærte også engelsk.', o:['Jeg også lærte engelsk.','Lærte jeg også engelsk.'] },
  { w:'I Tyskland boede han ikke med hans forældre.', h:'sin / hans', c:'I Tyskland boede han ikke med sine forældre.', o:['I Tyskland boede han ikke med sin forældre.','I Tyskland boede han ikke med hans forældrene.'] },
  { w:'Jeg havde mødte min kone, da vi gik i gymnasiet.', h:'tid (verbum)', c:'Jeg mødte min kone, da vi gik i gymnasiet.', o:['Jeg har mødt min kone, da vi gik i gymnasiet.','Jeg møder min kone, da vi gik i gymnasiet.'] },
  { w:'Vores anden barn kom i 2020.', h:'n-ord / t-ord', c:'Vores andet barn kom i 2020.', o:['Vores anden børn kom i 2020.','Vores andre barn kom i 2020.'] },
  { w:'Jeg kende ikke landet og kunde ikke tale svensk.', h:'datid · stavning', c:'Jeg kendte ikke landet og kunne ikke tale svensk.', o:['Jeg kendede ikke landet og kunne ikke tale svensk.','Jeg kendte ikke landet og kunde ikke tale svensk.'] },
  { w:'Det var en svær tid, så kom jeg tilbage til Lissabon.', h:'ordstilling', c:'Det var en svær tid, så jeg kom tilbage til Lissabon.', o:['Det var en svær tid, så jeg kommer tilbage til Lissabon.','Det var en svær tid, så kom tilbage jeg til Lissabon.'] },
  { w:'I 2025 en dansk firma kontaktede mig.', h:'ordstilling · en/et', c:'I 2025 kontaktede et dansk firma mig.', o:['I 2025 et dansk firma kontaktede mig.','I 2025 kontaktede en dansk firma mig.'] },
  { w:'I min fritid jeg spillete brætspil.', h:'ordstilling · datid', c:'I min fritid spillede jeg brætspil.', o:['I min fritid jeg spillede brætspil.','I min fritid spillete jeg brætspil.'] },
  { w:'Jeg flyttede, fordi jeg ville gerne bo sammen med ham.', h:'ordstilling i ledsætning', c:'Jeg flyttede, fordi jeg gerne ville bo sammen med ham.', o:['Jeg flyttede, fordi ville jeg gerne bo sammen med ham.','Jeg flyttede, fordi gerne jeg ville bo sammen med ham.'] },
  { w:'Jeg sovde tit på hotelet.', h:'datid · bestemt form', c:'Jeg sov tit på hotellet.', o:['Jeg sovede tit på hotellet.','Jeg sov tit på hotelet.'] },
  { w:'Jeg læste ingeniør på universitetet.', h:'præposition mangler', c:'Jeg læste til ingeniør på universitetet.', o:['Jeg læste som ingeniør på universitetet.','Jeg læste på ingeniør på universitetet.'] },
  { w:'Jeg gik til universitetet i Firenze.', h:'præposition', c:'Jeg gik på universitetet i Firenze.', o:['Jeg gik i universitetet i Firenze.','Jeg gik ved universitetet i Firenze.'] },
  { w:'Også jeg var glad for min nye job.', h:'ordstilling · min/mit', c:'Jeg var også glad for mit nye job.', o:['Jeg også var glad for mit nye job.','Jeg var også glad for min nye job.'] },
  { w:'Jeg også synge gospel.', h:'ordstilling · datid af at synge', c:'Jeg sang også gospel.', o:['Jeg også sang gospel.','Jeg syngede også gospel.'] },
  { w:'Mig og min kone fik vore børne i 2022.', h:'pronomen · flertal', c:'Min kone og jeg fik vores børn i 2022.', o:['Min kone og mig fik vores børn i 2022.','Min kone og jeg fik vores børne i 2022.'] },
  { w:'Mit første job var spændende, men jeg rejsede mange.', h:'datid · ordvalg', c:'Mit første job var spændende, men jeg rejste meget.', o:['Mit første job var spændende, men jeg rejste mange.','Mit første job var spændende, men jeg rejsede meget.'] },
];

// ---------------------------------------------------------------------------
// STORY — told slowly and simply, the way people talk to someone who is new in town
// ---------------------------------------------------------------------------
const STORY = {
  intro: {
    title: 'Ordby',
    pic: '🏰⚙️✨',
    text: [
      'Ordby er en gammel by med mure, tårne og smalle gader.',
      'Under katedralen står Ordværket: en stor maskine af messing, tandhjul og stjernelys. Ingen ved, hvem der byggede den. Den holder sproget sammen.',
      'I nat gik Ordværket i stykker. Nu flyver ordene rundt i gaderne. De er vilde, og de er farlige.',
      'Du er ny i byen. Du taler ikke perfekt dansk — endnu. Men du er Skriver.',
      'Folk taler langsomt til dig, og de viser dig billeder. Lyt. Saml ordene. Byg sætninger. Red byen.',
    ],
  },
  1: {
    title: 'Torvet vågner',
    pic: '🕰️💥',
    text: [
      'Urmageren faldt om på torvet. Hans ur stoppede, og så blev der stille.',
      'Langsomt vågnede byen igen. Bageren åbnede sin dør, slagteren råbte, og børnene legede på legepladsen.',
      'I Urmagerens lomme fandt du et lille tandhjul. Der var stjerner på det.',
      'Det kom ikke fra Jorden …',
    ],
  },
  2: {
    title: 'Lavsmesterens hemmelighed',
    pic: '⚒️📕',
    text: [
      'Lavsmesteren satte sig tungt ned. »Tak,« sagde han — meget langsomt, så du kunne forstå.',
      '»Jeg har ikke talt ordentligt i tyve år.«',
      'Han viste dig en gammel bog. »Ordværket blev bygget for tusind år siden,« sagde han.',
      '»Af nogen, der faldt ned fra himlen.«',
    ],
  },
  3: {
    title: 'Den nye stjerne',
    pic: '🕸️🌟',
    text: [
      'Den Grå Væver var ikke ond. Hun var bange. Hun vævede tråde rundt om ordene, fordi hun ville gemme dem.',
      '»Ordværket taler stadig,« hviskede hun. »Kan du høre det? Det kalder på nogen deroppe.«',
      'Du kiggede op. Over katedralen blinkede en ny stjerne.',
      '— Fortsættes i næste kapitel —',
    ],
  },
};

// Prepare prompts: parse frames into parts + answers, assign ids
(function prepare() {
  const re = /\[([^\]]+)\]/g;
  PROMPTS.forEach((p, i) => {
    p.id = 'p' + i;
    p.parts = []; p.answers = [];
    let last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(p.f))) {
      if (m.index > last) p.parts.push({ txt: p.f.slice(last, m.index) });
      p.parts.push({ gap: p.answers.length });
      p.answers.push(m[1]);
      last = re.lastIndex;
    }
    if (last < p.f.length) p.parts.push({ txt: p.f.slice(last) });
    p.full = p.f.replace(/\[|\]/g, '');
  });
  QUICK.forEach((q, i) => { q.id = 'q' + i; q.full = q.q.replace('___', q.o[0]); });
  FIXES.forEach((f, i) => { f.id = 'f' + i; f.full = f.c; f.t = 'fejl'; });
})();
