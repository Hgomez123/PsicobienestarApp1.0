"use client";

import { useEffect, useState } from "react";

type DoctorSidebarProps = {
  navItems: string[];
  activeSection: string;
  unreadCount: number;
  doctorName: string;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
};

const NAV_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  "Dashboard": {
    color: "#60A5FA",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  "Pacientes": {
    color: "#34D399",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="7" r="2.5"/><path d="M22 21v-1.5a2.5 2.5 0 00-2.5-2.5"/></svg>,
  },
  "Agenda": {
    color: "#38BDF8",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  "Seguimiento": {
    color: "#FB923C",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
  "Recomendaciones": {
    color: "#C084FC",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
  "Recursos": {
    color: "#4ADE80",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  },
  "Notificaciones": {
    color: "#F472B6",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  },
};

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function DoctorSidebar({
  navItems, activeSection, unreadCount, doctorName, onSelectSection, onLogout,
}: DoctorSidebarProps) {
  const initials  = doctorName ? getInitials(doctorName) : "Dr";
  const firstName = doctorName.split(" ").find(w => w.length > 2) ?? doctorName;
  const clock     = useClock();

  return (
    <aside
      className="hidden lg:flex w-'[272px] shrink-0 flex-col sticky top-0 h-screen overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #0A1628 0%, #0F1E35 60%, #0E1929 100%)" }}
    >
      {/* ── Logo ────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logosinfondo.png"
            alt="Psicobienestar"
            style={{ height: 26, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.85 }}
          />
        </div>
        <p className="mt-1.5 text-[10px] font-semibold tracking-[0.25em] text-white/25 uppercase">
          Portal profesional · v2
        </p>
      </div>

      <div className="mx-5 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* ── Doctor card ─────────────────────────────────── */}
      <div className="mx-4 mt-5">
        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #1e2d52 100%)" }}
        >
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-2xl opacity-30"
            style={{ background: "#38BDF8" }} />
          <div className="pointer-events-none absolute -bottom-4 -left-3 h-16 w-16 rounded-full blur-xl opacity-20"
            style={{ background: "#34D399" }} />

          <div className="relative flex items-center gap-3">
            {/* Avatar */}
            <div
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #1E5A85 0%, #2E4A8A 100%)",
                boxShadow: "0 0 0 2px rgba(255,255,255,0.12)",
              }}
            >
              {initials}
              {/* Online dot */}
              <span
                className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                style={{ background: "#0A1628", border: "1.5px solid #0A1628" }}
              >
                <span className="block h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight truncate">{firstName}</p>
              <p className="text-[10px] text-white/40 mt-0.5">Psicóloga · Psicobienestar</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                <span className="text-[9.5px] font-medium text-emerald-400/80">En línea · {clock}</span>
              </div>
            </div>
          </div>

          {/* Specialty tag */}
          <div
            className="mt-3 flex items-center gap-1.5 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <p className="text-[10px] text-white/35">Psicología clínica y bienestar</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="mt-5 flex-1 px-3 space-y-0.5">
        <p className="mb-2.5 px-3 text-[9px] font-bold uppercase tracking-[0.3em] text-white/18">
          Panel de control
        </p>
        {navItems.map((item) => {
          const cfg    = NAV_CONFIG[item];
          const active = activeSection === item;
          const isNotif = item === "Notificaciones";
          if (!cfg) return null;
          return (
            <button
              key={item}
              onClick={() => onSelectSection(item)}
              className="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all duration-150"
              style={active ? {
                background: "rgba(255,255,255,0.08)",
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
              <span className={`flex-1 font-medium transition-colors duration-150 ${
                active ? "text-white" : "text-white/45 group-hover:text-white/70"
              }`}>
                {item}
              </span>
              {isNotif && unreadCount > 0 ? (
                <span className="flex h-4.5 w-4.5 min-w-'[18px] items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : active ? (
                <span className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* ── Logout ──────────────────────────────────────── */}
      <div className="px-4 pb-6 pt-4">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all duration-150"
          style={{ borderLeft: "2.5px solid transparent", paddingLeft: "10px" }}
        >
          <span className="shrink-0 text-white/25 transition-colors group-hover:text-rose-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="font-medium text-white/30 transition-colors group-hover:text-rose-400">
            Cerrar sesión
          </span>
        </button>

        {/* Footer notice */}
        <div className="mt-3 rounded-xl p-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[9.5px] leading-[1.6] text-white/20">
            🔒 Portal clínico seguro. Datos protegidos bajo confidencialidad profesional.
          </p>
        </div>
      </div>
    </aside>
  );
}
