type ResourceItem = {
  type: string;
  title: string;
  desc: string;
  filePath: string | null;
  fileUrl: string | null;
};

type PortalResourcesSectionProps = {
  resources: ResourceItem[];
  onOpenResource: (filePath: string | null, fileUrl: string | null) => void;
};

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  "PDF":      { emoji: "📄", color: "#C05A3A", bg: "rgba(192,90,58,0.1)" },
  "Audio":    { emoji: "🎧", color: "#3B7EC8", bg: "rgba(59,126,200,0.1)" },
  "Video":    { emoji: "🎬", color: "#7C72B8", bg: "rgba(124,114,184,0.1)" },
  "Lectura":  { emoji: "📖", color: "#4A9472", bg: "rgba(74,148,114,0.1)" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { emoji: "📁", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
}

export default function PortalResourcesSection({
  resources,
  onOpenResource,
}: PortalResourcesSectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white"
      style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>

      <div className="border-b border-black/[0.05] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">Material asignado</p>
            <p className="mt-0.5 text-[15px] font-bold text-slate-900">Recursos para ti</p>
          </div>
          <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
            {resources.length} disponibles
          </span>
        </div>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {resources.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-[13px] text-slate-400">Sin recursos asignados aún.</p>
          </div>
        ) : resources.map((item) => {
          const cfg = getTypeConfig(item.type);
          return (
            <div key={item.title}
              className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-slate-50/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ background: cfg.bg }}>
                {cfg.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold" style={{ color: cfg.color }}>{item.type}</p>
                <p className="text-[13px] font-semibold text-slate-900 truncate">{item.title}</p>
                {item.desc && (
                  <p className="text-[11.5px] text-slate-500 truncate">{item.desc}</p>
                )}
              </div>
              <button
                onClick={() => onOpenResource(item.filePath, item.fileUrl)}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition hover:border-slate-300 hover:shadow-sm">
                Abrir
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
