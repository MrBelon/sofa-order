# Cahier des charges — Sofa Order

## 1. Objectif

Créer une petite application web maison permettant aux convives d'une soirée de commander une boisson depuis leur téléphone, sans avoir à se déplacer.

L'application doit être :

- très simple ;
- jolie ;
- mobile-first ;
- rapide ;
- sans fonctionnalités inutiles ;
- facile à déployer sur Docker / Dokploy.

Les convives peuvent consulter les boissons disponibles et commander une seule boisson à la fois.

L'administrateur peut gérer les boissons disponibles, les catégories et leur état de stock, avec une fonctionnalité de scan de code-barres basée sur Open Food Facts.

Chaque commande est enregistrée en PostgreSQL et transmise à Home Assistant via un webhook.

---

# 2. Stack technique

## Frontend / Backend

- Next.js
- TypeScript
- App Router
- Route Handlers / API Routes
- Prisma
- PostgreSQL
- Validation des données avec Zod
- Interface mobile-first

L'application doit rester monolithique : pas de microservices.

## Déploiement

L'application doit être compatible Docker et facilement déployable sur Dokploy.

Architecture :

```text
Docker
└── drink-order
    └── Next.js

PostgreSQL partagé
```

La base PostgreSQL est externe à l'application et sera fournie via `DATABASE_URL`.

---

# 3. Variables d'environnement

Prévoir au minimum :

```env
DATABASE_URL="postgresql://user:password@postgres:5432/drink_order"

ADMIN_PASSWORD="..."

HOME_ASSISTANT_WEBHOOK_URL="https://..."

NEXT_PUBLIC_APP_NAME="Sofa Order"
```

Le webhook Home Assistant doit rester strictement côté serveur.

**Il ne doit jamais être exposé au navigateur ou inclus dans du code client.**

L'utilisateur ne doit donc pas pouvoir voir directement l'URL du webhook ni la requête envoyée à Home Assistant.

Le navigateur appelle uniquement l'API Next.js de création de commande :

```text
Navigateur
    │
    │ POST /api/orders
    ▼
Next.js / serveur
    │
    │ POST HOME_ASSISTANT_WEBHOOK_URL
    ▼
Home Assistant
```

La requête vers Home Assistant est donc effectuée exclusivement par le serveur.

---

# 4. Identification des utilisateurs

À la première ouverture de l'application, demander le prénom de l'utilisateur.

Exemple :

```text
🥂 Bienvenue !

Avant de commencer...
Comment tu t'appelles ?

[ Robin              ]

       Continuer
```

## Stockage local

Deux informations sont conservées dans `localStorage`.

### UUID utilisateur

Générer un UUID côté navigateur :

```text
userId = "550e8400-e29b-41d4-a716-446655440000"
```

Cet UUID reste identique pendant toute la session d'utilisation du navigateur.

### Prénom

```text
userName = "Robin"
```

Le prénom peut être modifié ultérieurement sans changer le `userId`.

Cela permet de conserver un historique cohérent même si un utilisateur change son prénom.

Il n'est pas nécessaire d'avoir une table `User` en PostgreSQL.

---

# 5. Page principale utilisateur

Après identification, afficher la liste des boissons disponibles.

Les boissons sont regroupées par catégorie.

Exemple :

```text
┌──────────────────────────────┐
│ 🥂 Sofa Order       Robin ⚙ │
├──────────────────────────────┤
│                              │
│ 🍺 Bières                    │
│                              │
│ ┌─────────┐ ┌─────────┐      │
│ │ image   │ │ image   │      │
│ │         │ │         │      │
│ │ Heineken│ │ Grim     │      │
│ │ Blonde  │ │ Blanche  │      │
│ │ 5%      │ │ 6%       │      │
│ │         │ │         │      │
│ │Commander│ │Commander│      │
│ └─────────┘ └─────────┘      │
│                              │
│ 🥤 Softs                     │
│                              │
│ ┌─────────┐ ┌─────────┐      │
│ │ Coca    │ │ Ice Tea │      │
│ └─────────┘ └─────────┘      │
│                              │
└──────────────────────────────┘
```

