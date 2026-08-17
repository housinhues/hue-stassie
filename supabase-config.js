/*
 * Hue Stasie Supabase configuration.
 *
 * The anon key is designed for browser use, but must be protected by the
 * Row Level Security policies in supabase_schema.sql. Never add a service-role
 * key here. Replace these placeholders with values from Supabase Project
 * Settings > API before enabling cloud sync in the live deployment.
 */
window.HUESTASIE_SUPABASE = {
  url: '',
  anonKey: ''
};

/* Optional Vercel-friendly override. Set these before loading index.html if
 * your deployment injects configuration at runtime. */
window.HUESTASIE_SUPABASE.url = window.HUESTASIE_SUPABASE.url || window.HUESTASIE_SUPABASE_URL || '';
window.HUESTASIE_SUPABASE.anonKey = window.HUESTASIE_SUPABASE.anonKey || window.HUESTASIE_SUPABASE_ANON_KEY || '';

if (window.HUESTASIE_SUPABASE.url && window.HUESTASIE_SUPABASE.anonKey) {
  window.HUESTASIE_CLOUD_CONFIGURED = true;
}
