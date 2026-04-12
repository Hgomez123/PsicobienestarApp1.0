/**
 * PATCH /api/appointments
 *
 * Cancela una cita. Solo puede ser llamado por el paciente dueño de esa cita.
 * Verifica: 1) token JWT válido, 2) rol = patient, 3) patient.user_id coincide.
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

export async function PATCH(req: NextRequest) {
  /* ── Autenticación primero ─────────────────────────────── */
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const userId = await verifyPatient(token);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  /* ── Rate limit por usuario (strict: cancelar cita es acción sensible) */
  const rl = checkRateLimit(`appointments:${userId}`, "strict");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  /* ── Validación del body ───────────────────────────────── */
  let appointmentId: string, patientId: string;
  try {
    const body = await req.json() as { appointmentId?: unknown; patientId?: unknown };
    appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
    patientId     = typeof body.patientId     === "string" ? body.patientId     : "";
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const uuidRe = /^[0-9a-f-]{36}$/i;
  if (!uuidRe.test(appointmentId) || !uuidRe.test(patientId)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  /* ── Verificar que el paciente le pertenece al usuario ─── */
  const owns = await patientOwns(userId, patientId);
  if (!owns) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  /* ── Verificar que la cita pertenece al paciente ──────── */
  const admin = getAdmin();
  const { data: appt } = await admin
    .from("appointments")
    .select("id, patient_id")
    .eq("id", appointmentId)
    .eq("patient_id", patientId)
    .single();

  if (!appt) {
    return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  }

  /* ── Actualizar ────────────────────────────────────────── */
  const { error: updateError } = await admin
    .from("appointments")
    .update({ status: "Cancelada" })
    .eq("id", appointmentId);

  if (updateError) {
    return NextResponse.json({ error: "Error al actualizar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
