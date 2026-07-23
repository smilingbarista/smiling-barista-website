/**
 * Smiling Barista CMS — gedeelde dataopslag & DOM-toepassing
 * Wordt geladen op alle publieke pagina's én in admin.html
 */
const CMS = (() => {
  const K = {
    products:  'sb_products',
    workshops: 'sb_workshops',
    blocks:    'sb_blocks',
    content:   'sb_content',
    settings:  'sb_settings',
  };

  const DEFAULTS = {
    products: [
      { id:1,  name:'Signature Espresso Blend', price:14.50, emoji:'☕', cat:'koffie',      desc:'Onze huismix — krachtig, romig en vol van smaak. 250g vers geroosterd.', badge:'Bestseller', image:'' },
      { id:2,  name:'Cadeaubon Workshop',        price:65.00, emoji:'🎨', cat:'cadeaubon',   desc:'Geldig voor alle workshops — ideaal cadeau voor een koffieliefhebber.', badge:'', image:'' },
      { id:3,  name:'Latte Art Starter Kit',     price:32.00, emoji:'🥛', cat:'accessoires', desc:'Melkkan, thermometer en oefengids voor thuis.', badge:'', image:'' },
      { id:4,  name:'Single Origin Colombia',    price:17.50, emoji:'🫘', cat:'koffie',      desc:'Fruitig en licht met tonen van karamel en citrus. 250g.', badge:'Nieuw', image:'' },
      { id:5,  name:'Ethiopia Yirgacheffe',      price:18.50, emoji:'🫘', cat:'koffie',      desc:'Bloemig en fruitig, met tonen van bosbes en jasmijn. 250g.', badge:'', image:'' },
      { id:6,  name:'Barista Melkkan 600ml',     price:19.00, emoji:'🥛', cat:'accessoires', desc:'RVS melkkan voor professioneel opschuimen van melk.', badge:'', image:'' },
      { id:7,  name:'Espresso Tamper',           price:24.00, emoji:'🔧', cat:'accessoires', desc:'Aluminium tamper 58mm — onmisbaar voor de thuisbarista.', badge:'', image:'' },
      { id:8,  name:'Koffiedegustatieset',       price:28.00, emoji:'🧪', cat:'accessoires', desc:'Cupping-set met 5 verschillende koffies.', badge:'', image:'' },
      { id:9,  name:'Cadeaubon € 25',            price:25.00, emoji:'🎁', cat:'cadeaubon',   desc:'Besteedbaar in de webshop of als tegoed voor een workshop.', badge:'', image:'' },
      { id:10, name:'Cadeaubon € 50',            price:50.00, emoji:'🎁', cat:'cadeaubon',   desc:'Besteedbaar in de webshop of als tegoed voor een workshop.', badge:'', image:'' },
      { id:11, name:'Workshop Latte Art (1 pers)',price:65.00, emoji:'🎨', cat:'workshops',  desc:'2,5 uur latte art techniek. Datum in overleg.', badge:'', image:'' },
      { id:12, name:'Workshop Espresso (1 pers)', price:55.00, emoji:'☕', cat:'workshops',  desc:'2 uur espresso-techniek en koffiekennis. Datum in overleg.', badge:'', image:'' },
    ],

    workshops: [
      { id:1, title:'Latte Art Workshop',      tag:'🎨 Meest populair', style:'default',
        features:'Melk opschuimen als een pro\nHartje, rozet en tulp tekenen\nEspresso-extractie begrijpen\nOefenen op echte machines\n2,5 uur — inclusief koffie & snacks\nGeschikt voor beginners',
        priceLabel:'Op aanvraag', ctaText:'Boek nu' },
      { id:2, title:'Espresso Masterclass',    tag:'☕ Voor koffiekenners', style:'alt',
        features:'Koffiebonen: herkomst & smaakprofielen\nMalen, tampen en extractie\nEspresso, ristretto en lungo\nCupping-sessie (5 koffies vergelijken)\n3 uur — inclusief proeverij\nMaximaal 10 personen',
        priceLabel:'Op aanvraag', ctaText:'Boek nu' },
      { id:3, title:'Barista Teambuilding',    tag:'👥 Teambuilding', style:'dark',
        features:'Aangepast voor jouw team (4–20 pers)\nBarista-competitie tussen teams\nLatte art & koffietriviacontest\nMogelijkheid op locatie bij jullie\n2 – 3 uur naar keuze\nCatering inclusief',
        priceLabel:'Op aanvraag', ctaText:'Vraag offerte' },
      { id:4, title:'Privéworkshop op maat',   tag:'🎉 Privégroep', style:'warm',
        features:'Volledig op maat — jij kiest de inhoud\nIdeaal voor vrijgezellenfeest, verjaardag\nThuis, op locatie of bij ons\nTot 10 personen\nDatum volledig in overleg\nInclusief cadeautje voor elke deelnemer',
        priceLabel:'Op aanvraag', ctaText:'Boek nu' },
    ],

    blocks: [
      { id:'hero',          label:'Hero banner',           icon:'🚀', visible:true },
      { id:'about',         label:'Over ons',              icon:'☕', visible:true },
      { id:'services',      label:'Diensten overzicht',    icon:'📋', visible:true },
      { id:'teambuilding',  label:'Teambuilding',          icon:'🚲', visible:true },
      { id:'workshopteaser',label:'Workshops-teaser',      icon:'🎨', visible:true },
      { id:'praktisch',     label:'Praktisch',             icon:'📐', visible:true },
      { id:'tarieven',      label:'Tarieven',              icon:'💶', visible:true },
      { id:'gallery',       label:'Gallery',               icon:'🖼️', visible:true },
      { id:'reviews',       label:'Google Reviews',        icon:'⭐', visible:true },
      { id:'cta',           label:'CTA banner',            icon:'📣', visible:true },
    ],

    settings: {
      phone:    '+32 468 49 16 15',
      email:     'smilingbarista@spreadingsmiles.be',
      address:   'Dambruggestraat 267C, 2060 Antwerpen',
      btw:       'BE0566.931.049',
      instagram: '#',
      facebook:  '#',
      tagline:   'Koffie trappen met de glimlach — door heel België.',
    },

    content: {
      hero_badge:    '🚲 De enige koffiefiets die bonen maalt met trapkracht',
      hero_title:    'Koffie trappen met de glimlach',
      hero_sub:      'Op onze Velopresso\'s malen we de bonen met onze pedalen en schenken we cappuccino, latte, chaï, matcha latte en thee met heel veel goesting.',
      hero_btn1:     'Onze diensten ontdekken',
      hero_btn2:     'Latte Art Workshop',
      about_title:   'Smiling Barista\'s: koffie trappen met de glimlach',
      about_text1:   'Wij ontvangen jullie gasten met een glimlach en een lekkere warme drank, zijn de blikvanger op jullie bedrijfsfeest en ijsbreker op jullie beursstand. Dat blijft hangen bij je bezoekers… op de tofste manier!',
      about_text2:   'De Velopresso is de enige volledig mobiele koffiefiets waarmee we de bonen met trapkracht malen. Onze Smiling Barista\'s zitten nooit stil!',
      about_image:   '',
      cta_title:     'Klaar voor koffie op de trappers?',
      cta_sub:       'Laat ons weten wat jullie plannen — we denken graag mee over het perfecte moment voor koffie met een glimlach.',
    },
  };

  // ── Storage helpers ──
  function _get(key, def) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  }
  function _set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error('CMS opslaan mislukt:', e); }
  }

  // ── Public getters/setters ──
  const getProducts  = () => _get(K.products,  DEFAULTS.products);
  const getWorkshops = () => _get(K.workshops, DEFAULTS.workshops);
  const getBlocks    = () => _get(K.blocks,    DEFAULTS.blocks);
  const getSettings  = () => ({ ...DEFAULTS.settings,  ..._get(K.settings,  {}) });
  const getContent   = () => ({ ...DEFAULTS.content,   ..._get(K.content,   {}) });

  const saveProducts  = v => _set(K.products,  v);
  const saveWorkshops = v => _set(K.workshops, v);
  const saveBlocks    = v => _set(K.blocks,    v);
  const saveSettings  = v => _set(K.settings,  v);
  const saveContent   = v => _set(K.content,   v);

  // ── Export / Import ──
  function exportJSON() {
    const data = { products: getProducts(), workshops: getWorkshops(), blocks: getBlocks(), settings: getSettings(), content: getContent() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'smiling-barista-content.json' });
    a.click();
  }

  function importJSON(str) {
    const d = JSON.parse(str);
    if (d.products)  saveProducts(d.products);
    if (d.workshops) saveWorkshops(d.workshops);
    if (d.blocks)    saveBlocks(d.blocks);
    if (d.settings)  saveSettings(d.settings);
    if (d.content)   saveContent(d.content);
  }

  // ── Apply CMS data to public page ──
  function applyToPage() {
    _applyBlocks();
    _applyContent();
    _applySettings();
  }

  function _applyBlocks() {
    const blocks  = getBlocks();
    const bMap    = Object.fromEntries(blocks.map(b => [b.id, b]));
    const allEls  = Array.from(document.querySelectorAll('[data-block]'));
    if (!allEls.length) return;
    const parent  = allEls[0].parentNode;

    // Visibility
    allEls.forEach(el => {
      const b = bMap[el.dataset.block];
      if (b) el.style.display = b.visible ? '' : 'none';
    });
    // Order: reposition each block right after the previous one instead of
    // appending to the very end of the parent — appending unconditionally
    // would drag every managed block past unmanaged siblings that come
    // after them in the markup (footer, cart/modal overlays, scripts),
    // leaving those stranded above the content instead of below it.
    let anchor = null;
    blocks.forEach(b => {
      const el = document.querySelector(`[data-block="${b.id}"]`);
      if (!el) return;
      if (anchor) anchor.after(el);
      anchor = el;
    });
  }

  function _applyContent() {
    const c = getContent();
    document.querySelectorAll('[data-cms]').forEach(el => {
      const v = c[el.dataset.cms];
      if (v === undefined) return;
      if (el.tagName === 'IMG')      el.src  = v || el.src;
      else if (el.dataset.cmsAttr)   el.setAttribute(el.dataset.cmsAttr, v);
      else                           el.innerHTML = v;
    });
  }

  function _applySettings() {
    const s = getSettings();
    document.querySelectorAll('[data-setting]').forEach(el => {
      const v = s[el.dataset.setting];
      if (v === undefined) return;
      el.textContent = v;
    });
    document.querySelectorAll('[data-setting-href]').forEach(el => {
      const key = el.dataset.settingHref;
      const v   = s[key];
      if (!v) return;
      el.href = key === 'phone' ? `tel:${v.replace(/\s/g,'')}` : key === 'email' ? `mailto:${v}` : v;
    });
  }

  // ── Image helper: bestand → base64 ──
  function fileToBase64(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = e => res(e.target.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  return {
    getProducts, saveProducts,
    getWorkshops, saveWorkshops,
    getBlocks, saveBlocks,
    getSettings, saveSettings,
    getContent, saveContent,
    exportJSON, importJSON,
    applyToPage, fileToBase64,
    DEFAULTS,
  };
})();

// Auto-apply op publieke pagina's (niet in admin.html)
if (!document.documentElement.dataset.adminPage) {
  document.addEventListener('DOMContentLoaded', () => CMS.applyToPage());
}
