const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
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

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/sessions error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
