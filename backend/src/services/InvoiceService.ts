import { supabase } from "../config/database";
import { Invoice, InvoiceItem, ApiResponse } from "../types";
import { v4 as uuidv4 } from "uuid";

export class InvoiceService {
  /**
   * Get all invoices with pagination
   */
  static async getInvoices(
    page: number = 1,
    limit: number = 10,
    userId?: string
  ): Promise<ApiResponse<Invoice[]>> {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from("invoices")
        .select("*")
        .order("date", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);

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
   * Get invoice by ID with items
   */
  static async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (invoiceError) {
        return {
          success: false,
          error: invoiceError.message,
        };
      }

      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id);

      if (itemsError) {
        return {
          success: false,
          error: itemsError.message,
        };
      }

      return {
        success: true,
        data: {
          ...invoice,
          items: items || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(
    client: string,
    clientName: string,
    items: InvoiceItem[],
    status: "draft" | "pending" | "paid" | "overdue" = "draft",
    userId?: string
  ): Promise<ApiResponse<Invoice>> {
    try {
      const invoiceId = uuidv4();
      const now = new Date().toISOString();
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Create invoice
      const { error: invoiceError } = await supabase.from("invoices").insert([
        {
          id: invoiceId,
          client,
          clientName,
          amount: total,
          date: now,
          status,
          total,
          user_id: userId,
          created_at: now,
          updated_at: now,
        },
      ]);

      if (invoiceError) {
        return {
          success: false,
          error: invoiceError.message,
        };
      }

      // Insert invoice items
      const invoiceItems = items.map((item) => ({
        id: uuidv4(),
        invoice_id: invoiceId,
        item_id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) {
        return {
          success: false,
          error: itemsError.message,
        };
      }

      return {
        success: true,
        data: {
          id: invoiceId,
          client,
          clientName,
          amount: total,
          date: now,
          status,
          items,
          total,
        },
        message: "Invoice created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(
    id: string,
    status: "draft" | "pending" | "paid" | "overdue"
  ): Promise<ApiResponse<Invoice>> {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .update({
          status,
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
        message: "Invoice status updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get invoices by status
   */
  static async getInvoicesByStatus(
    status: "draft" | "pending" | "paid" | "overdue",
    userId?: string
  ): Promise<ApiResponse<Invoice[]>> {
    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("status", status)
        .order("date", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

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
   * Delete invoice
   */
  static async deleteInvoice(id: string): Promise<ApiResponse<void>> {
    try {
      // Delete invoice items first
      await supabase.from("invoice_items").delete().eq("invoice_id", id);

      // Delete invoice
      const { error } = await supabase.from("invoices").delete().eq("id", id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: "Invoice deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
