const { sb } = require("./_lib/supabase");
const { mollie } = require("./_lib/mollie");
const { lookupCode, validateCode, computeDiscount, applyCodeUsage, revertCodeUsage } = require("./_lib/discount");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { sessionId, spots, customerName, customerEmail, customerPhone, customerNote, discountCode } =
      req.body || {};

    if (!sessionId || !spots || !customerName || !customerEmail) {
      res.status(400).json({ error: "Vul alle verplichte velden in." });
      return;
    }
    const spotsNum = parseInt(spots, 10);
    if (!Number.isInteger(spotsNum) || spotsNum < 1) {
      res.status(400).json({ error: "Ongeldig aantal plaatsen." });
      return;
    }

    const sessions = await sb(
      `/workshop_sessions?id=eq.${sessionId}&select=*,workshops(*)`,
    );
    const session = sessions && sessions[0];
    if (!session || session.cancelled) {
      res.status(404).json({ error: "Deze sessie bestaat niet meer." });
      return;
    }
    const workshop = session.workshops;
    const maxSpots = session.max_spots ?? workshop.max_spots;
    const spotsLeft = maxSpots - session.booked_spots;
    if (spotsNum > spotsLeft) {
      res
        .status(409)
        .json({ error: `Nog maar ${spotsLeft} plaats(en) vrij voor deze sessie.` });
      return;
    }

    const amountTotal = Number(workshop.price) * spotsNum;

    // Kortingscode/cadeaubon vóór het aanmaken van de boeking valideren, zodat
    // we bij een ongeldige code niets hoeven terug te draaien.
    let discountCodeRow = null;
    let discountAmount = 0;
    if (discountCode) {
      discountCodeRow = await lookupCode(discountCode);
      const codeErr = validateCode(discountCodeRow);
      if (codeErr) {
        res.status(400).json({ error: codeErr });
        return;
      }
      discountAmount = computeDiscount(discountCodeRow, amountTotal);
    }
    const finalAmount = Math.max(0, Math.round((amountTotal - discountAmount) * 100) / 100);

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
        amount_total: finalAmount,
        discount_code: discountCodeRow ? discountCodeRow.code : null,
        discount_amount: discountCodeRow ? discountAmount : null,
        status: finalAmount <= 0 ? "paid" : "pending",
      },
    });

    // Plaatsen meteen reserveren tegen overboeking; bij een mislukte of
    // verlopen betaling geeft de webhook (of de catch hieronder) ze terug vrij.
    await sb(`/workshop_sessions?id=eq.${sessionId}`, {
      method: "PATCH",
      body: { booked_spots: session.booked_spots + spotsNum },
    });
    if (discountCodeRow) await applyCodeUsage(discountCodeRow, discountAmount);

    // Volledig gedekt door de kortingscode/cadeaubon: geen Mollie-betaling
    // nodig, de boeking staat al meteen op 'paid'.
    if (finalAmount <= 0) {
      res.status(200).json({ paid: true, bookingId: booking.id });
      return;
    }

    const origin = `https://${req.headers.host}`;
    let payment;
    try {
      payment = await mollie("/payments", {
        method: "POST",
        body: {
          amount: { currency: "EUR", value: finalAmount.toFixed(2) },
          description: `${workshop.name} — ${session.date} ${session.time}`,
          redirectUrl: `${origin}/workshops.html?booking=${booking.id}`,
          webhookUrl: `${origin}/api/mollie-webhook`,
          metadata: { bookingId: booking.id },
        },
      });
    } catch (mollieErr) {
      // Mollie-aanroep mislukt: gereserveerde plaatsen en kortingscodegebruik
      // meteen terug vrijgeven en de boeking als mislukt markeren, anders
      // blijft de plaats/code voor niets bezet.
      await sb(`/workshop_sessions?id=eq.${sessionId}`, {
        method: "PATCH",
        body: { booked_spots: session.booked_spots },
      });
      if (discountCodeRow) await revertCodeUsage(discountCodeRow.code, discountAmount);
      await sb(`/bookings?id=eq.${booking.id}`, {
        method: "PATCH",
        body: { status: "failed" },
      });
      throw mollieErr;
    }

    await sb(`/bookings?id=eq.${booking.id}`, {
      method: "PATCH",
      body: { mollie_payment_id: payment.id },
    });

    res.status(200).json({ checkoutUrl: payment._links.checkout.href });
  } catch (err) {
    console.error("create-booking error:", err);
    res
      .status(500)
      .json({ error: "Er ging iets mis bij het boeken. Probeer opnieuw." });
  }
};
