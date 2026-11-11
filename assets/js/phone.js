/* Vérification du numéro : contrôle de l'indicatif, puis code simulé rempli automatiquement après 2,5 s. */
const SIMULATE_SMS = true; // Mettre à false dès qu'un vrai fournisseur SMS est branché.

document.addEventListener("aldetic:ready", async () => {
  const db = window.aldeticDb;
  const country = document.getElementById("country"), phone = document.getElementById("phone");
  const stepPhone = document.getElementById("step-phone"), stepCode = document.getElementById("step-code");
  const codeInput = document.getElementById("code"), wait = document.getElementById("wait");
  let picked = null, userId = null, pendingCode = "";

  window.ALDETIC_COUNTRIES.forEach((c, i) => country.add(new Option(`${c.name} (+${c.dial})`, i)));
  country.value = window.ALDETIC_COUNTRIES.findIndex(c => c.dial === "33");

  if (db) {
    const { data } = await db.auth.getSession();
    if (!data.session) { location.href = "connexion.html"; return; }
    userId = data.session.user.id;
  } else if (!alDemo.get("account", null)) {
    location.href = "connexion.html"; return;
  }

  // Un numéro vérifié n'a pas à repasser par cette étape.
  if (db) {
    const { data } = await db.from("profiles").select("phone_verified").eq("id", userId).single();
    if (data && data.phone_verified) { location.href = "tableau-de-bord.html"; return; }
  } else if (alDemo.get("phone_verified", false)) { location.href = "tableau-de-bord.html"; return; }

  stepPhone.addEventListener("submit", async e => {
    e.preventDefault();
    const c = window.ALDETIC_COUNTRIES[country.value];
    const digits = phone.value.replace(/\D/g, "").replace(/^0/, "");
    const err = document.getElementById("perr");
    if (!/^\d+$/.test(digits) || digits.length < c.min || digits.length > c.max) {
      err.textContent = document.documentElement.lang === "en"
        ? `Invalid number for ${c.name}: ${c.min === c.max ? c.min : c.min + " to " + c.max} digits expected after the country code.`
        : `Numéro invalide pour ${c.name} : ${c.min === c.max ? c.min : c.min + " à " + c.max} chiffres attendus après l'indicatif.`;
      return;
    }
    err.textContent = "";
    picked = `+${c.dial}${digits}`;
    if (db) {
      const { error } = await db.from("profiles").update({ phone: picked }).eq("id", userId);
      if (error) { err.textContent = tr("Enregistrement impossible : ") + error.message; return; }
    } else alDemo.set("account", { ...alDemo.get("account", {}), phone: picked });

    stepPhone.hidden = true; stepCode.hidden = false;
    document.getElementById("sent").textContent = (document.documentElement.lang === "en" ? `Code sent to ${picked}.` : `Code envoyé au ${picked}.`);
    wait.hidden = false;
    setTimeout(() => {
      // Code simulé : rempli automatiquement, puis validé.
      pendingCode = String(Math.floor(100000 + Math.random() * 900000));
      codeInput.value = pendingCode;
      wait.hidden = true;
      if (SIMULATE_SMS) document.getElementById("simnote").hidden = false;
      verify();
    }, 2500);
  });

  async function verify() {
    if (codeInput.value.length !== 6) { document.getElementById("cerr").textContent = tr("Saisissez les 6 chiffres."); return; }
    if (db) {
      const { error } = await db.from("profiles").update({ phone_verified: true }).eq("id", userId);
      if (error) { document.getElementById("cerr").textContent = error.message; return; }
    } else alDemo.set("phone_verified", true);
    toast(tr("Numéro vérifié"));
    setTimeout(() => location.href = "tableau-de-bord.html", 700);
  }
  stepCode.addEventListener("submit", e => { e.preventDefault(); verify(); });
});
