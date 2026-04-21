# 📡 Exemples de Requêtes API - Supabase

## Base URL
```
http://localhost:3000/api
```

---

## 1️⃣ Créer un utilisateur

**Endpoint:**
```http
POST /api/supabase/users
Content-Type: application/json

{
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Réponse (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Avec curl:**
```bash
curl -X POST http://localhost:3000/api/supabase/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe"
  }'
```

---

## 2️⃣ Récupérer tous les utilisateurs

**Endpoint:**
```http
GET /api/supabase/users
```

**Réponse (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John Doe",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "jane@example.com",
    "name": "Jane Smith",
    "created_at": "2024-01-15T11:45:00Z"
  }
]
```

**Avec curl:**
```bash
curl http://localhost:3000/api/supabase/users
```

**Avec jq (pretty print):**
```bash
curl http://localhost:3000/api/supabase/users | jq .
```

---

## 3️⃣ Récupérer un utilisateur par ID

**Endpoint:**
```http
GET /api/supabase/users/550e8400-e29b-41d4-a716-446655440000
```

**Réponse (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Avec curl:**
```bash
curl http://localhost:3000/api/supabase/users/550e8400-e29b-41d4-a716-446655440000
```

---

## 4️⃣ Mettre à jour un utilisateur

**Endpoint:**
```http
PUT /api/supabase/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "name": "Jonathan Doe"
}
```

**Réponse (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "name": "Jonathan Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Avec curl:**
```bash
curl -X PUT http://localhost:3000/api/supabase/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jonathan Doe"
  }'
```

---

## 5️⃣ Supprimer un utilisateur

**Endpoint:**
```http
DELETE /api/supabase/users/550e8400-e29b-41d4-a716-446655440000
```

**Réponse (200):**
```json
{
  "success": true
}
```

**Avec curl:**
```bash
curl -X DELETE http://localhost:3000/api/supabase/users/550e8400-e29b-41d4-a716-446655440000
```

---

## 🧪 Script de test complet

```bash
#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:3000/api"

echo -e "${BLUE}🧪 Test API Supabase${NC}\n"

# Test 1: Créer utilisateur
echo -e "${GREEN}1. Créer un utilisateur...${NC}"
USER_ID=$(curl -s -X POST $BASE_URL/supabase/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$RANDOM'@example.com",
    "name": "Test User"
  }' | jq -r '.id')
echo "✅ Utilisateur créé: $USER_ID\n"

# Test 2: Récupérer tous
echo -e "${GREEN}2. Récupérer tous les utilisateurs...${NC}"
curl -s $BASE_URL/supabase/users | jq . 
echo ""

# Test 3: Récupérer un
echo -e "${GREEN}3. Récupérer utilisateur $USER_ID...${NC}"
curl -s $BASE_URL/supabase/users/$USER_ID | jq .
echo ""

# Test 4: Mettre à jour
echo -e "${GREEN}4. Mettre à jour utilisateur...${NC}"
curl -s -X PUT $BASE_URL/supabase/users/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated User"}' | jq .
echo ""

# Test 5: Supprimer
echo -e "${GREEN}5. Supprimer utilisateur...${NC}"
curl -s -X DELETE $BASE_URL/supabase/users/$USER_ID | jq .
echo ""

echo -e "${GREEN}✅ Tests terminés!${NC}"
```

**Exécuter:**
```bash
chmod +x test-supabase.sh
./test-supabase.sh
```

---

## 📌 Importort pour Postman

**Créer nouvelle requête:**

1. **Collection** → Nouveau dossier "Supabase"
2. Importer les requêtes ci-dessus manuellement ou JSON:

```json
{
  "info": {
    "name": "Supabase API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "GET All Users",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/api/supabase/users"
      }
    },
    {
      "name": "POST Create User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"user@example.com\",\n  \"name\": \"User Name\"\n}"
        },
        "url": "http://localhost:3000/api/supabase/users"
      }
    }
  ]
}
```

---

## 🔍 Cas d'erreur courants

### Email manquant
```bash
curl -X POST http://localhost:3000/api/supabase/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John"
  }'
```

Réponse (400):
```json
{
  "statusCode": 400,
  "message": "Email est obligatoire",
  "error": "Bad Request"
}
```

### Utilisateur non trouvé
```bash
curl http://localhost:3000/api/supabase/users/invalid-uuid
```

Réponse (200):
```json
null
```

### Erreur base de données
**Cause:** RLS ou table pas créée

Réponse (500):
```json
{
  "statusCode": 500,
  "message": "Internal Server Error"
}
```

---

## 📊 Headers utiles

```bash
# Voir tous les headers de réponse
curl -i http://localhost:3000/api/supabase/users

# Verbose mode
curl -v http://localhost:3000/api/supabase/users

# Avec authentication (futur)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/supabase/users

# Timeouts
curl --connect-timeout 5 \
  http://localhost:3000/api/supabase/users
```

---

## 🚀 Avec Fetch API (JavaScript)

```javascript
// Créer utilisateur
async function createUser(email, name) {
  const response = await fetch('http://localhost:3000/api/supabase/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, name })
  });
  return response.json();
}

// Récupérer utilisateurs
async function getUsers() {
  const response = await fetch('http://localhost:3000/api/supabase/users');
  return response.json();
}

// Utiliser
createUser('test@example.com', 'Test User').then(console.log);
getUsers().then(console.log);
```

---

## 🎯 Requêtes TypeScript (Axios)

```typescript
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Créer
api.post('/supabase/users', { 
  email: 'test@example.com', 
  name: 'Test' 
}).then(res => console.log(res.data));

// Récupérer
api.get('/supabase/users').then(res => console.log(res.data));

// Mettre à jour
api.put('/supabase/users/ID', { name: 'New Name' });

// Supprimer
api.delete('/supabase/users/ID');
```

---

## ✅ Checklist avant tests

- [ ] Serveur démarré: `npm run start:dev`
- [ ] .env.local créé avec clés Supabase
- [ ] Table `users` créée dans Supabase
- [ ] Port 3000 accessible
- [ ] Supabase online

---

**Prêt à tester! 🚀**
