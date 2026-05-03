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

const NAV_ICONS: Record<string, React.ReactNode> = {
  Dashboard:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Pacientes:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="19" cy="7" r="2.5"/><path d="M22 21v-1.5a2.5 2.5 0 00-2.5-2.5"/></svg>,
  Agenda:          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Seguimiento:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Recomendaciones: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  Recursos:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  Notificaciones:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
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
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white/70">
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
                <span className="flex h-4 w-4 items-center justify-center shrink-0">{NAV_ICONS[item] ?? null}</span>
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
