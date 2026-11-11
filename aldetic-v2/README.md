# Aldetic Platform — v2

Site statique (HTML, CSS, JavaScript) avec mouvement GSAP et connexion optionnelle à Supabase.
Publication possible sur Cloudflare Pages, Netlify ou GitHub Pages, sans serveur payant.

## Pages (21)
| Fichier | Rôle |
|---|---|
| index.html | Accueil : hero, modules, pourquoi Aldetic, carrières, entrée de communauté |
| a-propos.html | Mission, vision, valeurs, feuille de route par phases |
| services.html | Services par catégorie (onglets), conditions et statut de chaque module |
| projets.html | Projets publics, recherche et filtre |
| communaute.html | Developer Hub : publier, aimer, signaler (démonstration locale) |
| carrieres.html | Offres (vide tant qu'aucune n'est publiée), candidature avec contrôle de fichier |
| tarifs.html | Formule gratuite, premium (à confirmer), règles de parrainage |
| documentation.html | Guides, recherche, commandes Termux copiables |
| contact.html | Formulaire avec validation par sujet |
| connexion.html / inscription.html | Authentification Supabase |
| tableau-de-bord.html | Espace connecté : formule, quotas, activité |
| git.html | MY GIT : création de dépôt et commandes Termux |
| cloud.html | MY CLOUD : contrôle d'archive ZIP, étapes de déploiement |
| chat.html | AI CHAT : interface prête, modèle à confirmer |
| api.html | API CENTER : clés et catalogue (création après serveur) |
| editor.html, terminal.html, studio.html | MY EDITOR, MY TERMINAL, AI STUDIO : en préparation |
| conditions.html, confidentialite.html | Brouillons à faire relire |

## Mode démonstration et mode connecté
- Sans base connectée, les données (publications, dépôts, projets) restent dans le navigateur et chaque page l'indique.
- Rien n'est simulé comme un succès serveur : envois, déploiements et clés affichent leur état réel.

## Brancher Supabase
1. Créer un projet sur supabase.com.
2. **Project Settings > API** : copier l'URL et la clé **anon public**.
3. Renseigner `assets/js/config.js` (remplacer `YOUR_SUPABASE_URL` et `YOUR_SUPABASE_ANON_KEY`).
4. **SQL Editor** : exécuter `supabase/schema.sql`.
5. **Authentication** : garder e-mail et mot de passe activés.

Ne jamais mettre la clé `service_role` dans le site ni dans le dépôt.

## Structure
- `assets/css/base.css` : système de design (couleurs, typographie, composants, responsive).
- `assets/js/app.js` : langue, en-tête, pied de page, démonstration locale.
- `assets/js/motion.js` : animations GSAP (entrée, révélations, traits), désactivées si l'utilisateur réduit les mouvements.
- `assets/js/auth.js`, `supabase.js`, `config.js` : connexion et configuration.

## Ce qui reste à faire (honnêtement)
- Traductions : fr et en sont en place pour les textes marqués ; es, pt, de et ar retombent sur l'anglais et doivent être ajoutés (attributs `data-es`, `data-pt`, `data-de`, `data-ar`).
- Logo définitif et charte couleurs (à valider).
- Branchement réel : publications, candidatures, messages, dépôts Git, déploiements, assistant IA, clés API. Ils demandent un serveur ou des fonctions dédiées.
- Relecture juridique des conditions et de la confidentialité.
- Tests sur appareils réels : Playwright n'est pas exécuté dans cet environnement.

## Mise en ligne depuis Termux
```
pkg install git unzip
cd ~/storage/downloads
unzip aldetic-platform.zip -d aldetic-platform
cd aldetic-platform
git init && git add . && git commit -m "Initial import"
git branch -M main
git remote add origin ADRESSE_DU_DEPOT
git push -u origin main
```

## Ajouts v3
- **admin.html** : candidatures, réservées au rôle propriétaire. La vérification est faite par la base (RLS), pas seulement à l'écran. Attribuer le rôle après la première inscription du compte, via la section « Administration » de `schema.sql`.
- **Connexion Google** : bouton présent, à activer dans Supabase (Authentication > Providers > Google).
- **Validation par e-mail** : activée dans Supabase (Authentication > Email). Le code et le lien sont envoyés par Supabase.
- **Candidatures** : `supabase/functions/notify-application` enregistre la candidature et envoie une notification à l'adresse définie dans les secrets (`NOTIFY_EMAIL`). Clés d'envoi à fournir, jamais dans le site.
- **APK** : squelette WebView dans `android/`, non compilé ici. Logo officiel à créer.
- Aucune adresse e-mail personnelle n'est écrite dans le code du site.

## Ajouts v4 : vérification du numéro et assistant IA
- Après l'inscription : `verification-telephone.html`. Le pays et l'indicatif sont vérifiés (longueur du numéro par pays, liste à confirmer).
- **Code simulé** : `assets/js/phone.js`, constante `SIMULATE_SMS`. Après 2,5 s le code est rempli et l'accès est donné. Ce n'est PAS une vérification de possession du numéro. Avant production, remplacer par un envoi SMS réel (fournisseur à choisir) et une validation côté serveur.
- Sécurité à traiter avant production : `phone_verified` est actuellement écrit par le navigateur. Il faut le passer côté serveur (fonction avec clé service_role) pour qu'un utilisateur ne puisse pas se déclarer vérifié.
- Pages connectées : accès seulement avec session et numéro vérifié (`gateProtected` dans app.js).
- **Demander à l'IA** : bouton sur toutes les pages, appelle `supabase/functions/ask-ai`. Secrets à définir : `GROQ_API_KEY`, `GROQ_MODEL` (à confirmer), `AI_DAILY_LIMIT` (à confirmer). Réservé aux comptes à numéro vérifié.
