"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseDoctor } from "@/lib/supabase/client";
import {
  getDoctorSession, getDoctorProfile, getPatients,
  getNotifications, getUnreadCount, markAllNotificationsRead,
  getAppointmentRequests, updateRequestStatus, createAppointment,
} from "@/lib/supabase/db";
import type { Patient, Notification, AppointmentRequest } from "@/lib/supabase/types";

import OnboardingModal from "@/components/ui/OnboardingModal";
import InactivityGuard from "@/components/ui/InactivityGuard";
import { doctorSteps, DOCTOR_STORAGE_KEY } from "@/data/onboardingSteps";

import DoctorSidebar           from "@/components/doctor/DoctorSidebar";
import DoctorHeader            from "@/components/doctor/DoctorHeader";
import DoctorMobileMenu        from "@/components/doctor/DoctorMobileMenu";
import DoctorDashboard         from "@/components/doctor/DoctorDashboard";
import DoctorPatients          from "@/components/doctor/DoctorPatients";
import DoctorSchedule          from "@/components/doctor/DoctorSchedule";
import DoctorFollowUp          from "@/components/doctor/DoctorFollowUp";
import DoctorRecommendations   from "@/components/doctor/DoctorRecommendations";
import DoctorResources         from "@/components/doctor/DoctorResources";
import DoctorNotifications     from "@/components/doctor/DoctorNotifications";

const NAV_ITEMS = [
  "Dashboard",
  "Pacientes",
  "Agenda",
  "Seguimiento",
  "Recomendaciones",
  "Recursos",
  "Notificaciones",
] as const;

type DoctorSection = (typeof NAV_ITEMS)[number];

