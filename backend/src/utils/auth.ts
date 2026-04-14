import { Request } from "express";
import { supabase } from "../config/database";

export interface AuthenticatedUser {
  id: string;
  email: string;
  metadata: Record<string, unknown>;
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim();
}

export async function getAuthenticatedUser(
  req: Request
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  const token = extractBearerToken(req);
  if (!token) {
    return { user: null, error: "Authorization token is required" };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || !data.user.email) {
    return { user: null, error: error?.message || "Invalid authentication token" };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      metadata: (data.user.user_metadata as Record<string, unknown>) || {},
    },
  };
}
