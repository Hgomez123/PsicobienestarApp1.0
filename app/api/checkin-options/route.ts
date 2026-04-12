/**
 * PATCH /api/checkin-options
 *
 * La doctora actualiza las opciones de check-in de un paciente.
 * Usa service_role para bypassar RLS.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyDoctor, doctorOwnsPatient } from "@/lib/security/verifyAuth";
import { checkRateLimit } from "@/lib/security/rateLimit";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(req: NextRequest) {
  /* ── Autenticación ─────────────────────────────────────── */
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const doctorId = await verifyDoctor(token);
  if (!doctorId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  /* ── Rate limit ───────────────────────────────────────── */
  const rl = checkRateLimit(`checkin-opts:${doctorId}`, "strict");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  /* ── Validar body ─────────────────────────────────────── */
  let patientId: string, options: string[];
  try {
    const body = await req.json() as { patientId?: unknown; options?: unknown };
    patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
    options   = Array.isArray(body.options)
      ? (body.options as unknown[]).filter((o): o is string => typeof o === "string").map(o => o.trim()).filter(Boolean)
      : [];
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!patientId || !/^[0-9a-f-]{36}$/i.test(patientId)) {
    return NextResponse.json({ error: "patientId inválido." }, { status: 400 });
  }
  if (options.length > 20) {
    return NextResponse.json({ error: "Máximo 20 opciones." }, { status: 400 });
  }

  /* ── Verificar propiedad ──────────────────────────────── */
  const owns = await doctorOwnsPatient(doctorId, patientId);
  if (!owns) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const admin = getAdmin();

  /* ── Verificar si la columna checkin_options existe ───── */
  const { error: probeError } = await admin
    .from("patients")
    .select("checkin_options")
    .eq("id", patientId)
    .single();

  // PostgreSQL error code 42703 = undefined_column
  if (probeError && (probeError.code === "42703" || probeError.message.toLowerCase().includes("checkin_options"))) {
    return NextResponse.json(
      {
        error: "La columna 'checkin_options' no existe en la tabla 'patients'. Agrégala en Supabase: ALTER TABLE patients ADD COLUMN checkin_options text[] DEFAULT '{}'::text[];",
        code: "MISSING_COLUMN",
      },
      { status: 422 }
    );
  }

  /* ── Actualizar ───────────────────────────────────────── */
  const { data, error } = await admin
    .from("patients")
    .update({ checkin_options: options })
    .eq("id", patientId)
    .select("id, checkin_options")
    .single();

  if (error) {
    // Devolver el error real de Supabase para diagnóstico
    console.error("[checkin-options PATCH]", { code: error.code, message: error.message, details: error.details });
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
