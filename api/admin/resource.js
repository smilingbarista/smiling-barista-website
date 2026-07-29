const { sb } = require("../_lib/supabase");
const { requireAdmin } = require("../_lib/admin-auth");
const { sendBookingConfirmation } = require("../_lib/notifications");

// Samenvoeging van workshops.js, sessions.js, discount-codes.js,
// instructors.js en bookings.js in één bestand: elk bestand onder /api telt
// als een aparte Vercel Serverless Function, en Hobby staat max. 12 toe per
// deployment. ?resource=<naam> kiest welk stuk hieronder afgehandeld wordt;
// ?id=<uuid/slug> identificeert (waar van toepassing) een los item. Zelfde
// aanpak als de eerdere per-resource bestanden — enkel samengevoegd, geen
// gedragswijziging. Bewust GEEN Vercel-specifieke routeringsconventie
// (dynamische bestandsnamen, rewrites) — dat bleek eerder onbetrouwbaar voor
// dit project; querystring-parameters zijn universeel en al bevestigd
// werkend.
module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  const id = req.query.id;

  switch (req.query.resource) {
    case "workshops":      return handleWorkshops(req, res, id);
    case "sessions":        return handleSessions(req, res, id);
    case "discount-codes":  return handleDiscountCodes(req, res, id);
    case "instructors":    return handleInstructors(req, res, id);
    case "bookings":       return handleBookings(req, res, id);
    default:
      res.status(400).json({ error: "Onbekende resource." });
  }
};

