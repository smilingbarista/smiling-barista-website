const { sb } = require("./_lib/supabase");
const { lookupCode, validateCode, computeDiscount } = require("./_lib/discount");

// Publiek, ongeauthenticeerd endpoint (zelfde vertrouwensniveau als
// create-booking.js) — laat de klant meteen zien hoeveel korting een code
// oplevert vóórdat er effectief geboekt/betaald wordt. create-booking.js
// herberekent en past dit zelf nog eens onafhankelijk toe, dus dit endpoint
// is puur voor de directe UI-feedback.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { code, sessionId, spots } = req.body || {};
    if (!code || !sessionId || !spots) {
      res.status(400).json({ error: "Ontbrekende gegevens." });
      return;
    }

    const dc = await lookupCode(code);
    const err = validateCode(dc);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const sessions = await sb(
      `/workshop_sessions?id=eq.${sessionId}&select=*,workshops(price)`,
    );
    const session = sessions && sessions[0];
    if (!session) {
      res.status(404).json({ error: "Sessie niet gevonden." });
      return;
    }
    const spotsNum = parseInt(spots, 10);
    const amountTotal = Number(session.workshops.price) * spotsNum;
    const discount = computeDiscount(dc, amountTotal);
    const newTotal = Math.max(0, Math.round((amountTotal - discount) * 100) / 100);

    res.status(200).json({ valid: true, kind: dc.kind, discount, amountTotal, newTotal });
  } catch (err) {
    console.error("validate-discount error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
};
