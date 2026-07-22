// Kleine wrapper rond Mollie's REST API. MOLLIE_API_KEY blijft
// server-only (Vercel env var) — mag nooit naar de browser lekken.
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;

async function mollie(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.mollie.com/v2${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${MOLLIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error((data && data.detail) || `Mollie error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

module.exports = { mollie };
