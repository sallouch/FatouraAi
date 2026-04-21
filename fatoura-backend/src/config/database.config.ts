import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  ssl: {
    rejectUnauthorized: false,
  },
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    connectionTimeoutMillis: 10000,
  },
  logging: process.env.NODE_ENV === 'development',
};
