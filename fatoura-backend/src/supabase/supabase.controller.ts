import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SupabaseService, User } from '../services/supabase.service';

/**
 * Contrôleur Supabase
 * 
 * Endpoints pour gérer les utilisateurs via Supabase
 * Routes: /api/supabase/users
 */
@Controller('supabase/users')
export class SupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * GET /api/supabase/users
   * Récupère tous les utilisateurs
   */
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.supabaseService.getUsers();
  }

  /**
   * POST /api/supabase/users
   * Crée un utilisateur
   * 
   * Body exemple:
   * {
   *   "email": "user@example.com",
   *   "name": "John Doe"
   * }
   */
  @Post()
  async createUser(@Body() user: Partial<User>): Promise<User> {
    return this.supabaseService.createUser(user);
  }

  /**
   * GET /api/supabase/users/:id
   * Récupère un utilisateur par son ID
   */
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.supabaseService.getUserById(id);
  }

  /**
   * PUT /api/supabase/users/:id
   * Met à jour un utilisateur
   */
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updates: Partial<User>,
  ): Promise<User> {
    return this.supabaseService.updateUser(id, updates);
  }

  /**
   * DELETE /api/supabase/users/:id
   * Supprime un utilisateur
   */
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.supabaseService.deleteUser(id);
    return { success: true };
  }
}
