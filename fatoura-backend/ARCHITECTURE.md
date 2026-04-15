# 🏗️ Architecture Visuelle - Supabase x NestJS

## Level 1: Global Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        FatouraAI Application                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐        ┌──────────────────┐                 │
│  │   Frontend       │        │   Mobile App     │                 │
│  │ (React/Vue)      │        │  (iOS/Android)   │                 │
│  │                  │        │                  │                 │
│  │ VITE_SUPABASE_   │        │ SUPABASE_ANON_   │                 │
│  │ ANON_KEY         │────┬───│ KEY              │                 │
│  │                  │    │   │                  │                 │
│  └──────────────────┘    │   └──────────────────┘                 │
│                          │                                        │
│  ┌───────────────────────▼──────────────────────────────────┐    │
│  │              NestJS Backend (Port 3000)                 │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │  Controllers & Services                        │   │    │
│  │  │  ┌────────────┬────────────┬────────────┐      │   │    │
│  │  │  │   Auth     │   Stock    │  Invoice   │      │   │    │
│  │  │  └────────────┴────────────┴────────────┘      │   │    │
│  │  └──────────────────┬──────────────────────────────┘   │    │
│  │  ┌──────────────────▼──────────────────────────────┐   │    │
│  │  │  SupabaseService (Injectable)                 │   │    │
│  │  │  ✓ getUsers()                                 │   │    │
│  │  │  ✓ createUser()                               │   │    │
│  │  │  ✓ updateUser()                               │   │    │
│  │  │  ✓ deleteUser()                               │   │    │
│  │  └──────────────────┬──────────────────────────────┘   │    │
│  │  ┌──────────────────▼──────────────────────────────┐   │    │
│  │  │  Supabase Configuration                       │   │    │
│  │  │  ┌──────────────┬─────────────────────┐       │   │    │
│  │  │  │ supabaseAdmin│ (SERVICE_ROLE_KEY) │       │   │    │
│  │  │  │ supabaseAnon │ (ANON_KEY)         │       │   │    │
│  │  │  └──────────────┴─────────────────────┘       │   │    │
│  │  └──────────────────┬──────────────────────────────┘   │    │
│  │                     │                                   │    │
│  └─────────────────────┼───────────────────────────────────┘    │
│                        │                                        │
│  ┌─────────────────────▼───────────────────────────────────┐    │
│  │               Supabase Cloud                           │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │       PostgreSQL Database                      │   │    │
│  │  │  ┌──────────────────────────────────────────┐  │   │    │
│  │  │  │ Table: users                            │  │   │    │
│  │  │  │ ├─ id (UUID)                            │  │   │    │
│  │  │  │ ├─ email (VARCHAR)                      │  │   │    │
│  │  │  │ ├─ name (VARCHAR)                       │  │   │    │
│  │  │  │ └─ created_at (TIMESTAMP)               │  │   │    │
│  │  │  └──────────────────────────────────────────┘  │   │    │
│  │  │                                                │   │    │
│  │  │  Row Level Security (RLS) Policies:          │   │    │
│  │  │  ✓ SELECT: Users see own data              │   │    │
│  │  │  ✓ UPDATE: Users edit own data             │   │    │
│  │  │  ✓ INSERT: Anyone can register             │   │    │
│  │  │                                                │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Level 2: Request Flow

### Scénario 1: User Registration (Frontend)

```
Frontend (React)
    │
    ├─ user.email = "john@example.com"
    │  user.password = "secure123"
    │
    ▼
Fetch POST /api/auth/register
    │
    ├─ Content-Type: application/json
    │  { email: "john@example.com", name: "John" }
    │
    ▼
NestJS Backend
    │
    ├─ AuthController.register()
    │
    ├─ Validate email is not used
    │
    ├─ Call: SupabaseService.createUser()
    │
    ▼
Supabase Config
    │
    ├─ Use: supabaseAdmin (SERVICE_ROLE_KEY)
    │
    ▼
Supabase API
    │
    ├─ INSERT INTO users (email, name, created_at)
    │
    ▼
PostgreSQL Database
    │
    ├─ RLS Policies Check:
    │  ✓ INSERT policy: "Anyone can insert" → PASS
    │
    ├─ Create: UUID, timestamp
    │
    ▼
Return Response
    │
    ├─ { id: "...", email: "john@example.com", ... }
    │
    ▼
Frontend (React)
    │
    └─ ✅ User registered successfully!
```

