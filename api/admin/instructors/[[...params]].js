const { sb } = require("../../_lib/supabase");
const { requireAdmin } = require("../../_lib/admin-auth");

// Samengevoegd uit instructors.js + instructors/[id].js — zie de toelichting
// in api/admin/workshops/[[...params]].js voor waarom.
const FIELD_MAP = { name: "name", email: "email", phone: "phone", active: "active" };

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const id = (req.query.params || [])[0];

  try {
    if (!id) {
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
    } else {
      if (req.method === "PATCH") {
        const body = {};
        for (const [key, column] of Object.entries(FIELD_MAP)) {
          if (req.body && req.body[key] !== undefined) body[column] = req.body[key];
        }
        const [row] = await sb(`/instructors?id=eq.${id}`, {
          method: "PATCH",
          prefer: "return=representation",
          body,
        });
        res.status(200).json(row);
        return;
      }

      if (req.method === "DELETE") {
        await sb(`/instructors?id=eq.${id}`, { method: "DELETE" });
        res.status(200).json({ ok: true });
        return;
      }
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/instructors error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
