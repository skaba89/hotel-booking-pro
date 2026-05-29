# Hotel SETIFANA — Guide de Configuration & Formation

**Version** : 1.0  
**Derniere mise a jour** : Mai 2026  
**Plateforme** : Hotel Booking Pro

---

## Table des matieres

1. [Introduction](#1-introduction)
2. [Acces a l'administration](#2-acces-a-ladministration)
3. [Tableau de bord](#3-tableau-de-bord)
4. [Gestion des reservations](#4-gestion-des-reservations)
5. [Gestion des chambres](#5-gestion-des-chambres)
6. [Gestion des paiements](#6-gestion-des-paiements)
7. [Gestion des clients](#7-gestion-des-clients)
8. [Gestion des services](#8-gestion-des-services)
9. [Gestion des avis](#9-gestion-des-avis)
10. [Messages de contact](#10-messages-de-contact)
11. [Analytiques](#11-analytiques)
12. [Parametres generaux](#12-parametres-generaux)
13. [Site public — Parcours client](#13-site-public--parcours-client)
14. [Configuration initiale du serveur](#14-configuration-initiale-du-serveur)
15. [Maintenance et operations courantes](#15-maintenance-et-operations-courantes)
16. [FAQ et depannage](#16-faq-et-depannage)

---

## 1. Introduction

Hotel Booking Pro est une plateforme de reservation en ligne complete comprenant :

- **Un site public** accessible aux clients pour consulter les chambres, effectuer des reservations et suivre leurs sejours
- **Un back-office administratif** pour gerer les reservations, les chambres, les paiements et toutes les operations de l'hotel

### Roles utilisateur

| Role    | Acces                                                      |
|---------|------------------------------------------------------------|
| ADMIN   | Acces complet a toutes les fonctionnalites                  |
| STAFF   | Acces au back-office (reservations, chambres, clients)     |

---

## 2. Acces a l'administration

### Connexion

1. Ouvrez votre navigateur et accedez a : `https://votre-domaine.com/admin/login`
2. Entrez votre **adresse email** et votre **mot de passe**
3. Cliquez sur **Se connecter**

> **Identifiants par defaut** :  
> Email : `admin@setifana.com`  
> Mot de passe : `Admin@2024!`  
> **Important** : Changez ce mot de passe immediatement apres la premiere connexion.

### Deconnexion

- Cliquez sur l'icone de **profil** en haut a droite
- Selectionnez **Deconnexion**
- Ou cliquez sur l'icone de deconnexion en bas de la barre laterale

### Session et securite

- La session expire apres **15 minutes** d'inactivite
- Si votre session expire, vous serez redirige automatiquement vers la page de connexion
- Le systeme renouvelle automatiquement votre session tant que vous etes actif dans le back-office

---

## 3. Tableau de bord

Le tableau de bord (`/admin/dashboard`) est votre vue d'ensemble de l'activite de l'hotel.

### Indicateurs affiches

| Indicateur          | Description                                              |
|---------------------|----------------------------------------------------------|
| Total reservations  | Nombre total de reservations depuis l'ouverture          |
| Revenus totaux      | Somme de tous les paiements recus (statut PAID)          |
| Reservations du jour| Reservations creees aujourd'hui                          |
| Taux d'occupation   | Pourcentage de chambres occupees aujourd'hui              |
| Chambres disponibles| Nombre de chambres en statut AVAILABLE                    |
| Chambres en maintenance | Chambres temporairement indisponibles                |

### Dernieres reservations

Un tableau affichant les 10 reservations les plus recentes avec :
- Reference de reservation
- Nom du client
- Chambre reservee
- Statut (code couleur)

### Derniers paiements

Les 10 derniers paiements recus avec montant, methode et statut.

---

## 4. Gestion des reservations

**Menu** : Reservations (`/admin/bookings`)

### Vue d'ensemble

La page affiche toutes les reservations sous forme de tableau avec :
- **Reference** : Code unique de la reservation (ex: BK-XXXXXXXX)
- **Client** : Nom et email du client
- **Chambre** : Chambre reservee
- **Dates** : Arrivee et depart
- **Montant** : Total en GNF
- **Statut reservation** : En attente / Confirmee / Annulee / Terminee / No-show
- **Statut paiement** : En attente / Paye / A l'hotel / Echoue

### Filtrer les reservations

1. **Recherche** : Tapez un nom, email ou reference dans la barre de recherche
2. **Filtre par statut** : Utilisez les boutons de filtre (Tous / En attente / Confirmes / Annules)

### Modifier le statut d'une reservation

1. Cliquez sur l'icone **oeil** pour voir les details
2. Dans la modale, utilisez les boutons d'action :
   - **Confirmer** : Passe la reservation en CONFIRMED
   - **Annuler** : Passe la reservation en CANCELLED (une raison peut etre ajoutee)
   - **Terminer** : Marque le sejour comme COMPLETED
   - **No-show** : Le client ne s'est pas presente

> **Attention** : L'annulation d'une reservation envoie automatiquement un email de notification au client.

### Statuts des reservations

| Statut     | Couleur  | Description                                    |
|------------|----------|------------------------------------------------|
| PENDING    | Jaune    | Reservation en attente de confirmation          |
| CONFIRMED  | Vert     | Reservation confirmee                           |
| CANCELLED  | Rouge    | Reservation annulee                             |
| COMPLETED  | Bleu     | Sejour termine                                  |
| NO_SHOW    | Gris     | Client ne s'est pas presente                    |

### Exporter les reservations

Cliquez sur le bouton **Exporter CSV** pour telecharger l'historique complet au format Excel/CSV.
Le fichier contient : Reference, Client, Email, Chambre, Dates, Montant, Statuts.

---

## 5. Gestion des chambres

**Menu** : Chambres (`/admin/rooms`)

### Liste des chambres

Affiche toutes les chambres avec :
- Nom de la chambre
- Prix par nuit (GNF)
- Capacite (adultes/enfants)
- Surface (m2)
- Nombre de photos
- Statut (Disponible / Maintenance / Desactivee)

### Ajouter une nouvelle chambre

1. Cliquez sur le bouton **+ Nouvelle chambre**
2. Remplissez le formulaire :

| Champ              | Obligatoire | Description                                      |
|--------------------|:-----------:|--------------------------------------------------|
| Nom                | Oui         | Ex: "Suite Presidentielle", "Chambre Standard"  |
| Prix par nuit      | Oui         | Prix en GNF (ex: 850000)                         |
| Description        | Non         | Description detaillee pour la page de la chambre |
| Description courte | Non         | Resume affiche dans les cartes de la liste       |
| Capacite           | Non         | Nombre total de personnes                        |
| Adultes max        | Non         | Nombre max d'adultes                             |
| Enfants max        | Non         | Nombre max d'enfants                             |
| Type de lit        | Non         | Ex: "King Size", "Twin", "Double"               |
| Surface (m2)       | Non         | Ex: 35                                           |
| Equipements        | Non         | Liste separee par des virgules                   |
| Mise en avant      | Non         | Cocher pour afficher en page d'accueil           |

3. Cliquez sur **Creer la chambre**
4. Apres la creation, l'interface de gestion des photos s'affiche automatiquement

### Gerer les photos d'une chambre

1. Ouvrez la modale d'edition d'une chambre (icone crayon)
2. La section **Photos** est en bas de la modale
3. Deux methodes d'ajout :

**Methode 1 — Upload depuis votre ordinateur :**
- Cliquez sur **Choisir un fichier**
- Selectionnez une image (JPG, PNG, max 5 Mo)
- L'image est uploadee automatiquement

**Methode 2 — URL externe :**
- Collez l'URL d'une image hebergee en ligne
- Ajoutez un texte alternatif (description)
- Cliquez sur **Ajouter**

**Supprimer une photo :**
- Cliquez sur l'icone poubelle (X) sur la miniature de la photo
- Confirmez la suppression

> **Conseil** : La premiere photo de la liste sera l'image principale affichee sur le site. Ajoutez au moins 3 photos par chambre pour un meilleur taux de conversion.

### Modifier une chambre

1. Cliquez sur l'icone **crayon** a cote de la chambre
2. Modifiez les champs souhaites
3. Cliquez sur **Sauvegarder**

### Statuts des chambres

| Statut      | Description                                    |
|-------------|------------------------------------------------|
| AVAILABLE   | Chambre disponible a la reservation            |
| MAINTENANCE | Chambre temporairement indisponible            |
| DISABLED    | Chambre retiree du site                        |

> **Note** : Mettre une chambre en MAINTENANCE ou DISABLED ne l'empeche pas d'avoir des reservations existantes. Seules les nouvelles reservations seront bloquees.

### Supprimer une chambre

1. Cliquez sur l'icone **poubelle**
2. Confirmez la suppression

> **Attention** : La suppression est irreversible. Les reservations associees seront conservees dans l'historique mais la chambre ne sera plus visible.

---

## 6. Gestion des paiements

**Menu** : Paiements (`/admin/payments`)

### Methodes de paiement disponibles

| Methode        | Icone       | Description                              |
|----------------|-------------|------------------------------------------|
| Carte bancaire | Carte       | Via Stripe (Visa, Mastercard, etc.)      |
| Mobile Money   | Telephone   | Orange Money, MTN, Wave                  |
| A l'hotel      | Billets     | Paiement a l'arrivee                     |

### Statuts des paiements

| Statut   | Couleur | Description                         |
|----------|---------|-------------------------------------|
| SUCCESS  | Vert    | Paiement recu et confirme           |
| PENDING  | Jaune   | En attente de confirmation           |
| FAILED   | Rouge   | Paiement echoue                     |
| REFUNDED | Violet  | Paiement rembourse                   |

### Consulter un paiement

Cliquez sur l'icone **oeil** pour voir les details : montant, methode, date, reference de reservation associee.

---

## 7. Gestion des clients

**Menu** : Clients (`/admin/customers`)

### Liste des clients

Affiche tous les clients ayant effectue au moins une reservation :
- Nom complet
- Email
- Telephone
- Pays
- Date d'inscription

### Rechercher un client

Tapez un nom, email ou telephone dans la barre de recherche.

### Voir le profil client

Cliquez sur **oeil** pour voir :
- Informations personnelles
- Historique de reservations
- Total des depenses

---

## 8. Gestion des services

**Menu** : Services (`/admin/services`)

Les services sont affiches sur la page publique "Services" du site.

### Ajouter un service

1. Cliquez sur **+ Nouveau service**
2. Remplissez :
   - **Nom** : Ex: "Restaurant", "Piscine", "Spa"
   - **Slug** : Identifiant URL (genere automatiquement)
   - **Description** : Texte descriptif pour le site
   - **Icone** : Nom de l'icone (facultatif)
   - **Actif** : Cocher pour afficher sur le site
   - **Ordre** : Numero pour le tri d'affichage

3. Cliquez sur **Sauvegarder**

### Modifier / Supprimer

- Icone **crayon** pour modifier
- Icone **poubelle** pour supprimer

---

## 9. Gestion des avis

**Menu** : Avis (`/admin/reviews`)

### Moderer les avis

Les avis soumis par les clients doivent etre approuves avant publication.

1. Un avis non approuve apparait sans le badge de validation
2. Cliquez sur **Approuver** (icone coche) pour le publier
3. Cliquez sur **Supprimer** (icone poubelle) pour le retirer

### Informations affichees

- Nom du client
- Note (etoiles sur 5)
- Commentaire
- Date de soumission

---

## 10. Messages de contact

**Menu** : Messages (`/admin/contact-messages`)

### Gerer les messages

Les messages soumis via le formulaire de contact du site arrivent ici.

| Statut   | Description                                   |
|----------|-----------------------------------------------|
| NEW      | Nouveau message, non lu (bordure doree)       |
| READ     | Message lu                                    |
| ANSWERED | Reponse envoyee au client                     |
| ARCHIVED | Message archive                               |

### Actions

- Cliquez sur un message pour le lire
- Changez le statut via les boutons (Marquer comme lu, Repondu, Archiver)
- L'email et le telephone du client sont affiches pour repondre directement

---

## 11. Analytiques

**Menu** : Analytiques (`/admin/analytics`)

### Donnees disponibles

- **Taux d'occupation** : Graphique sur 30 jours montrant le % de chambres occupees par jour
- **Statistiques generales** : Reprend les indicateurs du tableau de bord avec plus de detail
- **Tendances** : Evolution des reservations et revenus

### Lecture du graphique d'occupation

- L'axe horizontal = les 30 derniers jours
- L'axe vertical = pourcentage d'occupation (0-100%)
- Une barre haute = forte occupation
- Objectif recommande : > 70% en moyenne

---

## 12. Parametres generaux

**Menu** : Parametres (`/admin/settings`)

### Informations de l'hotel

| Parametre     | Description                          | Exemple               |
|---------------|--------------------------------------|-----------------------|
| Nom           | Nom de l'hotel                       | Hotel SETIFANA        |
| Email         | Email de contact                     | contact@setifana.com  |
| Telephone     | Numero principal                     | +224 666 05 76 20     |
| WhatsApp      | Numero WhatsApp                      | +224 666 05 76 20     |
| Adresse       | Adresse complete                     | Conakry, Guinee       |
| Devise        | Code devise                          | GNF                   |
| Taux de taxe  | TVA en pourcentage                   | 18                    |

### Paiements

Activez ou desactivez chaque methode de paiement :
- **Stripe** : Paiement par carte bancaire
- **PayPal** : Paiement PayPal
- **Mobile Money** : Orange Money, MTN, Wave
- **Paiement a l'hotel** : Paiement a l'arrivee

### Reservation

| Parametre          | Description                                           |
|--------------------|-------------------------------------------------------|
| Heures annulation  | Delai avant l'arrivee pour annulation gratuite (heures) |
| Heure check-in     | Ex: "14:00"                                          |
| Heure check-out    | Ex: "12:00"                                          |

### Sauvegarder

Cliquez sur **Sauvegarder** en haut de la page apres toute modification.

---

## 13. Site public — Parcours client

### Comment un client effectue une reservation

1. Le client visite le site et consulte les chambres
2. Il clique sur **Reserver** sur la chambre souhaitee
3. **Etape 1** : Il selectionne ses dates, le nombre de personnes et la chambre
4. **Etape 2** : Il remplit ses informations personnelles (nom, email, telephone)
5. **Etape 3** : Il choisit le mode de paiement :
   - **Carte bancaire** : Redirige vers Stripe (paiement securise)
   - **Mobile Money** : Saisie du numero de telephone
   - **Paiement a l'hotel** : Confirmation directe
6. Il recoit un email de confirmation avec sa reference de reservation
7. Il peut consulter sa page de confirmation avec un lien vers le PDF

### Comment un client suit sa reservation

1. Le client accede a la page **Suivre ma reservation** (`/track`)
2. Il saisit :
   - Sa **reference de reservation** (ex: BK-XXXXXXXX)
   - Son **adresse email** utilisee lors de la reservation
3. Le systeme affiche les details : statut, chambre, dates, montant

### Comment un client annule sa reservation

1. Depuis la page de suivi, apres avoir saisi reference + email
2. Option d'annulation disponible si la reservation est en statut PENDING ou CONFIRMED
3. Un email de confirmation d'annulation est envoye

---

## 14. Configuration initiale du serveur

### Prerequis techniques

| Composant    | Version minimum | Description                    |
|-------------|-----------------|--------------------------------|
| Node.js     | 18+             | Runtime JavaScript             |
| PostgreSQL  | 14+             | Base de donnees relationnelle  |
| Redis       | 6+              | Cache et rate limiting         |
| Docker      | 20+             | Deploiement containerise       |

### Variables d'environnement essentielles

Avant le premier deploiement, configurez le fichier `.env.production` :

#### Base de donnees
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/hotel_booking_pro?schema=public"
```

#### Authentification (OBLIGATOIRE)
```
JWT_SECRET="[cle aleatoire de 64+ caracteres]"
JWT_REFRESH_SECRET="[AUTRE cle aleatoire de 64+ caracteres, differente de JWT_SECRET]"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
```

Generez vos cles avec la commande :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **Important** : Les deux cles JWT_SECRET et JWT_REFRESH_SECRET doivent etre **differentes**.

#### Frontend
```
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

#### Stripe (paiement carte)
```
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Configuration Stripe :
1. Creez un compte sur [stripe.com](https://stripe.com)
2. Activez votre compte en mode **Live**
3. Copiez les cles API depuis Dashboard > Developpeurs > Cles API
4. Configurez le webhook : Dashboard > Developpeurs > Webhooks
   - URL : `https://api.votre-domaine.com/webhooks/stripe`
   - Evenements : `checkout.session.completed`, `payment_intent.succeeded`

#### Email transactionnel (Resend)
```
RESEND_API_KEY="re_..."
EMAIL_FROM="Hotel SETIFANA <noreply@votre-domaine.com>"
```

Configuration :
1. Creez un compte sur [resend.com](https://resend.com)
2. Ajoutez et verifiez votre domaine
3. Generez une cle API

#### CORS (domaines autorises)
```
CORS_ORIGINS="https://votre-domaine.com,https://www.votre-domaine.com"
```

### Deploiement avec Docker

```bash
# 1. Clonez le projet
git clone <URL_DU_DEPOT>
cd hotel-booking-pro

# 2. Configurez l'environnement
cp .env.production .env

# 3. Lancez les conteneurs
docker compose up -d

# 4. Initialisez la base de donnees (premiere fois uniquement)
docker compose exec api npx prisma db push

# 5. Creez l'administrateur initial
docker compose exec api npx prisma db seed
```

### Deploiement sans Docker

```bash
# 1. Installez les dependances
npm install

# 2. Configurez l'environnement
cp .env.production .env

# 3. Generez le client Prisma
npx prisma generate

# 4. Synchronisez la base de donnees
npx prisma db push

# 5. Construisez les applications
cd apps/api && npm run build
cd apps/web && npm run build

# 6. Lancez
cd apps/api && npm run start:prod &
cd apps/web && npm run start &
```

### Verification post-deploiement

Verifiez que tout fonctionne :

| Test                          | URL                               | Resultat attendu           |
|-------------------------------|-----------------------------------|----------------------------|
| API Health                    | `GET /api/health`                 | `{"status":"ok"}`          |
| Site public                   | `/`                               | Page d'accueil visible     |
| Admin login                   | `/admin/login`                    | Page de connexion          |
| Liste des chambres            | `/rooms`                          | Chambres affichees         |

---

## 15. Maintenance et operations courantes

### Sauvegardes de la base de donnees

**Quotidiennement** (recommande) :
```bash
# Avec Docker
docker compose exec postgres pg_dump -U postgres hotel_booking_pro > backup_$(date +%Y%m%d).sql

# Sans Docker
pg_dump -U postgres hotel_booking_pro > backup_$(date +%Y%m%d).sql
```

**Restaurer une sauvegarde** :
```bash
psql -U postgres hotel_booking_pro < backup_20260527.sql
```

### Mise a jour de l'application

```bash
# 1. Arretez les services
docker compose down

# 2. Recuperez les derniers changements
git pull origin main

# 3. Reconstruisez et relancez
docker compose up -d --build

# 4. Appliquez les migrations si necessaire
docker compose exec api npx prisma db push
```

### Surveillance des logs

```bash
# Voir les logs API en temps reel
docker compose logs -f api

# Voir les logs du site web
docker compose logs -f web

# Voir les logs de la base de donnees
docker compose logs -f postgres
```

### Gestion des images uploadees

Les images des chambres sont stockees dans le volume `uploads_data`.

- **Emplacement** : `/app/uploads/` dans le conteneur API
- **Taille max** : 5 Mo par fichier
- **Formats acceptes** : JPG, PNG, WebP
- **Sauvegarde** : Incluez le volume `uploads_data` dans vos sauvegardes

### Ajouter un nouvel administrateur

Actuellement, les comptes administrateurs sont crees via la base de donnees :

```bash
# Accedez a la console Prisma
docker compose exec api npx prisma studio
```

Puis dans la table `User`, ajoutez une ligne avec :
- `email` : email du nouvel admin
- `password_hash` : hash bcrypt du mot de passe
- `full_name` : nom complet
- `role` : `ADMIN` ou `STAFF`
- `is_active` : `true`

---

## 16. FAQ et depannage

### "Je ne peux pas me connecter a l'admin"

1. Verifiez que vous utilisez la bonne URL : `/admin/login`
2. Verifiez vos identifiants (email + mot de passe)
3. Si votre session a expire, reconnectez-vous
4. Videz le cache du navigateur et reessayez

### "Un client dit ne pas recevoir d'email de confirmation"

1. Verifiez que la cle `RESEND_API_KEY` est configuree
2. Verifiez les logs API : `docker compose logs api | grep email`
3. Demandez au client de verifier son dossier spam
4. Verifiez que le domaine d'envoi est authentifie dans Resend

### "Le paiement par carte ne fonctionne pas"

1. Verifiez que Stripe est active dans Parametres
2. Verifiez les cles Stripe dans `.env`
3. Verifiez que le webhook est configure dans le dashboard Stripe
4. Consultez les logs Stripe : `docker compose logs api | grep stripe`

### "Une chambre n'apparait pas sur le site"

1. Verifiez que la chambre est en statut **AVAILABLE**
2. Verifiez qu'elle a au moins une photo
3. Si elle doit apparaitre en page d'accueil, cochez **Mise en avant**

### "Le site est lent"

1. Verifiez la connexion Redis : `docker compose exec redis redis-cli ping` → `PONG`
2. Verifiez les performances de PostgreSQL
3. Les images sont optimisees automatiquement par Next.js
4. En cas de forte charge, augmentez les ressources du serveur

### "Comment changer la devise ou le taux de taxe ?"

Allez dans **Parametres** > section **Informations hotel** :
- Modifiez le champ **Devise** (ex: GNF, EUR, USD)
- Modifiez le champ **Taux de taxe** (ex: 18 pour 18%)
- Cliquez sur **Sauvegarder**

### "Comment desactiver un moyen de paiement ?"

Allez dans **Parametres** > section **Paiements** :
- Decochez le moyen de paiement a desactiver
- Cliquez sur **Sauvegarder**

---

## Contacts support technique

| Type           | Contact                                |
|----------------|----------------------------------------|
| Email          | contact@setifana.com                   |
| WhatsApp       | +224 666 05 76 20                      |
| Support technique | Contactez l'equipe de developpement |

---

*Document genere pour Hotel SETIFANA — Plateforme Hotel Booking Pro*