L'interface doit être conçue mobile-first et être confortable à utiliser depuis un canapé avec un téléphone.

---

# 6. Catégories

Prévoir les catégories suivantes par défaut :

- Bières
- Vins
- Softs
- Alcools
- Cocktails
- Sans alcool

L'administrateur peut :

- créer une catégorie ;
- modifier son nom ;
- supprimer une catégorie si elle n'est plus utilisée.

Il n'est pas nécessaire d'avoir une hiérarchie complexe.

---

# 7. Modèle d'une boisson

Chaque boisson possède au minimum :

```text
id
name
description
imageUrl
categoryId
alcoholPercentage
barcode
source
available
createdAt
updatedAt
```

Exemple :

```text
Nom : Grimbergen Blanche
Description : Bière blanche belge
Catégorie : Bières
Alcool : 6 %
Image : URL Open Food Facts
Code-barres : 123456789
Disponible : oui
```

Le degré d'alcool n'est affiché que lorsqu'il existe.

Pour une boisson sans alcool ou une recette maison sans alcool :

```text
Sirop de grenadine
```

ne doit pas afficher `0 %` automatiquement si aucune valeur n'est renseignée.

---

# 8. Gestion du stock

Ne pas gérer de quantité numérique.

Une boisson possède uniquement un état :

```text
available = true
```

ou :

```text
available = false
```

Cela permet de gérer simplement les boissons dont le volume réel ne correspond pas au nombre de commandes.

Exemple :

> Une bouteille de bière de 75 cl peut servir plusieurs verres.

L'application ne cherche donc pas à calculer automatiquement le stock réel.

## Interface admin

Chaque boisson dispose d'un bouton permettant de basculer entre :

```text
✓ En stock
```

et :

```text
✕ Rupture
```

Lorsqu'une boisson est en rupture :

- elle reste visible côté utilisateur ;
- elle est clairement marquée comme indisponible ;
- elle ne peut plus être commandée.

---

# 9. Commande

Un utilisateur ne peut commander qu'une seule boisson à la fois.

Lorsqu'il clique sur `Commander`, afficher une confirmation.

Exemple :

```text
Tu veux vraiment commander :

🍺 Grimbergen Blanche

pour Robin ?

[ Annuler ]     [ Oui, commander ]
```

Après confirmation :

1. le navigateur appelle l'API Next.js ;
2. le serveur vérifie la disponibilité de la boisson ;
3. le serveur vérifie le cooldown anti-spam ;
4. la commande est enregistrée en PostgreSQL ;
5. le serveur appelle le webhook Home Assistant ;
6. une page de confirmation est affichée à l'utilisateur.

Toutes les vérifications importantes doivent être réalisées côté serveur.

---

# 10. Anti-spam

Un utilisateur ne peut pas passer plus d'une commande toutes les 30 secondes.

Le contrôle doit obligatoirement être réalisé côté serveur.

Le frontend peut également désactiver le bouton pendant 30 secondes pour améliorer l'expérience utilisateur, mais cette protection visuelle ne remplace pas le contrôle serveur.

Le cooldown est associé au `userId`.

Exemple :

```text
Robin → commande → cooldown 30 secondes
```

n'empêche pas :

```text
Alice → commande immédiatement
```

Si l'utilisateur tente une commande trop tôt, retourner une réponse HTTP adaptée, par exemple `429 Too Many Requests`.

---

# 11. Webhook Home Assistant

Après création de la commande, le serveur Next.js doit effectuer une requête :

```http
POST ${HOME_ASSISTANT_WEBHOOK_URL}
Content-Type: application/json
```

Payload exact :

```json
{
  "userName": "Robin",
  "drink": "Grimbergen Blanche"
}
```

Ne rien envoyer d'autre à Home Assistant.

## Sécurité importante

L'appel Home Assistant doit être réalisé **uniquement côté serveur**.

Le navigateur ne doit jamais appeler directement le webhook.

Ne jamais exposer :

```text
HOME_ASSISTANT_WEBHOOK_URL
```

dans :

- une variable `NEXT_PUBLIC_*` ;
- le bundle JavaScript client ;
- le HTML ;
- une réponse API ;
- les données envoyées au navigateur.

