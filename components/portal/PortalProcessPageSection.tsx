import Card from "@/components/ui/Card";

type GoalItem = {
  id: number;
  text: string;
  done: boolean;
};

type TaskItem = {
  text: string;
  created_at: string;
};

type PortalProcessPageSectionProps = {
  goals: GoalItem[];
  latestTask: TaskItem | null;
  onToggleGoal: (id: number) => void;
};

export default function PortalProcessPageSection({
  goals,
  latestTask,
  onToggleGoal,
}: PortalProcessPageSectionProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      {/* Objetivos actuales */}
      <Card>
        <div className="p-6">
          <p className="text-sm font-semibold text-slate-500">Objetivos actuales</p>
          {goals.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400 italic">
              Tu psicóloga aún no ha definido objetivos.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => onToggleGoal(goal.id)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    goal.done
                      ? "bg-[#EEF4F8] text-[#1E5A85]"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">{goal.done ? "✓" : "○"}</span>
                  <span className={`min-w-0 break-words leading-6 ${goal.done ? "line-through opacity-70" : ""}`}>
                    {goal.text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Tarea activa */}
      <Card>
        <div className="p-6">
          <p className="text-sm font-semibold text-slate-500">Tarea activa</p>
          {latestTask ? (
            <>
              <p className="mt-4 min-w-0 break-words text-sm leading-7 text-slate-700 whitespace-pre-wrap">
                {latestTask.text}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Asignada el{" "}
                {new Date(latestTask.created_at).toLocaleDateString("es-GT", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400 italic">
              Tu psicóloga aún no ha asignado una tarea.
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
