// Edge Function Supabase. Secrets à définir dans Supabase (jamais dans le site) :
//   supabase secrets set RESEND_API_KEY=... NOTIFY_EMAIL=... FROM_EMAIL=...
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });
  const { email, offer_id, message } = await req.json();
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) return new Response("E-mail invalide", { status: 400 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await db.from("applications").insert({ email, offer_id: offer_id ?? null, status: "received" });
  if (error) return new Response("Enregistrement impossible", { status: 500 });

  // Notification interne. Le fournisseur d'e-mail est à choisir (ex. Resend, Brevo).
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("FROM_EMAIL"), to: [Deno.env.get("NOTIFY_EMAIL")],
      subject: "Nouvelle candidature Aldetic", text: `Candidat : ${email}\n\n${(message || "").slice(0, 1000)}`
    })
  });
  return new Response(JSON.stringify({ ok: true, notified: res.ok }), { headers: { "Content-Type": "application/json" } });
});
