import { supabase } from "../config/database";
import { Product, Item, ItemType, ApiResponse } from "../types";
import { v4 as uuidv4 } from "uuid";

export class ProductService {
  private static async resolveOwnerColumn(): Promise<"owner_id" | "user_id"> {
    const ownerProbe = await supabase.from("items").select("owner_id").limit(1);
    if (!ownerProbe.error) {
      return "owner_id";
    }

    const userProbe = await supabase.from("items").select("user_id").limit(1);
    if (!userProbe.error) {
      return "user_id";
    }

    throw new Error(
      "Missing ownership column on items table. Add owner_id UUID (or user_id UUID) to enforce per-user product isolation."
    );
  }

  /**
   * Get all products and services
   */
  static async getAllItems(
    ownerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Item[]>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("items")
        .select("*", { count: "exact" })
        .eq(ownerColumn, ownerId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get products only
   */
  static async getProducts(
    ownerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Product[]>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq(ownerColumn, ownerId)
        .eq("type", "product")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get services only
   */
  static async getServices(
    ownerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Item[]>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq(ownerColumn, ownerId)
        .eq("type", "service")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get a single item by ID
   */
  static async getItemById(id: string, ownerId: string): Promise<ApiResponse<Item>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .eq(ownerColumn, ownerId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a new item (product or service)
   */
  static async createItem(
    ownerId: string,
    name: string,
    type: ItemType,
    price: number,
    description?: string,
    sku?: string,
    category?: string
  ): Promise<ApiResponse<Item>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const id = uuidv4();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("items")
        .insert([
          {
            id,
            [ownerColumn]: ownerId,
            name,
            type,
            price,
            description,
            sku: sku || `SKU-${id.substring(0, 8).toUpperCase()}`,
            category,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
        message: `${type} created successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update an item
   */
  static async updateItem(
    id: string,
    ownerId: string,
    updates: Partial<Item>
  ): Promise<ApiResponse<Item>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const { owner_id, id: itemId, created_at, ...safeUpdates } = updates;
      const { data, error } = await supabase
        .from("items")
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq(ownerColumn, ownerId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
        message: "Item updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete an item
   */
  static async deleteItem(id: string, ownerId: string): Promise<ApiResponse<void>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id)
        .eq(ownerColumn, ownerId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: "Item deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Search items by name or category
   */
  static async searchItems(
    ownerId: string,
    query: string,
    type?: ItemType
  ): Promise<ApiResponse<Item[]>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      let queryBuilder = supabase
        .from("items")
        .select("*")
        .eq(ownerColumn, ownerId)
        .or(
          `name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`
        );

      if (type) {
        queryBuilder = queryBuilder.eq("type", type);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get items by category
   */
  static async getItemsByCategory(
    ownerId: string,
    category: string
  ): Promise<ApiResponse<Item[]>> {
    try {
      const ownerColumn = await this.resolveOwnerColumn();
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq(ownerColumn, ownerId)
        .eq("category", category)
        .order("created_at", { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
