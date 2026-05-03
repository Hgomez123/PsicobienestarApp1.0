type DoctorMobileMenuProps = {
  open: boolean;
  doctorName: string;
  navItems: string[];
  activeSection: string;
  unreadCount: number;
  onClose: () => void;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const NAV_EMOJIS: Record<string, string> = {
  Dashboard:       "🔲",
  Pacientes:       "👥",
  Agenda:          "📅",
  Seguimiento:     "📈",
  Recomendaciones: "💬",
  Recursos:        "📁",
  Notificaciones:  "🔔",
};

export default function DoctorMobileMenu({
  open,
  doctorName,
  navItems,
  activeSection,
  unreadCount,
  onClose,
  onSelectSection,
  onLogout,
}: DoctorMobileMenuProps) {
  if (!open) return null;

  const initials = doctorName ? getInitials(doctorName) : "Dr";
  const firstName = doctorName.split(" ").find(w => w.length > 2) ?? doctorName.split(" ")[0] ?? "Doctora";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <button type="button" aria-label="Cerrar menú" onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] flex flex-col overflow-y-auto shadow-2xl portal-section-anim"
        style={{ background: "linear-gradient(180deg, #0A1628 0%, #0F1E35 60%, #0E1929 100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-[12px] font-bold tracking-[0.2em] text-white/40 uppercase">Psicobienestar</p>
            <p className="mt-0.5 text-[11px] text-white/30">Portal profesional</p>
          </div>
          <button type="button" aria-label="Cerrar menú" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white/70">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1E5A85 0%, #2E4A8A 100%)" }}>
              {initials}
              <span className="absolute -right-0.5 -bottom-0.5 flex h-3 w-3 items-center justify-center rounded-full"
                style={{ background: "#0A1628", border: "1.5px solid #0A1628" }}>
                <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white/90">{firstName}</p>
              <p className="text-[10.5px] text-white/40">Psicóloga · Psicobienestar</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10.5px] text-white/40">En línea</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-5 flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active  = activeSection === item;
            const isNotif = item === "Notificaciones";
            return (
              <button
                key={item}
                onClick={() => { onSelectSection(item); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] transition-all duration-150"
                style={active ? {
                  background: "rgba(255,255,255,0.09)",
                  color: "white",
                  fontWeight: 600,
                } : {
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <span className="text-base">{NAV_EMOJIS[item] ?? "·"}</span>
                <span className="flex-1">{item}</span>
                {isNotif && unreadCount > 0 ? (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : active ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Notice */}
        <div className="mx-4 mb-3 mt-4 rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] text-white/35 leading-5">
            🔒 Portal clínico seguro. Datos protegidos bajo confidencialidad profesional.
          </p>
        </div>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={() => { onClose(); onLogout(); }}
            className="w-full rounded-xl py-3 text-[13px] font-medium text-white/50 transition hover:bg-white/[0.08] hover:text-rose-400"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
