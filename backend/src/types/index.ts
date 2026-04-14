export type ItemType = "product" | "service";

export interface Item {
  id: string;
  owner_id?: string;
  name: string;
  type: ItemType;
  price: number;
  quantity?: number;
  description?: string;
  sku?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product extends Item {
  type: "product";
  stock_quantity?: number;
}

export interface Service extends Item {
  type: "service";
  duration?: number; // in minutes
}

export interface Invoice {
  id: string;
  client: string;
  clientName?: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue" | "draft";
  items?: InvoiceItem[];
  total?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  total?: number;
}

export interface Stock {
  id: string;
  product_id: string;
  quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  warehouse_location?: string;
  last_updated?: string;
}

export interface DashboardProduct {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  quantity?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}
