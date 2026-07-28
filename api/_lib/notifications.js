const { sendEmail } = require("./resend");
const { sendSms } = require("./twilio");

const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function fmtDateNL(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function baseEmailHtml(title, bodyHtml) {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#0A1F2E">
    <h2 style="color:#001E35">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:2rem;font-size:.875rem;color:#4A7A9B">Smiling Barista · smilingbarista@spreadingsmiles.be</p>
  </div>`;
}

async function sendBookingConfirmation(booking, session, workshop) {
  const html = baseEmailHtml("Je boeking is bevestigd!", `
    <p>Hoi ${escapeHtml(booking.customer_name)},</p>
    <p>Je boeking voor <strong>${escapeHtml(workshop.name)}</strong> is bevestigd:</p>
    <ul>
      <li>${fmtDateNL(session.date)} om ${session.time}</li>
      <li>${booking.spots} plaats${booking.spots === 1 ? "" : "en"}</li>
      <li>Totaal: € ${Number(booking.amount_total).toFixed(2).replace(".", ",")}</li>
    </ul>
    <p>Tot dan!</p>
  `);
  await sendEmail({ to: booking.customer_email, subject: `Boeking bevestigd — ${workshop.name}`, html });
}

async function sendWeekReminder(booking, session, workshop) {
  const html = baseEmailHtml("Nog een week te gaan!", `
    <p>Hoi ${escapeHtml(booking.customer_name)},</p>
    <p>Nog 1 week tot je workshop <strong>${escapeHtml(workshop.name)}</strong>, op ${fmtDateNL(session.date)} om ${session.time}. We kijken ernaar uit!</p>
  `);
  await sendEmail({ to: booking.customer_email, subject: `Nog 1 week — ${workshop.name}`, html });
}

async function send48hReminder(booking, session, workshop) {
  const html = baseEmailHtml("Bijna zover!", `
    <p>Hoi ${escapeHtml(booking.customer_name)},</p>
    <p>Over 2 dagen is het zover: <strong>${escapeHtml(workshop.name)}</strong>, op ${fmtDateNL(session.date)} om ${session.time}. Tot dan!</p>
  `);
  await sendEmail({ to: booking.customer_email, subject: `Over 2 dagen — ${workshop.name}`, html });
}

async function sendSmsReminder(booking, session, workshop) {
  const label = workshop.short_name || workshop.name;
  const body = `Smiling Barista: morgen om ${session.time} is je workshop "${label}". Tot dan!`;
  await sendSms({ to: booking.customer_phone, body });
}

module.exports = { sendBookingConfirmation, sendWeekReminder, send48hReminder, sendSmsReminder };
