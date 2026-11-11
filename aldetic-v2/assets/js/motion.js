/* Mouvement Aldetic.
   - Entrée de page orchestrée : en-tête, titre mot par mot, texte d'introduction.
   - Un trait cobalt se déploie au début de chaque section (horizon).
   - Cartes et panneaux apparaissent en groupe au défilement.
   - Erreurs : le champ concerné se secoue une fois.
   - Navigation entre pages : fondu court.
   Tout est désactivé si l'utilisateur réduit les animations. */
window.alMotion = function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!window.gsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  // 1. Découpe les mots des titres (noeuds texte seulement, les <em> sont conservés)
  document.querySelectorAll("main h1").forEach(h => {
    const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      if (!n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
        else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
      });
      n.parentNode.replaceChild(frag, n);
    });
  });

  // 2. Entrée de page
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".site-header", { y: -14, opacity: 0, duration: .6 }, 0)
    .from(".eyebrow", { x: -14, opacity: 0, duration: .6 }, .15)
    .from("main h1 .w", { y: 26, opacity: 0, duration: .9, stagger: .055 }, .2)
    .from("main .lead, main [data-intro]:not(h1):not(.eyebrow)", { y: 16, opacity: 0, duration: .8, stagger: .08 }, .45);

  // 3. Groupes de cartes : apparition au défilement, par lot
  const groups = "main .panel, main article, main .modules li, main .eco > div, main .empty, main .feed .row, main .card, main [data-reveal]";
  ScrollTrigger.batch(groups, {
    start: "top 90%", once: true,
    onEnter: batch => gsap.from(batch, { y: 22, opacity: 0, duration: .75, ease: "power2.out", stagger: .08, overwrite: true })
  });

  // 4. Trait d'horizon à chaque section
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  }), { threshold: .15 });
  document.querySelectorAll("main section, footer").forEach(s => io.observe(s));

  // 5. Erreur de saisie : secousse courte du champ concerné
  const shake = el => {
    if (!(el instanceof Element) || !el.classList.contains("err") || !el.textContent.trim()) return;
    const field = el.closest(".field") || el.parentElement;
    if (!field) return;
    gsap.fromTo(field, { x: 0 }, { keyframes: { x: [-7, 6, -4, 2, 0] }, duration: .42, ease: "power1.out" });
  };
  new MutationObserver(ms => ms.forEach(m => shake(m.target)))
    .observe(document.body, { subtree: true, childList: true, characterData: true });

  // 6. Changement de page : fondu court (sans bloquer les liens externes ni les ancres)
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:)/.test(href) || !href.endsWith(".html")) return;
    e.preventDefault();
    gsap.to("main, .site-footer", { opacity: 0, y: -8, duration: .22, ease: "power1.in", onComplete: () => location.href = href });
  });
};
