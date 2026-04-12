/**
 * GET /api/clinical-notes?patientId=...
 *
 * Solo puede ser llamado por el paciente dueño de ese patientId.
 * Verifica: 1) token JWT válido, 2) rol = patient, 3) patient.user_id coincide.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyPatient, patientOwns, verifyDoctor, doctorOwnsPatient } from "@/lib/security/verifyAuth";
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

  /* ── Rate limit por usuario (lenient: lectura frecuente) ── */
  const rl = checkRateLimit(`clinical-notes:${userId}`, "lenient");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en unos segundos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  /* ── Validación de parámetros ──────────────────────────── */
  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId || !/^[0-9a-f-]{36}$/i.test(patientId)) {
    return NextResponse.json({ error: "Parámetro inválido." }, { status: 400 });
  }

  /* ── Verificar que el paciente le pertenece al usuario ─── */
  const owns = await patientOwns(userId, patientId);
  if (!owns) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  /* ── Consulta ──────────────────────────────────────────── */
  const admin = getAdmin();
  const { data, error } = await admin
    .from("clinical_notes")
    .select("content, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/clinical-notes
 *
 * Crea una nota clínica para un paciente. Solo puede ser llamado por la doctora.
 * Usa service_role para bypassar RLS y garantizar que el insert siempre funciona.
 */
export async function POST(req: NextRequest) {
  /* ── Autenticación ─────────────────────────────────────── */
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const doctorId = await verifyDoctor(token);
  if (!doctorId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  /* ── Rate limit ────────────────────────────────────────── */
  const rl = checkRateLimit(`clinical-notes-create:${doctorId}`, "strict");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta en unos segundos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  /* ── Validación del body ───────────────────────────────── */
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
    return NextResponse.json({ error: "ID de paciente inválido." }, { status: 400 });
  }
  if (content.length > 5000) {
    return NextResponse.json({ error: "La nota es demasiado larga (máx. 5000 caracteres)." }, { status: 400 });
  }

  /* ── Verificar que el paciente le pertenece a la doctora ─ */
  const owns = await doctorOwnsPatient(doctorId, patientId);
  if (!owns) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  /* ── Insertar con service_role (bypassa RLS) ───────────── */
  const admin = getAdmin();
  const { data, error } = await admin
    .from("clinical_notes")
    .insert({ patient_id: patientId, doctor_id: doctorId, content })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al guardar la nota." }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
