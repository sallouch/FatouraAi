import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './stock/stock.module';
import { InvoiceModule } from './invoice/invoice.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    // ─── Config (.env) ──────────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ─── Base de données ─────────────────────────────────────────────────────
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'src/database/dev.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // ← désactiver en production
      logging: process.env.NODE_ENV === 'development',
    }),

    // ─── Modules métier ──────────────────────────────────────────────────────
    AuthModule,
    StockModule,
    InvoiceModule,
    DashboardModule,
    NotificationModule,
  ],
})
export class AppModule {}
