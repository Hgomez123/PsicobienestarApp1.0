import type {
  DoctorPatient,
  Goal,
  RecommendationItem,
  ResourceItem,
} from "@/types/doctor";

export const doctorPatients: DoctorPatient[] = [
  {
    id: 1,
    name: "María Fernanda",
    age: 24,
    modality: "Virtual",
    status: "Activa",
    nextSession: "Viernes 12 · 4:00 PM",
    process: "Ansiedad y regulación emocional",
    lastCheckin: "Tuve momentos de ansiedad",
  },
  {
    id: 2,
    name: "Andrea López",
    age: 31,
    modality: "Presencial",
    status: "Activa",
    nextSession: "Lunes 15 · 10:00 AM",
    process: "Autocuidado y límites",
    lastCheckin: "Me sentí estable",
  },
  {
    id: 3,
    name: "Sofía Ramírez",
    age: 28,
    modality: "Virtual",
    status: "Pendiente",
    nextSession: "Miércoles 17 · 3:00 PM",
    process: "Estrés laboral",
    lastCheckin: "Necesito hablar de algo importante",
  },
];

export const doctorGoalsByPatient: Record<number, Goal[]> = {
  1: [
    { id: 1, text: "Identificar detonantes de ansiedad", done: true },
    { id: 2, text: "Fortalecer rutinas de autocuidado", done: false },
    { id: 3, text: "Mejorar diálogo interno", done: false },
  ],
  2: [
    { id: 1, text: "Reconocer señales de sobrecarga", done: true },
    { id: 2, text: "Practicar límites saludables", done: true },
    { id: 3, text: "Mejorar descanso semanal", done: false },
  ],
  3: [
    { id: 1, text: "Identificar detonantes laborales", done: false },
    { id: 2, text: "Reducir sobreexigencia", done: false },
    { id: 3, text: "Establecer pausas activas", done: true },
  ],
};

export const doctorTasksByPatient: Record<number, string> = {
  1: "Registrar durante la semana tres momentos en los que aparezca tensión corporal.",
  2: "Registrar situaciones donde dijiste sí cuando querías decir no.",
  3: "Anotar los momentos de mayor carga emocional en la jornada laboral.",
};

export const doctorNotesByPatient: Record<number, string> = {
  1: "Has mostrado mayor capacidad para identificar lo que sientes. Seguiremos reforzando herramientas con suavidad y constancia.",
  2: "Se observan avances en reconocimiento de necesidades propias y límites personales.",
  3: "Todavía hay alta activación emocional. Será importante trabajar regulación y descanso.",
};

export const doctorRecommendationsByPatient: Record<number, RecommendationItem[]> = {
  1: [
    {
      id: 1,
      type: "Mensaje",
      title: "Observa antes de reaccionar",
      content:
        "Esta semana me gustaría que observes qué situaciones activan tensión en tu cuerpo. No necesitas controlarlas todavía; solo notarlas con calma.",
      active: true,
    },
    {
      id: 2,
      type: "Ejercicio",
      title: "Respiración consciente · 5 minutos",
      content:
        "Inhala en 4 tiempos, sostén 2 y exhala en 6. Repite durante cinco minutos en un lugar tranquilo.",
      active: true,
    },
    {
      id: 3,
      type: "Reflexión",
      title: "Comprender también es avanzar",
      content:
        "No todo lo que sientes necesita corregirse de inmediato. A veces, comprenderlo ya es una forma de cuidado.",
      active: true,
    },
  ],
  2: [
    {
      id: 1,
      type: "Mensaje",
      title: "Escúchate con más honestidad",
      content:
        "Intenta identificar cuándo aceptas algo por presión y no por verdadera disposición.",
      active: true,
    },
  ],
  3: [
    {
      id: 1,
      type: "Mensaje",
      title: "Pausar también es productividad",
      content:
        "Tu descanso no es un premio. Es una necesidad real para sostenerte con estabilidad.",
      active: true,
    },
  ],
};

export const doctorResourcesByPatient: Record<number, ResourceItem[]> = {
  1: [
    {
      id: 1,
      type: "Audio",
      title: "Respiración guiada",
      desc: "Una práctica breve para regular ansiedad y reconectar con el presente.",
      active: true,
    },
    {
      id: 2,
      type: "PDF",
      title: "Registro emocional",
      desc: "Plantilla simple para identificar detonantes, pensamientos y sensaciones.",
      active: true,
    },
  ],
  2: [
    {
      id: 1,
      type: "PDF",
      title: "Registro de límites",
      desc: "Guía práctica para notar situaciones donde cedes por presión.",
      active: true,
    },
  ],
  3: [
    {
      id: 1,
      type: "Audio",
      title: "Pausa guiada de 3 minutos",
      desc: "Ejercicio breve para bajar activación durante la jornada laboral.",
      active: true,
    },
  ],
};