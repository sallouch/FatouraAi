import { Router, Request, Response } from "express";
import productsRouter from "./products";
import invoicesRouter from "./invoices";
import stockRouter from "./stock";

const router = Router();

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
router.use("/products", productsRouter);
router.use("/invoices", invoicesRouter);
router.use("/stock", stockRouter);

export default router;
