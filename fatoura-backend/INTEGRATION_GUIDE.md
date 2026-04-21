# 🔗 Guide d'intégration - Utiliser Supabase dans vos modules

## 📚 Introduction

Le `SupabaseService` peut être utilisé dans n'importe quel module NestJS. Voici comment intégrer Supabase dans vos modules existants.

---

## 🔐 Case 1: Module Auth - Enregistrement & Login

### Créer un DTOUsersDatad'enregistrement

```typescript
// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### Mettre à jour AuthService

```typescript
// src/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Enregistrer un nouvel utilisateur
   */
  async register(registerDto: RegisterDto) {
    const { email, name, password } = registerDto;

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('Cet email est déjà utilisé');
      }

      // Créer l'utilisateur dans Supabase
      const user = await this.supabaseService.createUser({
        email,
        name
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        message: 'Inscription réussie'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Récupérer utilisateur par email
   */
  async findByEmail(email: string) {
    const users = await this.supabaseService.getUsers();
    return users.find(u => u.email === email) || null;
  }

  /**
   * Récupérer utilisateur par ID
   */
  async findById(id: string) {
    return this.supabaseService.getUserById(id);
  }

  /**
   * Mettre à jour profil utilisateur
   */
  async updateProfile(id: string, updates: any) {
    return this.supabaseService.updateUser(id, updates);
  }
}
```

### Mettre à jour AuthController

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
```

### Mettre à jour AuthModule

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], // ← Importez SupabaseModule
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Exporte pour autres modules
})
export class AuthModule {}
```

### Tester

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "password": "secret123"
  }'
```

---

## 📦 Case 2: Module Stock - Lier utilisateur au stock

### Créer DTOs

```typescript
// src/stock/dto/create-stock.dto.ts
import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateStockDto {
  @IsString()
  productName: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsUUID()
  userId: string; // ← Lier au utilisateur
}
```

### Mettre à jour StockService

```typescript
// src/stock/stock.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';
import { CreateStockDto } from './dto/create-stock.dto';

@Injectable()
export class StockService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Créer un stock et vérifier que l'utilisateur existe
   */
  async createStock(createStockDto: CreateStockDto) {
    const { userId, ...stockData } = createStockDto;

    try {
      // Vérifier que l'utilisateur existe
      const user = await this.supabaseService.getUserById(userId);
      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // TODO: Enregistrer le stock dans votre base de données
      // Pour cet exemple, on retourne juste les données
      return {
        ...stockData,
        userId,
        userName: user.name,
        createdAt: new Date()
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Récupérer les stocks d'un utilisateur
   */
  async getStockByUser(userId: string) {
    // Vérifier utilisateur existe
    const user = await this.supabaseService.getUserById(userId);
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // TODO: Récupérer les stocks filtrés par userId
    return {
      user,
      stocks: [] // À implémenter
    };
  }
}
```

### Mettre à jour StockModule

```typescript
// src/stock/stock.module.ts
import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
  imports: [SupabaseModule], // ← Importez
  providers: [StockService],
  controllers: [StockController],
})
export class StockModule {}
```

---

## 💰 Case 3: Module Invoice - Créer facture pour utilisateur

### StockService avec validation utilisateur

```typescript
// src/invoice/invoice.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class InvoiceService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Créer une facture pour un utilisateur
   */
  async createInvoice(userId: string, invoiceData: any) {
    try {
      // Valider que l'utilisateur existe
      const user = await this.supabaseService.getUserById(userId);
      if (!user) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // TODO: Enregistrer la facture
      return {
        ...invoiceData,
        userId,
        userEmail: user.email,
        createdAt: new Date()
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Récupérer les factures d'un utilisateur
   */
  async getInvoicesByUser(userId: string) {
    const user = await this.supabaseService.getUserById(userId);
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // TODO: Récupérer factures filtrées
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      invoices: [] // À implémenter
    };
  }
}
```

### Mettre à jour InvoiceModule

```typescript
// src/invoice/invoice.module.ts
import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';

@Module({
  imports: [SupabaseModule],
  providers: [InvoiceService],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
```

---

## 🔔 Case 4: Module Notification - Envoyer notification à utilisateurs

### NotificationService avec utilisateurs

