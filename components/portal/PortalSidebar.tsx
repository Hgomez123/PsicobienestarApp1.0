"use client";

import { useEffect, useState } from "react";
import type { NavItem, UserData } from "@/types/portal";

type PortalSidebarProps = {
  user: UserData | null;
  navItems: NavItem[];
  activeSection: NavItem;
  onSelectSection: (section: NavItem) => void;
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function useDate() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const fmt = () => new Date().toLocaleDateString("es-GT", {
      weekday: "long", day: "numeric", month: "long",
    });
    setLabel(fmt());
    const id = setInterval(() => setLabel(fmt()), 60_000);
    return () => clearInterval(id);
  }, []);
  return label;
}

const NAV_CONFIG: Record<NavItem, { color: string; icon: React.ReactNode }> = {
  "Inicio": {
    color: "#60A5FA",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  },
  "Mis recomendaciones": {
    color: "#C084FC",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  },
  "Mis recursos": {
    color: "#34D399",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  },
  "Mi proceso": {
    color: "#FB923C",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>,
  },
  "Mis citas": {
    color: "#38BDF8",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  "Configuración": {
    color: "#94A3B8",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  },
};

export default function PortalSidebar({ user, navItems, activeSection, onSelectSection }: PortalSidebarProps) {
  const dateLabel = useDate();
  const initials  = user?.name ? getInitials(user.name) : "P";
  const firstName = user?.name?.split(" ")[0] ?? "Paciente";

  return (
    <aside
      className="hidden lg:flex w-[268px] shrink-0 flex-col sticky top-0 h-screen overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #0E1621 0%, #101C2E 100%)" }}
    >
      {/* ── Logo ──────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logosinfondo.png"
            alt="Psicobienestar"
            style={{ height: 28, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.88 }}
          />
        </div>
        <p className="mt-1.5 text-[10.5px] font-medium text-white/30 tracking-wide">
          Portal del paciente · v2
        </p>
      </div>

      <div className="mx-5 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

      {/* ── User card ─────────────────────────────────────── */}
      <div className="mx-4 mt-5">
        {/* Banner gradient */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2D2060 100%)" }}
        >
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl opacity-40"
            style={{ background: "#60A5FA" }} />
          <div className="pointer-events-none absolute -bottom-3 -left-3 h-16 w-16 rounded-full blur-xl opacity-30"
            style={{ background: "#C084FC" }} />

          <div className="relative p-4">
            {/* Avatar + status */}
            <div className="flex items-start justify-between">
              <div
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold text-white"
                style={{ background: "linear-gradient(135deg, #3B7EC8 0%, #7C72B8 100%)", boxShadow: "0 0 0 3px rgba(255,255,255,0.12)" }}
              >
                {initials}
                {/* Pulse ring */}
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: "#0E1621", border: "2px solid #0E1621" }}
                >
                  <span className="block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              </div>

              <div className="rounded-xl px-2 py-1 text-[10px] font-semibold text-white/50"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                Activa
              </div>
            </div>

            {/* Name */}
            <p className="mt-3 text-[17px] font-bold leading-tight text-white">{user?.name || "Paciente"}</p>
            <p className="mt-0.5 text-[11px] text-white/45">Paciente · Psicobienestar</p>

            {/* Date strip */}
            <div
              className="mt-3 flex items-center gap-1.5 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p className="text-[10.5px] text-white/40 capitalize">{dateLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="mt-5 flex-1 px-3 space-y-0.5">
        <p className="mb-2.5 px-3 text-[9.5px] font-bold uppercase tracking-[0.28em] text-white/20">
          Secciones
        </p>
        {navItems.map((item) => {
          const cfg    = NAV_CONFIG[item];
          const active = activeSection === item;
          return (
            <button
              key={item}
              onClick={() => onSelectSection(item)}
              className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all duration-150"
              style={active ? {
                background: "rgba(255,255,255,0.09)",
                borderLeft: `2.5px solid ${cfg.color}`,
                paddingLeft: "10px",
              } : {
                borderLeft: "2.5px solid transparent",
                paddingLeft: "10px",
              }}
            >
              <span className="shrink-0 transition-colors duration-150"
                style={{ color: active ? cfg.color : "rgba(255,255,255,0.28)" }}>
                {cfg.icon}
              </span>
              <span className={`font-medium transition-colors duration-150 ${
                active ? "text-white" : "text-white/45 group-hover:text-white/70"
              }`}>
                {item}
              </span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="mx-4 mb-6 mt-4 rounded-2xl p-3.5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-start gap-2.5">
          <span className="shrink-0 text-base">🔒</span>
          <div>
            <p className="text-[11px] font-semibold text-white/50">Espacio confidencial</p>
            <p className="mt-0.5 text-[10px] leading-[1.6] text-white/25">
              No sustituye atención de emergencia psicológica o médica.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
