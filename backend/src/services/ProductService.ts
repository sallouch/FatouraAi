import { supabase } from "../config/database";
import { Product, Item, ItemType, ApiResponse } from "../types";
import { v4 as uuidv4 } from "uuid";

export class ProductService {
  /**
   * Get all products and services
   */
  static async getAllItems(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Item[]>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("items")
        .select("*", { count: "exact" })
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
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Product[]>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("items")
        .select("*")
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
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Item[]>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("items")
        .select("*")
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
  static async getItemById(id: string): Promise<ApiResponse<Item>> {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
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
    name: string,
    type: ItemType,
    price: number,
    description?: string,
    sku?: string,
    category?: string
  ): Promise<ApiResponse<Item>> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("items")
        .insert([
          {
            id,
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
    updates: Partial<Item>
  ): Promise<ApiResponse<Item>> {
    try {
      const { data, error } = await supabase
        .from("items")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
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
  static async deleteItem(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);

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
    query: string,
    type?: ItemType
  ): Promise<ApiResponse<Item[]>> {
    try {
      let queryBuilder = supabase
        .from("items")
        .select("*")
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
    category: string
  ): Promise<ApiResponse<Item[]>> {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
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
