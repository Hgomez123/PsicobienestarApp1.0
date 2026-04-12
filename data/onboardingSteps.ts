import type { OnboardingStep } from "@/components/ui/OnboardingModal";

export const PATIENT_STORAGE_KEY = "psicobienestar_patient_guide_done";
export const DOCTOR_STORAGE_KEY  = "psicobienestar_doctor_guide_done";

export const patientSteps: OnboardingStep[] = [
  {
    icon: "👋",
    color: "#1E5A85",
    colorAlt: "#6F98BE",
    title: "¡Bienvenida/o a tu portal!",
    description:
      "Este es tu espacio personal de bienestar. Aquí podrás revisar tus citas, materiales, objetivos y comunicarte con tu psicóloga entre sesiones. Esta guía rápida te explicará cada función.",
    tip: "La guía solo aparece una vez, pero siempre puedes revisarla tocando el botón de ayuda (?) en la barra superior.",
  },
  {
    icon: "🏠",
    color: "#1E5A85",
    colorAlt: "#4A8AB5",
    title: "Inicio — tu panel principal",
    description:
      "En la sección Inicio encontrarás un resumen de tu próxima cita, tus recursos disponibles y el avance de tus objetivos. Es tu punto de partida cada vez que ingresas al portal.",
    tip: "Los tres indicadores de la parte superior te dan un vistazo rápido del estado de tu proceso.",
  },
  {
    icon: "💬",
    color: "#3D7A54",
    colorAlt: "#5BA677",
    title: "Check-in emocional",
    description:
      "En el panel derecho de Inicio verás las opciones de check-in que tu psicóloga habilitó para ti. Selecciona cómo te sientes y presiona \"Enviar check-in\" — ella lo recibirá en tiempo real.",
    tip: "El check-in ayuda a tu psicóloga a preparar mejor cada sesión contigo.",
  },
  {
    icon: "📅",
    color: "#1E5A85",
    colorAlt: "#2D7AB5",
    title: "Ver detalles de tu cita",
    description:
      "Presiona el botón \"Ver cita\" en la barra superior para consultar la fecha, hora, modalidad y estado de tu próxima sesión. También encontrarás información sobre el acceso al enlace virtual.",
  },
  {
    icon: "🔄",
    color: "#946235",
    colorAlt: "#C08050",
    title: "Solicitar cambio de cita",
    description:
      "Desde el panel de Inicio o desde \"Mis citas\", puedes solicitar un cambio de fecha y hora. Selecciona el día y horario que prefieras y envía la solicitud — tu psicóloga la revisará.",
    tip: "Tu cita actual permanece activa hasta que la solicitud sea aprobada.",
  },
  {
    icon: "📋",
    color: "#6B5FA6",
    colorAlt: "#8A7CC0",
    title: "Mis recomendaciones",
    description:
      "Aquí aparecen los mensajes, indicaciones y ejercicios que tu psicóloga comparte específicamente para ti. Revísalos entre sesiones para apoyar tu proceso terapéutico.",
  },
  {
    icon: "📁",
    color: "#2E7A82",
    colorAlt: "#3D9BA6",
    title: "Mis recursos",
    description:
      "Tu psicóloga puede asignarte materiales de apoyo: lecturas, audios, videos o documentos. Tócalos para abrirlos directamente desde el portal.",
    tip: "Los archivos se abren en una nueva pestaña con un enlace seguro y temporal.",
  },
  {
    icon: "🎯",
    color: "#1E5A85",
    colorAlt: "#3D6A8A",
    title: "Mi proceso y Mis citas",
    description:
      "En \"Mi proceso\" verás tus objetivos terapéuticos activos, puedes marcarlos como completados y consultar las últimas notas de seguimiento. En \"Mis citas\" encuentras el historial completo de sesiones.",
    tip: "Marcar un objetivo como completado informa a tu psicóloga de tu avance.",
  },
];

export const doctorSteps: OnboardingStep[] = [
  {
    icon: "🧠",
    color: "#1A3049",
    colorAlt: "#1E5A85",
    title: "¡Bienvenida al panel clínico!",
    description:
      "Este es tu espacio profesional para gestionar pacientes, citas, seguimiento clínico y comunicación. La guía te mostrará cada sección y sus funciones principales.",
    tip: "Puedes revisar esta guía en cualquier momento tocando el botón (?) en la parte superior del panel.",
  },
  {
    icon: "📊",
    color: "#1E5A85",
    colorAlt: "#4A8AB5",
    title: "Dashboard — vista general",
    description:
      "El Dashboard muestra el resumen del día: pacientes activos, próximas citas, solicitudes pendientes y un acceso rápido a las secciones más usadas. Es tu punto de partida al iniciar sesión.",
    tip: "Las solicitudes de cita pendientes aparecen destacadas aquí para que no se te escapen.",
  },
  {
    icon: "👥",
    color: "#3D7A54",
    colorAlt: "#5BA677",
    title: "Pacientes — agregar y gestionar",
    description:
      "En la sección Pacientes puedes crear nuevos perfiles. Presiona el botón \"Nuevo paciente\", completa los datos (nombre, correo, teléfono, plan de sesiones) y guarda. Desde aquí también editas o archivas pacientes existentes.",
    tip: "El correo del paciente se usa para crear su acceso al portal. Asegúrate de que sea correcto antes de guardar.",
  },
  {
    icon: "📅",
    color: "#946235",
    colorAlt: "#C08050",
    title: "Agenda — programar citas",
    description:
      "Desde Agenda puedes crear nuevas citas seleccionando paciente, fecha, hora y modalidad. También aparecen aquí las solicitudes de cambio enviadas por pacientes — puedes aprobarlas o rechazarlas con un clic.",
    tip: "Al aceptar una solicitud, la cita se crea automáticamente en el sistema y el paciente lo verá en su portal.",
  },
  {
    icon: "📝",
    color: "#6B5FA6",
    colorAlt: "#8A7CC0",
    title: "Seguimiento — notas y objetivos",
    description:
      "En Seguimiento puedes registrar notas clínicas por sesión y gestionar los objetivos terapéuticos de cada paciente. Las notas quedan vinculadas al expediente y el paciente puede ver las más recientes en su portal.",
    tip: "Haz clic en el nombre del paciente en la lista lateral para cambiar entre expedientes.",
  },
  {
    icon: "💌",
    color: "#1E5A85",
    colorAlt: "#2D7AB5",
    title: "Recomendaciones — mensajes personalizados",
    description:
      "Envía indicaciones, reflexiones o ejercicios directamente al portal del paciente. Selecciona el paciente, escribe el mensaje con título y contenido, y publícalo. El paciente lo verá la próxima vez que ingrese.",
  },
  {
    icon: "📁",
    color: "#2E7A82",
    colorAlt: "#3D9BA6",
    title: "Recursos — materiales de apoyo",
    description:
      "Sube archivos (PDF, audio, video, enlaces) y asígnalos a uno o más pacientes. El paciente podrá abrirlos desde su sección \"Mis recursos\" con un enlace seguro.",
    tip: "Los archivos subidos se almacenan de forma segura. Puedes revocar el acceso en cualquier momento.",
  },
  {
    icon: "🔔",
    color: "#C05A3A",
    colorAlt: "#E07050",
    title: "Notificaciones — check-ins y solicitudes",
    description:
      "Aquí recibirás los check-ins emocionales enviados por tus pacientes, las solicitudes de cita nuevas y cualquier aviso relevante. El contador rojo en la barra te indica cuántos pendientes tienes.",
    tip: "Marca todas como leídas presionando \"Marcar todas como leídas\" cuando hayas revisado los pendientes.",
  },
];
