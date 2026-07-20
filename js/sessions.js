/* ─────────────────────────────────────────────────────────
   sessions.js  —  workshop sessie-beheer (localStorage)
   Gedeeld door admin.html en workshops.html
───────────────────────────────────────────────────────── */
window.Sessions = (function () {

  const KEY = 'sb_sessions';

  const WORKSHOPS = {
    'latte-art-1': {
      name:      'Latte Art Level 1 — Sweet Hearts',
      shortName: 'Latte Art L1',
      price:     99,
      maxSpots:  8,
      color:     '#0366C5',
    },
    'home-barista': {
      name:      'Home Barista',
      shortName: 'Home Barista',
      price:     99,
      maxSpots:  8,
      color:     '#00508C',
    },
    'brewing': {
      name:      'Brewing — Slow Brew',
      shortName: 'Slow Brew',
      price:     69,
      maxSpots:  8,
      color:     '#2E7D9F',
    },
    'latte-art-2': {
      name:      'Latte Art Level 2 — Masterclass',
      shortName: 'Masterclass',
      price:     149,
      maxSpots:  6,
      color:     '#001E35',
    },
  };

  const NL_MONTHS = ['Januari','Februari','Maart','April','Mei','Juni',
                     'Juli','Augustus','September','Oktober','November','December'];
  const NL_DAYS_SHORT = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
  const NL_DAYS_LONG  = ['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'];

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }

  function save(sessions) {
    localStorage.setItem(KEY, JSON.stringify(sessions));
  }

  function getUpcoming(workshopKey) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return getAll()
      .filter(s => (!workshopKey || s.workshopKey === workshopKey) && new Date(s.date) >= now)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  function getDatesWithSessions(workshopKey, year, month) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const sessions = getAll().filter(s =>
      (!workshopKey || s.workshopKey === workshopKey) &&
      new Date(s.date) >= now
    );
    const map = {};
    sessions.forEach(s => {
      const d = new Date(s.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = s.date;
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    });
    return map;
  }

  function add(session) {
    const sessions = getAll();
    session.id = Date.now();
    session.spotsBooked = session.spotsBooked || 0;
    sessions.push(session);
    save(sessions);
    return session;
  }

  function update(id, data) {
    const sessions = getAll();
    const i = sessions.findIndex(s => s.id === id);
    if (i >= 0) { sessions[i] = { ...sessions[i], ...data }; save(sessions); }
  }

  function remove(id) {
    save(getAll().filter(s => s.id !== id));
  }

  function incrementBooked(id, qty) {
    const sessions = getAll();
    const s = sessions.find(x => x.id === id);
    if (s) { s.spotsBooked = (s.spotsBooked || 0) + (qty || 1); save(sessions); }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const day = NL_DAYS_LONG[( d.getDay() + 6 ) % 7];
    return `${day.charAt(0).toUpperCase() + day.slice(1)} ${d.getDate()} ${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function spotsLeft(session) {
    const ws = WORKSHOPS[session.workshopKey];
    const max = session.maxSpots || (ws ? ws.maxSpots : 8);
    return Math.max(0, max - (session.spotsBooked || 0));
  }

  return {
    WORKSHOPS, NL_MONTHS, NL_DAYS_SHORT,
    getAll, save, getUpcoming, getDatesWithSessions,
    add, update, remove, incrementBooked,
    formatDate, spotsLeft,
  };
})();