Architecture obligatoire :

```text
┌──────────────┐
│ Navigateur   │
└──────┬───────┘
       │
       │ POST /api/orders
       │ { userId, userName, drinkId }
       ▼
┌──────────────────────┐
│ Next.js Server       │
│                      │
│ - validation         │
│ - disponibilité      │
│ - anti-spam          │
│ - création commande  │
└──────────┬───────────┘
           │
           │ POST webhook
           │ { userName, drink }
           ▼
┌──────────────────────┐
│ Home Assistant       │
└──────────────────────┘
```

## Gestion des erreurs

Si Home Assistant ne répond pas :

- la commande doit quand même être enregistrée ;
- le serveur ne doit pas exposer l'URL du webhook à l'utilisateur ;
- la commande doit être marquée avec un statut de webhook en échec ;
- l'utilisateur peut quand même recevoir une confirmation de commande.

Prévoir les statuts :

```text
PENDING
SUCCESS
FAILED
```

---

# 12. Page de confirmation

Après une commande réussie, afficher une page amusante avec un message choisi aléatoirement.

Exemples :

```text
🍺

C'est parti !

Ta Grimbergen Blanche
est en route vers toi.

Normalement.

🥂
```

Messages possibles :

```text
🍺 Ta boisson arrive. Fais semblant d'être patient.

🥂 Excellent choix. Le serveur a été prévenu.

🍹 Une boisson pour toi, une !

🍷 Ta commande est partie. Maintenant, regarde autour de toi d'un air innocent.

🥃 C'est noté. Quelqu'un va bientôt venir sauver ta soirée.

🚀 Commande envoyée à la vitesse de la lumière.
```

Prévoir environ 10 messages en V1.

---

# 13. Historique utilisateur

Ajouter une page `Mes commandes`.

Les commandes sont identifiées par le `userId` stocké dans le navigateur.

Exemple :

```text
Mes commandes

Aujourd'hui

20:42   🍺 Grimbergen Blanche
20:17   🥤 Coca-Cola
19:54   🍹 Cocktail maison
19:12   🍺 Heineken
```

Le prénom enregistré au moment de la commande doit également être stocké dans la commande.

Ainsi, si :

```text
userId = abc-123
userName = Robin
```

puis que l'utilisateur change son prénom :

```text
userId = abc-123
userName = Bob
```

l'historique reste lié au même utilisateur.

---

# 14. Administration

L'administration est accessible via :

```text
/admin
```

Il n'y a aucun système de compte administrateur.

Utiliser uniquement un mot de passe fourni via :

```env
ADMIN_PASSWORD=...
```

Exemple :

```text
┌─────────────────────────────┐
│ Administration              │
│                             │
│ Mot de passe                │
│ [ ******************* ]     │
│                             │
│ [ Connexion ]               │
└─────────────────────────────┘
```

Après authentification, utiliser une session simple basée sur un cookie sécurisé.

Pas besoin de :

- Authentik ;
- OAuth ;
- JWT complexe ;
- utilisateurs admin en base ;
- système de permissions.

---

# 15. Dashboard admin

Afficher une liste simple des boissons.

Exemple :

```text
Administration

[ + Ajouter une boisson ]

────────────────────────────

🍺 Bières

Grimbergen Blanche     ✓ En stock
Heineken               ✕ Rupture

🥤 Softs

Coca-Cola              ✓ En stock
Ice Tea                ✓ En stock

────────────────────────────

📊 Commandes

142 commandes
27 convives
```

Chaque produit permet :

- modifier ;
- supprimer ;
- changer le statut stock / rupture.

---

# 16. Ajout par scan Open Food Facts

Le but est de rendre l'ajout d'une boisson extrêmement rapide.

Ajouter un bouton :

```text
📷 Scanner un produit
```

Depuis un smartphone, demander l'accès à la caméra et scanner le code-barres.

Le code-barres est ensuite utilisé pour rechercher le produit dans Open Food Facts.

Source API :

```text
https://fr.openfoodfacts.org/data
```

