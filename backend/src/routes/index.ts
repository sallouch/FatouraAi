import { Router, Request, Response } from "express";
import productsRouter from "./products";
import invoicesRouter from "./invoices";
import stockRouter from "./stock";
import authRouter from "./auth";
import profileRouter from "./profile";

const router = Router();

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
router.use("/products", productsRouter);
router.use("/invoices", invoicesRouter);
router.use("/stock", stockRouter);
router.use("/auth", authRouter);
router.use("/profile", profileRouter);

export default router;
