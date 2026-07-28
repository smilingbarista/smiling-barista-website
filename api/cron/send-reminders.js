const { sb } = require("../_lib/supabase");
const { sendWeekReminder, send48hReminder, sendSmsReminder } = require("../_lib/notifications");

function addDays(base, n) {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Draait één keer per dag (zie vercel.json). Verstuurt de week- en
// 48u-herinnering per e-mail, en de sms-herinnering (enkel bij opt-in) een
// dag op voorhand. Elke stap zet een *_sent_at-timestamp zodat een sessie
// nooit twee keer dezelfde herinnering krijgt, ook niet als de cron een dag
// overslaat of dubbel draait.
module.exports = async function handler(req, res) {
  const auth = req.headers.authorization || "";
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const in7 = addDays(today, 7);
  const in2 = addDays(today, 2);
  const in1 = addDays(today, 1);

  const results = { weekReminders: 0, h48Reminders: 0, smsReminders: 0, errors: [] };

  try {
    const weekBookings = await sb(
      `/bookings?status=eq.paid&email_week_reminder_sent_at=is.null` +
      `&select=*,workshop_sessions!inner(date,time,cancelled,workshops(name,short_name))` +
      `&workshop_sessions.date=eq.${in7}&workshop_sessions.cancelled=eq.false`,
    );
    for (const b of weekBookings) {
      try {
        await sendWeekReminder(b, b.workshop_sessions, b.workshop_sessions.workshops);
        await sb(`/bookings?id=eq.${b.id}`, { method: "PATCH", body: { email_week_reminder_sent_at: new Date().toISOString() } });
        results.weekReminders++;
      } catch (err) {
        console.error("week reminder failed for booking", b.id, err);
        results.errors.push({ bookingId: b.id, step: "week", error: err.message });
      }
    }

    const h48Bookings = await sb(
      `/bookings?status=eq.paid&email_48h_reminder_sent_at=is.null` +
      `&select=*,workshop_sessions!inner(date,time,cancelled,workshops(name,short_name))` +
      `&workshop_sessions.date=eq.${in2}&workshop_sessions.cancelled=eq.false`,
    );
    for (const b of h48Bookings) {
      try {
        await send48hReminder(b, b.workshop_sessions, b.workshop_sessions.workshops);
        await sb(`/bookings?id=eq.${b.id}`, { method: "PATCH", body: { email_48h_reminder_sent_at: new Date().toISOString() } });
        results.h48Reminders++;
      } catch (err) {
        console.error("48h reminder failed for booking", b.id, err);
        results.errors.push({ bookingId: b.id, step: "48h", error: err.message });
      }
    }

    const smsBookings = await sb(
      `/bookings?status=eq.paid&sms_opt_in=eq.true&sms_reminder_sent_at=is.null&customer_phone=not.is.null` +
      `&select=*,workshop_sessions!inner(date,time,cancelled,workshops(name,short_name))` +
      `&workshop_sessions.date=eq.${in1}&workshop_sessions.cancelled=eq.false`,
    );
    for (const b of smsBookings) {
      try {
        await sendSmsReminder(b, b.workshop_sessions, b.workshop_sessions.workshops);
        await sb(`/bookings?id=eq.${b.id}`, { method: "PATCH", body: { sms_reminder_sent_at: new Date().toISOString() } });
        results.smsReminders++;
      } catch (err) {
        console.error("sms reminder failed for booking", b.id, err);
        results.errors.push({ bookingId: b.id, step: "sms", error: err.message });
      }
    }

    res.status(200).json(results);
  } catch (err) {
    console.error("cron/send-reminders error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis.", partial: results });
  }
};
