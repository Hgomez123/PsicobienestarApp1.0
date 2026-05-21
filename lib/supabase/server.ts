/**
 * Cliente Supabase server-side autenticado con el token del usuario.
 *
 * Vive separado de `./client.ts` (browser) para evitar que un Route
 * Handler importe accidentalmente el cliente del navegador o viceversa.
 *
 * El cliente devuelto opera bajo la sesión del usuario, lo que permite
 * que las RLS policies de Supabase apliquen como barrera estructural —
 * en contraste con `getAdmin()` (service role) que las bypasea.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getUserClient(token: string): SupabaseClient {
  if (!token) {
    throw new Error("getUserClient: token requerido.");
  }

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
