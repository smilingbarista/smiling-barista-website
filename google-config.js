/**
 * Google Places Reviews configuratie
 *
 * Stap 1 — API-sleutel
 *   Ga naar https://console.cloud.google.com/
 *   Maak een project aan → Activeer "Places API"
 *   Maak een API-sleutel aan onder "Credentials"
 *   Beperk de sleutel tot: HTTP referrers (je domeinen)
 *
 * Stap 2 — Place ID
 *   Ga naar https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
 *   Zoek "Smiling Barista Antwerpen" → kopieer het Place ID
 *   Het ziet er uit als: ChIJN1t_tDeuEmsRUsoyG83frY4
 */
window.GOOGLE_CONFIG = {
  apiKey:  'JOUW-GOOGLE-MAPS-API-SLEUTEL',
  placeId: 'JOUW-PLACE-ID',
};
