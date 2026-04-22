import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();