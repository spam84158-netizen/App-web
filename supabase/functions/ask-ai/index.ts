// Edge Function Supabase. Secrets : GROQ_API_KEY, GROQ_MODEL (à confirmer), AI_DAILY_LIMIT (à confirmer).
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Méthode non autorisée" }, { status: 405 });
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: userData } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (!user) return Response.json({ error: "Connexion requise." }, { status: 401 });

  const { data: prof } = await admin.from("profiles").select("phone_verified").eq("id", user.id).single();
  if (!prof?.phone_verified) return Response.json({ error: "Vérifiez votre numéro pour utiliser l'assistant." }, { status: 403 });

  const { question } = await req.json().catch(() => ({}));
  if (typeof question !== "string" || question.trim().length < 3 || question.length > 1000)
    return Response.json({ error: "Question invalide." }, { status: 400 });

  const limit = Number(Deno.env.get("AI_DAILY_LIMIT") ?? "0");
  if (limit > 0) {
    const since = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();
    const { count } = await admin.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
    if ((count ?? 0) >= limit) return Response.json({ error: "Limite quotidienne atteinte." }, { status: 429 });
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("GROQ_MODEL"),
      messages: [
        { role: "system", content: "Tu es l'assistant d'Aldetic Frontiers. Réponds en français ou dans la langue de la question, de façon claire et prudente." },
        { role: "user", content: question.trim() }
      ]
    })
  });
  if (!res.ok) return Response.json({ error: "Le service IA est indisponible." }, { status: 502 });
  const json = await res.json();
  await admin.from("ai_usage").insert({ user_id: user.id });
  return Response.json({ answer: json.choices?.[0]?.message?.content ?? "" });
});
