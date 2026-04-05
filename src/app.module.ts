import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    // 1. Charger le .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Connecter PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        synchronize: false, // false car on a déjà notre BD.sql
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    ChatbotModule,
  ],
})
export class AppModule {}