import { Module } from '@nestjs/common';
import { SupabaseService } from '../services/supabase.service';
import { SupabaseController } from './supabase.controller';

/**
 * Module Supabase
 * 
 * Fournit l'accès à Supabase pour tout l'application via SupabaseService
 */
@Module({
  providers: [SupabaseService],
  controllers: [SupabaseController],
  exports: [SupabaseService], // Exporte le service pour autres modules
})
export class SupabaseModule {}
