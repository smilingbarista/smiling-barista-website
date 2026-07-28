const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") {
      const sessionId = req.query.sessionId;
      const path = sessionId
        ? `/bookings?session_id=eq.${sessionId}&select=*,workshop_sessions(date,time,workshops(name))&order=created_at.desc`
        : `/bookings?select=*,workshop_sessions(date,time,workshops(name))&order=created_at.desc&limit=200`;
      const rows = await sb(path);
      res.status(200).json(rows);
      return;
    }

    if (req.method === "POST") {
      // Handmatig een deelnemer toevoegen (bv. betaald via overschrijving/
      // cash) — geen Mollie-betaling, de boeking staat meteen op 'paid'.
      const {
        sessionId, customerName, customerEmail, customerPhone, customerNote,
        spots, newsletter, previousWorkshops,
      } = req.body || {};
      if (!sessionId || !customerName || !customerEmail) {
        res.status(400).json({ error: "Sessie, naam en e-mail zijn verplicht." });
        return;
      }
      const spotsNum = parseInt(spots, 10) || 1;

      const sessions = await sb(`/workshop_sessions?id=eq.${sessionId}&select=*,workshops(*)`);
      const session = sessions && sessions[0];
      if (!session) {
        res.status(404).json({ error: "Deze sessie bestaat niet meer." });
        return;
      }
      const workshop = session.workshops;
      const maxSpots = session.max_spots ?? workshop.max_spots;
      const spotsLeft = maxSpots - session.booked_spots;
      if (spotsNum > spotsLeft) {
        res.status(409).json({ error: `Nog maar ${spotsLeft} plaats(en) vrij voor deze sessie.` });
        return;
      }

      const [booking] = await sb("/bookings", {
        method: "POST",
        prefer: "return=representation",
        body: {
          session_id: sessionId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          customer_note: customerNote || null,
          spots: spotsNum,
          amount_total: Number(workshop.price) * spotsNum,
          status: "paid",
          newsletter: !!newsletter,
          previous_workshops: Array.isArray(previousWorkshops) && previousWorkshops.length ? previousWorkshops : null,
        },
      });
      await sb(`/workshop_sessions?id=eq.${sessionId}`, {
        method: "PATCH",
        body: { booked_spots: session.booked_spots + spotsNum },
      });

      res.status(200).json(booking);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/bookings error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
