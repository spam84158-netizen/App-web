/* Connexion et inscription. Sans base connectée, le formulaire explique l'état au lieu de simuler un compte. */
document.addEventListener("aldetic:ready", () => {
  const form = document.getElementById("auth-form");
  if (!form) return;
  const msg = document.getElementById("auth-msg");
  const show = (t, cls) => { msg.textContent = t; msg.className = "notice" + (cls ? " " + cls : ""); msg.hidden = false; };
  const db = window.aldeticDb;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = form.email.value.trim(), password = form.password.value;
    const signup = form.dataset.mode === "signup";
    if (!db) {
      // Démonstration sans base : compte local, puis vérification du numéro.
      alDemo.set("account", { email });
      location.href = signup ? "verification-telephone.html" : "tableau-de-bord.html";
      return;
    }
    const { data, error } = signup
      ? await db.auth.signUp({ email, password })
      : await db.auth.signInWithPassword({ email, password });
    if (error) return show(error.message, "warn");
    if (signup && !data.session) return show(tr("Compte créé. Confirmez votre adresse e-mail, puis connectez-vous."), "");
    location.href = signup ? "verification-telephone.html" : "tableau-de-bord.html";
  });
});

// Connexion Google (optionnelle). Nécessite le fournisseur Google activé dans Supabase.
document.addEventListener("aldetic:ready", () => {
  document.querySelectorAll("[data-oauth=google]").forEach(btn => btn.addEventListener("click", async () => {
    if (!window.aldeticDb) return toast(tr("Connexion Google indisponible : base non branchée."));
    const { error } = await window.aldeticDb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + "/tableau-de-bord.html" } });
    if (error) toast(error.message);
  }));
});
