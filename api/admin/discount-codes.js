const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

// Zie de toelichting bovenaan api/admin/workshops.js: één plat bestand,
// los-item-operaties via ?id=xxx i.p.v. een dynamisch pad-segment.
const FIELD_MAP = {
  active: "active",
  value: "value",
  balance: "balance",
  maxUses: "max_uses",
  expiresAt: "expires_at",
  note: "note",
};

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const id = req.query.id;

  try {
    if (!id) {
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
    } else {
      if (req.method === "PATCH") {
        const body = {};
        for (const [key, column] of Object.entries(FIELD_MAP)) {
          if (req.body && req.body[key] !== undefined) body[column] = req.body[key];
        }
        const [row] = await sb(`/discount_codes?id=eq.${id}`, {
          method: "PATCH",
          prefer: "return=representation",
          body,
        });
        res.status(200).json(row);
        return;
      }

      if (req.method === "DELETE") {
        await sb(`/discount_codes?id=eq.${id}`, { method: "DELETE" });
        res.status(200).json({ ok: true });
        return;
      }
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/discount-codes error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
