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

    if (req.method === "POST") {
      const {
        id, name, shortName, description, bullets, price,
        durationLabel, maxSpots, color, level, sortOrder,
      } = req.body || {};
      if (!id || !name || !shortName || price === undefined || price === null) {
        res.status(400).json({ error: "ID, naam, korte naam en prijs zijn verplicht." });
        return;
      }
      const [row] = await sb("/workshops", {
        method: "POST",
        prefer: "return=representation",
        body: {
          id,
          name,
          short_name: shortName,
          description: description || null,
          bullets: bullets || null,
          price,
          duration_label: durationLabel || null,
          max_spots: maxSpots || 8,
          color: color || undefined,
          level: level || null,
          sort_order: sortOrder || 0,
          active: true,
        },
      });
      res.status(200).json(row);
      return;
    }

    if (req.method === "PATCH") {
      // Volgorde herschikken: body = { order: [id1, id2, ...] } in de nieuwe
      // volgorde. sort_order wordt herschreven naar de positie in die lijst.
      const { order } = req.body || {};
      if (!Array.isArray(order) || !order.length) {
        res.status(400).json({ error: "Ontbrekende volgorde." });
        return;
      }
      await Promise.all(
        order.map((id, i) =>
          sb(`/workshops?id=eq.${id}`, { method: "PATCH", body: { sort_order: i } }),
        ),
      );
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/workshops error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
