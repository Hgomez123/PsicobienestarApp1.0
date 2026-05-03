/**
 * Utilities para integración con Google Calendar.
 *
 * Genera URLs en formato render template para que el usuario agregue
 * eventos a su calendario personal sin necesidad de OAuth.
 */

/**
 * Construye una URL de Google Calendar para agregar una sesión.
 *
 * @param dateStr  Fecha de inicio en formato ISO (cualquier string parseable por `new Date(...)`).
 * @param patientName  Nombre del paciente (aparece en título y descripción del evento).
 * @param modality  Modalidad de la sesión ("Virtual", "Presencial", etc.). Se usa como location.
 * @param durationMinutes  Duración en minutos. Default 50.
 * @returns URL de Google Calendar, o string vacío si la fecha no es válida.
 */
export function buildGCalUrl(
  dateStr: string,
  patientName: string,
  modality: string,
  durationMinutes: number = 50
): string {
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     `Sesión con ${patientName}`,
    dates:    `${fmt(start)}/${fmt(end)}`,
    details:  `Sesión psicológica con ${patientName}. Modalidad: ${modality}.`,
    location: modality,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
