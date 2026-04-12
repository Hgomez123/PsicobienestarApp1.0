"use client";

import { useState, useEffect } from "react";

type DoctorHeaderProps = {
  activeSection: string;
  doctorName: string;
  unreadCount: number;
  navItems: string[];
  canGoBack: boolean;
  onBack: () => void;
  onGoToNotifications: () => void;
  onSelectSection: (s: string) => void;
  onLogout: () => void;
  onOpenGuide: () => void;
};

const SECTION_META: Record<string, { label: string; icon: string; color: string }> = {
  Dashboard:       { label: "Vista general de pacientes y jornada clínica.",     icon: "⬛", color: "#60A5FA" },
  Pacientes:       { label: "Crea y gestiona los perfiles de tus pacientes.",     icon: "👥", color: "#34D399" },
  Agenda:          { label: "Programa y administra sesiones terapéuticas.",        icon: "📅", color: "#38BDF8" },
  Seguimiento:     { label: "Notas clínicas, objetivos y check-ins por paciente.", icon: "📈", color: "#FB923C" },
  Recomendaciones: { label: "Envía mensajes, ejercicios y reflexiones.",           icon: "💬", color: "#C084FC" },
  Recursos:        { label: "Sube y asigna materiales de apoyo terapéutico.",     icon: "📁", color: "#4ADE80" },
  Notificaciones:  { label: "Check-ins y solicitudes de cita de tus pacientes.",  icon: "🔔", color: "#F472B6" },
};

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

const NAV_EMOJIS: Record<string, string> = {
  Dashboard: "🔲", Pacientes: "👥", Agenda: "📅", Seguimiento: "📈",
  Recomendaciones: "💬", Recursos: "📁", Notificaciones: "🔔",
};

export default function DoctorHeader({
  activeSection, doctorName, unreadCount, navItems,
  canGoBack, onBack, onGoToNotifications, onSelectSection, onLogout, onOpenGuide,
}: DoctorHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const clock    = useClock();
  const meta     = SECTION_META[activeSection];
  const firstName = doctorName.split(" ").find(w => w.length > 2) ?? doctorName.split(" ")[0];

  function selectSection(s: string) { onSelectSection(s); setMobileOpen(false); }

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between gap-3 px-5 py-3 lg:px-8"
        style={{
          background: "rgba(247,250,252,0.90)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Left — back + title */}
        <div className="flex items-center gap-3 min-w-0">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="portal-back-btn shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Volver
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-slate-900 leading-tight">{activeSection}</h1>
              {meta && (
                <span
                  className="hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${meta.color}18`, color: meta.color }}
                >
                  {activeSection}
                </span>
              )}
            </div>
            {meta && (
              <p className="hidden md:block text-[11.5px] text-slate-400 mt-0.5 leading-tight truncate max-w-md">
                {meta.label}
              </p>
            )}
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-500">{clock}</span>
          </div>

          {/* Guide */}
          <button
            type="button"
            onClick={onOpenGuide}
            title="Ver guía del panel"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
          >
            ?
          </button>

          {/* Notifications */}
          <button
            onClick={onGoToNotifications}
            className="relative flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span className="hidden sm:inline">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Greeting strip ───────────────────────────────────── */}
      <div className="px-5 pt-5 pb-1 lg:px-8">
        <p className="text-[13px] text-slate-400">
          Bienvenida, <span className="font-semibold text-slate-700">{firstName}</span>
        </p>
      </div>

      {/* ── Mobile menu overlay ──────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

          <div
            className="absolute right-0 top-0 flex h-full w-72 flex-col shadow-2xl"
            style={{ background: "linear-gradient(180deg, #0A1628 0%, #0F1E35 100%)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/35 uppercase">Psicobienestar</p>
                <p className="mt-0.5 text-[12px] font-semibold text-white/80">{doctorName}</p>
              </div>
              <button onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white/70">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5">
              {navItems.map(item => {
                const active  = activeSection === item;
                const isNotif = item === "Notificaciones";
                return (
                  <button key={item} onClick={() => selectSection(item)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] transition-all"
                    style={active ? {
                      background: "rgba(255,255,255,0.09)",
                      color: "white",
                      fontWeight: 600,
                    } : { color: "rgba(255,255,255,0.5)" }}
                  >
                    <span className="text-base">{NAV_EMOJIS[item] ?? "·"}</span>
                    <span className="flex-1">{item}</span>
                    {isNotif && unreadCount > 0 && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {active && !isNotif && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </nav>

            <div className="px-4 pb-6">
              <button onClick={onLogout}
                className="mt-4 w-full rounded-xl border border-white/10 py-3 text-[13px] font-medium text-white/40 transition hover:bg-white/08 hover:text-rose-400">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
