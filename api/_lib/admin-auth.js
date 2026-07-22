// Lichtgewicht admin-sessie: geen gebruikersaccounts, enkel één gedeeld
// wachtwoord (ADMIN_PASSWORD) dat een HMAC-ondertekend, tijdelijk token
// oplevert. Vervangt het oude hardcoded wachtwoord dat zichtbaar in de
// broncode van admin.html stond — de geheime waarden staan nu enkel
// server-side (Vercel env vars).
const crypto = require("crypto");

const SECRET = process.env.ADMIN_TOKEN_SECRET;
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 uur

function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function createToken() {
  const expires = Date.now() + TOKEN_TTL_MS;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(payload) > Date.now();
}

// Retourneert true als de request een geldig admin-token heeft; stuurt
// anders zelf een 401 en retourneert false (caller doet dan meteen `return`).
function requireAdmin(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!verifyToken(token)) {
    res.status(401).json({ error: "Niet ingelogd of sessie verlopen." });
    return false;
  }
  return true;
}

module.exports = { createToken, verifyToken, requireAdmin };
