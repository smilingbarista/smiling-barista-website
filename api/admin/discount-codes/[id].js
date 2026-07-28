const { sb } = require("../../_lib/supabase");
const { requireAdmin } = require("../../_lib/admin-auth");

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
  const { id } = req.query;

  try {
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

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/discount-codes/[id] error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
