/**
 * Supabase configuratie — publiek project (workshops/sessies lezen).
 *
 * De publishable key hierin is bedoeld om publiek te zijn: hij geeft enkel
 * leestoegang tot workshops/sessies (zie Row Level Security-policies in
 * supabase/migrations/0001_init.sql). De service_role-sleutel (die WEL
 * geheim moet blijven) staat nergens in browsercode — enkel als Vercel
 * environment variable, gebruikt door de serverless functies in /api.
 */
window.SUPABASE_CONFIG = {
  url: "https://gamupathpydkrezzviud.supabase.co",
  publishableKey: "sb_publishable_Ny0ePx_WADh2WYRbMQC34A_clSxyY-1",
};
