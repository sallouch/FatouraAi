import { supabase } from "../config/database";
import { Stock, ApiResponse } from "../types";
import { v4 as uuidv4 } from "uuid";

export class StockService {
  /**
   * Get all stock records
   */
  static async getAllStock(
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<Stock[]>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .order("last_updated", { ascending: false })
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
   * Get stock for a specific product
   */
  static async getStockByProductId(
    productId: string
  ): Promise<ApiResponse<Stock>> {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .eq("product_id", productId)
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
   * Create stock record for a product
   */
  static async createStock(
    productId: string,
    quantity: number,
    minQuantity?: number,
    maxQuantity?: number,
    warehouseLocation?: string
  ): Promise<ApiResponse<Stock>> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("stock")
        .insert([
          {
            id,
            product_id: productId,
            quantity,
            min_quantity: minQuantity || 10,
            max_quantity: maxQuantity || 1000,
            warehouse_location: warehouseLocation || "Main",
            last_updated: now,
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
        message: "Stock created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update stock quantity
   */
  static async updateStock(
    id: string,
    quantity: number
  ): Promise<ApiResponse<Stock>> {
    try {
      const { data, error } = await supabase
        .from("stock")
        .update({
          quantity,
          last_updated: new Date().toISOString(),
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
        message: "Stock updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Adjust stock quantity (increase or decrease)
   */
  static async adjustStock(
    id: string,
    adjustment: number
  ): Promise<ApiResponse<Stock>> {
    try {
      // Get current stock
      const { data: current, error: fetchError } = await supabase
        .from("stock")
        .select("quantity")
        .eq("id", id)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: fetchError.message,
        };
      }

      const newQuantity = current.quantity + adjustment;

      if (newQuantity < 0) {
        return {
          success: false,
          error: "Cannot adjust stock below zero",
        };
      }

      return this.updateStock(id, newQuantity);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStock(): Promise<ApiResponse<Stock[]>> {
    try {
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .lte("quantity", "min_quantity");

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
   * Delete stock record
   */
  static async deleteStock(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.from("stock").delete().eq("id", id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: "Stock deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
