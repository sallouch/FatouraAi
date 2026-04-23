import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { ChatbotModule } from "./chatbot/chatbot.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { InvoiceModule } from "./invoice/invoice.module";
import { NotificationModule } from "./notification/notification.module";
import { ProfileModule } from "./profile/profile.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { User } from "./auth/auth.entity";
import { Company } from "./profile/company.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST"),
        port: +config.get("DB_PORT"),
        username: config.get("DB_USERNAME"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME"),
        entities: [User, Company],
        synchronize: false,
        autoLoadEntities: true,
        ssl: { rejectUnauthorized: false },
        extra: { family: 4 },
      }),
    }),
    SupabaseModule,
    AuthModule,
    ProfileModule,
    ChatbotModule,
    InvoiceModule,
    DashboardModule,
    NotificationModule,
  ],
})
export class AppModule {}
