import Card from "@/components/ui/Card";

type GoalItem = {
  id: number;
  text: string;
  done: boolean;
};

type NoteItem = {
  content: string;
  created_at: string;
};

type PortalProcessPageSectionProps = {
  goals: GoalItem[];
  clinicalNotes: NoteItem[];
  onToggleGoal: (id: number) => void;
};

export default function PortalProcessPageSection({
  goals,
  clinicalNotes,
  onToggleGoal,
}: PortalProcessPageSectionProps) {
  const activeTask  = goals.find(g => !g.done) ?? null;
  const latestNote  = clinicalNotes[0] ?? null;

  return (
    <section className="grid gap-6 xl:grid-cols-3">
      {/* Objetivos actuales */}
      <Card>
        <div className="p-6">
          <p className="text-sm text-slate-500">Objetivos actuales</p>
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
                  <span className="mt-0.5">{goal.done ? "✓" : "○"}</span>
                  <span className={goal.done ? "line-through opacity-70" : ""}>{goal.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Tarea activa */}
      <Card>
        <div className="p-6">
          <p className="text-sm text-slate-500">Tarea activa</p>
          {activeTask ? (
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {activeTask.text}
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-400 italic">
              {goals.length === 0
                ? "Tu psicóloga aún no ha asignado tareas."
                : "Todas las tareas completadas. ¡Buen trabajo!"}
            </p>
          )}
        </div>
      </Card>

      {/* Última nota */}
      <Card>
        <div className="p-6">
          <p className="text-sm text-slate-500">Última nota</p>
          {latestNote ? (
            <>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                {latestNote.content}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {new Date(latestNote.created_at).toLocaleDateString("es-GT", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400 italic">
              Tu psicóloga aún no ha registrado notas para ti.
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
