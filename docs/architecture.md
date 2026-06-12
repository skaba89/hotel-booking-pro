# Architecture - Hotel Booking Pro

## Vue d'ensemble

Architecture monorepo avec séparation claire frontend/backend :

```
┌─────────────────┐    ┌──────────────────┐
│   Next.js Web   │───▶│   NestJS API     │
│  (Port 3000)    │    │   (Port 4000)    │
└─────────────────┘    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼─────┐     ┌──────▼──────┐
              │ PostgreSQL │     │    Redis    │
              │  (5432)    │     │   (6379)   │
              └───────────┘     └────────────┘
```

## Flux de réservation

1. Client choisit chambre + dates
2. Frontend demande un `quote` au backend
3. Backend vérifie disponibilité + calcule prix
4. Client remplit formulaire → POST /bookings
5. Backend vérifie à nouveau (transaction DB), crée réservation PENDING
6. Client redirigé vers page paiement
7. Selon méthode :
   - Stripe → Checkout Session → Webhook confirme
   - Mobile Money → Initiation → Webhook confirme
   - Pay at hotel → Confirmation immédiate admin
8. Webhook met à jour Payment + Booking + génère Invoice + envoie emails

## Sécurité paiement

- Jamais de validation côté frontend uniquement
- Webhooks vérifient la signature du provider
- Transaction DB pour éviter double-booking (race condition)
- Le montant officiel vient toujours du backend

## Authentification

- JWT access token (15 min) + refresh token (7 jours)
- RBAC : ADMIN, STAFF, CUSTOMER
- Guards NestJS sur chaque route protégée
- Rate limiting sur login/register/contact

## Base de données

- PostgreSQL via Prisma ORM
- Migrations versionnées
- Seed pour données initiales
- Indexes sur les champs de recherche fréquents
