const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") {
      const rows = await sb("/instructors?select=*&order=name.asc");
      res.status(200).json(rows);
      return;
    }

    if (req.method === "POST") {
      const { name, email, phone } = req.body || {};
      if (!name) {
        res.status(400).json({ error: "Naam is verplicht." });
        return;
      }
      const [row] = await sb("/instructors", {
        method: "POST",
        prefer: "return=representation",
        body: { name, email: email || null, phone: phone || null, active: true },
      });
      res.status(200).json(row);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/instructors error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
