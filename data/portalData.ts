import type { NavItem, SupportCard } from "@/types/portal";

export const navItems: NavItem[] = [
  "Inicio",
  "Mis recomendaciones",
  "Mis recursos",
  "Mi proceso",
  "Mis citas",
  "Configuración",
];

export const quickStats = [
  {
    label: "Próxima cita",
    value: "12 abril · 4:00 PM",
    helper: "Sesión virtual",
  },
  {
    label: "Recursos nuevos",
    value: "3 disponibles",
    helper: "Asignados esta semana",
  },
  {
    label: "Estado del proceso",
    value: "Seguimiento activo",
    helper: "Acompañamiento en curso",
  },
];

export const recommendations = [
  {
    title: "Mensaje de tu psicóloga",
    text: "Esta semana me gustaría que observes qué momentos del día te generan más tensión. No intentes resolverlos de inmediato; primero identifícalos con calma.",
  },
  {
    title: "Ejercicio recomendado",
    text: "Respiración consciente de 5 minutos para ayudarte a reconocer tensión corporal y recuperar estabilidad emocional.",
  },
];

export const resources = [
  {
    type: "Audio",
    title: "Respiración guiada",
    desc: "Una práctica breve para regular ansiedad y reconectar con el presente.",
  },
  {
    type: "PDF",
    title: "Registro emocional",
    desc: "Plantilla simple para identificar detonantes, pensamientos y sensaciones.",
  },
  {
    type: "Lectura",
    title: "Autocuidado sin culpa",
    desc: "Reflexión breve para trabajar descanso, límites y amabilidad contigo.",
  },
];

export const appointments = [
  {
    title: "Sesión individual",
    date: "Viernes 12 de abril · 4:00 PM",
    mode: "Virtual",
    status: "Confirmada",
  },
  {
    title: "Seguimiento",
    date: "Viernes 19 de abril · 4:00 PM",
    mode: "Virtual",
    status: "Pendiente",
  },
];

export const checkinOptions = [
  "Me sentí estable",
  "Tuve momentos de ansiedad",
  "Me sentí emocionalmente cargado/a",
  "Siento que tuve avances",
  "Necesito hablar de algo importante",
];

export const supportCards: Record<
  SupportCard,
  {
    label: string;
    title: string;
    text: string;
    note: string;
  }
> = {
  mensaje: {
    label: "Mensaje para ti",
    title: "Observa antes de reaccionar",
    text: "Esta semana me gustaría que observes qué situaciones activan tensión en tu cuerpo. No necesitas controlarlas todavía; solo notarlas con calma.",
    note: "El objetivo no es corregirlo todo hoy, sino desarrollar más conciencia emocional.",
  },
  ejercicio: {
    label: "Ejercicio sugerido",
    title: "Respiración consciente · 5 minutos",
    text: "Inhala en 4 tiempos, sostén 2 y exhala en 6. Repite durante cinco minutos en un lugar tranquilo.",
    note: "Esta práctica puede ayudarte a bajar activación física y recuperar estabilidad.",
  },
  reflexion: {
    label: "Reflexión semanal",
    title: "Comprender también es avanzar",
    text: "No todo lo que sientes necesita corregirse de inmediato. A veces, comprenderlo ya es una forma de cuidado.",
    note: "La meta no es exigirte perfección, sino acompañarte con más suavidad.",
  },
};

const DAY = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MON = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

/** Slots disponibles de 8:00 a 16:00 (horario 8 a 5). */
const ALL_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];

/**
 * Genera semana actual (lun–sáb) + semana siguiente (lun–sáb), excluyendo hoy y días pasados.
 * bookedISO: array de strings "YYYY-MM-DDTHH:MM:00" con horarios ya reservados.
 */
export function getAvailableDates(bookedISO: string[] = []) {
  const result: { isoDate: string; day: string; label: string; month: string; slots: string[] }[] = [];
  const bookedSet = new Set(bookedISO);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Lunes de la semana actual
  const dow = today.getDay();
  const daysToMonday = dow === 0 ? -6 : 1 - dow;
  const weekMonday = new Date(today);
  weekMonday.setDate(today.getDate() + daysToMonday);

  // 2 semanas: lun (0) a sáb (5)
  for (let week = 0; week < 2; week++) {
    for (let dayOff = 0; dayOff < 6; dayOff++) {
      const date = new Date(weekMonday);
      date.setDate(weekMonday.getDate() + week * 7 + dayOff);
      date.setHours(0, 0, 0, 0);

      if (date < tomorrow) continue; // omitir hoy y días pasados

      const yyyy = date.getFullYear();
      const mm   = String(date.getMonth() + 1).padStart(2, "0");
      const dd   = String(date.getDate()).padStart(2, "0");
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const slots = ALL_SLOTS.filter(slot => !bookedSet.has(`${isoDate}T${slot}:00`));
      if (slots.length === 0) continue; // día sin horarios disponibles

      result.push({
        isoDate,
        day:   String(date.getDate()),
        label: `${DAY[date.getDay()]} ${date.getDate()}`,
        month: MON[date.getMonth()],
        slots,
      });
    }
  }
  return result;
}

export const availableDates = getAvailableDates();