/**
 * Rate limiter distribuido con Upstash Redis.
 *
 * Por qué: `Map` en memoria NO funciona en Vercel serverless — cada
 * invocación puede caer en una instancia distinta. Upstash es gratis
 * hasta 10k req/día y tiene latencia <10ms desde Vercel Edge.
 *
 * Setup:
 *   1. Crear cuenta en upstash.com → New Redis Database → Global
 *   2. Copiar UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN a Vercel env
 *   3. npm i @upstash/redis @upstash/ratelimit
 *   4. Reemplazar `lib/security/rateLimit.ts` con este archivo
 *
 * Fallback: si faltan las env vars (dev local sin Upstash), usa un Map
 * en memoria como antes — útil para desarrollo pero no para producción.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

type Profile = "strict" | "medium" | "lenient";

const hasUrl   = !!process.env.UPSTASH_REDIS_REST_URL;
const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;
const hasUpstash = hasUrl && hasToken;
// Misconfig: una env definida pero no la otra. En producción se
// considera peor que no tener ninguna — log explícito, fail closed.
const hasPartialUpstash = (hasUrl || hasToken) && !hasUpstash;

// ── Cliente Redis (singleton) ──────────────────────────────
const redis = hasUpstash ? Redis.fromEnv() : null;

// ── Instancias de rate limit por perfil ───────────────────
const limiters: Record<Profile, Ratelimit | null> = hasUpstash
  ? {
      // Auth / escritura sensible: 20 / 15 minutos
      strict: new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(20, "15 m"),
        prefix: "rl:strict",
        analytics: false,
      }),
      // Write moderado (check-ins, acciones del paciente): 10 / minuto
      medium: new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "rl:medium",
        analytics: false,
      }),
      // Lectura autenticada: 120 / minuto
      lenient: new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(120, "1 m"),
        prefix: "rl:lenient",
        analytics: false,
      }),
    }
  : { strict: null, medium: null, lenient: null };

// ── Fallback en memoria (solo dev) ─────────────────────────
type Entry = { count: number; firstAttempt: number; blockedUntil: number | null };
// Uso globalThis para sobrevivir a HMR de Next.js dev:
// sin esto, cada hot reload resetea el Map y el rate limit de dev miente.
const g = globalThis as unknown as { __rlStore?: Map<string, Entry> };
const memStore: Map<string, Entry> = g.__rlStore ?? (g.__rlStore = new Map());

const MEM_PROFILES: Record<Profile, { max: number; windowMs: number; blockMs: number }> = {
  strict:  { max: 20,  windowMs: 15 * 60_000, blockMs: 30 * 60_000 },
  medium:  { max: 10,  windowMs: 60_000,      blockMs: 5 * 60_000 },
  lenient: { max: 120, windowMs: 60_000,      blockMs: 60_000 },
};

function memCheck(key: string, profile: Profile) {
  const { max, windowMs, blockMs } = MEM_PROFILES[profile];
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry) {
    memStore.set(key, { count: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true };
  }
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  if (now - entry.firstAttempt > windowMs) {
    memStore.set(key, { count: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true };
  }
  entry.count++;
  if (entry.count > max) {
    entry.blockedUntil = now + blockMs;
    memStore.set(key, entry);
    return { allowed: false, retryAfterSec: Math.ceil(blockMs / 1000) };
  }
  memStore.set(key, entry);
  return { allowed: true };
}

// ── API pública ────────────────────────────────────────────

export function getClientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

export async function checkRateLimit(
  key: string,
  profile: Profile = "strict",
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const limiter = limiters[profile];

  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      // Fail CLOSED: distinguir misconfig parcial de ausencia total.
      if (hasPartialUpstash) {
        console.error(
          "[rateLimit] MISCONFIG — solo una de UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN " +
          "está definida en producción. Fallando cerrado.",
        );
      } else {
        console.error("[rateLimit] Upstash no configurado en producción — fallando cerrado");
      }
      return { allowed: false, retryAfterSec: 60 };
    }
    // Dev sin Upstash (o con config parcial): usar memoria
    if (hasPartialUpstash) {
      console.warn(
        "[rateLimit] config parcial de Upstash detectada en dev — usando memoria",
      );
    }
    return memCheck(key, profile);
  }

  try {
    const { success, reset } = await limiter.limit(key);
    if (success) return { allowed: true };
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: false, retryAfterSec };
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      // Fail CLOSED en prod si Upstash está down o devuelve error
      console.error("[rateLimit] Upstash call falló — fail CLOSED:", err);
      return { allowed: false, retryAfterSec: 60 };
    }
    console.warn("[rateLimit] Upstash call falló en dev — fail OPEN:", err);
    return { allowed: true };
  }
}
