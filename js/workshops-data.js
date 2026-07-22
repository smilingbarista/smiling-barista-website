/* ─────────────────────────────────────────────────────────
   workshops-data.js — workshops/sessies rechtstreeks uit Supabase
   (publieke leestoegang via de publishable key, zie supabase-config.js).
   Vervangt het oude, localStorage-gebaseerde js/sessions.js voor de
   klantgerichte kalender op workshops.html.
───────────────────────────────────────────────────────── */
window.WorkshopsData = (function () {
  const NL_MONTHS = ['Januari','Februari','Maart','April','Mei','Juni',
                     'Juli','Augustus','September','Oktober','November','December'];
  const NL_DAYS_SHORT = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

  let workshops = [];
  let sessions = [];
  let loaded = false;
  let loadPromise = null;

  function cfg() { return window.SUPABASE_CONFIG; }

  async function sbGet(path) {
    const res = await fetch(`${cfg().url}/rest/v1${path}`, {
      headers: {
        apikey: cfg().publishableKey,
        Authorization: `Bearer ${cfg().publishableKey}`,
      },
    });
    if (!res.ok) throw new Error(`Supabase-fout (${res.status})`);
    return res.json();
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [ws, ss] = await Promise.all([
        sbGet('/workshops?select=*&active=eq.true&order=sort_order.asc'),
        sbGet(`/workshop_sessions?select=*&date=gte.${today}&cancelled=eq.false&order=date.asc,time.asc`),
      ]);
      workshops = ws;
      sessions = ss;
      loaded = true;
    })();
    return loadPromise;
  }

  function getWorkshops() { return workshops; }
  function getWorkshop(id) { return workshops.find((w) => w.id === id) || null; }

  function spotsLeft(session) {
    const ws = getWorkshop(session.workshop_id);
    const max = session.max_spots ?? (ws ? ws.max_spots : 8);
    return max - session.booked_spots;
  }

  function getUpcoming(workshopId) {
    return sessions.filter((s) => !workshopId || s.workshop_id === workshopId);
  }

  function getDatesWithSessions(workshopId, year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const map = {};
    for (const s of sessions) {
      if (workshopId && s.workshop_id !== workshopId) continue;
      if (!s.date.startsWith(prefix)) continue;
      (map[s.date] = map[s.date] || []).push(s);
    }
    return map;
  }

  function getSessionsOnDate(workshopId, date) {
    return sessions.filter((s) => s.date === date && (!workshopId || s.workshop_id === workshopId));
  }

  function getSession(id) { return sessions.find((s) => s.id === id) || null; }

  return {
    NL_MONTHS, NL_DAYS_SHORT,
    load, get loaded() { return loaded; },
    getWorkshops, getWorkshop,
    spotsLeft, getUpcoming, getDatesWithSessions, getSessionsOnDate, getSession,
  };
})();
