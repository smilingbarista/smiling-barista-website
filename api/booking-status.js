const { sb } = require("./_lib/supabase");

// Publiek, maar geeft enkel de status van één specifieke boeking terug (op
// basis van het onraadbare UUID) — geen namen/e-mails/telefoonnummers, dus
// veilig zonder inlog.
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const id = req.query.id;
  if (!id) {
    res.status(400).json({ error: "Ontbrekend boekings-id." });
    return;
  }

  try {
    const rows = await sb(
      `/bookings?id=eq.${id}&select=status,spots,amount_total,workshop_sessions(date,time,workshops(name))`,
    );
    const booking = rows && rows[0];
    if (!booking) {
      res.status(404).json({ error: "Boeking niet gevonden." });
      return;
    }
    res.status(200).json(booking);
  } catch (err) {
    console.error("booking-status error:", err);
    res.status(500).json({ error: "Er ging iets mis." });
  }
};
