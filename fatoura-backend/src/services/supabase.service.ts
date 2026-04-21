import { Injectable, Logger } from '@nestjs/common';
import { supabaseAdmin } from '../config/supabase.config';

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  /**
   * Récupère tous les utilisateurs depuis la table 'users'
   * 
   * @returns Array d'utilisateurs
   * @throws Error si la requête échoue
   */
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
        throw error;
      }

      this.logger.log(`✅ ${data?.length || 0} utilisateurs récupérés`);
      return data || [];
    } catch (error) {
      this.logger.error('Erreur dans getUsers:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur dans la table 'users'
   * 
   * @param user - Objet utilisateur avec email et name
   * @returns L'utilisateur créé
   * @throws Error si la création échoue
   */
  async createUser(user: Partial<User>): Promise<User> {
    try {
      // Validation basique
      if (!user.email) {
        throw new Error('Email est obligatoire');
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([
          {
            email: user.email,
            name: user.name || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id, email, name, created_at')
        .single();

      if (error) {
        this.logger.error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
        throw error;
      }

      this.logger.log(`✅ Utilisateur créé: ${data.email}`);
      return data;
    } catch (error) {
      this.logger.error('Erreur dans createUser:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, created_at')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Utilisateur non trouvé
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Erreur dans getUserById:', error);
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, email, name, created_at')
        .single();

      if (error) {
        throw error;
      }

      this.logger.log(`✅ Utilisateur ${id} mis à jour`);
      return data;
    } catch (error) {
      this.logger.error('Erreur dans updateUser:', error);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      this.logger.log(`✅ Utilisateur ${id} supprimé`);
    } catch (error) {
      this.logger.error('Erreur dans deleteUser:', error);
      throw error;
    }
  }
}
