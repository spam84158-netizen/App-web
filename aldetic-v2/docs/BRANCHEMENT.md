# Branchement des services — offres gratuites, sans que l'utilisateur quitte Aldetic

## Principe
- Les comptes sont **ceux d'Aldetic**, pas ceux des utilisateurs. L'utilisateur ne s'inscrit que sur Aldetic.
- Toutes les clés vivent dans les **secrets** de Supabase (Edge Functions > Secrets), jamais dans le code du site ni dans le dépôt.
- Les limites des offres gratuites sont **à vérifier sur la page tarifs du fournisseur avant la mise en ligne**. Elles changent souvent.

## Ce que chaque service apporte (gratuit)
| Besoin | Service | Rôle | Limite à vérifier |
|---|---|---|---|
| Comptes, base, e-mails de connexion | Supabase | Auth, données, fonctions serveur | Mise en pause après inactivité ; quotas e-mail intégrés |
| E-mails (notifications, confirmations) | Resend | Envoi d'e-mails transactionnels | Volume mensuel gratuit |
| IA (AI CHAT, Demander à l'IA) | Groq | Modèle de langage | Quotas par minute et par jour |
| Dépôts (MY GIT) | GitHub (organisation gratuite) | Dépôts privés cachés derrière MY GIT | Dépôts privés gratuits ; nombre d'appels API |
| Publication (MY CLOUD) | Cloudflare Pages | Sites statiques, URL publique | Nombre de projets, builds, taille |

## Étape 1 — Créer les comptes (une seule fois, par toi)
1. **Supabase** : déjà fait.
2. **Resend** : créer un compte, puis une clé API. Vérifier un domaine d'envoi dès que `aldeticfrontiers.com` est acheté ; en attendant, utiliser l'adresse de test fournie par Resend.
3. **Groq** : créer un compte, puis une clé API. Choisir le modèle gratuit disponible au moment de l'activation.
4. **GitHub** : créer une **organisation** (ex. `aldetic-platform`). Créer un jeton **fine-grained** limité à cette organisation, avec droits « Contents » et « Administration » sur les dépôts.
5. **Cloudflare** : créer un compte gratuit. Noter l'**Account ID**. Créer un **jeton API** avec la permission « Cloudflare Pages : Edit » uniquement.

## Étape 2 — Mettre les clés dans Supabase (sans terminal)
Supabase > ton projet > **Edge Functions** > **Secrets**, puis ajouter :

| Nom du secret | Valeur | Utilisé par |
|---|---|---|
| `RESEND_API_KEY` | clé Resend | notify-application |
| `NOTIFY_EMAIL` | adresse qui reçoit les candidatures | notify-application |
| `FROM_EMAIL` | expéditeur (ex. `onboarding@resend.dev` en test) | notify-application |
| `GROQ_API_KEY` | clé Groq | ask-ai |
| `GROQ_MODEL` | nom du modèle choisi (à confirmer) | ask-ai |
| `AI_DAILY_LIMIT` | nombre de questions par jour et par utilisateur (ex. 20, à confirmer) | ask-ai |
| `GITHUB_TOKEN` | jeton GitHub (étape 4) | MY GIT (à venir) |
| `GITHUB_ORG` | nom de l'organisation | MY GIT (à venir) |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | MY CLOUD (à venir) |
| `CLOUDFLARE_API_TOKEN` | jeton Pages | MY CLOUD (à venir) |

Les fonctions `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournies automatiquement par Supabase : ne pas les copier ailleurs.

## Étape 3 — Déployer les fonctions
Supabase > **Edge Functions** > créer `notify-application` et `ask-ai`, coller le contenu des fichiers du dossier `supabase/functions/`. Aucune installation sur ton ordinateur n'est nécessaire.

## Étape 4 — E-mail de connexion réel (gratuit)
Supabase > **Authentication** > **Email** : activer la confirmation d'adresse. Pour la production, configurer un SMTP personnalisé (Resend) afin que les e-mails ne soient pas limités.
Supabase > **Authentication** > **Providers** > **Google** : activer si tu veux la connexion Google (demande un identifiant OAuth créé dans Google Cloud, gratuit).

## Étape 5 — MY GIT sans que l'utilisateur voie GitHub
- La plateforme crée le dépôt dans l'organisation GitHub, puis génère un **jeton limité à ce seul dépôt**, affiché une fois.
- L'utilisateur copie les commandes Termux générées par Aldetic ; elles contiennent l'adresse du dépôt et le jeton.
- Limite honnête : le jeton est visible par l'utilisateur, donc il ne doit avoir que les droits sur son dépôt. Le révoquer est possible à tout moment depuis Aldetic.
- Alternative plus propre plus tard : un service Git (Forgejo) sur un serveur, quand le budget le permettra.

## Étape 6 — MY CLOUD sans que l'utilisateur voie Cloudflare
- L'utilisateur importe son ZIP sur Aldetic. La fonction serveur le décompresse et l'envoie à Cloudflare Pages avec le jeton de la plateforme.
- L'utilisateur reçoit une adresse du type `nomprojet.aldetic.pages.dev` (ou sous-domaine Aldetic une fois le domaine acheté).
- Les journaux de publication sont renvoyés à l'utilisateur ; les identifiants Cloudflare ne quittent jamais le serveur.

## Ordre conseillé
1. E-mail (Resend + SMTP Supabase) : utile tout de suite pour les candidatures et la confirmation.
2. IA (Groq) : la fonction est déjà écrite, il suffit des secrets.
3. MY CLOUD (Cloudflare Pages) : le plus utile pour les utilisateurs, à faire après le point 1.
4. MY GIT (GitHub) : après MY CLOUD, car le déploiement dépend souvent d'un dépôt.
5. SMS réel : seulement si un budget est prévu.

## Ce que je peux écrire maintenant et ce qui dépend de toi
- Je peux écrire les fonctions MY CLOUD et MY GIT dès que tu me confirmes que les comptes Cloudflare et GitHub existent et que les secrets sont créés. Je ne peux pas créer ces comptes ni saisir tes clés.
- Je ne peux pas non plus tester les appels réels depuis ici : il faudra un essai sur ton projet Supabase.
