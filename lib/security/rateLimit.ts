/**
 * Rate limiter en memoria.
 *
 * Dos perfiles de límite:
 *  - "strict"  → endpoints de autenticación/escritura (login, crear paciente…)
 *  - "lenient" → endpoints de lectura autenticados (patient-profile, clinical-notes…)
 *
 * En despliegue serverless cada instancia tiene su propio Map; sigue siendo
 * útil contra floods dentro de la misma instancia y entornos single-process.
 */

type Entry = {
  count:        number;
  firstAttempt: number;
  blockedUntil: number | null;
};

const store = new Map<string, Entry>();

type Profile = { maxAttempts: number; windowMs: number; blockMs: number };

const PROFILES: Record<"strict" | "lenient", Profile> = {
  /** Auth / escritura: 20 intentos / 15 min → bloqueo 30 min */
  strict: { maxAttempts: 20, windowMs: 15 * 60_000, blockMs: 30 * 60_000 },
  /** Lectura autenticada: 120 solicitudes / 1 min → bloqueo 60 s */
  lenient: { maxAttempts: 120, windowMs: 60_000, blockMs: 60_000 },
};

export function getClientIp(req: Request): string {
  const h   = req.headers as unknown as { get(k: string): string | null };
  const fwd = h.get("x-forwarded-for") ?? h.get("x-real-ip");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}

export function checkRateLimit(
  key: string,
  profile: "strict" | "lenient" = "strict",
): { allowed: boolean; retryAfterSec?: number } {
  const { maxAttempts, windowMs, blockMs } = PROFILES[profile];
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true };
  }

  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1_000) };
  }

  // Ventana expirada → reiniciar
  if (now - entry.firstAttempt > windowMs) {
    store.set(key, { count: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    entry.blockedUntil = now + blockMs;
    store.set(key, entry);
    return { allowed: false, retryAfterSec: Math.ceil(blockMs / 1_000) };
  }

  store.set(key, entry);
  return { allowed: true };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
