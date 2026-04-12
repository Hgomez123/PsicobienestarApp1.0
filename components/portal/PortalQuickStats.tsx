type QuickStatItem = {
  label: string;
  value: string;
  helper: string;
};

type PortalQuickStatsProps = {
  items: QuickStatItem[];
};

const CONFIGS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    iconColor: "#3B7EC8",
    iconBg:    "rgba(59,126,200,0.12)",
    accent:    "#3B7EC8",
    glow:      "rgba(59,126,200,0.08)",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    ),
    iconColor: "#4A9472",
    iconBg:    "rgba(74,148,114,0.12)",
    accent:    "#4A9472",
    glow:      "rgba(74,148,114,0.06)",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      </svg>
    ),
    iconColor: "#7C72B8",
    iconBg:    "rgba(124,114,184,0.12)",
    accent:    "#7C72B8",
    glow:      "rgba(124,114,184,0.07)",
  },
];

export default function PortalQuickStats({ items }: PortalQuickStatsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map((item, i) => {
        const cfg = CONFIGS[i] ?? CONFIGS[0];
        return (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: `0 2px 12px ${cfg.glow}, 0 1px 3px rgba(0,0,0,0.04)`,
            }}
          >
            {/* Subtle top accent line */}
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
              style={{ background: cfg.accent, opacity: 0.4 }} />

            <div className="flex items-start gap-3 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: cfg.iconBg, color: cfg.iconColor }}>
                {cfg.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1.5 text-[15px] font-bold leading-tight text-slate-900">
                  {item.value}
                </p>
                <p className="mt-1 text-[11.5px] text-slate-500">{item.helper}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
