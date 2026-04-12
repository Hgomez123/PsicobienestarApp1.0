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

/** Genera los próximos 4 días hábiles (lun–vie) a partir de mañana. */
export function getAvailableDates() {
  const result: { isoDate: string; day: string; label: string; month: string; slots: string[] }[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);

  while (result.length < 4) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const yyyy = d.getFullYear();
      const mm   = String(d.getMonth() + 1).padStart(2, "0");
      const dd   = String(d.getDate()).padStart(2, "0");
      result.push({
        isoDate: `${yyyy}-${mm}-${dd}`,
        day:     String(d.getDate()),
        label:   `${DAY[dow]} ${d.getDate()}`,
        month:   MON[d.getMonth()],
        slots:   ["09:00", "10:30", "12:00", "15:00", "16:30"],
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return result;
}

export const availableDates = getAvailableDates();