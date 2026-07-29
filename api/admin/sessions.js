const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

// Zie de toelichting bovenaan api/admin/workshops.js: één plat bestand,
// los-item-operaties via ?id=xxx i.p.v. een dynamisch pad-segment.
const FIELD_MAP = {
  date: "date",
  time: "time",
  endTime: "end_time",
  maxSpots: "max_spots",
  bookedSpots: "booked_spots",
  notes: "notes",
  cancelled: "cancelled",
  instructorId: "instructor_id",
};

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const id = req.query.id;

  try {
    if (!id) {
      if (req.method === "GET") {
        const rows = await sb(
          "/workshop_sessions?select=*,workshops(id,name,short_name,color,max_spots),instructors(id,name)&order=date.asc,time.asc",
        );
        res.status(200).json(rows);
        return;
      }

      if (req.method === "POST") {
        const { workshopId, date, time, endTime, maxSpots, bookedSpots, notes, instructorId } =
          req.body || {};
        if (!workshopId || !date || !time) {
          res.status(400).json({ error: "Ontbrekende gegevens." });
          return;
        }
        const [row] = await sb("/workshop_sessions", {
          method: "POST",
          prefer: "return=representation",
          body: {
            workshop_id: workshopId,
            date,
            time,
            end_time: endTime || null,
            max_spots: maxSpots || null,
            booked_spots: bookedSpots || 0,
            notes: notes || null,
            instructor_id: instructorId || null,
          },
        });
        res.status(200).json(row);
        return;
      }
    } else {
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
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/sessions error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