La récupération doit être réalisée côté serveur autant que possible afin de centraliser la logique et d'éviter de dépendre directement de l'API depuis le navigateur.

## Données à récupérer

Si disponibles :

- image ;
- nom / titre ;
- description ;
- catégorie ;
- degré d'alcool ;
- code-barres.

Le formulaire d'ajout est automatiquement prérempli.

Exemple :

```text
┌─────────────────────────────┐
│ Ajouter une boisson         │
│                             │
│ 📷 Code-barres              │
│ 3760123456789               │
│                             │
│ [ image ]                   │
│                             │
│ Nom                         │
│ Grimbergen Blanche          │
│                             │
│ Description                 │
│ Bière blanche belge...      │
│                             │
│ Catégorie                   │
│ [ Bières ▼ ]                │
│                             │
│ Alcool                      │
│ 6 %                         │
│                             │
│ Stock                       │
│ ● Disponible                │
│                             │
│ [ Ajouter ]                 │
└─────────────────────────────┘
```

L'administrateur peut modifier les informations récupérées avant de valider.

---

# 17. Produit Open Food Facts introuvable

Si aucun produit n'est trouvé pour le code-barres :

```text
Produit introuvable dans Open Food Facts.
```

Proposer immédiatement :

```text
[ Ajouter manuellement ]
```

L'administrateur peut alors renseigner lui-même les informations.

---

# 18. Ajout manuel

L'ajout manuel est obligatoire pour gérer notamment les recettes maison.

Exemples :

- Sirop de grenadine ;
- Mojito maison ;
- Cocktail surprise ;
- Sirop de menthe ;
- Eau pétillante ;
- Jus maison.

Formulaire :

```text
Nom
Description
Catégorie
Pourcentage d'alcool
Image
Disponible
```

L'image et la description sont facultatives.

---

# 19. Images

Ne pas stocker les images dans PostgreSQL.

Pour les produits provenant d'Open Food Facts, conserver simplement l'URL de l'image.

Pour les boissons ajoutées manuellement :

- image facultative ;
- possibilité de renseigner une URL d'image en V1.

Ne pas mettre en place de système de stockage de fichiers ou de S3 en V1.

---

# 20. Modèle PostgreSQL / Prisma

Proposer un modèle proche de celui-ci :

```prisma
enum DrinkSource {
  MANUAL
  OPEN_FOOD_FACTS
}

enum WebhookStatus {
  PENDING
  SUCCESS
  FAILED
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())

  drinks    Drink[]
}

model Drink {
  id                String      @id @default(uuid())
  name              String
  description       String?
  imageUrl          String?
  barcode           String?     @unique
  alcoholPercentage Float?
  available         Boolean     @default(true)

  categoryId        String
  category          Category    @relation(fields: [categoryId], references: [id])

  source            DrinkSource @default(MANUAL)

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  orders            Order[]
}

model Order {
  id            String        @id @default(uuid())

  userId        String
  userName      String

  drinkId       String
  drinkName     String

  webhookStatus WebhookStatus @default(PENDING)

  createdAt     DateTime      @default(now())

  drink         Drink         @relation(fields: [drinkId], references: [id])

  @@index([userId, createdAt])
  @@index([createdAt])
}
```

Le `drinkName` est volontairement copié dans `Order`.

Si une boisson est renommée plus tard, l'historique doit conserver le nom qui existait au moment de la commande.

---

# 21. API utilisateur

Prévoir notamment :

```http
GET /api/drinks
```

Retourne les boissons et catégories nécessaires à l'interface utilisateur.

```http
POST /api/orders
```

Payload :

```json
{
  "userId": "uuid",
  "userName": "Robin",
  "drinkId": "uuid"
}
```

Le serveur doit vérifier :

1. validité du payload ;
2. existence de la boisson ;
3. disponibilité ;
4. cooldown de 30 secondes ;
5. création de la commande ;
6. appel du webhook Home Assistant.

Le serveur ne doit jamais faire confiance aux données envoyées par le client.

---

# 22. API administration

Prévoir notamment :

```http
POST   /api/admin/drinks
PATCH  /api/admin/drinks/:id
DELETE /api/admin/drinks/:id
```

