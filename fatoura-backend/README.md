# FatouraAI — Backend NestJS

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et configurer le .env
cp .env.example .env
# → Editer .env avec vos paramètres PostgreSQL

# 3. Créer la base de données PostgreSQL
createdb fatoura_db

# 4. Lancer en développement
npm run start:dev
```

L'API sera disponible sur **http://localhost:3000/api**

---

## 📡 Endpoints disponibles

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → retourne `access_token` |
| GET | `/api/auth/me` | Profil utilisateur connecté |
| PATCH | `/api/auth/me` | Modifier le profil |

### Factures
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/invoices` | Liste paginée (`?page=1&limit=20&status=paid&search=`) |
| GET | `/api/invoices/next-number` | Prochain numéro auto |
| GET | `/api/invoices/:id` | Détail d'une facture |
| POST | `/api/invoices` | Créer une facture |
| PATCH | `/api/invoices/:id` | Modifier une facture |
| DELETE | `/api/invoices/:id` | Supprimer |
| POST | `/api/invoices/:id/mark-paid` | Marquer comme payée |
| POST | `/api/invoices/:id/send` | Envoyer par email |
| GET | `/api/invoices/:id/pdf` | Télécharger PDF |

### Stock
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/stock` | Liste (`?search=&category=`) |
| GET | `/api/stock/:id` | Détail |
| POST | `/api/stock` | Créer |
| PUT | `/api/stock/:id` | Modifier |
| DELETE | `/api/stock/:id` | Supprimer |

### Dashboard
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/dashboard` | Stats globales |

### Notifications
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/notifications` | Liste des notifications |

---

## 🔐 Authentification

Toutes les routes (sauf `/auth/login` et `/auth/register`) nécessitent le header :

```
Authorization: Bearer <access_token>
```

---

## 🗄️ Base de données

- **PostgreSQL** requis
- `synchronize: true` en développement (les tables sont créées automatiquement)
- Désactiver `synchronize` en production et utiliser les migrations
