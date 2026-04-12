"use client";

import { useEffect, useState } from "react";
import type { NavItem, UserData } from "@/types/portal";

type PortalHeaderProps = {
  user: UserData | null;
  activeSection: NavItem;
  canGoBack: boolean;
  onBack: () => void;
  onOpenSessionDetails: () => void;
  onOpenLogoutModal: () => void;
  onOpenMobileMenu: () => void;
  onOpenGuide: () => void;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function PortalHeader({
  user,
  activeSection,
  canGoBack,
  onBack,
  onOpenSessionDetails,
  onOpenLogoutModal,
  onOpenMobileMenu,
  onOpenGuide,
}: PortalHeaderProps) {
  const firstName = user?.name?.split(" ")[0] ?? "Paciente";
  const clock     = useClock();

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06]"
      style={{ background: "rgba(245,242,238,0.88)", backdropFilter: "blur(20px)" }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">

        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button type="button" onClick={onOpenMobileMenu} aria-label="Menú"
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-black/[0.05] shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect y="2"    width="16" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="12.5" width="10" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>

          {/* Back button */}
          {canGoBack && (
            <button type="button" onClick={onBack} className="portal-back-btn shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Volver
            </button>
          )}

          <div className="min-w-0">
            <p className="text-[11px] text-slate-400">
              {getGreeting()}, <span className="font-medium text-slate-600">{firstName}</span>
            </p>
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 truncate">
              {activeSection === "Inicio" ? "Tu espacio personal" : activeSection}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clock */}
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-white/70 px-3 py-1.5 text-[12px] font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {clock}
          </span>

          {/* Guide */}
          <button type="button" onClick={onOpenGuide} title="Guía del portal"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[12px] font-bold text-slate-400 transition hover:bg-black/[0.05] hover:text-slate-600">
            ?
          </button>

          {/* Ver cita */}
          <button onClick={onOpenSessionDetails}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(59,126,200,0.3)] transition hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #3B7EC8 0%, #2E6DA4 100%)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Ver cita
          </button>

          {/* Logout */}
          <button onClick={onOpenLogoutModal} title="Cerrar sesión"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Avatar mobile */}
          <div className="sm:hidden h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #3B7EC8 0%, #7C72B8 100%)" }}>
            {user?.name ? getInitials(user.name) : "P"}
          </div>
        </div>
      </div>
    </header>
  );
}
