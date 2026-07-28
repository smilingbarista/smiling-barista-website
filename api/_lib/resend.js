// Kleine wrapper rond Resend's e-mail-API. Vereist RESEND_API_KEY en
// RESEND_FROM_EMAIL (bv. "Smiling Barista <boekingen@spreadingsmiles.be>" —
// dat domein moet eerst bij Resend geverifieerd zijn, anders weigert Resend
// de mail of verstuurt hij enkel naar het eigen testadres).
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.error("Resend niet geconfigureerd (RESEND_API_KEY/RESEND_FROM_EMAIL ontbreken) — mail niet verstuurd:", subject);
    return null;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: RESEND_FROM_EMAIL, to, subject, html }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.message) || `Resend-fout ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

module.exports = { sendEmail };
