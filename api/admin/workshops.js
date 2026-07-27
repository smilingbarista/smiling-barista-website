const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") {
      // Geen active-filter (i.t.t. de publieke WorkshopsData-query): de admin
      // moet ook verborgen workshops zien om ze weer zichtbaar te kunnen maken.
      const rows = await sb("/workshops?select=*&order=sort_order.asc");
      res.status(200).json(rows);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/workshops error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
