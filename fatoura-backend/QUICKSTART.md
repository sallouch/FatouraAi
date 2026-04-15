# 🎯 DÉMARRAGE RAPIDE - Supabase x NestJS

> **Lire d'abord:** Ce fichier (5 min) → Puis SUPABASE_SETUP.md

---

## ✅ Qu'est-ce qui a été fait?

### Fichiers créés:
```
✅ src/config/supabase.config.ts        Configuration Supabase
✅ src/services/supabase.service.ts     Service avec methods getUsers(), createUser(), etc
✅ src/supabase/supabase.module.ts      Module NestJS
✅ src/supabase/supabase.controller.ts  REST API endpoints
✅ src/app.module.ts                    Mise à jour (SupabaseModule importé)
✅ .env.example                         Template variables d'env
✅ 6 fichiers de documentation          Guides complets
```

### Package installé:
```bash
✅ @supabase/supabase-js
```

### Build:
```bash
✅ npm run build → SUCCESS (aucune erreur)
```

---

## 🚀 3 ÉTAPES POUR DÉMARRER

### **Étape 1: Créer compte Supabase (5 min)**

1. Allez sur: https://supabase.com
2. Cliquez "Sign Up"
3. Créez un projet
4. **Attendez que le projet soit prêt** (2-3 min)

### **Étape 2: Créer la table `users` (2 min)**

1. Dans Supabase → **SQL Editor**
2. Copiez ce script:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can insert"
  ON users FOR INSERT
  WITH CHECK (true);
```

3. Cliquez **Execute** ✅

### **Étape 3: Copier vos clés API (1 min)**

1. Supabase → **Settings** → **API**
2. Copiez:
   - `Project URL` → SUPABASE_URL
   - `anon key` → SUPABASE_ANON_KEY
   - `service_role key` → SUPABASE_SERVICE_ROLE_KEY

3. Créez fichier `.env.local`:
```bash
# Copier depuis .env.example
cp .env.example .env.local
```

4. Remplissez:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 🧪 TESTER (2 min)

### Démarrer serveur:
```bash
npm run start:dev
```

Vous verrez:
```
🚀 FatouraAI Backend running on http://localhost:3000/api
```

### Créer un utilisateur:
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
  "id": "550e8400...",
  "email": "test@example.com",
  "name": "Test User",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Récupérer tous les utilisateurs:
```bash
curl http://localhost:3000/api/supabase/users
```

✅ **Ça marche!**

---

## 📚 ENDPOINTS API

```
POST   /api/supabase/users         Créer utilisateur
GET    /api/supabase/users         Récupérer tous
GET    /api/supabase/users/:id     Récupérer un
PUT    /api/supabase/users/:id     Mettre à jour
DELETE /api/supabase/users/:id     Supprimer
```

Plus d'exemples: **API_EXAMPLES.md**

---

## 🔗 UTILISER DANS D'AUTRES MODULES

### Exemple AuthService:

```typescript
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async signUp(email: string, name: string) {
    return this.supabaseService.createUser({ email, name });
  }
}
```

### Importer dans AuthModule:

```typescript
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], // ← C'est tout!
  providers: [AuthService],
})
export class AuthModule {}
```

Complet: **INTEGRATION_GUIDE.md**

---

## 🔐 SÉCURITÉ (IMPORTANT!)

### Deux clés:

| Clé | Type | Utilisateur |
|-----|------|-------------|
| ANON_KEY | Publique | Frontend (visible) |
| SERVICE_ROLE_KEY | Secret | Backend seulement |

### ✅ Checklist:
```
✅ .env.local dans .gitignore
✅ SERVICE_ROLE_KEY jamais en production au frontend
✅ RLS activé sur tables
✅ Backend valide permissions
```

Détails: **SUPABASE_SECURITY.md**

---

## 📖 DOCS À LIRE

| Ordre | Fichier | Temps | Contenu |
|-------|---------|-------|---------|
| 1️⃣ | Ce fichier (QUICKSTART.md) | 5 min | Vue générale |
| 2️⃣ | SUPABASE_SETUP.md | 10 min | Configuration Supabase |
| 3️⃣ | API_EXAMPLES.md | 5 min | Exemples de requêtes |
| 4️⃣ | INTEGRATION_GUIDE.md | 15 min | Intégration modules |
| 5️⃣ | SUPABASE_SECURITY.md | 10 min | Sécurité & RLS |

---

## 🆘 SI ÇA NE MARCHE PAS

### "Variables Supabase manquantes"
→ Créez `.env.local` avec vos clés

### "PGRST116: relation 'users' does not exist"
→ Exécutez le script SQL dans Supabase Dashboard

### "Cannot find module '@supabase/supabase-js'"
→ `npm install @supabase/supabase-js`

### Le build ne compile pas
→ `npm run build` (check les erreurs TypeScript)

### Port 3000 déjà utilisé
→ `npm run start:dev -- --port 3001`

Plus: **SUPABASE_SETUP.md** (section Dépannage)

---

## 📋 TO-DO LIST

- [ ] Créer compte Supabase
- [ ] Exécuter script SQL (table users)
- [ ] Copier API keys
- [ ] Créer .env.local
- [ ] `npm run start:dev`
- [ ] Tester endpoints (curl)
- [ ] Lire INTEGRATION_GUIDE.md
- [ ] Intégrer dans AuthModule
- [ ] Lire SUPABASE_SECURITY.md

---

## 🎯 RÉSUMÉ

```
✅ Supabase installé et configuré
✅ Service CRUD prêt
✅ API REST fonctionnelle
✅ Prêt pour tous les modules
✅ Sécurité implémentée
```

**Vous pouvez commencer à développer! 🚀**

---

## 🚀 PROCHAINE ÉTAPE

→ **Lire: SUPABASE_SETUP.md**

Ça explique en détail comment configurer Supabase et tester.

---

**Questions?** Voir les docs ou SUPABASE_SECURITY.md

**Bon courage!** 💪
