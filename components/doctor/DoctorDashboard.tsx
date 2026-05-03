"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllAppointments, getAllCheckins } from "@/lib/supabase/db";
import { supabaseDoctor } from "@/lib/supabase/client";
import type { Patient, Appointment, PatientStatus, AppointmentRequest } from "@/lib/supabase/types";

type Props = {
  doctorId: string;
  patients: Patient[];
  selectedPatient: Patient | null;
  appointmentRequests: AppointmentRequest[];
  onSelectPatient: (p: Patient) => void;
  onGoToSection: (s: string) => void;
};

const STATUS_COLOR: Record<PatientStatus, string> = {
  Activa:    "bg-green-50 text-green-700",
  Pendiente: "bg-amber-50 text-amber-700",
  Inactiva:  "bg-slate-100 text-slate-500",
};

type AppointmentWithPatient = Appointment & { patients?: { name: string } };
type CheckinRow = { id: string; content: string; created_at: string; patient_id: string; patients?: { name: string; doctor_id: string } };

function useCountdown(targetDate: Date | null) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!targetDate) { setLabel(""); return; }
    const update = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setLabel("En curso"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      if (h > 23) {
        const days = Math.floor(h / 24);
        setLabel(`${days}d ${h % 24}h`);
      } else if (h > 0) {
        setLabel(`${h}h ${m.toString().padStart(2,"0")}m`);
      } else {
        setLabel(`${m}m ${s.toString().padStart(2,"0")}s`);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return label;
}

export default function DoctorDashboard({ doctorId, patients, selectedPatient, appointmentRequests, onSelectPatient, onGoToSection }: Props) {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [checkins, setCheckins]         = useState<CheckinRow[]>([]);
  const [loading, setLoading]           = useState(true);

  const loadAppointments = useCallback(async () => {
    if (!doctorId) return;
    const { data } = await getAllAppointments(doctorId);
    if (data) setAppointments(data as AppointmentWithPatient[]);
  }, [doctorId]);

  const loadCheckins = useCallback(async () => {
    if (!doctorId) return;
    const { data } = await getAllCheckins(doctorId);
    if (data) setCheckins(data as CheckinRow[]);
  }, [doctorId]);

  useEffect(() => {
    Promise.all([loadAppointments(), loadCheckins()]).finally(() => setLoading(false));
  }, [loadAppointments, loadCheckins]);

  // Refresca check-ins cada hora para mantener alertas actualizadas
  useEffect(() => {
    if (!doctorId) return;
    const id = setInterval(() => loadCheckins(), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [doctorId, loadCheckins]);

  // Real-time: citas y check-ins
  useEffect(() => {
    if (!doctorId) return;
    const ch = supabaseDoctor
      .channel("dashboard-rt")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${doctorId}` },
        () => loadAppointments()
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        () => loadCheckins()
      )
      .subscribe();
    return () => { supabaseDoctor.removeChannel(ch); };
  }, [doctorId, loadAppointments, loadCheckins]);

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    return d >= todayStart && d <= todayEnd && a.status !== "Cancelada";
  }).sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const upcomingAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    return d > todayEnd && a.status !== "Cancelada" && a.status !== "Completada";
  }).sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).slice(0, 4);

  // Next upcoming session (today or future)
  const nextSession = appointments
    .filter(a => new Date(a.scheduled_at) > now && a.status !== "Cancelada" && a.status !== "Completada")
    .sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null;

  const nextSessionDate = nextSession ? new Date(nextSession.scheduled_at) : null;
  const countdown = useCountdown(nextSessionDate);

  const activeCount     = patients.filter(p => p.status === "Activa").length;
  const pendingRequests = appointmentRequests.filter(r => r.status === "Pendiente").length;

  // Latest check-in per patient
  const latestCheckinByPatient: Record<string, CheckinRow> = {};
  for (const c of checkins) {
    if (!latestCheckinByPatient[c.patient_id]) {
      latestCheckinByPatient[c.patient_id] = c;
    }
  }

  // Pacientes activos sin check-in en +7 días.
  // Solo alertar si el paciente lleva más de 7 días registrado (evita falsos positivos en pacientes nuevos).
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const patientsWithoutRecentCheckin = patients.filter(p => {
    if (p.status !== "Activa") return false;
    // Excluir pacientes creados hace menos de 7 días (no han tenido tiempo de usar el portal)
    if (new Date(p.created_at) > sevenDaysAgo) return false;
    const last = latestCheckinByPatient[p.id];
    if (!last) return true;
    return new Date(last.created_at) < sevenDaysAgo;
  });

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-slate-500">
        <svg className="animate-spin text-[#1E5A85]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <p className="text-sm text-slate-600">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total de pacientes",  value: patients.length,    sub: `${activeCount} activos`,    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="7" r="2.5"/><path d="M22 21v-1.5a2.5 2.5 0 00-2.5-2.5"/></svg>, accent: "#3B7EC8" },
          { label: "Citas hoy",           value: todayAppts.length,  sub: todayAppts.length === 0 ? "Ninguna hoy" : `${todayAppts.filter(a=>a.status==="Confirmada").length} confirmadas`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, accent: "#4A9472" },
          { label: "Solicitudes nuevas",  value: pendingRequests,    sub: pendingRequests > 0 ? "Requieren atención" : "Al día", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>, accent: pendingRequests > 0 ? "#F97316" : "#94A3B8" },
          { label: "Check-ins recibidos", value: checkins.length,    sub: `De ${Object.keys(latestCheckinByPatient).length} pacientes`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 9"/></svg>, accent: "#7C72B8" },
        ].map(stat => (
          <div key={stat.label} className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div
              className="absolute left-0 top-0 h-1 w-full rounded-t-[24px]"
              style={{ background: stat.accent }}
            />
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-600">{stat.label}</p>
              <span className="inline-flex items-center justify-center" style={{ color: stat.accent }}>{stat.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Countdown + next session ─────────────────────────── */}
      {nextSession && (
        <div
          className="relative overflow-hidden rounded-[24px] p-5"
          style={{ background: "linear-gradient(135deg, #0E1621 0%, #1E3A5F 100%)" }}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ background: "#60A5FA" }} />
          <div className="pointer-events-none absolute -bottom-4 left-8 h-24 w-24 rounded-full opacity-10 blur-2xl" style={{ background: "#C084FC" }} />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/40">Próxima sesión</p>
              <p className="mt-1 text-[17px] font-bold text-white">
                {nextSession.patients?.name ?? "Paciente"}
              </p>
              <p className="mt-0.5 text-[12px] text-white/50">
                {new Date(nextSession.scheduled_at).toLocaleDateString("es-GT", {
                  weekday: "long", day: "numeric", month: "long",
                  hour: "2-digit", minute: "2-digit",
                })} · {nextSession.modality}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-widest text-white/30">Comienza en</p>
              <p className="mt-1 font-mono text-[32px] font-bold text-white">{countdown}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

        {/* ── Citas de hoy ─────────────────────────────────── */}
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Jornada de hoy</p>
              <h2 className="mt-1 text-[17px] font-bold text-slate-900">Citas del día</h2>
            </div>
            <button onClick={() => onGoToSection("Agenda")}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 transition hover:border-[#6F98BE] hover:text-[#1E5A85]">
              Ver agenda →
            </button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="flex justify-center text-amber-400"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></div>
              <p className="mt-2 text-sm text-slate-600">Sin citas programadas para hoy.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {todayAppts.map(a => {
                const timeStr = new Date(a.scheduled_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
                const isPast  = new Date(a.scheduled_at) < now;
                return (
                  <div key={a.id} className="flex items-center gap-4 rounded-[18px] border border-slate-100 p-4 transition hover:bg-slate-50">
                    <div
                      className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-2xl"
                      style={{ background: isPast ? "rgba(0,0,0,0.04)" : "linear-gradient(135deg, #EEF4F8, #E0ECF8)" }}
                    >
                      <span className={`text-xs font-bold ${isPast ? "text-slate-400" : "text-[#1E5A85]"}`}>{timeStr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{a.patients?.name ?? "Paciente"}</p>
                      <p className="text-xs text-slate-500">{a.modality} · {a.duration_minutes} min</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      a.status === "Confirmada" ? "bg-green-50 text-green-700" :
                      a.status === "Pendiente"  ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                    }`}>{a.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Panel derecho ────────────────────────────────── */}
        <div className="space-y-5">

          {/* Alertas */}
          {(patientsWithoutRecentCheckin.length > 0 || pendingRequests > 0) && (
            <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-amber-600">Alertas</p>
              <div className="mt-2.5 space-y-2">
                {pendingRequests > 0 && (
                  <button onClick={() => onGoToSection("Notificaciones")}
                    className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left transition hover:bg-amber-50">
                    <span className="inline-flex items-center justify-center text-amber-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{pendingRequests} solicitud{pendingRequests > 1 ? "es" : ""} de cita pendiente{pendingRequests > 1 ? "s" : ""}</p>
                      <p className="text-xs text-slate-500">Toca para revisar</p>
                    </div>
                    <span className="text-xs text-amber-500">→</span>
                  </button>
                )}
                {patientsWithoutRecentCheckin.slice(0, 3).map(p => (
                  <button key={p.id} onClick={() => { onSelectPatient(p); onGoToSection("Seguimiento"); }}
                    className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left transition hover:bg-amber-50">
                    <span className="inline-flex items-center justify-center text-amber-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">Sin check-in en +7 días</p>
                    </div>
                    <span className="text-xs text-amber-500">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Próximas citas */}
          {upcomingAppts.length > 0 && (
            <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Próximamente</p>
              <div className="mt-2.5 space-y-2">
                {upcomingAppts.map(a => {
                  const dt = new Date(a.scheduled_at);
                  const dateStr = dt.toLocaleDateString("es-GT", { weekday: "short", day: "numeric", month: "short" });
                  const timeStr = dt.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{a.patients?.name ?? "Paciente"}</p>
                        <p className="text-xs text-slate-500">{dateStr} · {timeStr}</p>
                      </div>
                      <span className="text-xs text-slate-500">{a.modality}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acceso rápido */}
          <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Acceso rápido</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "Pacientes",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="7" r="2.5"/><path d="M22 21v-1.5a2.5 2.5 0 00-2.5-2.5"/></svg>, section: "Pacientes" },
                { label: "Agenda",          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, section: "Agenda" },
                { label: "Seguimiento",     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, section: "Seguimiento" },
                { label: "Recomendaciones", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, section: "Recomendaciones" },
                { label: "Recursos",        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>, section: "Recursos" },
                { label: "Notificaciones",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, section: "Notificaciones" },
              ].map(item => (
                <button key={item.section} onClick={() => onGoToSection(item.section)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-[#6F98BE] hover:bg-[#EEF4F8] hover:text-[#1E5A85]">
                  <span className="inline-flex items-center justify-center text-[#4A7DA8]">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Estado emocional de pacientes ───────────────────── */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Seguimiento emocional</p>
            <h2 className="mt-1 text-[17px] font-bold text-slate-900">Último check-in por paciente</h2>
          </div>
          <button onClick={() => onGoToSection("Seguimiento")}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 transition hover:border-[#6F98BE] hover:text-[#1E5A85]">
            Ver seguimiento →
          </button>
        </div>

        {patients.length === 0 ? (
          <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">Aún no hay pacientes registrados.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {patients.map(p => {
              const last = latestCheckinByPatient[p.id];
              const daysSince = last
                ? Math.floor((now.getTime() - new Date(last.created_at).getTime()) / 86_400_000)
                : null;
              const isRecent = daysSince !== null && daysSince < 2;
              const isStale  = daysSince !== null && daysSince >= 7;
              return (
                <button key={p.id}
                  onClick={() => { onSelectPatient(p); onGoToSection("Seguimiento"); }}
                  className="group rounded-[20px] border border-slate-100 p-4 text-left transition hover:border-[#6F98BE] hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                  </div>

                  {last ? (
                    <>
                      <p className={`mt-2 text-sm leading-5 line-clamp-2 ${isRecent ? "text-slate-700" : "text-slate-500"}`}>
                        &ldquo;{last.content}&rdquo;
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${isRecent ? "bg-green-400" : isStale ? "bg-amber-400" : "bg-slate-300"}`} />
                        <p className="text-[10.5px] text-slate-500">
                          {daysSince === 0 ? "Hoy" : daysSince === 1 ? "Ayer" : `Hace ${daysSince} días`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm italic text-slate-500">Sin check-ins aún.</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lista de pacientes ───────────────────────────────── */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Mis pacientes</p>
            <h2 className="mt-1 text-[17px] font-bold text-slate-900">Gestión de pacientes</h2>
          </div>
          <button onClick={() => onGoToSection("Pacientes")}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 transition hover:border-[#6F98BE] hover:text-[#1E5A85]">
            Gestionar →
          </button>
        </div>

        {patients.length === 0 ? (
          <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">Aún no hay pacientes. Ve a Pacientes para crear el primero.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {patients.slice(0, 6).map(p => (
              <button key={p.id} onClick={() => { onSelectPatient(p); onGoToSection("Seguimiento"); }}
                className={`rounded-[20px] border p-4 text-left transition hover:shadow-md ${selectedPatient?.id === p.id ? "border-[#6F98BE] bg-[#EEF4F8]" : "border-slate-100 bg-white hover:border-[#6F98BE]/50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                </div>
                {p.process && <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{p.process}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{p.modality}</span>
                  {p.user_id
                    ? <span className="text-xs text-green-600">Portal activo</span>
                    : <span className="text-xs text-slate-500">Sin portal</span>}
                </div>
              </button>
            ))}
            {patients.length > 6 && (
              <button onClick={() => onGoToSection("Pacientes")}
                className="flex items-center justify-center rounded-[20px] border border-dashed border-slate-200 p-4 text-sm text-slate-500 transition hover:border-[#6F98BE] hover:text-[#1E5A85]">
                +{patients.length - 6} más →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
