# Hotel Booking Pro - SETIFANA

Plateforme complète de réservation hôtelière pour l'Hotel SETIFANA à Conakry, Guinée.

## Stack technique

- **Frontend** : Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend** : NestJS, TypeScript, Prisma ORM, PostgreSQL
- **Paiements** : Stripe, PayPal, Mobile Money (Orange, MTN, Wave)
- **Email** : Resend
- **PDF** : PDFKit
- **Infrastructure** : Docker Compose, Redis

## Démarrage rapide

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone <repo-url>
cd hotel-booking-pro

# Setup automatique
chmod +x scripts/setup.sh
./scripts/setup.sh

# Ou manuellement :
npm install
cp .env.example .env
docker compose up -d postgres redis
npx prisma migrate dev --name init
npx prisma generate
npx ts-node prisma/seed.ts
```

### Lancer en développement

```bash
npm run dev
```

- Frontend : http://localhost:3000
- Backend API : http://localhost:4000
- Admin : http://localhost:3000/admin/login

### Identifiants admin par défaut

- Email : `admin@setifana.com`
- Mot de passe : `Admin@2024!`

## Structure du projet

```
hotel-booking-pro/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Types et utilitaires partagés
├── prisma/
│   ├── schema.prisma # Schéma base de données
│   └── seed.ts       # Données initiales
├── scripts/          # Scripts utilitaires
├── docs/             # Documentation
└── docker-compose.yml
```

## API Endpoints

### Public

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/rooms | Liste des chambres |
| GET | /api/rooms/:slug | Détail chambre |
| GET | /api/rooms/featured | Chambres en vedette |
| GET | /api/availability | Vérifier disponibilité |
| POST | /api/bookings/quote | Devis réservation |
| POST | /api/bookings | Créer réservation |
| GET | /api/bookings/:reference | Détail réservation |
| POST | /api/payments/stripe/create-session | Paiement Stripe |
| POST | /api/payments/pay-at-hotel | Paiement à l'hôtel |
| GET | /api/services | Services hôtel |
| GET | /api/reviews | Avis clients |
| POST | /api/contact | Message contact |

### Admin (authentifié)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/admin/dashboard/stats | KPIs |
| GET | /api/admin/bookings | Liste réservations |
| PATCH | /api/admin/bookings/:id/status | Modifier statut |
| POST | /api/admin/rooms | Créer chambre |
| PATCH | /api/admin/rooms/:id | Modifier chambre |
| GET | /api/admin/export/bookings.csv | Export CSV |

## Déploiement

### Frontend (Vercel)

```bash
cd apps/web
vercel deploy
```

### Backend (Railway / Render)

Configurer les variables d'environnement et déployer le dossier `apps/api`.

### Docker (production)

```bash
docker compose up -d
```

## Variables d'environnement

Voir `.env.example` pour la liste complète.

## Fonctionnalités principales

- Site vitrine premium SEO-friendly
- Moteur de réservation en 3 étapes
- Paiement multi-providers (Stripe, PayPal, Mobile Money, à l'hôtel)
- Confirmation par email automatique
- Génération de reçu PDF
- Webhooks sécurisés pour validation paiement
- Back-office admin complet (dashboard KPI, CRUD, exports)
- Vérification stricte des disponibilités (anti double-booking)
- Responsive mobile-first
- Sécurité JWT + RBAC + rate limiting

## Licence

Propriétaire - Hotel SETIFANA