export default function DoctorPage() {
  const router = useRouter();

  const [authorized, setAuthorized]         = useState(false);
  const [doctorId, setDoctorId]             = useState<string>("");
  const [doctorName, setDoctorName]         = useState<string>("");
  const [activeSection, setActiveSection]   = useState<DoctorSection>("Dashboard");
  const [navHistory, setNavHistory]         = useState<DoctorSection[]>([]);
  const [sectionKey, setSectionKey]         = useState(0);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients]                   = useState<Patient[]>([]);
  const [notifications, setNotifications]         = useState<Notification[]>([]);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [unreadCount, setUnreadCount]             = useState(0);

  /* ── Auth guard ─────────────────────────────────────────── */
  useEffect(() => {
    getDoctorSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/doctor-login"); return; }

      const { data: profile } = await getDoctorProfile(data.session.user.id);
      if (!profile || profile.role !== "doctor") {
        router.replace("/doctor-login");
        return;
      }

      setDoctorId(profile.id);
      setDoctorName(profile.name);
      setAuthorized(true);

      // Show onboarding once on first visit
      if (!localStorage.getItem(DOCTOR_STORAGE_KEY)) {
        setTimeout(() => setOnboardingOpen(true), 600);
      }
    });
  }, [router]);

  /* ── Cargar pacientes ───────────────────────────────────── */
  const loadPatients = useCallback(async () => {
    if (!doctorId) return;
    const { data } = await getPatients(doctorId);
    if (data) {
      setPatients(data);
      if (!selectedPatient && data.length > 0) setSelectedPatient(data[0]);
    }
  }, [doctorId, selectedPatient]);

  /* ── Cargar notificaciones + solicitudes de cita ───────── */
  const loadNotifications = useCallback(async () => {
    if (!doctorId) return;
    const [{ data: notifs }, { count }, { data: reqs }] = await Promise.all([
      getNotifications(doctorId),
      getUnreadCount(doctorId),
      getAppointmentRequests(doctorId),
    ]);
    if (notifs) setNotifications(notifs as Notification[]);
    if (reqs)   setAppointmentRequests(reqs as AppointmentRequest[]);
    const pendingReqs = reqs?.filter(r => r.status === "Pendiente").length ?? 0;
    setUnreadCount((count ?? 0) + pendingReqs);
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    loadPatients();
    loadNotifications();
  }, [doctorId, loadPatients, loadNotifications]);

  /* ── Real-time: nuevas notificaciones ───────────────────── */
  useEffect(() => {
    if (!doctorId) return;

    const channel = supabaseDoctor
      .channel("doctor-notifications")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `doctor_id=eq.${doctorId}` },
        () => loadNotifications()
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        () => loadNotifications()
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "appointment_requests", filter: `doctor_id=eq.${doctorId}` },
        () => loadNotifications()
      )
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointment_requests", filter: `doctor_id=eq.${doctorId}` },
        () => loadNotifications()
      )
      .subscribe();

    return () => { supabaseDoctor.removeChannel(channel); };
  }, [doctorId, loadNotifications]);

  /* ── Navigation ────────────────────────────────────────── */
  function navigateTo(section: DoctorSection) {
    setNavHistory(prev => [...prev, activeSection]);
    setActiveSection(section);
    setSectionKey(k => k + 1);
  }

  function handleBack() {
    setNavHistory(prev => {
      const next = [...prev];
      const previous = next.pop() ?? "Dashboard";
      setActiveSection(previous);
      setSectionKey(k => k + 1);
      return next;
    });
  }

  /* ── Logout ─────────────────────────────────────────────── */
  async function handleLogout() {
    await supabaseDoctor.auth.signOut();
    router.push("/doctor-login");
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(doctorId);
    await loadNotifications();
  }

  async function handleUpdateRequestStatus(id: string, status: "Aceptada" | "Rechazada") {
    await updateRequestStatus(id, status);

    if (status === "Aceptada") {
      const req = appointmentRequests.find(r => r.id === id);
      if (req) {
        // preferred_date is stored as "YYYY-MM-DDTHH:MM:00" by the portal
        let scheduledAt: string;
        try {
          const d = new Date(req.preferred_date ?? "");
          scheduledAt = isNaN(d.getTime())
            ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
            : d.toISOString();
        } catch {
          scheduledAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        }
        const modality = req.preferred_modality === "Presencial" ? "Presencial" : "Virtual";
        await createAppointment({
          patient_id: req.patient_id,
          doctor_id: doctorId,
          scheduled_at: scheduledAt,
          modality,
          duration_minutes: 60,
          notes: req.message ?? null,
          status: "Confirmada",
        });
      }
    }

    await loadNotifications();
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7FAFC] text-slate-700">
        Cargando portal profesional...
      </main>
    );
  }

  return (
    <div className="min-h-screen text-slate-800" style={{ background: "#F0F4F8" }}>

      {/* ── Cierre automático por inactividad ───────────── */}
      <InactivityGuard onLogout={handleLogout} timeoutMinutes={20} />

      {/* ── Onboarding ──────────────────────────────────── */}
      <OnboardingModal
        steps={doctorSteps}
        storageKey={DOCTOR_STORAGE_KEY}
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      {/* ── Mobile menu (lg:hidden) ─────────────────────── */}
      <DoctorMobileMenu
        open={mobileMenuOpen}
        doctorName={doctorName}
        navItems={[...NAV_ITEMS]}
        activeSection={activeSection}
        unreadCount={unreadCount}
        onClose={() => setMobileMenuOpen(false)}
        onSelectSection={(s) => navigateTo(s as DoctorSection)}
        onLogout={handleLogout}
      />

      <div className="flex min-h-screen">

        <DoctorSidebar
          navItems={[...NAV_ITEMS]}
          activeSection={activeSection}
          unreadCount={unreadCount}
          onSelectSection={(s) => navigateTo(s as DoctorSection)}
          onLogout={handleLogout}
          doctorName={doctorName}
        />

        <main className="flex-1 overflow-y-auto">
          <DoctorHeader
            activeSection={activeSection}
            doctorName={doctorName}
            unreadCount={unreadCount}
            canGoBack={navHistory.length > 0}
            onBack={handleBack}
            onGoToNotifications={() => navigateTo("Notificaciones")}
            onOpenGuide={() => setOnboardingOpen(true)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />

          <div key={sectionKey} className="mt-4 px-5 pb-8 sm:px-6 lg:px-8 portal-section-anim">
            {activeSection === "Dashboard" && (
              <DoctorDashboard
                doctorId={doctorId}
                patients={patients}
                selectedPatient={selectedPatient}
                appointmentRequests={appointmentRequests}
                onSelectPatient={setSelectedPatient}
                onGoToSection={(s) => navigateTo(s as DoctorSection)}
              />
            )}

            {activeSection === "Pacientes" && (
              <DoctorPatients
                doctorId={doctorId}
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
                onPatientsChange={loadPatients}
              />
            )}

            {activeSection === "Agenda" && (
              <DoctorSchedule
                doctorId={doctorId}
                patients={patients}
                selectedPatient={selectedPatient}
                appointmentRequests={appointmentRequests}
                onSelectPatient={setSelectedPatient}
                onUpdateRequestStatus={handleUpdateRequestStatus}
              />
            )}

            {activeSection === "Seguimiento" && (
              <DoctorFollowUp
                doctorId={doctorId}
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
                onPatientsChange={loadPatients}
              />
            )}

            {activeSection === "Recomendaciones" && (
              <DoctorRecommendations
                doctorId={doctorId}
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
              />
            )}

            {activeSection === "Recursos" && (
              <DoctorResources
                doctorId={doctorId}
                patients={patients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
              />
            )}

            {activeSection === "Notificaciones" && (
              <DoctorNotifications
                notifications={notifications}
                appointmentRequests={appointmentRequests}
                onMarkAllRead={handleMarkAllRead}
                onRefresh={loadNotifications}
                onUpdateRequestStatus={handleUpdateRequestStatus}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
