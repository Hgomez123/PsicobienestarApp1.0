/**
 * GET /api/resource-url?filePath=...&patientId=...
 *
 * Genera una URL firmada para un recurso almacenado en Supabase Storage.
 * Usa service_role para:
 *   1. Crear el bucket automáticamente si no existe.
 *   2. Generar la URL firmada sin depender de la sesión del cliente.
 *
 * Solo puede ser llamado por el paciente dueño del recurso.
 */

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { extractToken, verifyPatient, patientOwns } from "@/lib/security/verifyAuth";
import { checkRateLimit } from "@/lib/security/rateLimit";

const BUCKET = "psicobienestar-files";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Crea el bucket si no existe. Retorna false si hay un error real. */
async function ensureBucket(admin: ReturnType<typeof getAdmin>): Promise<boolean> {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (exists) return true;

  const { error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    allowedMimeTypes: ["application/pdf", "audio/*", "video/*", "image/*", "text/*"],
    fileSizeLimit: 52_428_800, // 50 MB
  });

  if (error && !error.message.includes("already exists")) {
    console.error("[resource-url] Error creando bucket:", error.message);
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  /* ── Auth ──────────────────────────────────────────────── */
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const userId = await verifyPatient(token);
  if (!userId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  /* ── Rate limit ───────────────────────────────────────── */
  const rl = checkRateLimit(`resource-url:${userId}`, "lenient");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } }
    );
  }

  /* ── Parámetros ───────────────────────────────────────── */
  const filePath = req.nextUrl.searchParams.get("filePath");
  const patientId = req.nextUrl.searchParams.get("patientId");

  if (!filePath || !patientId) {
    return NextResponse.json({ error: "Parámetros faltantes." }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(patientId)) {
    return NextResponse.json({ error: "patientId inválido." }, { status: 400 });
  }
  // Evitar path traversal
  if (filePath.includes("..") || filePath.startsWith("/")) {
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  }

  /* ── Verificar propiedad ──────────────────────────────── */
  const owns = await patientOwns(userId, patientId);
  if (!owns) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

  /* ── Asegurar que el bucket existe ────────────────────── */
  const admin = getAdmin();
  const bucketReady = await ensureBucket(admin);
  if (!bucketReady) {
    return NextResponse.json(
      { error: "Error de almacenamiento. Contacta al administrador." },
      { status: 503 }
    );
  }

  /* ── Generar URL firmada (válida 1 hora) ──────────────── */
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    console.error("[resource-url] Error firmando URL:", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "No se pudo generar la URL." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
