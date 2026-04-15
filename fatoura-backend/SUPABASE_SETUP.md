# 📋 Configuration Supabase - Guide Complet

## 1️⃣ Créer un compte Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur "Sign up"
3. Créez un compte avec GitHub, Google, ou email
4. Créez un nouveau projet

---

## 2️⃣ Configuration initiale du projet

### Créer la table `users`

Allez dans **SQL Editor** et exécutez:

```sql
-- Créer la table users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

-- Ajouter un index sur email pour les recherches rapides
CREATE INDEX idx_users_email ON users(email);

-- Activer Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique: Chaque utilisateur voit ses propres données
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Politique: Chaque utilisateur modifie ses propres données
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Politique: N'importe qui peut créer un utilisateur (inscription)
CREATE POLICY "Anyone can insert"
  ON users
  FOR INSERT
  WITH CHECK (true);
```

---

## 3️⃣ Récupérer vos clés API

### Où les trouver?

1. **Allez dans:** Supabase Dashboard → **Settings** → **API**
2. **Vous verrez:**
   ```
   Project URL: https://xxxxx.supabase.co
   anon key: eyJhbGciOiJIUzI1NiIsIn...
   service_role key: eyJhbGciOiJIUzI1NiIsIn...
   ```

---

## 4️⃣ Configurer variables d'environnement

### Créer `.env.local`

```bash
cp .env.example .env.local
```

Remplissez:

```env
# URL du projet (sans slash final)
SUPABASE_URL=https://your-project.supabase.co

# Clé anon (publique - peut être exposée)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clé service-role (SECRET - ne JAMAIS exposer)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ⚠️ Sécurité

```bash
# Vérifiez que .env.local est dans .gitignore
echo ".env.local" >> .gitignore

# Ne commitez JAMAIS SERVICE_ROLE_KEY
git add .env.local
git status # Vérifiez que .env.local n'est pas stagé
```

---

## 5️⃣ Tester l'intégration

### Démarrer le serveur

```bash
npm run start:dev
```

Vous devriez voir:
```
🚀 FatouraAI Backend running on http://localhost:3000/api
```

### Tester les endpoints

#### A. Créer un utilisateur

```bash
curl -X POST http://localhost:3000/api/supabase/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

Réponse:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "name": "Test User",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### B. Récupérer tous les utilisateurs

```bash
curl http://localhost:3000/api/supabase/users
```

Réponse:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "name": "Test User",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### C. Récupérer un utilisateur spécifique

```bash
curl http://localhost:3000/api/supabase/users/550e8400-e29b-41d4-a716-446655440000
```

#### D. Mettre à jour un utilisateur

```bash
curl -X PUT http://localhost:3000/api/supabase/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

#### E. Supprimer un utilisateur

```bash
curl -X DELETE http://localhost:3000/api/supabase/users/550e8400-e29b-41d4-a716-446655440000
```

---

## 6️⃣ Utiliser Supabase dans d'autres modules

### Exemple: Service d'authentification

```typescript
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async registerUser(email: string, name: string) {
    // Utilisez le service Supabase
    return this.supabaseService.createUser({ email, name });
  }

  async getUser(id: string) {
    return this.supabaseService.getUserById(id);
  }
}
```

Dans `auth.module.ts`:

```typescript
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], // ← Importez le module
  providers: [AuthService],
})
export class AuthModule {}
```

---

## 7️⃣ Vérifier les données dans Supabase

### Via Supabase Dashboard

1. Allez dans **Table Editor**
2. Sélectionnez la table `users`
3. Vous verrez toutes les lignes avec un UI visuel

### Via SQL

1. Allez dans **SQL Editor**
2. Exécutez:

```sql
-- Voir tous les utilisateurs
SELECT * FROM users;

-- Voir les 10 derniers créés
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- Chercher par email
SELECT * FROM users WHERE email LIKE '%example%';

-- Voir les audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;
```

---

## 🔒 Checklist sécurité

- [ ] SERVICE_ROLE_KEY en .env.local seulement
- [ ] .env.local dans .gitignore
- [ ] RLS activé sur table `users`
- [ ] Politiques RLS créées
- [ ] Backend valide permissions
- [ ] Audit Logs activés
- [ ] Variables d'env chargées correctement

---

## 📞 Dépannage

### Erreur: "Variables d'environnement Supabase manquantes"

```
❌ SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY manquantes
```

**Solution:**
```bash
# Vérifiez .env.local
cat .env.local

# Redémarrez le serveur après modification
npm run start:dev
```

### Erreur: "PGRST116 - Relation not found"

**Cause:** Table `users` n'existe pas

**Solution:**
1. Allez dans Supabase SQL Editor
2. Exécutez le script de création de table ci-dessus

### Erreur: "relation 'users' does not exist"

**Cause:** Syntaxe SQL incorrecte ou table supprimée

**Solution:**
```sql
-- Vérifiez table existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'users';

-- Ou recréez-la
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);
```

---

## 📚 Ressources

- [Supabase Docs](https://supabase.com/docs)
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript SDK](https://supabase.com/docs/reference/javascript/introduction)
