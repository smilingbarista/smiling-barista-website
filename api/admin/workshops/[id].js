const { sb } = require("../../_lib/supabase");
const { requireAdmin } = require("../../_lib/admin-auth");

// camelCase (client) -> snake_case (kolomnaam in Postgres), zelfde aanpak
// als in api/admin/sessions/[id].js.
const FIELD_MAP = {
  active: "active",
  name: "name",
  shortName: "short_name",
  description: "description",
  bullets: "bullets",
  price: "price",
  durationLabel: "duration_label",
  maxSpots: "max_spots",
  color: "color",
  level: "level",
  sortOrder: "sort_order",
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
      const [row] = await sb(`/workshops?id=eq.${id}`, {
        method: "PATCH",
        prefer: "return=representation",
        body,
      });
      res.status(200).json(row);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/workshops/[id] error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
