# Hotel Booking Pro — SETIFANA

Plateforme complète de réservation hôtelière pour l'Hôtel SETIFANA à Conakry, Guinée.

## Stack technique

- **Frontend** : Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend** : NestJS, TypeScript, Prisma ORM, PostgreSQL
- **Paiements** : Stripe, PayPal, Mobile Money (Orange, MTN, Wave)
- **Email** : Gmail SMTP / Resend
- **PDF** : PDFKit
- **Infrastructure** : Docker Compose, Redis, Nginx

---

## Démarrage rapide (local sans Docker)

### Prérequis
- Node.js 20+
- PostgreSQL 14+ (ou utiliser Docker juste pour la DB)
- npm 10+

### Installation

```bash
# 1. Installer les dépendances (tous les workspaces)
npm ci

# 2. Copier et remplir les variables d'environnement
cp .env.example .env
# → éditer .env avec DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, etc.

# 3. Valider + générer le client Prisma
# Utilise le CLI Prisma local (v5.x) — évite les conflits avec un Prisma global v6/v7+
npm run db:validate
npm run db:generate

# 4. Appliquer les migrations (base vide → schéma complet)
node_modules/.bin/prisma migrate deploy

# 5. Seed (données initiales : admin + chambres)
npm run db:seed
```

### Lancer en développement

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4005 |
| Admin | http://localhost:3000/admin/login |
| Prisma Studio | `npx prisma studio` |

### Identifiants admin par défaut

| Champ | Valeur |
|---|---|
| Email | `admin@setifana.com` |
| Mot de passe | `Admin@2024!` |

---

## Commandes de vérification

```bash
# Validation schéma Prisma (utilise le CLI local v5.x)
npm run db:validate

# Génération du client Prisma
npm run db:generate

# Build API (NestJS)
npm run build:api
# ou : npm run build --workspace=apps/api

# Build Frontend (Next.js)
npm run build:web
# ou : npm run build --workspace=apps/web

# Lint (tous les workspaces)
npm run lint

# Tests unitaires API (93 tests)
npm run test          # raccourci racine
# ou :
npm run test --workspace=apps/api
```

> ⚠️ **Note Prisma CLI** : Si vous avez Prisma 6+ installé globalement (`npx prisma --version`),
> utilisez `npm run db:validate` / `npm run db:generate` au lieu de `npx prisma …`
> pour forcer l'usage de la version locale `^5.22.0` incluse dans `node_modules`.

---

## Déploiement Docker (local / production)

### Prérequis
- Docker ≥ 24 + Docker Compose v2
- Un fichier `.env` à la racine (optionnel — les valeurs par défaut sont sécurisées pour le développement)

### Variables obligatoires en production

```bash
JWT_SECRET=<64 chars random>          # openssl rand -hex 32
JWT_REFRESH_SECRET=<64 chars random>  # différent de JWT_SECRET
POSTGRES_PASSWORD=<strong password>
```

### Lancer la stack complète

```bash
# Vérifier la config docker-compose
docker compose config

# Démarrer (build + run)
docker compose up --build

# En arrière-plan
docker compose up --build -d

# Seed (première fois uniquement)
docker compose run --rm seed
```

### Ports exposés

| Service | Port hôte | Port conteneur |
|---|---|---|
| PostgreSQL | 5432 | 5432 |
| Redis | 6380 | 6379 |
| API (NestJS) | 4000 | 4000 |
| Web (Next.js) | 3000 | 3000 |
| Nginx (proxy) | 80 | 80 |

### Architecture Docker

```
                  ┌─────────────────────┐
  Browser ──80──▶ │      Nginx          │
                  │  /api/*  ──▶ api:4000
                  │  /*      ──▶ web:3000
                  └─────────────────────┘
                         │          │
                    ┌────┘          └────┐
                    ▼                    ▼
              ┌──────────┐       ┌──────────┐
              │  api:4000│       │  web:3000│
              │  NestJS  │       │  Next.js │
              └────┬─────┘       └──────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
    ┌──────────┐     ┌──────────┐
    │ postgres │     │  redis   │
    │  :5432   │     │  :6379   │
    └──────────┘     └──────────┘
```

### Health checks

- API : `GET http://localhost:4000/api/health`
- Nginx : `GET http://localhost/nginx-health`
- Web : `GET http://localhost:3000/`

---

## Structure du projet

```
hotel-booking-pro/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/         # JWT, refresh tokens, vérif. email
│   │   │   ├── bookings/     # Réservations + anti double-booking
│   │   │   ├── payments/     # Stripe, PayPal, Mobile Money
│   │   │   ├── admin/        # Dashboard, stats, notifications
│   │   │   ├── health/       # GET /api/health
│   │   │   └── ...
│   │   └── Dockerfile
│   └── web/              # Next.js 14 frontend
│       ├── app/
│       │   ├── (admin)/      # Back-office admin
│       │   └── (public)/     # Site vitrine + compte client
│       └── Dockerfile
├── prisma/
│   ├── schema.prisma     # Schéma DB (validé ✅)
│   ├── migrations/       # Migrations SQL versionnées
│   └── seed.ts           # Données initiales
├── nginx/
│   └── nginx.conf        # Reverse proxy config
├── docker-compose.yml    # Stack Docker complète
└── package.json          # Monorepo workspaces
```

---

## API Endpoints (sélection)

### Public

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | Health check (DB + uptime) |
| GET | `/api/rooms` | Liste des chambres |
| GET | `/api/rooms/:slug` | Détail chambre |
| POST | `/api/bookings/quote` | Devis réservation |
| POST | `/api/bookings` | Créer réservation |
| GET | `/api/bookings/:reference` | Suivi réservation |
| POST | `/api/auth/register` | Inscription client |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/auth/reset-password` | Réinitialiser MDP |
| POST | `/api/auth/verify-email` | Vérifier email |

### Auth client (JWT requis)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/auth/me` | Profil utilisateur |
| PATCH | `/api/auth/profile` | Modifier profil |
| GET | `/api/auth/my-bookings` | Mes réservations |

### Admin (JWT + rôle ADMIN/STAFF)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/dashboard/stats` | KPIs |
| GET | `/api/admin/dashboard/chart/occupancy` | Taux d'occupation hebdo |
| GET | `/api/admin/dashboard/chart/revenue` | Revenus mensuels |
| GET | `/api/admin/notifications` | Réservations en attente |
| GET | `/api/admin/bookings` | Liste réservations |
| PATCH | `/api/admin/bookings/:id/status` | Modifier statut |
| GET | `/api/admin/export/bookings.csv` | Export CSV |

---

## Sécurité

- **Anti double-booking** : `SELECT ... FOR UPDATE` (verrou pessimiste au niveau ligne)
- **Auth** : JWT access (15 min) + refresh token rotatif (7 jours, stocké en DB)
- **Rate limiting** : ThrottlerGuard global (100 req/60s), surcharge sur les routes sensibles
- **XSS** : SanitizePipe global (strip HTML sur tous les body)
- **Whitelist settings** : seules les clés autorisées sont acceptées en `PATCH /admin/settings`
- **RBAC** : rôles ADMIN / STAFF / CUSTOMER
- **Cookies** : `httpOnly`, `secure` (prod), `sameSite: strict`
- **Secrets** : validation au démarrage — arrêt si JWT_SECRET absent en production

---

## Variables d'environnement

Voir `.env.example` pour la liste complète et commentée.

---

## Licence

Propriétaire — Hôtel SETIFANA, Conakry, Guinée.
