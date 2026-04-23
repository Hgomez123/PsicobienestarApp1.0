import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy de seguridad global.
 * - Agrega headers HTTP de seguridad en todas las respuestas.
 * - Bloquea peticiones a rutas API que vengan de orígenes no permitidos.
 *
 * Nota: en Next 16 la convención `middleware` fue renombrada a `proxy`.
 * API y semántica idénticas (mismo NextRequest/NextResponse y mismo matcher).
 */

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  /* ── Security Headers ──────────────────────────────────── */
  // Evita que la app se cargue dentro de un iframe (clickjacking)
  res.headers.set("X-Frame-Options", "DENY");

  // El navegador no debe adivinar el tipo MIME
  res.headers.set("X-Content-Type-Options", "nosniff");

  // No enviar el Referer a sitios externos
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Deshabilitar funciones de hardware no necesarias
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // XSS Protection (legacy browsers)
  res.headers.set("X-XSS-Protection", "1; mode=block");

  // Content-Security-Policy: solo permitir recursos del propio sitio + Supabase
  const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/^https?:\/\//, "")
    .split("/")[0];

  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Next.js requiere unsafe-inline/eval en dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  /* ── CORS para rutas API ────────────────────────────────── */
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin") ?? "";

    // Preflight CORS
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  ALLOWED_ORIGIN || origin,
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age":       "86400",
        },
      });
    }

    // Bloquear orígenes externos en producción
    if (ALLOWED_ORIGIN && origin && origin !== ALLOWED_ORIGIN) {
      return NextResponse.json(
        { error: "Origen no permitido." },
        { status: 403 }
      );
    }

    res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN || origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return res;
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas excepto archivos estáticos de Next.js
    "/((?!_next/static|_next/image|favicon.ico|logosinfondo.png).*)",
  ],
};
