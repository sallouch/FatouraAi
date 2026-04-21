import * as dotenv from 'dotenv';
dotenv.config(); // must be before any process.env access

import { createClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────────────────────────────────
// Variables d'environnement requises
// ──────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation
// ✅ Après
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Supabase non configuré — fonctionnalités Supabase désactivées');
}

// ✅ Remplace les exports par :
export const supabaseAdmin = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const supabaseAnon = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  { auth: { persistSession: true } }
);

export default supabaseAdmin;
