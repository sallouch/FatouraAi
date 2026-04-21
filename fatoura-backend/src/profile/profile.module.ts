import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User } from '../auth/auth.entity';
import { Company } from './company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]),
    AuthModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}