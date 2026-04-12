import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente para pacientes
export const supabase = createClient(url, key, {
  auth: { storageKey: "psicobienestar-patient" },
});

// Cliente para la doctora (sesión separada)
export const supabaseDoctor = createClient(url, key, {
  auth: { storageKey: "psicobienestar-doctor" },
});
