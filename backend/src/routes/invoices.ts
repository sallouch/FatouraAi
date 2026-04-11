import { Router, Request, Response } from "express";
import { InvoiceService } from "../services/InvoiceService";

const router = Router();

/**
 * GET /api/invoices
 * Get all invoices with pagination
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.query.userId as string | undefined;

    const result = await InvoiceService.getInvoices(page, limit, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /api/invoices/status/:status
 * Get invoices by status
 */
router.get("/status/:status", async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const validStatuses = ["draft", "pending", "paid", "overdue"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: draft, pending, paid, overdue",
      });
    }

    const userId = req.query.userId as string | undefined;

    const result = await InvoiceService.getInvoicesByStatus(
      status as "draft" | "pending" | "paid" | "overdue",
      userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /api/invoices/:id
 * Get a single invoice with its items
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await InvoiceService.getInvoiceById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * POST /api/invoices
 * Create a new invoice
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { client, clientName, items, status, userId } = req.body;
    const validStatuses = ["draft", "pending", "paid", "overdue"];
    const invoiceStatus = status || "draft";

    if (!client || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: client, items",
      });
    }

    if (!validStatuses.includes(invoiceStatus)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid status. Must be one of: draft, pending, paid, overdue",
      });
    }

    const result = await InvoiceService.createInvoice(
      client,
      clientName || client,
      items,
      invoiceStatus as "draft" | "pending" | "paid" | "overdue",
      userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * PUT /api/invoices/:id/status
 * Update invoice status
 */
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["draft", "pending", "paid", "overdue"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error:
          "Status is required and must be one of: draft, pending, paid, overdue",
      });
    }

    const result = await InvoiceService.updateInvoiceStatus(
      id,
      status as "draft" | "pending" | "paid" | "overdue"
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete an invoice
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await InvoiceService.deleteInvoice(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