---

### Scénario 2: Get Own Profile (Frontend)

```
Frontend (React)
    │
    ├─ Logged in as: user@example.com
    │  Have: VITE_SUPABASE_ANON_KEY
    │
    ▼
Fetch GET /api/supabase/users/{id}
    │
    ├─ Authorization: Bearer JWT_TOKEN (optional)
    │
    ▼
NestJS Backend
    │
    ├─ SupabaseController.getUserById(id)
    │
    ├─ Call: SupabaseService.getUserById(id)
    │
    ▼
Supabase Config
    │
    ├─ Use: supabaseAdmin (SERVICE_ROLE_KEY)
    │  (Backend knows it's trusted)
    │
    ▼
Supabase API
    │
    ├─ SELECT * FROM users WHERE id = ?
    │
    ▼
PostgreSQL with RLS
    │
    ├─ RLS Check:
    │  "Users can view own data"
    │  auth.uid() = id ?
    │
    ├─ NOTE: SERVICE_ROLE_KEY bypasses RLS!
    │  Backend is responsible for validation
    │
    ▼
Return All Users (Backend knows SERVICE_ROLE)
    │
    ├─ But should filter in Backend!
    │
    ▼
NestJS Backend Validation
    │
    ├─ Only return if:
    │  - User is owner, OR
    │  - User is admin, OR
    │  - User has permission
    │
    ▼
Return Response to Frontend
    │
    └─ ✅ Profile data sent
```

---

## Level 3: Module Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                          AppModule                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Imports:                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. ConfigModule     (Global .env)                       │  │
│  │ 2. TypeOrmModule   (PostgreSQL for business data)       │  │
│  │ 3. AuthModule      ✓ imports [SupabaseModule]         │  │
│  │ 4. StockModule     ✓ imports [SupabaseModule]         │  │
│  │ 5. InvoiceModule   ✓ imports [SupabaseModule]         │  │
│  │ 6. NotificationModule ✓ imports [SupabaseModule]      │  │
│  │ 7. DashboardModule ✓ imports [SupabaseModule]         │  │
│  │ 8. SupabaseModule  ← Can be imported by all modules   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────────┐   ┌─────────────┐   ┌──────────────────┐
   │ AuthModule  │   │StockModule  │   │ InvoiceModule    │
   │             │   │             │   │                  │
   │ Svc: Auth   │   │ Svc: Stock  │   │ Svc: Invoice     │
   └─────┬───────┘   └─────┬───────┘   └────────┬─────────┘
         │                 │                    │
         │                 │                    │
         └─────────┬───────┴────────────┬───────┘
                   │                    │
         ┌─────────▼────────────────────▼────────┐
         │   SupabaseService Injected             │
         │                                        │
         │  Used by multiple modules:             │
         │  • AuthService.signUp()                │
         │  • StockService.checkUser()            │
         │  • InvoiceService.validateUser()       │
         │  • NotificationService.findUser()      │
         │  • DashboardService.getUserStats()     │
         └────────────────────────────────────────┘
```

---

## Level 4: Dependency Injection Pattern

```
Every Module that needs SupabaseService:

┌─────────────────────────────────────────┐
│         AuthModule (Example)            │
├─────────────────────────────────────────┤
│                                         │
│  @Module({                              │
│    imports: [SupabaseModule], ◄─ Import │
│    providers: [AuthService],             │
│  })                                     │
│                                         │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         AuthService                    │
├─────────────────────────────────────────┤
│                                         │
│  @Injectable()                          │
│  class AuthService {                    │
│    constructor(                         │
│      private supabase: SupabaseService  │◄─ Injected
│    ) {}                                 │                                 │
│                                         │
│    async register(email, name) {        │
│      return this.supabase.createUser({  │◄─ Used  
│        email,                           │
│        name                             │
│      });                                │
│    }                                    │
│  }                                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## Level 5: Data Flow Detail

