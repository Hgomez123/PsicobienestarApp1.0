/**
 * Catálogo de mensajes de error genéricos al cliente.
 *
 * Centraliza los textos visibles para garantizar consistencia y
 * facilitar cambios de copy. Los detalles técnicos van a `logError`,
 * nunca al body de la respuesta.
 *
 * Handlers que necesiten errores propios (ej. validación de negocio)
 * agregan sus mensajes a este archivo, no inline en el route.
 */

export const ERRORS = {
  UNAUTHORIZED: "No autorizado.",
  RATE_LIMITED: "Demasiadas solicitudes.",
  INVALID_REQUEST: "Solicitud inválida.",
  SERVER_ERROR: "Error del servidor.",
} as const;
