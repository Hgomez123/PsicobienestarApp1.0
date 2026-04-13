/**
 * GET /api/available-slots
 *
 * Retorna los horarios ya reservados del médico de la paciente autenticada
 * para las próximas 2 semanas. Solo devuelve fechas/horas (sin datos personales).
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
  /* ── Autenticación ─────────────────────────────────────── */
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const userId = await verifyPatient(token);
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  /* ── Rate limit ────────────────────────────────────────── */
  const rl = checkRateLimit(`available-slots:${userId}`, "lenient");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  const admin = getAdmin();

  /* ── Obtener doctor_id del paciente ────────────────────── */
  const { data: patient } = await admin
    .from("patients")
    .select("doctor_id")
    .eq("user_id", userId)
    .single();

  if (!patient) return NextResponse.json({ error: "Paciente no encontrado." }, { status: 404 });

  /* ── Citas no canceladas en las próximas 2 semanas ─────── */
  const now       = new Date().toISOString();
  const twoWeeks  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: appts } = await admin
    .from("appointments")
    .select("scheduled_at")
    .eq("doctor_id", patient.doctor_id)
    .neq("status", "Cancelada")
    .gte("scheduled_at", now)
    .lte("scheduled_at", twoWeeks);

  /* ── Normalizar a "YYYY-MM-DDTHH:MM:00" ───────────────── */
  const booked = (appts ?? []).map(a => {
    const d   = new Date(a.scheduled_at);
    const yy  = d.getFullYear();
    const mo  = String(d.getMonth() + 1).padStart(2, "0");
    const dd  = String(d.getDate()).padStart(2, "0");
    const hh  = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yy}-${mo}-${dd}T${hh}:${min}:00`;
  });

  return NextResponse.json({ booked });
}
