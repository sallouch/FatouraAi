import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { InvoiceModule } from './invoice/invoice.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notification/notification.module';
import { ProfileModule } from './profile/profile.module';
import { User } from './auth/auth.entity';
import { Company } from './profile/company.entity';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    // ─── Config (.env) ──────────────────────────────────────────────────────
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── Base de données : Supabase / PostgreSQL ────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (!databaseUrl) {
          throw new Error(
            '❌ DATABASE_URL non trouvée.\n' +
            'Ajoutez DATABASE_URL dans votre fichier .env'
          );
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [User, Company],
          synchronize: false,
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
            // Paramètres de pool pour Supabase
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
          },
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
    }),

    // ─── Modules métier ──────────────────────────────────────────────────────
    AuthModule,
    ProfileModule,
    StockModule,
    InvoiceModule,
    DashboardModule,
    NotificationModule,
    SupabaseModule,
  ],
})
export class AppModule {}