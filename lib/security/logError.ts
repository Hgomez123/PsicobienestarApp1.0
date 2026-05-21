/**
 * Logging server-side estructurado para errores.
 *
 * Escribe JSON a `console.error` para que Vercel logs y herramientas
 * de observabilidad (Sentry, Datadog) puedan parsearlo si se conectan
 * en el futuro.
 *
 * Los detalles técnicos del error van acá; al cliente solo se le
 * devuelven mensajes genéricos del catálogo `ERRORS`.
 */

export function logError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error(
    JSON.stringify({
      scope,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
      context,
      timestamp: new Date().toISOString(),
    })
  );
}
