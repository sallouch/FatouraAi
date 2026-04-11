# FatouraAI Backend

Backend API for FatouraAI - Product and Service Management with Invoice Tracking

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials:
```env
SUPABASE_URL=https://ybgwwphwqgeozcmkjwmx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Database Schema

### Tables Required in Supabase

#### 1. items
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. invoices
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client TEXT NOT NULL,
  clientName TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  date TIMESTAMP NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue')),
  total DECIMAL(12, 2),
  user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. invoice_items
```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  name TEXT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(12, 2)
);
```

#### 4. stock
```sql
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT DEFAULT 10,
  max_quantity INT DEFAULT 1000,
  warehouse_location TEXT DEFAULT 'Main',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Products & Services

- **GET** `/api/products` - Get all products
- **GET** `/api/products/all` - Get all items (products & services)
- **GET** `/api/products/services` - Get all services
- **GET** `/api/products/:id` - Get single product/service
- **GET** `/api/products/search?q=query` - Search products/services
- **GET** `/api/products/category/:category` - Get items by category
- **POST** `/api/products` - Create new product/service
- **PUT** `/api/products/:id` - Update product/service
- **DELETE** `/api/products/:id` - Delete product/service

### Invoices

- **GET** `/api/invoices` - Get all invoices
- **GET** `/api/invoices/:id` - Get invoice with items
- **GET** `/api/invoices/status/:status` - Get invoices by status
- **POST** `/api/invoices` - Create new invoice
- **PUT** `/api/invoices/:id/status` - Update invoice status
- **DELETE** `/api/invoices/:id` - Delete invoice

### Stock Management

- **GET** `/api/stock` - Get all stock records
- **GET** `/api/stock/product/:productId` - Get stock for product
- **GET** `/api/stock/low` - Get low stock items
- **POST** `/api/stock` - Create stock record
- **PUT** `/api/stock/:id` - Update stock quantity
- **PUT** `/api/stock/:id/adjust` - Adjust stock (increase/decrease)
- **DELETE** `/api/stock/:id` - Delete stock record

### Health Check

- **GET** `/api/health` - Server health status

## Request/Response Examples

### Create Product
```json
POST /api/products
{
  "name": "Laptop",
  "type": "product",
  "price": 999.99,
  "description": "High-performance laptop",
  "category": "Electronics",
  "sku": "LAP-001"
}
```

### Create Invoice
```json
POST /api/invoices
{
  "client": "ACME Corp",
  "clientName": "ACME Corporation",
  "status": "draft",
  "items": [
    {
      "item_id": "uuid",
      "name": "Laptop",
      "quantity": 2,
      "price": 999.99
    }
  ]
}
```

### Create Stock
```json
POST /api/stock
{
  "productId": "uuid",
  "quantity": 50,
  "minQuantity": 10,
  "maxQuantity": 500,
  "warehouseLocation": "Main Warehouse"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.ts
│   ├── middleware/      # Express middleware
│   │   └── cors.ts
│   ├── routes/          # API routes
│   │   ├── index.ts
│   │   ├── products.ts
│   │   ├── invoices.ts
│   │   └── stock.ts
│   ├── services/        # Business logic
│   │   ├── ProductService.ts
│   │   ├── InvoiceService.ts
│   │   ├── StockService.ts
│   │   └── index.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── index.ts         # Main entry point
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

All endpoints return a consistent response format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message"
}
```

## Notes

- All timestamps are in ISO 8601 format
- Pagination defaults: page=1, limit=10
- Environment variables are loaded from `.env` file
- CORS is configured for specified origins in `.env`
- Service Role Key is optional (defaults to anon key if not provided)

## Development

The project uses:
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **Supabase** - Backend as a Service
- **tsx** - TypeScript executor for development

For questions or issues, contact the development team.
