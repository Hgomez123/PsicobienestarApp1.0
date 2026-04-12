import type { NavItem, UserData } from "@/types/portal";

type PortalMobileMenuProps = {
  open: boolean;
  user: UserData | null;
  navItems: NavItem[];
  activeSection: NavItem;
  onClose: () => void;
  onSelectSection: (section: NavItem) => void;
  onOpenLogoutModal: () => void;
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const NAV_EMOJIS: Record<string, string> = {
  "Inicio":              "🏠",
  "Mis recomendaciones": "✨",
  "Mis recursos":        "📚",
  "Mi proceso":          "🎯",
  "Mis citas":           "📅",
  "Configuración":       "⚙️",
};

export default function PortalMobileMenu({
  open,
  user,
  navItems,
  activeSection,
  onClose,
  onSelectSection,
  onOpenLogoutModal,
}: PortalMobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <button type="button" aria-label="Cerrar menú" onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] flex flex-col overflow-y-auto shadow-2xl portal-section-anim"
        style={{ background: "linear-gradient(180deg, #111827 0%, #0F1E33 100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="text-[12px] font-bold tracking-[0.2em] text-white/40 uppercase">Psicobienestar</p>
            <p className="mt-0.5 text-[11px] text-white/30">Portal del paciente</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/10 hover:text-white/70">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #3B7EC8, #7C72B8)" }}>
              {user?.name ? getInitials(user.name) : "P"}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white/90">{user?.name || "Paciente"}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10.5px] text-white/40">Sesión activa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-5 flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = activeSection === item;
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
                <span>{item}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Notice */}
        <div className="mx-4 mb-3 mt-4 rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[11px] text-white/35 leading-5">
            🛡️ Espacio confidencial. No sustituye atención de emergencia.
          </p>
        </div>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button
            onClick={() => { onClose(); onOpenLogoutModal(); }}
            className="w-full rounded-xl py-3 text-[13px] font-medium text-white/50 transition hover:bg-white/08 hover:text-white/70"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
