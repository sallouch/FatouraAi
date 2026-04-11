import express, { Express, Request, Response, NextFunction } from "express";
import corsMiddleware from "./middleware/cors";
import apiRoutes from "./routes";
import * as dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const PORT: string | number = process.env.PORT || 3000;
const NODE_ENV: string = process.env.NODE_ENV || "development";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api", apiRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "FatouraAI Backend API",
    version: "1.0.0",
    environment: NODE_ENV,
    endpoints: {
      products: "/api/products",
      invoices: "/api/invoices",
      stock: "/api/stock",
      health: "/api/health",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Environment: ${NODE_ENV}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