```
User Action: Click "Create Stock"
    │
    ▼
Frontend
    ├─ Collect form data
    ├─ Validate client-side
    ├─ Send POST to /api/stock
    │  Body: {
    │    productName: "iPhone 14",
    │    quantity: 100,
    │    price: 999,
    │    userId: "550e8400-e29b-41d4-a716-446655440000"
    │  }
    │
    ▼
NestJS StockController
    ├─ @Post()
    ├─ Receive CreateStockDto
    ├─ Call: this.stockService.createStock(dto)
    │
    ▼
StockService
    ├─ Validate userId exists
    ├─ Call: this.supabaseService.getUserById(userId)
    │
    ▼
SupabaseService
    ├─ Return User object / null
    │
    ▼
StockService (returned to)
    ├─ if (!user) throw BadRequestException
    ├─ if (user exists) continue
    ├─ Insert into stock table (TypeORM)
    │
    ▼
PostgreSQL (Business Data)
    ├─ Save stock record
    │
    ▼
Return Response
    ├─ { id, productName, quantity, price, userId, createdAt }
    │
    ▼
Frontend
    ├─ Display: "Stock created successfully"
    ├─ Show new stock in list
    │
    ▼
✅ Complete!
```

---

## Level 6: Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                    Security Layers                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Layer 1: HTTP Transport                                       │
│ ├─ CORS (configured in main.ts)                              │
│ ├─ Only accept from authorized origins                       │
│ └─ Reject options: localhost:5173, localhost:3001            │
│                                                                │
│ Layer 2: Validation                                           │
│ ├─ ValidationPipe in main.ts                                 │
│ ├─ Check incoming data matches DTO                           │
│ └─ Reject invalid/missing fields                             │
│                                                                │
│ Layer 3: Authentication                                       │
│ ├─ JWT tokens (configured in auth.module)                    │
│ ├─ @UseGuards(JwtAuthGuard)                                  │
│ ├─ Verify token is valid                                     │
│ └─ Extract user.id from token                                │
│                                                                │
│ Layer 4: Authorization (Backend)                             │
│ ├─ Check user has permission                                 │
│ ├─ Example: Can user access their own data?                  │
│ ├─ Example: Is user an admin?                                │
│ └─ Throw ForbiddenException if not                           │
│                                                                │
│ Layer 5: Database (RLS)                                      │
│ ├─ Row Level Security policies                               │
│ ├─ Apply filters at SQL level                                │
│ ├─ Even if backend is hacked, RLS protects                   │
│ └─ NOTE: SERVICE_ROLE_KEY bypasses, so backend validation    │
│          is critical                                          │
│                                                                │
│ Layer 6: Encryption                                          │
│ ├─ Supabase encrypts data at rest                            │
│ ├─ HTTPS/TLS for data in transit                             │
│ └─ Passwords hashed with bcrypt                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Level 7: File Structure Reference

```
src/
├── app.module.ts (root)
│   └─ imports: [SupabaseModule, AuthModule, ...]
│
├── config/
│   ├── database.config.ts (TypeORM)
│   └── supabase.config.ts ←─ NEW
│       └─ exports: supabaseAdmin, supabaseAnon
│
├── services/
│   └── supabase.service.ts ←─ NEW
│       └─ CRUD operations for users
│
├── supabase/ ←─ NEW FOLDER
│   ├── supabase.module.ts
│   │   └─ exports: SupabaseService
│   └── supabase.controller.ts
│       └─ REST endpoints (POST, GET, PUT, DELETE)
│
├── auth/
│   ├── auth.module.ts (imports [SupabaseModule])
│   ├── auth.service.ts (injects SupabaseService)
│   └── auth.controller.ts
│
├── stock/
│   ├── stock.module.ts (imports [SupabaseModule])
│   ├── stock.service.ts (injects SupabaseService)
│   └── stock.controller.ts
│
├── invoice/
├── notification/
└── dashboard/
```

---

## 🎯 Key Concepts Summary

```
Concept                    Where                Implementation
────────────────────────────────────────────────────────────────
Configuration              supabase.config.ts    Two clients
Service                    supabase.service.ts   CRUD methods
Module                     supabase.module.ts    Dependency Injection
API                        supabase.controller   REST endpoints
Integration                any.module.ts         imports [SupabaseModule]
Security                   RLS policies          Row Level Security
Backend Validation         any.service.ts        Check permissions
Environment Variables      .env.local            Store secrets
Logging                    supabase.service.ts   Logger errors
```

---

✅ **Architecture Complete and Ready!**
