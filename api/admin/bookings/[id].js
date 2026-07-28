const { sb } = require("../../_lib/supabase");
const { requireAdmin } = require("../../_lib/admin-auth");

const VALID_CHECKIN = ["checked_in", "no_show", "cancelled", "moved"];

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.query;

  try {
    if (req.method === "PATCH") {
      const { checkinStatus } = req.body || {};
      if (checkinStatus !== null && !VALID_CHECKIN.includes(checkinStatus)) {
        res.status(400).json({ error: "Ongeldige status." });
        return;
      }
      const [row] = await sb(`/bookings?id=eq.${id}`, {
        method: "PATCH",
        prefer: "return=representation",
        body: { checkin_status: checkinStatus },
      });
      res.status(200).json(row);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/bookings/[id] error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
