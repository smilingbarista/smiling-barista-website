const { sb } = require("./_lib/supabase");
const { mollie } = require("./_lib/mollie");
const { revertCodeUsage } = require("./_lib/discount");
const { sendBookingConfirmation } = require("./_lib/notifications");

// Mollie stuurt enkel { id } (form-encoded) en verwacht een snelle 2xx.
// Bij een echte fout geven we een 500 terug zodat Mollie het later
// opnieuw probeert i.p.v. het event stilzwijgend te laten vallen.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  try {
    const paymentId = req.body && req.body.id;
    if (!paymentId) {
      res.status(400).end();
      return;
    }

    const payment = await mollie(`/payments/${paymentId}`);
    const bookings = await sb(
      `/bookings?mollie_payment_id=eq.${paymentId}&select=*,workshop_sessions(date,time,workshops(name,short_name))`,
    );
    const booking = bookings && bookings[0];
    if (!booking) {
      // Onbekende/test-betaling van Mollie zelf — niets te doen, maar wel
      // bevestigen zodat Mollie niet blijft retries sturen.
      res.status(200).end();
      return;
    }

    if (payment.status === "paid" && booking.status !== "paid") {
      await sb(`/bookings?id=eq.${booking.id}`, {
        method: "PATCH",
        body: { status: "paid", updated_at: new Date().toISOString() },
      });
      try {
        await sendBookingConfirmation(booking, booking.workshop_sessions, booking.workshop_sessions.workshops);
        await sb(`/bookings?id=eq.${booking.id}`, { method: "PATCH", body: { email_confirmation_sent_at: new Date().toISOString() } });
      } catch (mailErr) {
        console.error("bevestigingsmail mislukt voor boeking", booking.id, mailErr);
      }
    } else if (
      ["expired", "canceled", "failed"].includes(payment.status) &&
      booking.status === "pending"
    ) {
      await sb(`/bookings?id=eq.${booking.id}`, {
        method: "PATCH",
        body: { status: payment.status, updated_at: new Date().toISOString() },
      });

      const sessions = await sb(
        `/workshop_sessions?id=eq.${booking.session_id}&select=booked_spots`,
      );
      const session = sessions && sessions[0];
      if (session) {
        await sb(`/workshop_sessions?id=eq.${booking.session_id}`, {
          method: "PATCH",
          body: {
            booked_spots: Math.max(0, session.booked_spots - booking.spots),
          },
        });
      }
      if (booking.discount_code) {
        await revertCodeUsage(booking.discount_code, Number(booking.discount_amount) || 0);
      }
    }

    res.status(200).end();
  } catch (err) {
    console.error("mollie-webhook error:", err);
    res.status(500).end();
  }
};
