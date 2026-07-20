/**
 * Odoo Configuration
 * Vul hier jouw Odoo-instantie in.
 *
 * Stap 1: Maak een API-sleutel aan via Odoo → Instellingen → Technisch → API-sleutels
 * Stap 2: Activeer CORS via Odoo → Instellingen → Technisch → Systeemparameters
 *         Sleutel: web.cors.origins  Waarde: *
 */
window.ODOO_CONFIG = {
  url:      'https://jouw-bedrijf.odoo.com',  // bijv. https://smilingbarista.odoo.com
  db:       'jouw-database-naam',              // naam van je Odoo-database
  username: 'jouw-email@bedrijf.com',          // login-e-mailadres van de Odoo-gebruiker
  apiKey:   'jouw-api-sleutel',                // API-sleutel uit Odoo Instellingen

  currency:       'EUR',
  currencySymbol: '€',
  pageSize:       12,
};
