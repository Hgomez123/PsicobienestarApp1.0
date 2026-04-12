/**
 * POST /api/checkin
 *
 * Registra un check-in emocional del paciente.
 * Usa service_role para bypassar RLS (patient_id ≠ auth.uid()).
 * Verifica: 1) token JWT válido, 2) rol = patient, 3) el patient_id pertenece al usuario.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyPatient, patientOwns } from "@/lib/security/verifyAuth";
import { checkRateLimit } from "@/lib/security/rateLimit";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  /* ── Autenticación ─────────────────────────────────────── */
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const userId = await verifyPatient(token);
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  /* ── Rate limit por usuario ───────────────────────────── */
  const rl = checkRateLimit(`checkin:${userId}`, "lenient");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  /* ── Validar body ─────────────────────────────────────── */
  let patientId: string, content: string;
  try {
    const body = await req.json() as { patientId?: unknown; content?: unknown };
    patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
    content   = typeof body.content   === "string" ? body.content.trim()   : "";
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!patientId || !content) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(patientId)) {
    return NextResponse.json({ error: "patientId inválido." }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "Contenido demasiado largo." }, { status: 400 });
  }

  /* ── Verificar que el paciente pertenece al usuario ──── */
  const owns = await patientOwns(userId, patientId);
  if (!owns) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  /* ── Insertar con service_role ────────────────────────── */
  const admin = getAdmin();
  const { data, error } = await admin
    .from("checkins")
    .insert({ patient_id: patientId, content })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[checkin POST]", { code: error.code, message: error.message, details: error.details });
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    );
  }

  /* ── Crear notificación para la doctora ──────────────── */
  const { data: patient } = await admin
    .from("patients")
    .select("doctor_id, name")
    .eq("id", patientId)
    .single();

  if (patient) {
    await admin.from("notifications").insert({
      doctor_id: patient.doctor_id,
      patient_id: patientId,
      type: "checkin",
      content: `${patient.name} envió un check-in: "${content}"`,
    });
  }

  return NextResponse.json({ success: true, data });
}
