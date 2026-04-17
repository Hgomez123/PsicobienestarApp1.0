/**
 * POST /api/upload-resource  (multipart/form-data)
 *
 * Sube un archivo al bucket de Supabase Storage usando service_role.
 * Crea el bucket automáticamente si no existe.
 * Solo accesible para doctores autenticados.
 *
 * Body (FormData):
 *   file     — Blob del archivo
 *   patientId — UUID del paciente
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyDoctor, doctorOwnsPatient } from "@/lib/security/verifyAuth";
import { checkRateLimit } from "@/lib/security/rateLimit";

const BUCKET        = "psicobienestar-files";
const MAX_SIZE_BYTES = 52_428_800; // 50 MB
const ALLOWED_TYPES  = [
  "application/pdf",
  "audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4",
  "video/mp4", "video/webm", "video/ogg",
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "text/plain",
];

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function ensureBucket(admin: ReturnType<typeof getAdmin>) {
  const { data: buckets } = await admin.storage.listBuckets();
  if (buckets?.some(b => b.name === BUCKET)) return true;

  const { error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_SIZE_BYTES,
  });
  return !error || error.message.includes("already exists");
}

export async function POST(req: NextRequest) {
  /* ── Auth ──────────────────────────────────────────────── */
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const doctorId = await verifyDoctor(token);
  if (!doctorId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  /* ── Rate limit ───────────────────────────────────────── */
  const rl = checkRateLimit(`upload:${doctorId}`, "strict");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  /* ── Leer FormData ────────────────────────────────────── */
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido." }, { status: 400 });
  }

  const file      = formData.get("file");
  const patientId = formData.get("patientId");

  if (!(file instanceof Blob) || !patientId || typeof patientId !== "string") {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(patientId)) {
    return NextResponse.json({ error: "patientId inválido." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande. Máximo 50 MB." }, { status: 413 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Tipo de archivo no permitido: ${file.type}` }, { status: 415 });
  }

  /* ── Verificar que el paciente pertenece a la doctora ─── */
  const owns = await doctorOwnsPatient(doctorId, patientId);
  if (!owns) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

  /* ── Crear bucket si no existe ────────────────────────── */
  const admin = getAdmin();
  const ready = await ensureBucket(admin);
  if (!ready) {
    return NextResponse.json({ error: "Error configurando almacenamiento." }, { status: 503 });
  }

  /* ── Subir archivo ────────────────────────────────────── */
  const ext  = (file instanceof File ? file.name : "file").split(".").pop() ?? "bin";
  const path = `patients/${patientId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload-resource] Error al subir:", uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // El bucket es privado — no se genera URL pública.
  // El cliente usa /api/resource-url para obtener una URL firmada al momento de abrir.
  return NextResponse.json({
    success: true,
    path,
    url: null,
  });
}
