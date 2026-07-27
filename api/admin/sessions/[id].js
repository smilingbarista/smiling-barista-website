const { sb } = require("../../_lib/supabase");
const { requireAdmin } = require("../../_lib/admin-auth");

// Vertaalt de camelCase velden die de client stuurt (zelfde vorm als de
// POST-body in sessions.js) naar de snake_case kolomnamen in Postgres. Eerder
// verwachtte deze whitelist rechtstreeks "max_spots"/"booked_spots" terwijl
// de admin-UI altijd "maxSpots"/"bookedSpots" stuurde — die twee velden
// werden daardoor stilzwijgend nooit opgeslagen bij het bewerken van een
// bestaande sessie.
const FIELD_MAP = {
  date: "date",
  time: "time",
  endTime: "end_time",
  maxSpots: "max_spots",
  bookedSpots: "booked_spots",
  notes: "notes",
  cancelled: "cancelled",
};

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.query;

  try {
    if (req.method === "PATCH") {
      const body = {};
      for (const [key, column] of Object.entries(FIELD_MAP)) {
        if (req.body && req.body[key] !== undefined) body[column] = req.body[key];
      }
      const [row] = await sb(`/workshop_sessions?id=eq.${id}`, {
        method: "PATCH",
        prefer: "return=representation",
        body,
      });
      res.status(200).json(row);
      return;
    }

    if (req.method === "DELETE") {
      await sb(`/workshop_sessions?id=eq.${id}`, { method: "DELETE" });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/sessions/[id] error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
