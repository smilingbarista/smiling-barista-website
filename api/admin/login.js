const { createToken } = require("../_lib/admin-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Fout wachtwoord." });
    return;
  }

  res.status(200).json({ token: createToken() });
};