```typescript
// src/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Envoyer notification à un utilisateur spécifique
   */
  async sendToUser(userId: string, message: string) {
    try {
      // Vérifier l'utilisateur
      const user = await this.supabaseService.getUserById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      this.logger.log(`📧 Notification envoyée à ${user.email}: ${message}`);

      // TODO: Intégrer un service d'email (SendGrid, Stripe, etc)
      return {
        success: true,
        userId,
        message,
        sentAt: new Date()
      };
    } catch (error) {
      this.logger.error('Erreur envoi notification:', error);
      throw error;
    }
  }

  /**
   * Envoyer notification à tous les utilisateurs
   */
  async sendToAll(message: string) {
    try {
      const users = await this.supabaseService.getUsers();

      for (const user of users) {
        this.logger.log(`📧 Notification à ${user.email}`);
        // TODO: Envoyer email via SendGrid etc
      }

      return {
        success: true,
        sentCount: users.length,
        message
      };
    } catch (error) {
      this.logger.error('Erreur broadcast notification:', error);
      throw error;
    }
  }
}
```

### Mettre à jour NotificationModule

```typescript
// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [SupabaseModule],
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
```

---

## 📊 Case 5: Module Dashboard - Statistiques utilisateurs

### DashboardService avec Supabase

```typescript
// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Récupérer statistiques dashboard
   */
  async getDashboardStats() {
    const users = await this.supabaseService.getUsers();

    return {
      totalUsers: users.length,
      newUsersThisMonth: users.filter(u => {
        const createdDate = new Date(u.created_at || '');
        const now = new Date();
        return createdDate.getMonth() === now.getMonth();
      }).length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        joinedAt: u.created_at
      })),
      lastUpdated: new Date()
    };
  }

  /**
   * Statistiques par utilisateur
   */
  async getUserStats(userId: string) {
    const user = await this.supabaseService.getUserById(userId);
    
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        joinedAt: user.created_at
      },
      // TODO: Ajouter stats métier (total invoices, total stock, etc)
      totalInvoices: 0,
      totalStock: 0,
      totalNotifications: 0
    };
  }
}
```

### Mettre à jour DashboardModule

```typescript
// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [SupabaseModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
```

---

## 🧲 Pattern: Injection de dépendances

### Pattern général

```typescript
// Tout service peut utiliser SupabaseService

@Injectable()
export class MeService {
  // ✅ Injectez le service
  constructor(private supabaseService: SupabaseService) {}

  async someMethod() {
    // ✅ Utilisez-le
    const users = await this.supabaseService.getUsers();
    return users;
  }
}

@Module({
  // ✅ Importez le module
  imports: [SupabaseModule],
  providers: [MyService],
})
export class MyModule {}
```

---

## ✨ Checklist d'intégration pour chaque module

Para chaque module que vous voulez intégrer Supabase:

- [ ] Importer `SupabaseModule` dans les imports du module
- [ ] Injecter `SupabaseService` dans le service
- [ ] Utiliser `this.supabaseService.method()`
- [ ] Ajouter validation `if (!user) throw new BadRequestException()`
- [ ] Logger les opérations importantes
- [ ] Tester les endpoints avec curl/Postman

---

## 🚀 Commandes utiles

```bash
# Démarrer le serveur
npm run start:dev

# Regarder les logs
npm run start:dev 2>&1 | grep "ERROR\|WARN\|Module"

# Tester l'auth + stock integration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","password":"123456"}'

# Puis récupérer l'ID et l'utiliser dans stock
curl -X POST http://localhost:3000/api/stock \
  -H "Content-Type: application/json" \
  -d '{"productName":"iPhone","quantity":10,"price":999,"userId":"THE_ID_FROM_ABOVE"}'
```

---

## 📚 Architecture complète

```
┌─────────────────────────────────────────┐
│         AppModule                       │
│  • SupabaseModule ← Central            │
│  • AuthModule                           │
│  • StockModule                          │
│  • InvoiceModule                        │
│  • NotificationModule                   │
│  • DashboardModule                      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    SupabaseService                      │
│  • getUsers()                           │
│  • createUser()                         │
│  • getUserById()                        │
│  • updateUser()                         │
│  • deleteUser()                         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    Supabase (Backend)                   │
│  • PostgreSQL Database                  │
│  • Authentication                       │
│  • Row Level Security (RLS)             │
└─────────────────────────────────────────┘
```

---

**Intégration complète dans tous vos modules! 🎉**
