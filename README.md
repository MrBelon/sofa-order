# Sofa Order 🥂

Petite application web (Next.js + Prisma + PostgreSQL) pour commander une boisson depuis son téléphone pendant une soirée. Chaque commande est enregistrée en base puis transmise à Home Assistant via un webhook, appelé **uniquement côté serveur**.

Cahier des charges : [drink-order-cahier-des-charges.md](./drink-order-cahier-des-charges.md)

## Fonctionnement

- `/` : carte des boissons par catégorie, confirmation, commande (une seule à la fois, cooldown de 30 s par `userId`, contrôlé côté serveur).
- `/success` : page de confirmation avec message aléatoire.
- `/orders` : historique personnel (basé sur l'UUID stocké dans `localStorage`).
- `/admin` : connexion par mot de passe (`ADMIN_PASSWORD`), gestion des boissons, du stock (✓ En stock / ✕ Rupture), des catégories, scan de code-barres (Open Food Facts), statistiques et dernières commandes.

Le webhook reçoit exactement `{ "userName": "...", "drink": "..." }`. Si Home Assistant est injoignable, la commande est quand même enregistrée avec `webhookStatus = FAILED`.

> Note : une boisson supprimée conserve ses commandes (`Order.drinkId` passe à `NULL`, `drinkName` reste), ce qui s'écarte légèrement du schéma du cahier des charges (`drinkId` obligatoire).

## Variables d'environnement

Voir [.env.example](./.env.example).

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL (externe) |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` (sert aussi à signer le cookie de session) |
| `HOME_ASSISTANT_WEBHOOK_URL` | URL du webhook, jamais exposée au navigateur |
| `NEXT_PUBLIC_APP_NAME` | Nom affiché (valeur injectée **au build**) |

## Développement

```bash
cp .env.example .env.local   # puis adapter les valeurs
npm install                  # génère aussi le client Prisma
npx prisma migrate deploy    # applique les migrations (crée aussi les catégories par défaut)
npm run dev
```

La caméra (scan de code-barres) nécessite HTTPS, sauf sur `localhost`. Un champ de saisie manuelle du code-barres est disponible en secours.

## Docker / Dokploy

```bash
docker build --build-arg NEXT_PUBLIC_APP_NAME="Sofa Order" -t drink-order .
docker run -p 3000:3000 \
  -e DATABASE_URL=... -e ADMIN_PASSWORD=... -e HOME_ASSISTANT_WEBHOOK_URL=... \
  drink-order
```

Le conteneur applique les migrations (`prisma migrate deploy`) puis démarre Next.js sur le port 3000. Sur Dokploy : déploiement via le `Dockerfile`, variables d'environnement ci-dessus, et `NEXT_PUBLIC_APP_NAME` en *build argument*. Le cookie admin est `Secure` en production : servir l'application en HTTPS (proxy Dokploy/Traefik).
