import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../config/database";
import { getAuthenticatedUser } from "../utils/auth";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error });
  }

  const metadata = user.metadata;
  return res.json({
    name: String(metadata.name || ""),
    email: user.email,
    phone: String(metadata.phone || ""),
    company: String(metadata.company || ""),
    address: String(metadata.address || ""),
    city: String(metadata.city || ""),
    postalCode: String(metadata.postalCode || ""),
    country: String(metadata.country || ""),
    taxId: String(metadata.taxId || metadata.vatNumber || ""),
    avatarUrl: metadata.avatarUrl ? String(metadata.avatarUrl) : undefined,
  });
});

router.put("/", async (req: Request, res: Response) => {
  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error });
  }

  const { name, email, phone, avatarUrl } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      email,
      user_metadata: {
        ...user.metadata,
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
    }
  );

  if (updateError) {
    return res.status(400).json({ success: false, message: updateError.message });
  }

  return res.json({ success: true, message: "Profile updated successfully" });
});

router.patch("/company", async (req: Request, res: Response) => {
  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error });
  }

  const { companyName, vatNumber, address, city, postalCode, country, phone } =
    req.body as {
      companyName?: string;
      vatNumber?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
    };

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        ...user.metadata,
        ...(companyName !== undefined ? { company: companyName } : {}),
        ...(vatNumber !== undefined ? { taxId: vatNumber, vatNumber } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(postalCode !== undefined ? { postalCode } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    }
  );

  if (updateError) {
    return res.status(400).json({ success: false, message: updateError.message });
  }

  return res.json({ success: true, message: "Company profile updated successfully" });
});

router.put("/password", async (req: Request, res: Response) => {
  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: currentPassword, newPassword",
    });
  }

  const { error: checkPasswordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (checkPasswordError) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      password: newPassword,
    }
  );

  if (updateError) {
    return res.status(400).json({ success: false, message: updateError.message });
  }

  return res.json({ success: true, message: "Password updated successfully" });
});

router.post("/avatar", async (req: Request, res: Response) => {
  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error });
  }

  const { base64, mimeType } = req.body as {
    base64?: string;
    mimeType?: string;
  };

  if (!base64 || !mimeType) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: base64, mimeType",
    });
  }

  const avatarUrl = `data:${mimeType};base64,${base64}`;

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        ...user.metadata,
        avatarUrl,
      },
    }
  );

  if (updateError) {
    return res.status(400).json({ success: false, error: updateError.message });
  }

  return res.json({ avatarUrl });
});

export default router;
