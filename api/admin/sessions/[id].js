const { sb } = require("../../_lib/supabase");
const { requireAdmin } = require("../../_lib/admin-auth");

const PATCHABLE_FIELDS = [
  "date",
  "time",
  "max_spots",
  "booked_spots",
  "notes",
  "cancelled",
];

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.query;

  try {
    if (req.method === "PATCH") {
      const body = {};
      for (const key of PATCHABLE_FIELDS) {
        if (req.body && req.body[key] !== undefined) body[key] = req.body[key];
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
    res.status(500).json({ error: "Er ging iets mis." });
  }
};
