import { Router, Request, Response } from "express";
import { StockService } from "../services/StockService";

const router = Router();

/**
 * GET /api/stock
 * Get all stock records
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await StockService.getAllStock(page, limit);

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
 * GET /api/stock/low
 * Get low stock items
 */
router.get("/low", async (req: Request, res: Response) => {
  try {
    const result = await StockService.getLowStock();

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
 * GET /api/stock/product/:productId
 * Get stock for a specific product
 */
router.get("/product/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const result = await StockService.getStockByProductId(productId);

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
 * POST /api/stock
 * Create stock record for a product
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { productId, quantity, minQuantity, maxQuantity, warehouseLocation } =
      req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: productId, quantity",
      });
    }

    const result = await StockService.createStock(
      productId,
      quantity,
      minQuantity,
      maxQuantity,
      warehouseLocation
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
 * PUT /api/stock/:id
 * Update stock quantity
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res
        .status(400)
        .json({ success: false, error: "Quantity is required" });
    }

    const result = await StockService.updateStock(id, quantity);

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
 * PUT /api/stock/:id/adjust
 * Adjust stock quantity (increase/decrease)
 */
router.put("/:id/adjust", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustment } = req.body;

    if (adjustment === undefined) {
      return res
        .status(400)
        .json({ success: false, error: "Adjustment value is required" });
    }

    const result = await StockService.adjustStock(id, adjustment);

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
 * DELETE /api/stock/:id
 * Delete a stock record
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await StockService.deleteStock(id);

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
