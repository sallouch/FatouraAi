import { Router, Request, Response } from "express";
import { supabase, supabaseAdmin } from "../config/database";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, company, password } = req.body as {
      name?: string;
      email?: string;
      company?: string;
      password?: string;
    };

    if (!name || !email || !company || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, email, company, password",
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, company },
      },
    });

    if (error) {
      const shouldTryAdminFallback = error.message
        .toLowerCase()
        .includes("rate limit");

      if (!shouldTryAdminFallback) {
        return res.status(400).json({
          success: false,
          error: error.message || "Registration failed",
        });
      }

      const { error: adminCreateError } = await supabaseAdmin.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: true,
          user_metadata: { name, company },
        }
      );

      if (adminCreateError) {
        return res.status(400).json({
          success: false,
          error: adminCreateError.message || "Registration failed",
        });
      }

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError || !loginData.user || !loginData.session) {
        return res.status(400).json({
          success: false,
          error: loginError?.message || "Registration created but login failed",
        });
      }

      return res.status(201).json({
        accessToken: loginData.session.access_token,
        user: {
          id: loginData.user.id,
          name: (loginData.user.user_metadata?.name as string) || name,
          email: loginData.user.email || email,
          company: (loginData.user.user_metadata?.company as string) || company,
        },
      });
    }

    if (!data.user) {
      return res.status(400).json({
        success: false,
        error: "Registration failed",
      });
    }

    return res.status(201).json({
      accessToken: data.session?.access_token || "",
      user: {
        id: data.user.id,
        name: (data.user.user_metadata?.name as string) || name,
        email: data.user.email || email,
        company: (data.user.user_metadata?.company as string) || company,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, password",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return res.status(401).json({
        success: false,
        error: error?.message || "Invalid credentials",
      });
    }

    return res.json({
      accessToken: data.session.access_token,
      user: {
        id: data.user.id,
        name: (data.user.user_metadata?.name as string) || "",
        email: data.user.email || email,
        company: (data.user.user_metadata?.company as string) || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
