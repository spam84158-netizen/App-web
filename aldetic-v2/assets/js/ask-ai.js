/* Widget « Demander à l'IA ». Appelle la fonction serveur ask-ai ; aucune clé de fournisseur dans le site. */
document.addEventListener("aldetic:ready", () => {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button id="ai-open" class="btn" style="position:fixed;right:20px;bottom:20px;z-index:60;border-radius:999px;min-height:48px;box-shadow:0 8px 24px rgba(14,17,22,.18)">${tr(tr("Demander à l'IA"))}</button>
    <section id="ai-panel" role="dialog" aria-label=tr("Demander à l'IA") hidden style="position:fixed;right:16px;bottom:80px;width:min(380px,calc(100vw - 32px));z-index:61;background:#fff;border:1px solid var(--rule);border-radius:12px;box-shadow:0 20px 50px rgba(14,17,22,.18);padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong>${tr(tr("Demander à l'IA"))}</strong><button id="ai-close" class="btn small ghost" type="button" aria-label=tr("Fermer")><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <textarea id="ai-q" maxlength="1000" placeholder=tr("Votre question (1000 caractères max)") data-ph-en="Your question (1000 characters max)" style="min-height:90px"></textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap">
        <span class="muted" style="font-size:12.5px">${tr(tr("Réponses générées par IA, à vérifier."))}</span>
        <button id="ai-send" class="btn small" type="button">${tr(tr("Envoyer"))}</button>
      </div>
      <p id="ai-out" class="notice" style="margin-top:12px" hidden></p>
    </section>`;
  if (document.documentElement.dir === "rtl") wrap.innerHTML = wrap.innerHTML.replace(/right:(\d+)px/g, "left:$1px");
  document.body.appendChild(wrap);
  const panel = document.getElementById("ai-panel"), out = document.getElementById("ai-out");
  document.getElementById("ai-open").onclick = () => panel.hidden = !panel.hidden;
  document.getElementById("ai-close").onclick = () => panel.hidden = true;
  const show = (t, cls) => { out.textContent = t; out.className = "notice" + (cls ? " " + cls : ""); out.hidden = false; };
  document.getElementById("ai-send").onclick = async () => {
    const q = document.getElementById("ai-q").value.trim();
    if (q.length < 3) return show(tr("Écrivez une question."), "warn");
    const db = window.aldeticDb;
    if (!db) return show(tr("Assistant indisponible : la base et le serveur ne sont pas branchés."), "warn");
    const { data } = await db.auth.getSession();
    if (!data.session) return show(tr("Connectez-vous pour utiliser l'assistant."), "warn");
    show(tr("Réflexion en cours…"));
    const res = await fetch(`${window.ALDETIC_CONFIG.SUPABASE_URL}/functions/v1/ask-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}`, apikey: window.ALDETIC_CONFIG.SUPABASE_ANON_KEY },
      body: JSON.stringify({ question: q })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return show(json.error || tr("Réponse impossible pour le moment."), "warn");
    show(json.answer); // textContent : aucune interprétation HTML de la réponse
  };
});
