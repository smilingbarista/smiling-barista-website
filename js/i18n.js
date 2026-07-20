/**
 * Smiling Barista — i18n engine
 *
 * HOE HET WERKT
 * ─────────────
 * 1. Voeg data-i18n="sleutel" toe aan een element in het HTML
 *    bijv. <h1 data-i18n="hero.title">Koffie trappen met de glimlach</h1>
 *
 * 2. Vul de vertaling in via i18n/en.json  (of fr/de/es)
 *    bijv. { "hero": { "title": "Cycling coffee with a smile" } }
 *
 * 3. De engine vervangt de HTML-inhoud met de vertaling.
 *    Is een vertaling leeg ("") of ontbreekt ze? Dan blijft de
 *    originele HTML-tekst staan (fallback op Nederlands).
 *
 * ACTIVEREN OP EEN PAGINA
 * ───────────────────────
 * Voeg onderaan de pagina toe (na cms.js):
 *   <script src="js/i18n.js"></script>
 *   <script>I18n.init();</script>
 *
 * VERTAALBESTANDEN
 * ─────────────────
 * i18n/nl.json  → bronbestand / referentie (volledig NL)
 * i18n/en.json  → vertaling Engels  (nu nog leeg → valt terug op NL)
 * i18n/fr.json  → vertaling Frans
 * i18n/de.json  → vertaling Duits
 * i18n/es.json  → vertaling Spaans
 */
const I18n = (() => {

  const SUPPORTED  = ['nl', 'en', 'fr', 'de', 'es'];
  const DEFAULT    = 'nl';
  const LABELS     = { nl: 'NL', en: 'EN', fr: 'FR', de: 'DE', es: 'ES' };

  let _current = DEFAULT;
  let _strings = {};

  /* ── Taal laden ── */
  async function load(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;
    if (lang === DEFAULT) {
      _current = DEFAULT;
      localStorage.setItem('sb_lang', DEFAULT);
      _strings = {};
      _apply();
      return;
    }
    try {
      const res = await fetch(`i18n/${lang}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _strings = await res.json();
      _current = lang;
      localStorage.setItem('sb_lang', lang);
    } catch (err) {
      console.warn(`[i18n] Kan i18n/${lang}.json niet laden:`, err.message, '— terugvallen op NL');
      _strings = {};
      _current = DEFAULT;
    }
    _apply();
  }

  /* ── Vertaling ophalen ── */
  function t(key) {
    const val = key.split('.').reduce((o, k) => o?.[k], _strings);
    return (val && typeof val === 'string' && val.trim() !== '') ? val : null;
  }

  /* ── DOM bijwerken ── */
  function _apply() {
    document.documentElement.lang = _current;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (!val) return; // geen vertaling → originele HTML-tekst blijft

      const attr = el.dataset.i18nAttr;
      if (attr) {
        el.setAttribute(attr, val);
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.innerHTML = val;
      }
    });

    // Taalkiezer: actieve taal markeren
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.classList.toggle('lang-btn--active', btn.dataset.langBtn === _current);
    });
  }

  /* ── Taalkiezer HTML genereren ── */
  function renderSwitcher(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = SUPPORTED.map(lang => `
      <button
        class="lang-btn ${lang === _current ? 'lang-btn--active' : ''}"
        data-lang-btn="${lang}"
        onclick="I18n.setLang('${lang}')"
        title="${_langName(lang)}"
        aria-label="Schakel naar ${_langName(lang)}"
      >${LABELS[lang]}</button>
    `).join('');
  }

  function _langName(lang) {
    const names = { nl: 'Nederlands', en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español' };
    return names[lang] || lang;
  }

  /* ── Voorkeurstaal detecteren ── */
  function _detectLang() {
    const stored  = localStorage.getItem('sb_lang');
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = (navigator.language || '').split('-')[0].toLowerCase();
    return SUPPORTED.includes(browser) ? browser : DEFAULT;
  }

  /* ── Public API ── */
  function init() {
    load(_detectLang());
  }

  function setLang(lang) {
    load(lang);
  }

  function getLang() { return _current; }

  return { init, setLang, getLang, t, renderSwitcher };
})();