Recherche Open Food Facts :

```http
POST /api/admin/openfoodfacts
```

Payload :

```json
{
  "barcode": "3760123456789"
}
```

Historique / statistiques :

```http
GET /api/admin/orders
```

Gestion des catégories selon les besoins :

```http
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

Tous les endpoints `/api/admin/*` doivent être protégés par la session administrateur.

---

# 23. Validation

Utiliser Zod pour valider les données côté serveur.

Exemples :

- `userId` doit être un UUID valide ;
- `userName` doit avoir une longueur raisonnable ;
- `drinkId` doit être un UUID ;
- `barcode` doit être valide ;
- les champs texte doivent avoir une longueur maximale ;
- `alcoholPercentage` doit être un nombre positif cohérent.

Ne jamais faire confiance à la validation uniquement réalisée côté client.

---

# 24. Sécurité

Même si l'application est destinée à un usage privé, respecter les règles suivantes :

- mot de passe admin uniquement dans `.env` ;
- webhook Home Assistant uniquement côté serveur ;
- ne jamais utiliser `NEXT_PUBLIC_HOME_ASSISTANT_WEBHOOK_URL` ;
- ne jamais envoyer l'URL du webhook au navigateur ;
- validation Zod côté serveur ;
- Prisma pour les accès PostgreSQL ;
- pas de SQL construit manuellement ;
- cookie admin `HttpOnly` ;
- cookie `Secure` en production ;
- `SameSite=Lax` ;
- endpoints admin protégés ;
- cooldown anti-spam côté serveur.

---

# 25. Interface et design

L'application doit être volontairement légère.

Principes :

- mobile-first ;
- gros boutons ;
- cartes de boissons ;
- images bien visibles ;
- peu de texte ;
- navigation simple ;
- animations légères ;
- interface utilisable avec une seule main ;
- design convivial et légèrement fun.

Pas besoin d'un design system complexe.

Composants principaux possibles :

```text
DrinkCard
CategorySection
ConfirmOrderModal
OrderSuccess
OrderHistory
AdminDrinkCard
DrinkForm
BarcodeScanner
AdminDashboard
```

Le rendu doit être propre aussi bien sur smartphone que sur desktop pour la partie administration.

---

# 26. Statistiques admin

Prévoir une petite section permettant de visualiser :

- nombre total de commandes ;
- nombre de convives différents ;
- boissons les plus commandées ;
- classement des utilisateurs par nombre de commandes.

Exemple :

```text
🍻 Statistiques

142 commandes
27 convives

Top convives

🥇 Robin       23
🥈 Thomas      19
🥉 Julie       17
   Antoine     11
```

Et :

```text
Boissons les plus commandées

1. 🍺 Grimbergen       32
2. 🥤 Coca-Cola        27
3. 🍷 Vin rouge        19
4. 🍹 Mojito           14
```

Les statistiques sont basées uniquement sur les commandes stockées en PostgreSQL.

---

# 27. Gestion du webhook

Lors d'une commande :

```text
1. POST /api/orders
2. Validation du payload
3. Vérification du drink
4. Vérification du stock
5. Vérification du cooldown
6. Création de l'Order avec webhookStatus = PENDING
7. Appel serveur → Home Assistant
8. Mise à jour webhookStatus = SUCCESS ou FAILED
9. Réponse au navigateur
```

Le serveur doit gérer proprement les erreurs réseau et les timeouts du webhook.

Le webhook Home Assistant ne doit jamais être appelé directement par le navigateur.

---

# 28. Fonctionnalités V1

## Utilisateur

- [x] Demande du prénom
- [x] Génération d'un UUID local
- [x] Stockage `localStorage`
- [x] Liste des boissons
- [x] Catégories
- [x] Images
- [x] Description
- [x] Degré d'alcool
- [x] Indication de rupture
- [x] Confirmation avant commande
- [x] Cooldown de 30 secondes
- [x] Création de commande côté serveur
- [x] Webhook Home Assistant côté serveur
- [x] Page de succès humoristique
- [x] Historique personnel

## Administration

- [x] Connexion par mot de passe
- [x] Dashboard
- [x] Ajout manuel
- [x] Modification
- [x] Suppression
- [x] Gestion des catégories
- [x] Stock / rupture
- [x] Scan de code-barres
- [x] Recherche Open Food Facts
- [x] Préremplissage automatique
- [x] Historique des commandes
- [x] Statistiques simples

---

# 29. Fonctionnalités volontairement exclues de la V1

Ne pas ajouter de complexité inutile :

- pas de comptes utilisateurs ;
- pas d'authentification OAuth ;
- pas d'Authentik ;
- pas de JWT complexe ;
- pas de rôles utilisateurs ;
- pas de quantité numérique de stock ;
- pas de paiement ;
- pas de gestion de tables ;
- pas de notifications push ;
- pas de WebSocket ;
- pas de Redis ;
- pas de microservices ;
- pas de synchronisation permanente avec Open Food Facts ;
- pas de stockage d'images complexe ;
- pas de S3 ;
- pas de système de réservation.

L'objectif est de garder une application très légère et maintenable.

---

# 30. Architecture globale

```text
                         ┌─────────────────┐
                         │   Téléphone     │
                         │    convive      │
                         └────────┬────────┘
                                  │
                                  │ HTTPS
                                  ▼
                         ┌─────────────────┐
                         │    Next.js      │
                         │                 │
                         │ UI              │
                         │ API             │
                         │ Admin           │
                         │ OpenFoodFacts   │
                         │ Webhook HA      │
                         └───────┬─────────┘
                                 │
                       ┌─────────┴─────────┐
                       │                   │
                       ▼                   ▼
                ┌──────────────┐    ┌──────────────┐
                │ PostgreSQL   │    │ Home         │
                │ partagé      │    │ Assistant    │
                └──────────────┘    └──────────────┘
```

Ajout d'un produit :

```text
Téléphone admin
      │
      │ scan EAN
      ▼
Next.js Server
      │
      │ requête Open Food Facts
      ▼
Open Food Facts
      │
      │ données produit
      ▼
Formulaire prérempli
      │
      │ validation
      ▼
PostgreSQL
```

Commande :

```text
Téléphone
    │
    │ POST /api/orders
    ▼
Next.js Server
    │
    ├── validation
    ├── disponibilité
    ├── anti-spam
    ├── création commande
    │
    └── POST webhook
              │
              ▼
       Home Assistant
```

---

# 31. Critères d'acceptation

## Utilisateur

- Un nouveau visiteur doit pouvoir être opérationnel en moins de quelques secondes.
- Le prénom est demandé uniquement si aucun prénom n'est présent dans `localStorage`.
- Un UUID utilisateur est généré automatiquement.
- Les boissons sont affichées par catégorie.
- Une boisson en rupture ne peut pas être commandée.
- Une confirmation est affichée avant toute commande.
- Deux commandes du même utilisateur doivent être espacées d'au moins 30 secondes.
- Le cooldown doit être impossible à contourner simplement depuis le navigateur.
- Après commande, un message aléatoire est affiché.
- La commande apparaît dans l'historique.

## Home Assistant

- L'URL du webhook n'est jamais exposée au navigateur.
- Le navigateur ne contacte jamais directement Home Assistant.
- Le serveur envoie uniquement :

```json
{
  "userName": "Robin",
  "drink": "Grimbergen Blanche"
}
```

## Administration

- L'admin peut se connecter avec le mot de passe défini dans `.env`.
- L'admin peut ajouter une boisson manuellement.
- L'admin peut scanner un code-barres depuis son smartphone.
- Les informations disponibles dans Open Food Facts préremplissent automatiquement le formulaire.
- L'admin peut modifier les données avant validation.
- L'admin peut marquer une boisson comme disponible ou en rupture.
- L'admin peut supprimer une boisson.
- L'admin peut consulter les commandes et statistiques.

## Déploiement

- L'application doit fonctionner avec une base PostgreSQL externe.
- Elle doit pouvoir être buildée et exécutée dans Docker.
- Elle doit être déployable facilement sur Dokploy.
- Aucun service supplémentaire obligatoire ne doit être nécessaire en dehors de PostgreSQL.
