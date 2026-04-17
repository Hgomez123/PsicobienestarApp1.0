type RecommendationItem = {
  title: string;
  text: string;
};

type PortalRecommendationsSectionProps = {
  recommendations: RecommendationItem[];
};

const PALETTE = [
  { bg: "rgba(59,126,200,0.07)",  border: "rgba(59,126,200,0.18)",  accent: "#3B7EC8",  tag: "Recomendación", emoji: "💌" },
  { bg: "rgba(74,148,114,0.07)",  border: "rgba(74,148,114,0.18)",  accent: "#4A9472",  tag: "Indicación",    emoji: "🌱" },
  { bg: "rgba(124,114,184,0.07)", border: "rgba(124,114,184,0.18)", accent: "#7C72B8",  tag: "Reflexión",     emoji: "🔮" },
  { bg: "rgba(0,0,0,0.03)",       border: "rgba(0,0,0,0.07)",       accent: "#94a3b8",  tag: "Nota",          emoji: "📝" },
];

export default function PortalRecommendationsSection({
  recommendations,
}: PortalRecommendationsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {recommendations.map((item, i) => {
          const p = PALETTE[i % PALETTE.length];
          return (
            <div
              key={item.title}
              className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: p.bg, border: `1px solid ${p.border}` }}
            >
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 text-lg">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: p.accent }}>
                    {p.tag}
                  </p>
                  <h2 className="mt-1.5 break-words text-[14px] font-bold tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-2 break-words text-[12.5px] leading-[1.7] text-slate-600 whitespace-pre-wrap">{item.text}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Soft focus card */}
        <div className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          style={{ background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(0,0,0,0.1)" }}>
          <div className="flex items-start gap-2.5">
            <span className="shrink-0 text-lg">🌿</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Próximo enfoque</p>
              <h2 className="mt-1.5 break-words text-[14px] font-bold text-slate-900">Observación emocional diaria</h2>
              <p className="mt-2 break-words text-[12.5px] leading-[1.7] text-slate-500 whitespace-pre-wrap">
                Nota cuándo cambia tu energía, qué lo provoca y cómo responde tu cuerpo. Sin juicio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
