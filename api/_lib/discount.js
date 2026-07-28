const { sb } = require("./supabase");

async function lookupCode(code) {
  if (!code) return null;
  const rows = await sb(
    `/discount_codes?code=eq.${encodeURIComponent(code.trim().toUpperCase())}&select=*`,
  );
  return rows && rows[0] ? rows[0] : null;
}

// Geeft een foutmelding terug als de code niet (meer) bruikbaar is, anders
// null. Bevat geen bedrag-berekening — dat is aan computeDiscount().
function validateCode(dc) {
  if (!dc) return "Deze code bestaat niet.";
  if (!dc.active) return "Deze code is niet meer geldig.";
  if (dc.expires_at && dc.expires_at < new Date().toISOString().slice(0, 10)) {
    return "Deze code is verlopen.";
  }
  if (dc.kind === "giftcard") {
    if (!(Number(dc.balance) > 0)) return "Deze cadeaubon is volledig opgebruikt.";
  } else if (dc.max_uses != null && dc.uses_count >= dc.max_uses) {
    return "Deze code is al het maximaal aantal keer gebruikt.";
  }
  return null;
}

function computeDiscount(dc, amountTotal) {
  if (dc.kind === "percent") {
    return Math.round(amountTotal * (Number(dc.value) / 100) * 100) / 100;
  }
  if (dc.kind === "fixed") return Math.min(Number(dc.value), amountTotal);
  if (dc.kind === "giftcard") return Math.min(Number(dc.balance), amountTotal);
  return 0;
}

// Optimistisch toepassen bij het aanmaken van de boeking (zelfde patroon als
// booked_spots): meteen verrekenen, terugdraaien via revertCodeUsage() als de
// betaling nadien mislukt/verloopt/geannuleerd wordt.
async function applyCodeUsage(dc, discountAmount) {
  const body = { uses_count: dc.uses_count + 1 };
  if (dc.kind === "giftcard") body.balance = Math.max(0, Number(dc.balance) - discountAmount);
  await sb(`/discount_codes?id=eq.${dc.id}`, { method: "PATCH", body });
}

async function revertCodeUsage(code, discountAmount) {
  if (!code) return;
  const dc = await lookupCode(code);
  if (!dc) return;
  const body = { uses_count: Math.max(0, dc.uses_count - 1) };
  if (dc.kind === "giftcard") body.balance = Number(dc.balance) + discountAmount;
  await sb(`/discount_codes?id=eq.${dc.id}`, { method: "PATCH", body });
}

module.exports = { lookupCode, validateCode, computeDiscount, applyCodeUsage, revertCodeUsage };
