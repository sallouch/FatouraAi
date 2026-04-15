# 🔐 Sécurité Supabase - Guide Complet

## 📚 Table des matières
1. [Authentification & Clés](#authentification)
2. [Row Level Security (RLS)](#row-level-security)
3. [Frontend vs Backend](#frontend-vs-backend)
4. [Bonnes pratiques](#bonnes-pratiques)

---

## 🔑 Authentification

### Les deux clés Supabase

| Clé | Type | Utilisation | Contexte |
|-----|------|-------------|---------|
| **ANON_KEY** | Publique | Frontend - respecte RLS | Navigateur |
| **SERVICE_ROLE_KEY** | Secrète | Backend - bypasse RLS | Serveur seulement |

### ⚠️ IMPORTANT
```
ANON_KEY        → Autorisée en production (visible dans le code)
SERVICE_ROLE_KEY → JAMAIS en production au frontend (exposée)
                  → À protéger comme un mot de passe
                  → Uniquement en variables d'environnement serveur
```

---

## 🛡️ Row Level Security (RLS)

### Qu'est-ce que c'est?
RLS permet de contrôler l'accès aux données au niveau des lignes SQL directement dans la base de données.

### Exemple: Table Users

```sql
-- Activez RLS sur la table 'users'
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique 1: Chaque utilisateur ne peut voir que ses propres données
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Politique 2: Chaque utilisateur peut mettre à jour ses propres données
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Politique 3: Tout le monde peut s'inscrire (pas de auth.uid())
CREATE POLICY "Anyone can insert"
  ON users
  FOR INSERT
  WITH CHECK (true);
```

### Configuration dans Supabase Dashboard

1. **Allez dans:** SQL Editor → Exécutez les requêtes ci-dessus
2. **Ou via UI:** Authentication → Policies → Créez les politiques

---

## 🎯 Frontend vs Backend

### Frontend (React/Vue/Svelte)

```typescript
// ✅ CORRECT - Utilise ANON_KEY
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY  // ← Clé publique
);

// Appellez l'API Backend pour les opérations sensibles
async function createUser(email: string) {
  const response = await fetch('/api/supabase/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
}

// Si l'utilisateur est authentifié:
const user = await supabase.auth.getUser();
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id);  // ← RLS protège automatiquement!
```

### Backend (NestJS)

```typescript
// ✅ CORRECT - Utilise SERVICE_ROLE_KEY
import { supabaseAdmin } from '../config/supabase.config';

// ByPass RLS pour les opérations administrateur
const allUsers = await supabaseAdmin
  .from('users')
  .select('*');  // ← Retourne TOUS les utilisateurs (pas de RLS)
```

---

## 🔒 Bonnes pratiques

### 1️⃣ Gestion des Clés
```bash
# ✅ CORRECT
SUPABASE_ANON_KEY=public_key        # Peut être commitée
SUPABASE_SERVICE_ROLE_KEY=secret    # JAMAIS commiter

# ✅ Ajouter à .gitignore
.env.local
.env
.env.*.local
```

### 2️⃣ Pattern: Backend comme Proxy

```typescript
// ❌ MAUVAIS: Frontend appelle directement Supabase
// User peut modifier `userId` dans la console → accès non autorisé

// ✅ BON: Backend valide requêtes
@Post('users/:id/profile')
async updateProfile(
  @Param('id') targetId: string,
  @Req() request: any,
) {
  const currentUserId = request.user.id;
  
  // Vérifiez l'authentification
  if (currentUserId !== targetId) {
    throw new ForbiddenException('Non autorisé');
  }
  
  // Puis appelez Supabase
  return this.supabaseService.updateUser(targetId, updates);
}
```

### 3️⃣ Politiques RLS pour Admin

```sql
-- Les admins peuvent voir/modifier tout
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 4️⃣ Audit & Logging

```typescript
// Loggez les opérations sensibles
async createUser(user: Partial<User>) {
  const data = await supabaseAdmin.from('users').insert([user]);
  
  this.logger.log(
    `User created: ${user.email} by ${user.createdBy || 'system'}`
  );
  
  return data;
}

// Supabase Audit Log
// Supabase enregistre automatiquement toutes les opérations !
// Consultez-les dans: Dashboard → Database → Audit Logs
```

---

## 📊 Architecture de sécurité complète

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React/Vue)                                        │
│ • VITE_SUPABASE_ANON_KEY (publique)                         │
│ • Respecte automatiquement RLS                              │
│ • Pour opérations sensibles → appelle Backend               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ API HTTP
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Backend (NestJS)                                            │
│ • SUPABASE_SERVICE_ROLE_KEY (secret dans .env)             │
│ • Valide les permissions utilisateur                        │
│ • Logs & Audit séquestré                                    │
│ • Encrypt sensitive data avant Supabase                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Supabase Client SDK
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Supabase (PostgreSQL + Auth)                               │
│ • Row Level Security (RLS) policies                         │
│ • Audit Logs automatiques                                   │
│ • Encryption at rest                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Sécurité

- [ ] SERVICE_ROLE_KEY en .env.local uniquement
- [ ] RLS activé sur toutes les tables
- [ ] Politiques RLS créées et testées
- [ ] Backend valide les permissions utilisateur
- [ ] Audit Logs activés dans Supabase
- [ ] Sensitive data encryptés avant stockage
- [ ] API Backend rate limitée
- [ ] CORS configuré correctement
- [ ] JWT tokens exportés après usage
- [ ] .env en .gitignore

---

## 🧪 Test de Sécurité

```bash
# Test 1: Vérifiez RLS
curl http://localhost:3000/api/supabase/users \
  -H "Authorization: Bearer $ANON_KEY"
# Doit retourner uniquement vos données

# Test 2: Vérifiez SERVICE_ROLE bypass
curl http://localhost:3000/api/supabase/users
# Retourne tous les utilisateurs (backend = trust)

# Test 3: Admin ne peut ignorer RLS
# Dans Supabase Dashboard → SQL → SELECT * FROM users;
# Vérifiez que RLS s'applique même depuis le panel
```

---

## 📚 Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
