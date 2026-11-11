/* Aldetic : langue, en-tête, pied de page, données de démonstration locales, petits utilitaires. */
(function () {
  const LANGS = ["fr", "en", "es", "pt", "de", "ar"];
  const NAV = [
    ["services.html", "Services", "Services"],
    ["projets.html", "Projets", "Projects"],
    ["communaute.html", "Communauté", "Community"],
    ["git.html", "MY GIT", "MY GIT"],
    ["cloud.html", "MY CLOUD", "MY CLOUD"],
    ["chat.html", "AI CHAT", "AI CHAT"],
    ["api.html", "API CENTER", "API CENTER"],
    ["carrieres.html", "Carrières", "Careers"],
    ["tarifs.html", "Tarifs", "Pricing"],
    ["documentation.html", "Docs", "Docs"]
  ];

  // Langues réellement traduites. Les autres apparaissent dans le menu, désactivées, tant que leur traduction n'est pas complète.
  const AVAILABLE = ["fr", "en", "es", "ar", "zh"];
  const LABEL = { fr: "Français", en: "English", es: "Español", pt: "Português", de: "Deutsch", ar: "العربية" };

  // Langue : choix manuel enregistré, sinon langues du navigateur (dans l'ordre), sinon anglais.
  function currentLang() {
    const saved = localStorage.getItem("aldetic-lang");
    if (saved && AVAILABLE.includes(saved)) return saved;
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"])
      .map(l => l.slice(0, 2).toLowerCase());
    return prefs.find(c => AVAILABLE.includes(c)) || "en";
  }

  // Premier accès sans choix enregistré : l'utilisateur choisit sa langue, la détection n'est que proposée.
  function showLanguageChooser(detected) {
    if (localStorage.getItem("aldetic-lang")) return;
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Choisissez votre langue / Choose your language");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(14,17,22,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px";
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:28px;max-width:420px;width:100%;box-shadow:0 30px 70px rgba(0,0,0,.25)">
        <p style="font-family:var(--serif);font-size:30px;margin:0 0 6px">Aldetic</p>
        <p style="margin:0 0 18px;color:#5B6372;font-size:15px">Choisissez votre langue<br>Choose your language</p>
        <div style="display:grid;gap:8px">${AVAILABLE.map(c =>
          `<button type="button" data-pick="${c}" class="btn ${c === detected ? "" : "ghost"}" style="justify-content:space-between;width:100%">
             <span>${LABEL[c]}</span>${c === detected ? '<span style="font-size:12px;opacity:.8">suggérée / suggested</span>' : ""}</button>`).join("")}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(`[data-pick="${detected}"]`).focus();
    overlay.addEventListener("click", e => {
      const b = e.target.closest("[data-pick]");
      if (!b) return;
      localStorage.setItem("aldetic-lang", b.dataset.pick);
      location.reload();
    });
  }

  // Textes : écrits en français dans le HTML. Traduction en via data-en ; autres langues via data-<code>.
  function translateTextNodes() {
    const dict = { en: window.ALDETIC_EN, es: window.ALDETIC_ES, ar: window.ALDETIC_AR, zh: window.ALDETIC_ZH }[document.documentElement.lang] || {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement && !/^(SCRIPT|STYLE)$/.test(n.parentElement.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const key = n.textContent.trim();
      if (key && dict[key] !== undefined) n.textContent = n.textContent.replace(key, dict[key]);
    });
    document.querySelectorAll("[placeholder]").forEach(el => {
      const key = el.getAttribute("placeholder");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    const parts = document.title.split(" · ");
    if (dict[parts[0]] !== undefined) document.title = [dict[parts[0]], ...parts.slice(1)].join(" · ");
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    if (lang !== "fr") translateTextNodes();
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.dir = document.documentElement.dir;
    document.querySelectorAll("[data-en],[data-es],[data-pt],[data-de],[data-ar]").forEach(el => {
      if (!el.dataset.fr) el.dataset.fr = el.innerHTML;
      const v = el.dataset[lang] !== undefined ? el.dataset[lang] : (lang === "en" ? el.dataset.en || el.dataset.fr : el.dataset.fr);
      el.innerHTML = v;
    });
    document.querySelectorAll("[data-ph-en]").forEach(el => {
      if (!el.dataset.phFr) el.dataset.phFr = el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", lang === "fr" ? el.dataset.phFr : el.dataset.phEn);
    });
    const sel = document.getElementById("lang");
    if (sel) sel.value = lang;
  }

  function header(lang) {
    const current = location.pathname.split("/").pop() || "index.html";
    const en = lang !== "fr";
    const links = NAV.map(([href, fr, e]) =>
      `<a href="${href}" ${href === current ? 'aria-current="page"' : ""}>${en ? e : fr}</a>`).join("");
    const opts = LANGS.map(c => AVAILABLE.includes(c)
      ? `<option value="${c}" ${c === lang ? "selected" : ""}>${LABEL[c]}</option>`
      : `<option value="${c}" disabled>${LABEL[c]} (bientôt / soon)</option>`).join("");
    return `
      <header class="site-header"><div class="wrap bar">
        <a class="brand" href="index.html"><i></i>Aldetic</a>
        <nav class="nav" id="nav">${links}<span class="sep"></span>
          <a href="connexion.html">${en ? "Log in" : tr("Connexion")}</a>
          <a class="btn small" href="inscription.html">${en ? "Sign up" : tr("Inscription")}</a>
          <select class="lang" id="lang" aria-label="Language">${opts}</select>
        </nav>
        <button class="menu-btn" id="menu" aria-label="Menu" aria-expanded="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      </div></header>`;
  }

  function footer(lang) {
    const en = lang !== "fr";
    return `
      <footer class="site-footer"><div class="wrap">
        <div class="foot-grid">
          <div><p style="font-family:var(--serif);font-size:28px;color:#fff;margin:0 0 10px">Aldetic Frontiers Ltd</p>
            <p>${en ? "Technology Beyond Limits" : "Technology Beyond Limits"}<br>${en ? "Innovate. Develop. Build the future." : "Innover. Développer. Bâtir l'avenir."}</p></div>
          <div><h3>${en ? "Platform" : "Plateforme"}</h3><ul><li><a href="services.html">${en ? tr("Services") : tr("Services")}</a></li><li><a href="git.html">MY GIT</a></li><li><a href="cloud.html">MY CLOUD</a></li><li><a href="api.html">API CENTER</a></li></ul></div>
          <div><h3>${en ? "Company" : "Entreprise"}</h3><ul><li><a href="a-propos.html">${en ? "About" : tr("À propos")}</a></li><li><a href="carrieres.html">${en ? "Careers" : tr("Carrières")}</a></li><li><a href="contact.html">Contact</a></li></ul></div>
          <div><h3>${en ? "Legal" : "Légal"}</h3><ul><li><a href="conditions.html">${en ? "Terms of use" : tr("Conditions d'utilisation")}</a></li><li><a href="confidentialite.html">${en ? "Privacy" : tr("Confidentialité")}</a></li><li><a href="tarifs.html">${en ? "Pricing" : tr("Tarifs")}</a></li></ul></div>
        </div>
        <div class="foot-bottom"><span>© 2026 Aldetic Frontiers Ltd</span><span>${en ? "Language follows your browser; you can change it in the menu." : "La langue suit votre navigateur ; vous pouvez la changer dans le menu."}</span></div>
      </div></footer>`;
  }

  // Données locales de démonstration : rien n'est envoyé à un serveur tant que la base n'est pas connectée.
  window.alDemo = {
    get(key, fallback) {
      try { const v = localStorage.getItem("aldetic-demo:" + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem("aldetic-demo:" + key, JSON.stringify(value)); } catch (e) {} }
  };

  window.toast = function (msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
  };

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  window.esc = escapeHtml;

  function wireUi() {
    const menu = document.getElementById("menu");
    const nav = document.getElementById("nav");
    if (menu && nav) menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); toast(document.documentElement.lang === "fr" ? "Copié" : "Copied"); }
      catch (e) { toast(tr("Copie impossible : sélectionnez le texte")); }
    }));
    document.querySelectorAll("[data-tabs]").forEach(group => {
      const tabs = group.querySelectorAll("[role=tab]");
      tabs.forEach(tab => tab.addEventListener("click", () => {
        tabs.forEach(t => { t.setAttribute("aria-selected", String(t === tab)); document.getElementById(t.getAttribute("aria-controls")).hidden = t !== tab; });
      }));
    });
    if (document.body.dataset.protected === "true") gateProtected();
  }

  // Accès aux pages connectées : session ET numéro vérifié.
  async function gateProtected() {
    const db = window.aldeticDb;
    if (!db) {
      if (!alDemo.get("account", null)) return location.href = "connexion.html";
      if (!alDemo.get("phone_verified", false)) return location.href = "verification-telephone.html";
      return;
    }
    const { data } = await db.auth.getSession();
    if (!data.session) return location.href = "connexion.html";
    const { data: prof } = await db.from("profiles").select("phone_verified").eq("id", data.session.user.id).single();
    if (!prof || !prof.phone_verified) location.href = "verification-telephone.html";
  }

  function init() {
    const lang = currentLang();
    const hdr = document.getElementById("site-header");
    const ftr = document.getElementById("site-footer");
    if (hdr) hdr.innerHTML = header(lang);
    if (ftr) ftr.innerHTML = footer(lang);
    applyLang(lang);
    showLanguageChooser(lang);
    const sel = document.getElementById("lang");
    if (sel) sel.addEventListener("change", e => { localStorage.setItem("aldetic-lang", e.target.value); location.reload(); });
    wireUi();
    if (window.alMotion) window.alMotion();
    document.dispatchEvent(new CustomEvent("aldetic:ready", { detail: { lang } }));
  }
  document.addEventListener("DOMContentLoaded", init);
})();
