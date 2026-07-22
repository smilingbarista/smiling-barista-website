const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const sessionId = req.query.sessionId;
    const path = sessionId
      ? `/bookings?session_id=eq.${sessionId}&select=*&order=created_at.desc`
      : `/bookings?select=*,workshop_sessions(date,time,workshops(name))&order=created_at.desc&limit=200`;
    const rows = await sb(path);
    res.status(200).json(rows);
  } catch (err) {
    console.error("admin/bookings error:", err);
    res.status(500).json({ error: "Er ging iets mis." });
  }
};
