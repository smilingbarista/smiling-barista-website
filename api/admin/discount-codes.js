const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") {
      const rows = await sb("/discount_codes?select=*&order=created_at.desc");
      res.status(200).json(rows);
      return;
    }

    if (req.method === "POST") {
      const { code, kind, value, maxUses, expiresAt, note } = req.body || {};
      if (!code || !kind || value === undefined || value === null) {
        res.status(400).json({ error: "Code, type en waarde zijn verplicht." });
        return;
      }
      if (!["percent", "fixed", "giftcard"].includes(kind)) {
        res.status(400).json({ error: "Ongeldig type." });
        return;
      }
      const valueNum = Number(value);
      const [row] = await sb("/discount_codes", {
        method: "POST",
        prefer: "return=representation",
        body: {
          code: String(code).trim().toUpperCase(),
          kind,
          value: valueNum,
          balance: kind === "giftcard" ? valueNum : null,
          max_uses: kind === "giftcard" ? null : (maxUses || null),
          expires_at: expiresAt || null,
          note: note || null,
          active: true,
        },
      });
      res.status(200).json(row);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/discount-codes error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
