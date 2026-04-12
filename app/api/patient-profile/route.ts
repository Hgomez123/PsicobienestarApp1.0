/**
 * GET /api/patient-profile
 *
 * Devuelve el perfil completo del paciente autenticado (incluye checkin_options).
 * Usa service_role para bypassar RLS y garantizar que todos los campos llegan.
 *
 * Rate limit: lenient (120 req/min) keyed por userId — no por IP para no
 * bloquear a usuarios legítimos detrás del mismo NAT/proxy.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyPatient } from "@/lib/security/verifyAuth";
import { checkRateLimit } from "@/lib/security/rateLimit";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  /* ── Autenticación primero ─────────────────────────────── */
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const userId = await verifyPatient(token);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  /* ── Rate limit por usuario (no por IP) ────────────────── */
  const rl = checkRateLimit(`patient-profile:${userId}`, "lenient");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en unos segundos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  /* ── Consulta con service_role ─────────────────────────── */
  const admin = getAdmin();
  const { data, error } = await admin
    .from("patients")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Paciente no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ data });
}
