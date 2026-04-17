"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  getSession, getPatientByUserId,
  getRecommendations, getResources, getAppointments, getGoals,
  updateGoal, createNotification,
  createAppointmentRequest, getPatientAppointmentRequests,
} from "@/lib/supabase/db";
import type { Patient } from "@/lib/supabase/types";

import PortalSidebar                from "@/components/portal/PortalSidebar";
import PortalHeader                 from "@/components/portal/PortalHeader";
import PortalMobileMenu             from "@/components/portal/PortalMobileMenu";
import PortalWelcomeCard            from "@/components/portal/PortalWelcomeCard";
import PortalQuickStats             from "@/components/portal/PortalQuickStats";
import PortalSupportSection         from "@/components/portal/PortalSupportSection";
import PortalSessionPanel           from "@/components/portal/PortalSessionPanel";
import PortalResourcesSection       from "@/components/portal/PortalResourcesSection";
import PortalProcessSection         from "@/components/portal/PortalProcessSection";
import PortalRecommendationsSection from "@/components/portal/PortalRecommendationsSection";
import PortalResourcesPageSection   from "@/components/portal/PortalResourcesPageSection";
import PortalProcessPageSection     from "@/components/portal/PortalProcessPageSection";
import PortalAppointmentsSection    from "@/components/portal/PortalAppointmentsSection";
import PortalSettingsSection        from "@/components/portal/PortalSettingsSection";

import Modal          from "@/components/ui/Modal";
import SimpleModal    from "@/components/ui/SimpleModal";
import PrimaryButton  from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import OnboardingModal from "@/components/ui/OnboardingModal";
import InactivityGuard from "@/components/ui/InactivityGuard";
import { patientSteps, PATIENT_STORAGE_KEY } from "@/data/onboardingSteps";

import type { NavItem, SupportCard, UserData } from "@/types/portal";
import { navItems, supportCards, checkinOptions as defaultCheckinOptions, getAvailableDates } from "@/data/portalData";

type RecommendationItem = { title: string; text: string };
type ResourceItem       = { type: string; title: string; desc: string; filePath: string | null; fileUrl: string | null };
type AppointmentItem    = { title: string; date: string; mode: string; status: string; isPending?: boolean };
type GoalItem           = { id: number; text: string; done: boolean };

