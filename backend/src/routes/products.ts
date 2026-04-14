import { Router, Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { getAuthenticatedUser } from "../utils/auth";

const router = Router();

/**
 * GET /api/products/all
 * Get all items (products and services)
 */
router.get("/all", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await ProductService.getAllItems(user.id, page, limit);

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
 * GET /api/products
 * Get all products
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await ProductService.getProducts(user.id, page, limit);

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
 * GET /api/products/services
 * Get all services
 */
router.get("/services", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await ProductService.getServices(user.id, page, limit);

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
 * GET /api/products/search
 * Search products and services
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const query = req.query.q as string;
    const type = req.query.type as string | undefined;

    if (!query) {
      return res
        .status(400)
        .json({ success: false, error: "Search query is required" });
    }

    const result = await ProductService.searchItems(user.id, query, type as any);

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
 * GET /api/products/category/:category
 * Get items by category
 */
router.get("/category/:category", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const { category } = req.params;

    const result = await ProductService.getItemsByCategory(user.id, category);

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
 * GET /api/products/:id
 * Get a single product/service
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const { id } = req.params;

    const result = await ProductService.getItemById(id, user.id);

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
 * POST /api/products
 * Create a new product or service
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const { name, type, price, description, sku, category } = req.body;

    if (!name || !type || price === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, type, price",
      });
    }

    if (!["product", "service"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "product" or "service"',
      });
    }

    const result = await ProductService.createItem(
      user.id,
      name,
      type,
      price,
      description,
      sku,
      category
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
 * PUT /api/products/:id
 * Update a product/service
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const { id } = req.params;
    const updates = req.body;

    const result = await ProductService.updateItem(id, user.id, updates);

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
 * DELETE /api/products/:id
 * Delete a product/service
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error });
    }

    const { id } = req.params;

    const result = await ProductService.deleteItem(id, user.id);

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
