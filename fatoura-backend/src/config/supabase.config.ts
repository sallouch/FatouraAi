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
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '❌ Variables d\'environnement Supabase manquantes. ' +
    'Ajouter à .env.local:\n' +
    'SUPABASE_URL=...\n' +
    'SUPABASE_ANON_KEY=...\n' +
    'SUPABASE_SERVICE_ROLE_KEY=...'
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Client Admin (Backend) - Droits complets
// ──────────────────────────────────────────────────────────────────────────
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ──────────────────────────────────────────────────────────────────────────
// Client Anon (Frontend) - Respecte Row Level Security
// ──────────────────────────────────────────────────────────────────────────
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
  },
});

export default supabaseAdmin;
