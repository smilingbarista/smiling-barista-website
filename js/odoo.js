/**
 * Odoo JSON-RPC API client — Smiling Barista webshop.
 * Vereist: odoo-config.js geladen vóór dit script.
 */

const OdooAPI = (() => {
  const cfg = () => window.ODOO_CONFIG;

  // ── Low-level JSON-RPC call ──
  async function rpc(endpoint, params) {
    const res = await fetch(`${cfg().url}${endpoint}`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method:  'call',
        id:      Math.floor(Math.random() * 1e9),
        params,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} op ${endpoint}`);
    const data = await res.json();
    if (data.error) {
      const msg = data.error.data?.message || data.error.message || 'Onbekende Odoo-fout';
      throw new Error(msg);
    }
    return data.result;
  }

  // ── Model method call ──
  async function callKw(model, method, args = [], kwargs = {}) {
    return rpc('/web/dataset/call_kw', {
      model,
      method,
      args,
      // Geen website_id: vereist website-module; alleen lang is veilig
      kwargs: { context: { lang: 'nl_BE' }, ...kwargs },
    });
  }

  // ── Authenticatie (login + API-sleutel) ──
  async function authenticate() {
    const result = await rpc('/web/session/authenticate', {
      db:       cfg().db,
      login:    cfg().username,   // e-mailadres van de Odoo-gebruiker
      password: cfg().apiKey,     // API-sleutel als wachtwoord (Odoo 16+)
    });
    if (!result?.uid) throw new Error('Authenticatie mislukt — controleer username en apiKey in odoo-config.js');
    return result;
  }

  // ── Ping: publiek endpoint, geen auth nodig ──
  async function ping() {
    try {
      const res = await fetch(`${cfg().url}/web/webclient/version_info`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.result;
    } catch {
      return false;
    }
  }

  // ── Producten ophalen ──
  // Odoo field-namen voor sortering: list_price (niet 'price'), name
  const SORT_FIELD_MAP = {
    name:       'name',
    price:      'list_price',
    list_price: 'list_price',
  };

  async function getProducts({ categoryId = null, limit = cfg().pageSize, offset = 0, sort = 'name asc' } = {}) {
    const [rawField, dir = 'asc'] = sort.split(' ');
    const field = SORT_FIELD_MAP[rawField] || rawField;

    const domain = [['sale_ok', '=', true], ['active', '=', true]];
    if (categoryId) domain.push(['categ_id', '=', categoryId]);

    return callKw('product.template', 'search_read', [domain], {
      fields: ['name', 'description_sale', 'list_price', 'image_512', 'categ_id', 'product_variant_ids'],
      limit,
      offset,
      order: `${field} ${dir}`,
    });
  }

  async function getCategories() {
    return callKw('product.category', 'search_read', [[]], {
      fields: ['name', 'id'],
      limit:  50,
    });
  }

  // ── Bestelling aanmaken ──
  async function createOrder({ customerName, customerEmail, customerPhone, street, zip, city, lines, note }) {
    // Klant opzoeken of aanmaken
    let partnerId;
    const existing = await callKw('res.partner', 'search_read',
      [[['email', '=', customerEmail]]],
      { fields: ['id'], limit: 1 }
    );
    if (existing.length > 0) {
      partnerId = existing[0].id;
    } else {
      partnerId = await callKw('res.partner', 'create', [{
        name:   customerName,
        email:  customerEmail,
        phone:  customerPhone || '',
        street: street || '',
        zip:    zip    || '',
        city:   city   || '',
        type:   'contact',
      }]);
    }

    // Orderlijnen: [0, 0, { ... }] = aanmaken via Many2many-commando
    const orderLines = lines.map(l => [0, 0, {
      product_id:      l.productId,
      product_uom_qty: l.qty,
      price_unit:      l.price,
    }]);

    // state NIET meegeven — readonly field, Odoo zet dit zelf op 'draft'
    const orderId = await callKw('sale.order', 'create', [{
      partner_id:  partnerId,
      note:        note || '',
      order_line:  orderLines,
    }]);

    return orderId;
  }

  // ── Check of Odoo geconfigureerd is ──
  function isConfigured() {
    const c = cfg();
    return !!(c && c.url && !c.url.includes('jouw-bedrijf') && c.apiKey && !c.apiKey.includes('jouw-api'));
  }

  // ── Workshop-events ophalen uit Odoo ──
  // Zoekt event.event op basis van naamfragment, enkel toekomstige sessies
  async function getWorkshopEvents(nameFragment, limit = 12) {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())} 00:00:00`;

    return callKw('event.event', 'search_read',
      [[
        ['name', 'ilike', nameFragment],
        ['date_begin', '>=', todayStr],
      ]],
      {
        fields: ['id', 'name', 'date_begin', 'date_end', 'seats_available',
                 'seats_max', 'seats_availability', 'website_published'],
        order: 'date_begin asc',
        limit,
      }
    );
  }

  // ── Registratie aanmaken voor een event ──
  async function createEventRegistration({ eventId, name, email, phone, qty }) {
    return callKw('event.registration', 'create', [{
      event_id: eventId,
      name:     name,
      email:    email,
      phone:    phone || '',
      qty:      qty   || 1,
    }]);
  }

  return { authenticate, ping, getProducts, getCategories, createOrder,
           isConfigured, getWorkshopEvents, createEventRegistration };
})();
