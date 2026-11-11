// Client Supabase : inactif tant que config.js n'est pas renseigné. Le site reste alors en mode démonstration.
(function () {
  const c = window.ALDETIC_CONFIG || {};
  const ready = c.SUPABASE_URL && !c.SUPABASE_URL.startsWith("YOUR_") && window.supabase;
  window.aldeticDb = ready ? window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY) : null;
})();
