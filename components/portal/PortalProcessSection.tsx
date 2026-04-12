type GoalItem = {
  id: number;
  text: string;
  done: boolean;
};

type PortalProcessSectionProps = {
  progressPercent: number;
  goals: GoalItem[];
  onToggleGoal: (id: number) => void;
};

export default function PortalProcessSection({
  progressPercent,
  goals,
  onToggleGoal,
}: PortalProcessSectionProps) {
  const done  = goals.filter(g => g.done).length;
  const total = goals.length;

  return (
    <div className="overflow-hidden rounded-2xl bg-white"
      style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>

      {/* Header */}
      <div className="border-b border-black/[0.05] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">Seguimiento</p>
            <p className="mt-0.5 text-[15px] font-bold text-slate-900">Mis objetivos</p>
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className="text-[22px] font-bold" style={{ color: "#FB923C" }}>{progressPercent}<span className="text-[13px]">%</span></p>
              <p className="text-[10px] text-slate-400">{done}/{total} completados</p>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #FB923C, #F97316)",
              }}
            />
          </div>
        )}
      </div>

      {/* Goals list */}
      <div className="divide-y divide-black/[0.04]">
        {goals.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-2xl">🌱</p>
            <p className="mt-2 text-[13px] font-medium text-slate-500">Objetivos por definir</p>
            <p className="mt-1 text-[11.5px] text-slate-400">Tu psicóloga los asignará pronto.</p>
          </div>
        ) : (
          goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => onToggleGoal(goal.id)}
              className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50/80"
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200"
                style={goal.done ? {
                  borderColor: "#4A9472",
                  background: "#4A9472",
                } : {
                  borderColor: "rgba(0,0,0,0.15)",
                  background: "transparent",
                }}>
                {goal.done && (
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={`text-[13px] leading-5 transition-colors duration-200 ${goal.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {goal.text}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
