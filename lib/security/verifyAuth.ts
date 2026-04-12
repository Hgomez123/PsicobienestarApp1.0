/**
 * Helpers de verificación de autenticación para rutas API.
 * Usa la service_role key para verificar tokens JWT sin depender
 * de cookies ni del cliente del navegador.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Extrae el Bearer token del header Authorization */
export function extractToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

/**
 * Verifica que el token pertenece a un paciente válido.
 * Retorna el userId si es válido, null si no.
 */
export async function verifyPatient(token: string): Promise<string | null> {
  const admin = getAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "patient" ? user.id : null;
}

/**
 * Verifica que el token pertenece a un doctor válido.
 * Retorna el profileId del doctor si es válido, null si no.
 */
export async function verifyDoctor(token: string): Promise<string | null> {
  const admin = getAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  return profile?.role === "doctor" ? profile.id : null;
}

/**
 * Verifica que el paciente (por userId) es dueño del patientId.
 * Evita que un paciente acceda a los datos de otro.
 */
export async function patientOwns(userId: string, patientId: string): Promise<boolean> {
  const admin = getAdmin();
  const { data } = await admin
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

/**
 * Verifica que el doctor (por doctorId) atiende al paciente con patientId.
 * Evita que un doctor acceda a datos de otro doctor.
 */
export async function doctorOwnsPatient(doctorId: string, patientId: string): Promise<boolean> {
  const admin = getAdmin();
  const { data } = await admin
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("doctor_id", doctorId)
    .single();
  return !!data;
}
