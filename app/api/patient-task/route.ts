/**
 * GET /api/patient-task?patientId=...
 *
 * Retorna la tarea más reciente asignada al paciente por su psicóloga.
 * Solo puede ser llamado por el paciente dueño de ese patientId.
 * Verifica: 1) JWT válido, 2) rol = patient, 3) patient.user_id coincide.
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

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const userId = await verifyPatient(token);
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const rl = checkRateLimit(`patient-task:${userId}`, "lenient");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId || !/^[0-9a-f-]{36}$/i.test(patientId)) {
    return NextResponse.json({ error: "Parámetro inválido." }, { status: 400 });
  }

  // Verifica que este paciente le pertenece al usuario autenticado — evita cross-patient
  const owns = await patientOwns(userId, patientId);
  if (!owns) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

  const admin = getAdmin();
  const { data, error } = await admin
    .from("tasks")
    .select("id, text, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? null });
}
