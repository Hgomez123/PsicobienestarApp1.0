"use client";

import type { SupportCard } from "@/types/portal";

type RecommendationItem    = { title: string; text: string };
type SupportCardContent    = { label: string; title: string; text: string; note: string };

type PortalSupportSectionProps = {
  activeSupportCard: SupportCard;
  setActiveSupportCard: React.Dispatch<React.SetStateAction<SupportCard>>;
  supportCards: Record<SupportCard, SupportCardContent>;
  recommendations: RecommendationItem[];
};

const TABS: {
  key: SupportCard; label: string; emoji: string;
  color: string; bg: string; border: string; pill: string;
}[] = [
  {
    key: "mensaje", label: "Mensaje", emoji: "💌",
    color: "#3B7EC8", bg: "rgba(59,126,200,0.08)", border: "rgba(59,126,200,0.2)",
    pill: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    key: "ejercicio", label: "Ejercicio", emoji: "🌱",
    color: "#4A9472", bg: "rgba(74,148,114,0.08)", border: "rgba(74,148,114,0.2)",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    key: "reflexion", label: "Reflexión", emoji: "🔮",
    color: "#7C72B8", bg: "rgba(124,114,184,0.08)", border: "rgba(124,114,184,0.2)",
    pill: "bg-violet-50 text-violet-700 border-violet-100",
  },
];

export default function PortalSupportSection({
  activeSupportCard,
  setActiveSupportCard,
  supportCards,
  recommendations,
}: PortalSupportSectionProps) {
  const tab  = TABS.find(t => t.key === activeSupportCard) ?? TABS[0];
  const card = supportCards[activeSupportCard];

  return (
    <div className="space-y-4 min-w-0">

      {/* ── Tab selector ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {TABS.map(t => {
          const active = activeSupportCard === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveSupportCard(t.key)}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all duration-200"
              style={active ? {
                background: t.bg,
                border: `1px solid ${t.border}`,
                color: t.color,
              } : {
                background: "transparent",
                border: "1px solid transparent",
                color: "#94a3b8",
              }}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Main card ────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-white transition-all duration-200"
        style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>

        {/* Colored header strip */}
        <div className="px-5 py-4" style={{ background: tab.bg, borderBottom: `1px solid ${tab.border}` }}>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{tab.emoji}</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: tab.color }}>
                {card.label}
              </p>
              <p className="text-[15px] font-bold text-slate-900">{card.title}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-[13.5px] leading-[1.75] text-slate-600">{card.text}</p>

          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: tab.bg, border: `1px solid ${tab.border}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: tab.color }}>
              Nota de acompañamiento
            </p>
            <p className="text-[12.5px] leading-[1.65] text-slate-600">{card.note}</p>
          </div>

          {/* Progress steps */}
          <div className="mt-4 flex items-center gap-2">
            {TABS.map((t, i) => (
              <div
                key={t.key}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  background: activeSupportCard === t.key ? tab.color
                    : TABS.indexOf(tab) > i ? "rgba(0,0,0,0.12)"
                    : "rgba(0,0,0,0.06)",
                }}
              />
            ))}
            <p className="text-[10px] text-slate-400 shrink-0 ml-1">
              {TABS.findIndex(t => t.key === activeSupportCard) + 1} / {TABS.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Recommendation cards ─────────────────────────── */}
      {recommendations.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.map((item, i) => {
            const colors = [
              { bg: "rgba(59,126,200,0.06)", border: "rgba(59,126,200,0.15)", label: "#3B7EC8", tag: "Recomendación" },
              { bg: "rgba(74,148,114,0.06)", border: "rgba(74,148,114,0.15)", label: "#4A9472", tag: "Indicación" },
              { bg: "rgba(124,114,184,0.06)", border: "rgba(124,114,184,0.15)", label: "#7C72B8", tag: "Reflexión" },
              { bg: "rgba(0,0,0,0.02)", border: "rgba(0,0,0,0.06)", label: "#94a3b8", tag: "Nota" },
            ];
            const c = colors[i % colors.length];
            return (
              <div key={item.title} className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: c.label }}>
                  {c.tag}
                </p>
                <p className="mt-1.5 text-[13px] font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