export default function PortalPacientePage() {
  const router = useRouter();
  // Ref para el userId de Supabase Auth (estable, no recrea callbacks)
  const userIdRef = useRef<string | null>(null);

  const [authorized, setAuthorized]           = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [patient, setPatient]                 = useState<Patient | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [resources, setResources]             = useState<ResourceItem[]>([]);
  const [appointments, setAppointments]       = useState<AppointmentItem[]>([]);
  const [nextAppointmentId, setNextAppointmentId] = useState<string | null>(null);
  const [goals, setGoals]                     = useState<GoalItem[]>([]);
  const [goalIds, setGoalIds]                 = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes]     = useState<{ content: string; created_at: string }[]>([]);
  const [latestTask, setLatestTask]           = useState<{ text: string; created_at: string } | null>(null);

  const [activeSection, setActiveSection]       = useState<NavItem>("Inicio");
  const [navHistory, setNavHistory]             = useState<NavItem[]>([]);
  const [sectionKey, setSectionKey]             = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [logoutModalOpen, setLogoutModalOpen]   = useState(false);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen]     = useState(false);
  const [bookedSlots, setBookedSlots]           = useState<string[]>([]);
  const [selectedDate, setSelectedDate]         = useState("");
  const [selectedIsoDate, setSelectedIsoDate]   = useState("");
  const [selectedSlot, setSelectedSlot]         = useState("");
  const [bookingSuccess, setBookingSuccess]     = useState(false);
  const [activeSupportCard, setActiveSupportCard] = useState<SupportCard>("mensaje");
  const [selectedCheckin, setSelectedCheckin]   = useState("");
  const [checkinSent, setCheckinSent]           = useState(false);
  const [showTaskDetails, setShowTaskDetails]   = useState(false);
  const [onboardingOpen, setOnboardingOpen]     = useState(false);
  const [checkinError, setCheckinError]         = useState<string | null>(null);

  /* ── Auth guard ─────────────────────────────────────────── */
  //
  // Usamos onAuthStateChange + INITIAL_SESSION en lugar de getSession() para evitar
  // el bucle infinito portal ↔ login que ocurre al hacer F5.
  //
  // getSession() puede retornar null mientras el SDK aún está restaurando la sesión
  // de localStorage (race condition de inicialización). onAuthStateChange con
  // INITIAL_SESSION se dispara DESPUÉS de que el SDK terminó de inicializar,
  // por lo que un session=null aquí es definitivo y seguro para redirigir.
  useEffect(() => {
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Redirigir si la sesión fue cerrada en otro tab o el token fue revocado.
        if (event === "SIGNED_OUT") {
          router.replace("/login");
          return;
        }

        // Solo procesar la inicialización una vez (ignorar TOKEN_REFRESHED, etc.)
        if (initialized) return;
        if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN") return;

        initialized = true;

        if (!session) { router.replace("/login"); return; }

        userIdRef.current = session.user.id;

        // Use API route (service_role) so checkin_options and all fields are always returned.
        // Only redirect to /login on 401 (not authenticated). Any other error (429, 5xx)
        // must NOT redirect — that would create an infinite login ↔ portal loop.
        const profileRes = await fetch("/api/patient-profile", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (profileRes.status === 401) { router.replace("/login"); return; }

        if (profileRes.ok) {
          const profileJson = await profileRes.json() as { data: import("@/lib/supabase/types").Patient };
          if (!profileJson.data) { router.replace("/login"); return; }
          setPatient(profileJson.data);
        } else if (profileRes.status === 404) {
          // Usuario autenticado pero sin perfil de paciente vinculado aún.
          // NO redirigir a /login — causaría un bucle infinito porque el login
          // volvería a redirigir aquí al detectar la sesión activa.
          setProfileNotFound(true);
          return;
        } else {
          // 429, 5xx, etc. — fall back to the regular supabase client so the portal
          // still loads; checkin_options may be empty until the rate window resets.
          const { data: patientData } = await getPatientByUserId(session.user.id);
          if (!patientData) { router.replace("/login"); return; }
          setPatient(patientData);
        }
        setAuthorized(true);
        fetchBookedSlots();

        // Show onboarding once on first visit
        if (!localStorage.getItem(PATIENT_STORAGE_KEY)) {
          setTimeout(() => setOnboardingOpen(true), 600);
        }
      }
    );

    return () => subscription.unsubscribe();
    // fetchBookedSlots es estable (useCallback con []) — omitirla del array
    // evita el error "used before declaration" sin cambiar el comportamiento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ── Cargar datos del paciente ──────────────────────────── */
  // Carga notas clínicas vía API route (service_role bypassa RLS del doctor)
  const loadClinicalNotes = useCallback(async (patientId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/clinical-notes?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: { content: string; created_at: string }[] };
        setClinicalNotes(json.data ?? []);
      }
    } catch { /* silencioso */ }
  }, []);

  const loadLatestTask = useCallback(async (patientId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/patient-task?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: { text: string; created_at: string } | null };
        setLatestTask(json.data ?? null);
      }
    } catch { /* silencioso */ }
  }, []);

  // Re-carga el registro del paciente via API service-role (bypassa RLS para checkin_options).
  // Si la API falla por cualquier razón, NO redirige — solo mantiene el estado actual.
  const loadPatient = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch("/api/patient-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return; // sesión expirada, el guard de auth lo manejará
      if (!res.ok) return;            // 429 / 5xx: mantener estado actual, no redirigir
      const json = await res.json() as { data: import("@/lib/supabase/types").Patient };
      if (json.data) setPatient(json.data);
    } catch { /* error de red: mantener estado actual */ }
  }, []);

  // Carga horarios ya reservados de la doctora para filtrar el calendario
  const fetchBookedSlots = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch("/api/available-slots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json() as { booked: string[] };
        setBookedSlots(json.booked ?? []);
      }
    } catch { /* silencioso */ }
  }, []);

  const load = useCallback(async () => {
    if (!patient) return;

    const [{ data: recs }, { data: res }, { data: appts }, { data: gs }, { data: reqsData }] = await Promise.all([
      getRecommendations(patient.id, true),
      getResources(patient.id, true),
      getAppointments(patient.id),
      getGoals(patient.id),
      getPatientAppointmentRequests(patient.id),
    ]);

    // Notas clínicas y tarea activa via API (evita RLS que bloquea al paciente)
    await Promise.all([
      loadClinicalNotes(patient.id),
      loadLatestTask(patient.id),
    ]);

    if (recs) setRecommendations(recs.map(r => ({ title: r.title, text: r.content })));
    if (res)  setResources(res.map(r => ({ type: r.type, title: r.title, desc: r.description ?? "", filePath: r.file_path ?? null, fileUrl: r.file_url ?? null })));

    // Citas confirmadas/pendientes (excluir canceladas y completadas para el listado principal)
    const activeAppts = (appts ?? []).filter(a => a.status !== "Cancelada" && a.status !== "Completada");
    const firstActive = activeAppts[0] ?? null;
    setNextAppointmentId(firstActive?.id ?? null);

    const apptItems = activeAppts.map(a => ({
      title: "Sesión individual",
      date: new Date(a.scheduled_at).toLocaleDateString("es-GT", {
        weekday: "long", day: "numeric", month: "long",
        hour: "2-digit", minute: "2-digit",
      }),
      mode: a.modality,
      status: a.status,
      isPending: false,
    }));

    // Solicitudes pendientes del paciente (se muestran como tarjetas en Mis citas)
    const pendingReqs = (reqsData ?? []).filter(r => r.status === "Pendiente");
    const reqItems = pendingReqs.map(r => ({
      title: "Solicitud de cita",
      date: r.preferred_date
        ? (() => {
            const d = new Date(r.preferred_date);
            return isNaN(d.getTime())
              ? r.preferred_date
              : d.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
          })()
        : "Fecha por confirmar",
      mode: r.preferred_modality ?? "Virtual",
      status: "Solicitud enviada",
      isPending: true,
    }));

    setAppointments([...apptItems, ...reqItems]);

    if (gs) {
      setGoals(gs.map((g, i) => ({ id: i, text: g.text, done: g.done })));
      setGoalIds(gs.map(g => g.id));
    }
  }, [patient, loadClinicalNotes, loadLatestTask]);

  useEffect(() => { load(); }, [load]);

  /* ── Real-time: actualizaciones del doctor ──────────────── */
  useEffect(() => {
    if (!patient) return;

    const channel = supabase
      .channel("patient-updates")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "recommendations", filter: `patient_id=eq.${patient.id}` },
        () => load()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "resources", filter: `patient_id=eq.${patient.id}` },
        () => load()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${patient.id}` },
        () => load()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "appointment_requests", filter: `patient_id=eq.${patient.id}` },
        () => load()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "goals", filter: `patient_id=eq.${patient.id}` },
        () => load()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "clinical_notes", filter: `patient_id=eq.${patient.id}` },
        () => loadClinicalNotes(patient.id)
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks", filter: `patient_id=eq.${patient.id}` },
        () => loadLatestTask(patient.id)
      )
      // Detecta cambios en el perfil del paciente (ej: opciones de check-in actualizadas por la doctora)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "patients", filter: `id=eq.${patient.id}` },
        () => loadPatient()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patient, load, loadClinicalNotes, loadLatestTask, loadPatient]);

  /* ── Polling notas clínicas (por si RLS bloquea real-time) ── */
  useEffect(() => {
    if (!patient) return;
    const id = setInterval(() => loadClinicalNotes(patient.id), 60_000);
    return () => clearInterval(id);
  }, [patient, loadClinicalNotes]);

  /* ── Polling perfil paciente (backup si Broadcast falla) ─── */
  /* 90 s es suficiente como fallback; el Broadcast cubre updates inmediatos */
  useEffect(() => {
    if (!patient) return;
    const id = setInterval(() => loadPatient(), 90_000);
    return () => clearInterval(id);
  }, [patient, loadPatient]);

  /* ── Broadcast: actualizaciones inmediatas desde la doctora ── */
  useEffect(() => {
    if (!patient) return;
    const bc = supabase
      .channel(`patient-room-${patient.id}`)
      .on("broadcast", { event: "reload" }, () => {
        loadPatient();
        loadClinicalNotes(patient.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(bc); };
  }, [patient, loadPatient, loadClinicalNotes]);

  /* ── Calendario dinámico ───────────────────────────────── */
  const computedDates = useMemo(() => getAvailableDates(bookedSlots), [bookedSlots]);

  // Al abrir el modal de reprogramación: refrescar slots y seleccionar el primer día disponible
  useEffect(() => {
    if (!rescheduleOpen) return;
    fetchBookedSlots();
  }, [rescheduleOpen, fetchBookedSlots]);

  useEffect(() => {
    if (rescheduleOpen && computedDates.length > 0) {
      setSelectedDate(computedDates[0].label);
      setSelectedIsoDate(computedDates[0].isoDate);
      setSelectedSlot("");
      setBookingSuccess(false);
    }
  }, [rescheduleOpen, computedDates]);

  /* ── Navigation ────────────────────────────────────────── */
  function navigateTo(section: NavItem) {
    setNavHistory(prev => [...prev, activeSection]);
    setActiveSection(section);
    setSectionKey(k => k + 1);
  }

  function handleBack() {
    setNavHistory(prev => {
      const next = [...prev];
      const previous = next.pop() ?? "Inicio";
      setActiveSection(previous);
      setSectionKey(k => k + 1);
      return next;
    });
  }

  /* ── Handlers ───────────────────────────────────────────── */
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleSendCheckin() {
    if (!selectedCheckin || !patient) return;
    try {
      const { data: { session: checkinSession } } = await supabase.auth.getSession();
      if (!checkinSession?.access_token) return;

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${checkinSession.access_token}`,
        },
        body: JSON.stringify({ patientId: patient.id, content: selectedCheckin }),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string; code?: string };
        const msg = json.code === "MISSING_COLUMN"
          ? "Error de configuración: tabla 'checkins' o columna faltante."
          : (json.error ?? "Error al enviar. Intenta de nuevo.");
        setCheckinError(msg);
        console.error("[checkin]", json);
        return;
      }

      setCheckinError(null);
      setCheckinSent(true);
    } catch (err) {
      console.error("[checkin] Error de red:", err);
    }
  }

  async function handleOpenResource(filePath: string | null, fileUrl: string | null) {
    // Abrir la ventana de forma sincrónica (preserva el gesto del usuario)
    // para que los navegadores móviles no bloqueen el popup.
    const win = window.open("", "_blank");

    // Intentar URL firmada via API (service_role, crea el bucket si no existe)
    if (filePath && patient) {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s?.access_token) {
          const params = new URLSearchParams({ filePath, patientId: patient.id });
          const res = await fetch(`/api/resource-url?${params}`, {
            headers: { Authorization: `Bearer ${s.access_token}` },
          });
          if (res.ok) {
            const json = await res.json() as { url?: string };
            if (json.url) {
              if (win) { win.location.href = json.url; } else { window.open(json.url, "_blank"); }
              return;
            }
          } else {
            const json = await res.json() as { error?: string };
            console.error("[resource-url]", json.error);
          }
        }
      } catch (err) {
        console.error("[resource-url] Error de red:", err);
      }
    }
    // Fallback: URL pública directa (si el bucket es público o el recurso tiene file_url)
    if (fileUrl) {
      if (win) { win.location.href = fileUrl; } else { window.open(fileUrl, "_blank"); }
      return;
    }
    // Si no hay URL disponible, cerrar la ventana vacía
    if (win) { win.close(); }
  }

  async function toggleGoal(id: number) {
    const supabaseId = goalIds[id];
    if (!supabaseId) return;
    const current = goals.find(g => g.id === id);
    if (!current) return;
    await updateGoal(supabaseId, { done: !current.done });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  }

  /* ── Derived ────────────────────────────────────────────── */
  const completedGoals  = goals.filter(g => g.done).length;
  const progressPercent = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const nextAppointment = appointments.find(a => !a.isPending && a.status !== "Cancelada" && a.status !== "Completada");

  const quickStats = [
    {
      label:  "Próxima cita",
      value:  nextAppointment ? nextAppointment.date.split(",")[0] ?? "Próximamente" : "Sin citas",
      helper: nextAppointment ? `${nextAppointment.mode}` : "Consulta con tu psicóloga",
    },
    {
      label:  "Recursos disponibles",
      value:  resources.length > 0 ? `${resources.length} disponibles` : "Sin recursos aún",
      helper: "Material asignado para ti",
    },
    {
      label:  "Estado del proceso",
      value:  goals.length > 0 ? `${progressPercent}% completado` : "En seguimiento",
      helper: goals.length > 0 ? `${completedGoals} de ${goals.length} objetivos` : "Objetivos por definir",
    },
  ];

  const user: UserData | null = patient ? { name: patient.name, email: patient.email ?? "" } : null;

  const sectionDescription = useMemo(() => {
    const map: Partial<Record<NavItem, string>> = {
      "Inicio":               "Aquí encontrarás recomendaciones, recursos y seguimiento pensado para acompañarte con más claridad entre sesiones.",
      "Mis recomendaciones":  "Revisa indicaciones, mensajes y sugerencias compartidas para tu proceso actual.",
      "Mis recursos":         "Consulta el material asignado para acompañar tu bienestar emocional entre sesiones.",
      "Mi proceso":           "Visualiza objetivos, tareas activas y notas relevantes de tu seguimiento.",
      "Mis citas":            "Consulta tus sesiones programadas y los detalles de cada encuentro.",
      "Configuración":        "Administra tus preferencias generales de acceso y visualización.",
    };
    return map[activeSection] ?? "";
  }, [activeSection]);

  /* ── Perfil no vinculado ────────────────────────────────── */
  if (profileNotFound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-slate-700"
        style={{ background: "#F2EDE8" }}>
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #3B7EC8, #7C72B8)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-[1.1rem] font-bold text-slate-800">Tu perfil está siendo configurado</h2>
          <p className="text-[13px] leading-6 text-slate-500">
            Tu cuenta fue creada correctamente pero aún no está completamente vinculada. Por favor contacta a tu psicóloga para que active tu acceso.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="mt-2 rounded-xl bg-slate-100 px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  /* ── Loading ────────────────────────────────────────────── */
  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-700"
        style={{ background: "#F2EDE8" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg, #3B7EC8, #7C72B8)" }} />
          <p className="text-[13px] text-slate-500">Cargando tu portal...</p>
        </div>
      </main>
    );
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen text-slate-800" style={{ background: "#F2EDE8" }}>

      {/* ── Cierre automático por inactividad ───────────── */}
      <InactivityGuard onLogout={handleLogout} timeoutMinutes={15} />

      {/* ── Onboarding ──────────────────────────────────── */}
      <OnboardingModal
        steps={patientSteps}
        storageKey={PATIENT_STORAGE_KEY}
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      {/* ── Modals ──────────────────────────────────────── */}
      <Modal
        open={logoutModalOpen}
        title="¿Seguro que deseas cerrar sesión?"
        description="Si cierras sesión, tendrás que volver a ingresar tu contraseña para entrar nuevamente al portal."
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />

      <SimpleModal
        open={sessionDetailsOpen}
        title="Detalles de tu próxima sesión"
        onClose={() => setSessionDetailsOpen(false)}
      >
        {nextAppointment ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Fecha y hora",      value: nextAppointment.date },
              { label: "Modalidad",         value: nextAppointment.mode },
              { label: "Duración estimada", value: "50 minutos" },
              { label: "Estado",            value: nextAppointment.status },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No hay citas próximas registradas.</p>
        )}
        <div className="mt-6 rounded-2xl bg-[#EEF4F8] p-4">
          <p className="text-sm text-slate-500">Acceso</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            El enlace de la sesión estará disponible 15 minutos antes del inicio.
          </p>
        </div>
      </SimpleModal>

      <SimpleModal
        open={rescheduleOpen}
        title="Solicitar cambio de cita"
        onClose={() => setRescheduleOpen(false)}
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm text-slate-500">Calendario disponible</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {computedDates.length === 0 ? (
                <p className="col-span-2 text-sm text-slate-400">No hay fechas disponibles en este momento.</p>
              ) : computedDates.map(date => {
                const active = selectedDate === date.label;
                return (
                  <button key={date.label}
                    onClick={() => { setSelectedDate(date.label); setSelectedIsoDate(date.isoDate); setSelectedSlot(""); setBookingSuccess(false); }}
                    className={`rounded-2xl border p-4 text-left transition ${active ? "border-[#6F98BE] bg-[#EEF4F8]" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <p className="text-sm text-slate-500">{date.month}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{date.day}</p>
                    <p className="mt-1 text-sm text-slate-600">{date.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500">Horarios disponibles</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {computedDates.find(d => d.label === selectedDate)?.slots.map(slot => {
                const active = selectedSlot === slot;
                const [hh, mm] = slot.split(":").map(Number);
                const label12 = `${hh === 0 ? 12 : hh > 12 ? hh - 12 : hh}:${mm.toString().padStart(2,"0")} ${hh >= 12 ? "PM" : "AM"}`;
                return (
                  <button key={slot}
                    onClick={() => { setSelectedSlot(slot); setBookingSuccess(false); }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-[#6F98BE] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                    {label12}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Selección actual</p>
              <p className="mt-2 text-sm text-slate-700">
                {selectedDate}{selectedSlot ? ` · ${(() => { const [h,m]=selectedSlot.split(":").map(Number); return `${h===0?12:h>12?h-12:h}:${m.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`; })()}` : " · Sin horario seleccionado"}
              </p>
            </div>

            {bookingSuccess && (
              <div className="mt-4 rounded-2xl bg-[#EEF4F8] p-4 text-sm text-slate-700">
                Tu solicitud de cambio fue enviada correctamente.
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton onClick={async () => {
                if (!selectedSlot || !patient) return;
                // Cancelar la cita actual si existe (para que no quede duplicada)
                if (nextAppointmentId) {
                  const { data: { session: apptSession } } = await supabase.auth.getSession();
                  await fetch("/api/appointments", {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      ...(apptSession?.access_token ? { Authorization: `Bearer ${apptSession.access_token}` } : {}),
                    },
                    body: JSON.stringify({ appointmentId: nextAppointmentId, patientId: patient.id }),
                  });
                }

                const [hReq, mReq] = selectedSlot.split(":").map(Number);
                const label12Req = `${hReq===0?12:hReq>12?hReq-12:hReq}:${mReq.toString().padStart(2,"0")} ${hReq>=12?"PM":"AM"}`;
                await createAppointmentRequest({
                  patient_id: patient.id,
                  doctor_id: patient.doctor_id,
                  preferred_date: `${selectedIsoDate}T${selectedSlot}:00`,
                  preferred_modality: "Virtual",
                  message: `Solicitud desde el portal para ${selectedDate} a las ${label12Req}`,
                });
                await createNotification({
                  doctor_id: patient.doctor_id,
                  patient_id: patient.id,
                  type: "appointment_request",
                  content: `${patient.name} solicitó una cita para el ${selectedDate} a las ${selectedSlot}.`,
                });
                setBookingSuccess(true);
                setTimeout(() => {
                  setRescheduleOpen(false);
                  setBookingSuccess(false);
                }, 1800);
              }}>
                Confirmar solicitud
              </PrimaryButton>
              <SecondaryButton onClick={() => setRescheduleOpen(false)}>
                Cancelar
              </SecondaryButton>
            </div>
          </div>
        </div>
      </SimpleModal>

      {/* ── Mobile menu ─────────────────────────────────── */}
      <PortalMobileMenu
        open={mobileMenuOpen}
        user={user}
        navItems={navItems}
        activeSection={activeSection}
        onClose={() => setMobileMenuOpen(false)}
        onSelectSection={navigateTo}
        onOpenLogoutModal={() => setLogoutModalOpen(true)}
      />

      {/* ── Layout ──────────────────────────────────────── */}
      <div className="flex min-h-screen">
        <PortalSidebar
          user={user}
          navItems={navItems}
          activeSection={activeSection}
          onSelectSection={navigateTo}
        />

        <main className="flex-1">
          <PortalHeader
            user={user}
            activeSection={activeSection}
            canGoBack={navHistory.length > 0}
            onBack={handleBack}
            onOpenSessionDetails={() => setSessionDetailsOpen(true)}
            onOpenLogoutModal={() => setLogoutModalOpen(true)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenGuide={() => setOnboardingOpen(true)}
          />

          <div className="mt-3 sm:mt-4">
            <PortalWelcomeCard user={user} />
          </div>

          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-6">
            <div key={sectionKey} className="portal-section-anim">

            {sectionDescription && (
              <section className="mb-5">
                <p className="max-w-2xl text-[13px] leading-6 text-slate-500">
                  {sectionDescription}
                </p>
              </section>
            )}

            {/* ── Inicio ─────────────────────────────── */}
            {activeSection === "Inicio" && (
              <>
                <PortalQuickStats items={quickStats} />

                <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <PortalSupportSection
                    activeSupportCard={activeSupportCard}
                    setActiveSupportCard={setActiveSupportCard}
                    supportCards={supportCards}
                    recommendations={recommendations.length > 0 ? recommendations : [
                      { title: "Mensaje de tu psicóloga", text: "Pronto recibirás mensajes y recomendaciones personalizadas para tu proceso." },
                    ]}
                  />
                  <PortalSessionPanel
                    checkinOptions={patient?.checkin_options ?? []}
                    selectedCheckin={selectedCheckin}
                    checkinSent={checkinSent}
                    checkinError={checkinError}
                    nextAppointment={nextAppointment ?? null}
                    onSelectCheckin={option => { setSelectedCheckin(option); setCheckinSent(false); setCheckinError(null); }}
                    onSendCheckin={handleSendCheckin}
                    onOpenSessionDetails={() => setSessionDetailsOpen(true)}
                    onOpenReschedule={() => { setRescheduleOpen(true); setBookingSuccess(false); }}
                  />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <PortalResourcesSection resources={resources.length > 0 ? resources : []} onOpenResource={handleOpenResource} />
                  <PortalProcessSection
                    progressPercent={progressPercent}
                    goals={goals}
                    onToggleGoal={toggleGoal}
                  />
                </div>
              </>
            )}

            {/* ── Mis recomendaciones ─────────────────── */}
            {activeSection === "Mis recomendaciones" && (
              <PortalRecommendationsSection
                recommendations={recommendations.length > 0 ? recommendations : [
                  { title: "Sin recomendaciones aún", text: "Tu psicóloga aún no ha compartido recomendaciones. Vuelve pronto." },
                ]}
              />
            )}

            {/* ── Mis recursos ────────────────────────── */}
            {activeSection === "Mis recursos" && (
              <PortalResourcesPageSection
                resources={resources.length > 0 ? resources : []}
                onOpenResource={handleOpenResource}
              />
            )}

            {/* ── Mi proceso ──────────────────────────── */}
            {activeSection === "Mi proceso" && (
              <PortalProcessPageSection
                goals={goals}
                latestTask={latestTask}
                onToggleGoal={toggleGoal}
              />
            )}

            {/* ── Mis citas ───────────────────────────── */}
            {activeSection === "Mis citas" && (
              <PortalAppointmentsSection
                appointments={appointments}
                onOpenSessionDetails={() => setSessionDetailsOpen(true)}
                onOpenReschedule={() => { setRescheduleOpen(true); setBookingSuccess(false); }}
              />
            )}

            {/* ── Configuración ───────────────────────── */}
            {activeSection === "Configuración" && (
              <PortalSettingsSection
                user={user}
                onOpenLogoutModal={() => setLogoutModalOpen(true)}
              />
            )}
            </div>{/* end portal-section-anim */}
          </div>
        </main>
      </div>
    </div>
  );
}