/* ─── WORKSHOPS ─────────────────────────────────────────── */
const WORKSHOP_FIELD_MAP = {
  active: "active", name: "name", shortName: "short_name", description: "description",
  bullets: "bullets", price: "price", durationLabel: "duration_label", maxSpots: "max_spots",
  color: "color", level: "level", sortOrder: "sort_order",
};
async function handleWorkshops(req, res, id) {
  try {
    if (!id) {
      if (req.method === "GET") {
        // Geen active-filter (i.t.t. de publieke WorkshopsData-query): de
        // admin moet ook verborgen workshops zien om ze weer zichtbaar te
        // kunnen maken.
        const rows = await sb("/workshops?select=*&order=sort_order.asc");
        res.status(200).json(rows);
        return;
      }

      if (req.method === "POST") {
        const {
          id: newId, name, shortName, description, bullets, price,
          durationLabel, maxSpots, color, level, sortOrder,
        } = req.body || {};
        if (!newId || !name || !shortName || price === undefined || price === null) {
          res.status(400).json({ error: "ID, naam, korte naam en prijs zijn verplicht." });
          return;
        }
        const [row] = await sb("/workshops", {
          method: "POST",
          prefer: "return=representation",
          body: {
            id: newId, name, short_name: shortName, description: description || null,
            bullets: bullets || null, price, duration_label: durationLabel || null,
            max_spots: maxSpots || 8, color: color || undefined, level: level || null,
            sort_order: sortOrder || 0, active: true,
          },
        });
        res.status(200).json(row);
        return;
      }

      if (req.method === "PATCH") {
        // Volgorde herschikken: body = { order: [id1, id2, ...] } in de
        // nieuwe volgorde.
        const { order } = req.body || {};
        if (!Array.isArray(order) || !order.length) {
          res.status(400).json({ error: "Ontbrekende volgorde." });
          return;
        }
        await Promise.all(
          order.map((oid, i) => sb(`/workshops?id=eq.${oid}`, { method: "PATCH", body: { sort_order: i } })),
        );
        res.status(200).json({ ok: true });
        return;
      }
    } else if (req.method === "PATCH") {
      const body = {};
      for (const [key, column] of Object.entries(WORKSHOP_FIELD_MAP)) {
        if (req.body && req.body[key] !== undefined) body[column] = req.body[key];
      }
      const [row] = await sb(`/workshops?id=eq.${id}`, { method: "PATCH", prefer: "return=representation", body });
      res.status(200).json(row);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/resource(workshops) error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
}

/* ─── SESSIONS ──────────────────────────────────────────── */
const SESSION_FIELD_MAP = {
  date: "date", time: "time", endTime: "end_time", maxSpots: "max_spots",
  bookedSpots: "booked_spots", notes: "notes", cancelled: "cancelled", instructorId: "instructor_id",
};
async function handleSessions(req, res, id) {
  try {
    if (!id) {
      if (req.method === "GET") {
        const rows = await sb(
          "/workshop_sessions?select=*,workshops(id,name,short_name,color,max_spots),instructors(id,name)&order=date.asc,time.asc",
        );
        res.status(200).json(rows);
        return;
      }

      if (req.method === "POST") {
        const { workshopId, date, time, endTime, maxSpots, bookedSpots, notes, instructorId } = req.body || {};
        if (!workshopId || !date || !time) {
          res.status(400).json({ error: "Ontbrekende gegevens." });
          return;
        }
        const [row] = await sb("/workshop_sessions", {
          method: "POST",
          prefer: "return=representation",
          body: {
            workshop_id: workshopId, date, time, end_time: endTime || null,
            max_spots: maxSpots || null, booked_spots: bookedSpots || 0,
            notes: notes || null, instructor_id: instructorId || null,
          },
        });
        res.status(200).json(row);
        return;
      }
    } else {
      if (req.method === "PATCH") {
        const body = {};
        for (const [key, column] of Object.entries(SESSION_FIELD_MAP)) {
          if (req.body && req.body[key] !== undefined) body[column] = req.body[key];
        }
        const [row] = await sb(`/workshop_sessions?id=eq.${id}`, { method: "PATCH", prefer: "return=representation", body });
        res.status(200).json(row);
        return;
      }

      if (req.method === "DELETE") {
        await sb(`/workshop_sessions?id=eq.${id}`, { method: "DELETE" });
        res.status(200).json({ ok: true });
        return;
      }
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/resource(sessions) error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
}

/* ─── DISCOUNT CODES ────────────────────────────────────── */
const DISCOUNT_FIELD_MAP = {
  active: "active", value: "value", balance: "balance",
  maxUses: "max_uses", expiresAt: "expires_at", note: "note",
};
async function handleDiscountCodes(req, res, id) {
  try {
    if (!id) {
      if (req.method === "GET") {
        const rows = await sb("/discount_codes?select=*&order=created_at.desc");
        res.status(200).json(rows);
        return;
      }

      if (req.method === "POST") {
        const { code, kind, value, maxUses, expiresAt, note } = req.body || {};
        if (!code || !kind || value === undefined || value === null) {
          res.status(400).json({ error: "Code, type en waarde zijn verplicht." });
          return;
        }
        if (!["percent", "fixed", "giftcard"].includes(kind)) {
          res.status(400).json({ error: "Ongeldig type." });
          return;
        }
        const valueNum = Number(value);
        const [row] = await sb("/discount_codes", {
          method: "POST",
          prefer: "return=representation",
          body: {
            code: String(code).trim().toUpperCase(), kind, value: valueNum,
            balance: kind === "giftcard" ? valueNum : null,
            max_uses: kind === "giftcard" ? null : (maxUses || null),
            expires_at: expiresAt || null, note: note || null, active: true,
          },
        });
        res.status(200).json(row);
        return;
      }
    } else {
      if (req.method === "PATCH") {
        const body = {};
        for (const [key, column] of Object.entries(DISCOUNT_FIELD_MAP)) {
          if (req.body && req.body[key] !== undefined) body[column] = req.body[key];
        }
        const [row] = await sb(`/discount_codes?id=eq.${id}`, { method: "PATCH", prefer: "return=representation", body });
        res.status(200).json(row);
        return;
      }

      if (req.method === "DELETE") {
        await sb(`/discount_codes?id=eq.${id}`, { method: "DELETE" });
        res.status(200).json({ ok: true });
        return;
      }
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/resource(discount-codes) error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
}

/* ─── INSTRUCTORS ───────────────────────────────────────── */
const INSTRUCTOR_FIELD_MAP = { name: "name", email: "email", phone: "phone", active: "active" };
async function handleInstructors(req, res, id) {
  try {
    if (!id) {
      if (req.method === "GET") {
        const rows = await sb("/instructors?select=*&order=name.asc");
        res.status(200).json(rows);
        return;
      }

      if (req.method === "POST") {
        const { name, email, phone } = req.body || {};
        if (!name) {
          res.status(400).json({ error: "Naam is verplicht." });
          return;
        }
        const [row] = await sb("/instructors", {
          method: "POST",
          prefer: "return=representation",
          body: { name, email: email || null, phone: phone || null, active: true },
        });
        res.status(200).json(row);
        return;
      }
    } else {
      if (req.method === "PATCH") {
        const body = {};
        for (const [key, column] of Object.entries(INSTRUCTOR_FIELD_MAP)) {
          if (req.body && req.body[key] !== undefined) body[column] = req.body[key];
        }
        const [row] = await sb(`/instructors?id=eq.${id}`, { method: "PATCH", prefer: "return=representation", body });
        res.status(200).json(row);
        return;
      }

      if (req.method === "DELETE") {
        await sb(`/instructors?id=eq.${id}`, { method: "DELETE" });
        res.status(200).json({ ok: true });
        return;
      }
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/resource(instructors) error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
}

/* ─── BOOKINGS ──────────────────────────────────────────── */
const VALID_CHECKIN = ["checked_in", "no_show", "cancelled", "moved"];
async function handleBookings(req, res, id) {
  try {
    if (!id) {
      if (req.method === "GET") {
        const sessionId = req.query.sessionId;
        const path = sessionId
          ? `/bookings?session_id=eq.${sessionId}&select=*,workshop_sessions(date,time,workshops(name))&order=created_at.desc`
          : `/bookings?select=*,workshop_sessions(date,time,workshops(name))&order=created_at.desc&limit=200`;
        const rows = await sb(path);
        res.status(200).json(rows);
        return;
      }

      if (req.method === "POST") {
        // Handmatig een deelnemer toevoegen (bv. betaald via overschrijving/
        // cash) — geen Mollie-betaling, de boeking staat meteen op 'paid'.
        const {
          sessionId, customerName, customerEmail, customerPhone, customerNote,
          spots, newsletter, previousWorkshops, smsOptIn,
        } = req.body || {};
        if (!sessionId || !customerName || !customerEmail) {
          res.status(400).json({ error: "Sessie, naam en e-mail zijn verplicht." });
          return;
        }
        const spotsNum = parseInt(spots, 10) || 1;

        const sessions = await sb(`/workshop_sessions?id=eq.${sessionId}&select=*,workshops(*)`);
        const session = sessions && sessions[0];
        if (!session) {
          res.status(404).json({ error: "Deze sessie bestaat niet meer." });
          return;
        }
        const workshop = session.workshops;
        const maxSpots = session.max_spots ?? workshop.max_spots;
        const spotsLeft = maxSpots - session.booked_spots;
        if (spotsNum > spotsLeft) {
          res.status(409).json({ error: `Nog maar ${spotsLeft} plaats(en) vrij voor deze sessie.` });
          return;
        }

        const [booking] = await sb("/bookings", {
          method: "POST",
          prefer: "return=representation",
          body: {
            session_id: sessionId, customer_name: customerName, customer_email: customerEmail,
            customer_phone: customerPhone || null, customer_note: customerNote || null,
            sms_opt_in: !!smsOptIn && !!customerPhone, spots: spotsNum,
            amount_total: Number(workshop.price) * spotsNum, status: "paid",
            newsletter: !!newsletter,
            previous_workshops: Array.isArray(previousWorkshops) && previousWorkshops.length ? previousWorkshops : null,
          },
        });
        await sb(`/workshop_sessions?id=eq.${sessionId}`, {
          method: "PATCH",
          body: { booked_spots: session.booked_spots + spotsNum },
        });
        try {
          await sendBookingConfirmation(booking, session, workshop);
          await sb(`/bookings?id=eq.${booking.id}`, { method: "PATCH", body: { email_confirmation_sent_at: new Date().toISOString() } });
        } catch (mailErr) {
          console.error("bevestigingsmail mislukt voor boeking", booking.id, mailErr);
        }

        res.status(200).json(booking);
        return;
      }
    } else if (req.method === "PATCH") {
      const { checkinStatus } = req.body || {};
      if (checkinStatus !== null && !VALID_CHECKIN.includes(checkinStatus)) {
        res.status(400).json({ error: "Ongeldige status." });
        return;
      }
      const [row] = await sb(`/bookings?id=eq.${id}`, {
        method: "PATCH",
        prefer: "return=representation",
        body: { checkin_status: checkinStatus },
      });
      res.status(200).json(row);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("admin/resource(bookings) error:", err);
    res.status(500).json({ error: err.message || "Er ging iets mis." });
  }
}
