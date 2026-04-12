# FatouraAi
FatouraAi est une solution SaaS (Software as a Service) de gestion de facturation électronique , destinée aux commerçants et prestataires de services tunisiens

## Installation

```bash
npm install
```

## Lancement

```bash
npm run start:dev
```

L'application sera disponible sur http://localhost:3000

## API Endpoints

### Authentification

- POST /auth/register - Inscription d'un nouvel utilisateur
- POST /auth/login - Connexion

### Exemples d'utilisation

#### Inscription
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John Doe"}'
```

#### Connexion
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```
