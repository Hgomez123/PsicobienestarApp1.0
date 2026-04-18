"use client";

import { useState } from "react";

type GoalItem = {
  id: number;
  text: string;
  done: boolean;
};

type TaskItem = {
  id: string;
  text: string;
  created_at: string;
};

type Props = {
  goals: GoalItem[];
  tasks: TaskItem[];
  onToggleGoal: (id: number) => void;
};

const GOAL_COLORS = [
  { ring: "#6F98BE", bg: "#EEF4F8", text: "#1E5A85", dot: "#3B7EC8" },
  { ring: "#A78BFA", bg: "#F5F3FF", text: "#5B21B6", dot: "#7C3AED" },
  { ring: "#34D399", bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  { ring: "#F59E0B", bg: "#FFFBEB", text: "#92400E", dot: "#D97706" },
  { ring: "#F87171", bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  { ring: "#60A5FA", bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function PortalProcessPageSection({ goals, tasks, onToggleGoal }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const completed = goals.filter(g => g.done).length;
  const pct = goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0;

  return (
    <section className="space-y-6">

      {/* ── Barra de progreso global ───────────────────── */}
      {goals.length > 0 && (
        <div
          className="rounded-[24px] p-5 text-white"
          style={{ background: "linear-gradient(135deg, #1E5A85 0%, #3B7EC8 60%, #7C72B8 100%)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Progreso general</p>
              <p className="mt-1 text-3xl font-bold">{pct}%</p>
              <p className="mt-0.5 text-[12px] opacity-70">
                {completed} de {goals.length} objetivo{goals.length !== 1 ? "s" : ""} completado{completed !== 1 ? "s" : ""}
              </p>
            </div>
            <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6"/>
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke="white" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
                transform="rotate(-90 32 32)"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
              <text x="32" y="37" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{pct}%</text>
            </svg>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${pct}%`, transition: "width 0.8s ease" }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">

        {/* ── Objetivos ──────────────────────────────────── */}
        <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl text-base"
              style={{ background: "linear-gradient(135deg,#EEF4F8,#dbeafe)" }}>
              🎯
            </span>
            <p className="text-sm font-semibold text-slate-700">Objetivos terapéuticos</p>
            {goals.length > 0 && (
              <span className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: "#EEF4F8", color: "#1E5A85" }}>
                {completed}/{goals.length}
              </span>
            )}
          </div>

          {goals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-2xl">🌱</p>
              <p className="mt-2 text-sm text-slate-400 italic">Tu psicóloga aún no ha definido objetivos.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {goals.map((goal, i) => {
                const col = GOAL_COLORS[i % GOAL_COLORS.length];
                return (
                  <button
                    key={goal.id}
                    onClick={() => onToggleGoal(goal.id)}
                    className="flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    style={goal.done
                      ? { background: col.bg, border: `1px solid ${col.ring}40` }
                      : { background: "#f8fafc", border: "1px solid #e2e8f0" }
                    }
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300"
                      style={goal.done
                        ? { background: col.dot, borderColor: col.dot, color: "white" }
                        : { borderColor: "#cbd5e1", color: "transparent" }
                      }
                    >
                      {goal.done && "✓"}
                    </span>
                    <span
                      className="min-w-0 break-words leading-6 transition-all duration-200"
                      style={goal.done
                        ? { color: col.text, textDecoration: "line-through", opacity: 0.7 }
                        : { color: "#374151" }
                      }
                    >
                      {goal.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tareas ─────────────────────────────────────── */}
        <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl text-base"
              style={{ background: "linear-gradient(135deg,#FFF7ED,#fde68a)" }}>
              📋
            </span>
            <p className="text-sm font-semibold text-slate-700">Tareas asignadas</p>
            {tasks.length > 0 && (
              <span className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: "#FFF7ED", color: "#92400E" }}>
                {tasks.length}
              </span>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-2xl">✏️</p>
              <p className="mt-2 text-sm text-slate-400 italic">Tu psicóloga aún no ha asignado tareas.</p>
            </div>
          ) : (
            <div className="relative space-y-3">
              {/* línea de tiempo */}
              <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gradient-to-b from-[#3B7EC8]/30 via-[#7C72B8]/20 to-transparent" />

              {tasks.map((task, idx) => {
                const isFirst = idx === 0;
                const isOpen  = expanded === task.id;
                return (
                  <div
                    key={task.id}
                    className="relative pl-9 transition-all duration-200"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* dot */}
                    <span
                      className="absolute left-0 top-3.5 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm"
                      style={isFirst
                        ? { background: "linear-gradient(135deg,#3B7EC8,#7C72B8)", borderColor: "transparent", color: "white" }
                        : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8" }
                      }
                    >
                      {isFirst ? "★" : idx + 1}
                    </span>

                    <div
                      className="rounded-2xl border p-3.5 cursor-pointer transition-all duration-200 hover:shadow-sm"
                      style={isFirst
                        ? { borderColor: "#3B7EC820", background: "linear-gradient(135deg,#EEF4F8,#f0f4ff)" }
                        : { borderColor: "#e2e8f0", background: "#f8fafc" }
                      }
                      onClick={() => setExpanded(isOpen ? null : task.id)}
                    >
                      {isFirst && (
                        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                          style={{ background: "linear-gradient(90deg,#3B7EC8,#7C72B8)", color: "white" }}>
                          ✦ Tarea actual
                        </span>
                      )}

                      <p className={`break-words text-sm leading-6 text-slate-800 whitespace-pre-wrap ${!isOpen && !isFirst ? "line-clamp-2" : ""}`}>
                        {task.text}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-400">
                          {formatDate(task.created_at)}
                        </p>
                        {task.text.length > 120 && (
                          <span className="text-[11px] font-medium" style={{ color: "#3B7EC8" }}>
                            {isOpen ? "Ver menos ↑" : "Ver más ↓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
