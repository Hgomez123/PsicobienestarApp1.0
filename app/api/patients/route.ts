/**
 * POST   /api/patients  — Crear cuenta de paciente
 * DELETE /api/patients  — Eliminar cuenta de paciente
 *
 * Solo puede ser llamado por la doctora autenticada.
 * Verifica: 1) token JWT válido, 2) rol = doctor, 3) doctorId coincide con el token.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyDoctor } from "@/lib/security/verifyAuth";
import { checkRateLimit } from "@/lib/security/rateLimit";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Autenticar y autorizar la doctora; retorna su profileId o null */
async function authDoctor(req: NextRequest, claimedDoctorId: string): Promise<string | null> {
  const token = extractToken(req);
  if (!token) return null;

  const doctorProfileId = await verifyDoctor(token);
  if (!doctorProfileId) return null;

  // El doctorId del body debe coincidir con el del token (no permite suplantar)
  if (doctorProfileId !== claimedDoctorId) return null;

  return doctorProfileId;
}

export async function POST(req: NextRequest) {
  /* ── Validación del body ───────────────────────────────── */
  let name: string, email: string, password: string, patientId: string, doctorId: string;
  try {
    const body = await req.json() as {
      name?: unknown; email?: unknown; password?: unknown;
      patientId?: unknown; doctorId?: unknown;
    };
    name      = typeof body.name      === "string" ? body.name.trim()      : "";
    email     = typeof body.email     === "string" ? body.email.trim().toLowerCase() : "";
    password  = typeof body.password  === "string" ? body.password          : "";
    patientId = typeof body.patientId === "string" ? body.patientId         : "";
    doctorId  = typeof body.doctorId  === "string" ? body.doctorId          : "";
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!name || !email || !password || !patientId || !doctorId) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }

  // Validar formato de email y UUID
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }
  const uuidRe = /^[0-9a-f-]{36}$/i;
  if (!uuidRe.test(patientId) || !uuidRe.test(doctorId)) {
    return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
  }

  /* ── Autenticación ─────────────────────────────────────── */
  const verifiedDoctorId = await authDoctor(req, doctorId);
  if (!verifiedDoctorId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const rl = checkRateLimit(`patients-create:${verifiedDoctorId}`, "strict");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  /* ── Crear usuario ─────────────────────────────────────── */
  const admin = getAdmin();
  const { data: authData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "patient", patient_id: patientId },
  });

  if (createError) {
    if (createError.message.includes("already registered")) {
      return NextResponse.json({ error: "Este correo ya tiene una cuenta." }, { status: 409 });
    }
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const newUserId = authData.user.id;

  await admin.from("profiles").upsert({ id: newUserId, name, email, role: "patient" });

  /* ── Vincular patient.user_id directamente (service_role bypasa RLS) ── */
  const { data: updatedPatient, error: updateError } = await admin
    .from("patients")
    .update({ user_id: newUserId })
    .eq("id", patientId)
    .select("id")
    .single();

  if (updateError || !updatedPatient) {
    // Revertir: eliminar el usuario recién creado
    await admin.auth.admin.deleteUser(newUserId);
    const detail = updateError?.message ?? "No se encontró el paciente con ese ID.";
    return NextResponse.json({ error: `Error al vincular el acceso: ${detail}` }, { status: 500 });
  }

  // Intentar también el RPC como mecanismo secundario (si existe y hace algo extra).
  // Su fallo no es crítico — el UPDATE directo ya vinculó correctamente.
  try {
    await admin.rpc("link_patient_user", {
      p_patient_id: patientId,
      p_user_id:    newUserId,
    });
  } catch { /* ignorar si el RPC no existe o falla */ }

  return NextResponse.json({ success: true, userId: newUserId });
}

export async function DELETE(req: NextRequest) {
  /* ── Validación ────────────────────────────────────────── */
  let userId: string, doctorId: string;
  try {
    const body = await req.json() as { userId?: unknown; doctorId?: unknown };
    userId   = typeof body.userId   === "string" ? body.userId   : "";
    doctorId = typeof body.doctorId === "string" ? body.doctorId : "";
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const uuidRe = /^[0-9a-f-]{36}$/i;
  if (!uuidRe.test(userId) || !uuidRe.test(doctorId)) {
    return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
  }

  /* ── Autenticación + rate limit por doctor ─────────────── */
  const verifiedDoctorId = await authDoctor(req, doctorId);
  if (!verifiedDoctorId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const rlDel = checkRateLimit(`patients-delete:${verifiedDoctorId}`, "strict");
  if (!rlDel.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rlDel.retryAfterSec) } }
    );
  }

  /* ── Eliminar ──────────────────────────────────────────── */
  const admin = getAdmin();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: "Error al eliminar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
