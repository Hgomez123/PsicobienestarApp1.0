"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getGoals, createGoal, updateGoal, deleteGoal,
  getDoctorCheckins, createTask, getTaskHistory, deleteTask,
} from "@/lib/supabase/db";
import { supabaseDoctor } from "@/lib/supabase/client";
import type { Patient, Goal, Task, Checkin } from "@/lib/supabase/types";

type Props = {
  doctorId: string;
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (p: Patient) => void;
  onPatientsChange: () => void;
};

type Tab = "tareas" | "objetivos" | "checkins";

// ── Helpers para el tracker semanal ───────────────────────────
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getWeekMonday(offsetWeeks: number): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Lun…
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + toMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const EMOTION_PALETTE = [
  { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", chip: "#3B82F6" },
  { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", chip: "#22C55E" },
  { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", chip: "#F97316" },
  { bg: "#FAF5FF", border: "#E9D5FF", text: "#7E22CE", chip: "#A855F7" },
  { bg: "#F0F9FF", border: "#BAE6FD", text: "#0369A1", chip: "#0EA5E9" },
  { bg: "#FFF0F6", border: "#FBCFE8", text: "#9D174D", chip: "#EC4899" },
  { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", chip: "#F59E0B" },
  { bg: "#F8FAFC", border: "#CBD5E1", text: "#475569", chip: "#94A3B8" },
];

export default function DoctorFollowUp({ doctorId, patients, selectedPatient, onSelectPatient, onPatientsChange }: Props) {
  const [goals, setGoals]         = useState<Goal[]>([]);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [checkins, setCheckins]   = useState<Omit<Checkin, "patient_id">[]>([]);
  const [goalText, setGoalText]   = useState("");
  const [taskText, setTaskText]   = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState<Tab>("tareas");

  // Check-in options state (per patient)
  const [checkinOpts, setCheckinOpts]   = useState<string[]>([]);
  const [newOpt, setNewOpt]             = useState("");
  const [savingOpts, setSavingOpts]     = useState(false);
  const [savedOpts, setSavedOpts]       = useState(false);
  const [optsError, setOptsError]       = useState<string | null>(null);
  const [weekOffset, setWeekOffset]     = useState(0);
  const [showOptsManager, setShowOptsManager] = useState(false);

  const load = useCallback(async () => {
    if (!selectedPatient) return;
    const [{ data: g }, { data: c }, { data: th }] = await Promise.all([
      getGoals(selectedPatient.id),
      getDoctorCheckins(selectedPatient.id),
      getTaskHistory(selectedPatient.id),
    ]);
    if (g) setGoals(g);
    if (c) setCheckins(c as Omit<Checkin, "patient_id">[]);
    if (th) setTaskHistory(th);
    setCheckinOpts(selectedPatient.checkin_options ?? []);
  }, [selectedPatient]);

  useEffect(() => { load(); }, [load]);

  // Real-time: detectar nuevos check-ins del paciente seleccionado
  useEffect(() => {
    if (!selectedPatient) return;
    const ch = supabaseDoctor
      .channel(`followup-checkins-${selectedPatient.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins", filter: `patient_id=eq.${selectedPatient.id}` },
        () => load()
      )
      .subscribe();
    return () => { supabaseDoctor.removeChannel(ch); };
  }, [selectedPatient, load]);

  // ── Objetivos ────────────────────────────────────────────────
  async function handleAddGoal() {
    if (!goalText.trim() || !selectedPatient) return;
    setSaving(true);
    await createGoal({ patient_id: selectedPatient.id, doctor_id: doctorId, text: goalText.trim(), done: false });
    setGoalText(""); setSaving(false); load();
  }

  async function handleToggleGoal(goal: Goal) {
    await updateGoal(goal.id, { done: !goal.done }); load();
  }

  async function handleDeleteGoal(id: string) {
    await deleteGoal(id); load();
  }

  async function handleSaveTask() {
    if (!taskText.trim() || !selectedPatient) return;
    setSavingTask(true);
    setTaskError(null);
    const { error } = await createTask({
      patient_id: selectedPatient.id,
      doctor_id: doctorId,
      text: taskText.trim(),
    });
    setSavingTask(false);
    if (error) {
      setTaskError(`Error al guardar: ${error.message}`);
      return;
    }
    setTaskText("");
    setTaskSaved(true);
    setTimeout(() => setTaskSaved(false), 3000);
    load();
  }

  async function handleDeleteTask(id: string) {
    await deleteTask(id);
    load();
  }

  // ── Opciones Check-in ────────────────────────────────────────
  function addOpt() {
    const t = newOpt.trim();
    if (!t || checkinOpts.includes(t)) return;
    setCheckinOpts(prev => [...prev, t]);
    setNewOpt("");
  }

  function removeOpt(opt: string) {
    setCheckinOpts(prev => prev.filter(o => o !== opt));
  }

  async function saveCheckinOpts() {
    if (!selectedPatient) return;
    setSavingOpts(true);
    try {
      // Obtener token de la doctora
      const { data: { session } } = await supabaseDoctor.auth.getSession();
      if (!session?.access_token) { setSavingOpts(false); return; }

      const res = await fetch("/api/checkin-options", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ patientId: selectedPatient.id, options: checkinOpts }),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string; code?: string };
        const msg = json.code === "MISSING_COLUMN"
          ? "Columna 'checkin_options' faltante en la BD. Ejecuta en Supabase SQL Editor: ALTER TABLE patients ADD COLUMN checkin_options text[] DEFAULT '{}'::text[];"
          : (json.error ?? "Error desconocido al guardar.");
        setOptsError(msg);
        console.error("[checkin-options]", json);
        setSavingOpts(false);
        return;
      }
      setOptsError(null);

      setSavedOpts(true);
      setTimeout(() => setSavedOpts(false), 3000);

      // Notificar al portal del paciente en tiempo real via Broadcast
      const bc = supabaseDoctor.channel(`patient-room-${selectedPatient.id}`);
      bc.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          bc.send({ type: "broadcast", event: "reload", payload: {} });
          setTimeout(() => supabaseDoctor.removeChannel(bc), 1500);
        }
      });

      // Refrescar lista de pacientes en el portal de la doctora
      onPatientsChange();
    } catch (err) {
      console.error("[checkin-options] Error de red:", err);
    } finally {
      setSavingOpts(false);
    }
  }

  const input = "w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#6F98BE] focus:bg-white focus:ring-2 focus:ring-[#6F98BE]/20";

  const tabs: { key: Tab; label: string }[] = [
    { key: "tareas",    label: `📋 Tareas (${taskHistory.length})` },
    { key: "objetivos", label: `🎯 Objetivos (${goals.length})` },
    { key: "checkins",  label: `✅ Check-ins (${checkins.length})` },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">

      {/* Selector de paciente */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#4A7DA8]">Pacientes</p>
        <div className="mt-4 space-y-2">
          {patients.length === 0 && <p className="text-sm text-slate-400">Sin pacientes registrados.</p>}
          {patients.map(p => (
            <button key={p.id} onClick={() => onSelectPatient(p)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${selectedPatient?.id === p.id ? "bg-[#EEF4F8] font-medium text-[#1E5A85]" : "text-slate-600 hover:bg-slate-50"}`}>
              <p className="font-medium">{p.name}</p>
              {p.process && <p className="mt-0.5 truncate text-xs text-slate-400">{p.process}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {!selectedPatient ? (
        <div className="flex items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
          <p className="text-sm">Selecciona un paciente para ver su seguimiento.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header paciente */}
          <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="font-semibold text-slate-900">{selectedPatient.name}</p>
            {selectedPatient.process && <p className="mt-1 text-sm text-slate-500">{selectedPatient.process}</p>}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === t.key ? "bg-[#1E5A85] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tareas ─────────────────────────────────────────── */}
          {tab === "tareas" && (
            <div className="space-y-4">

              {/* Nueva tarea */}
              <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-1 text-sm font-semibold text-slate-700">Asignar tarea al paciente</p>
                <p className="mb-3 text-xs text-slate-400">
                  La nueva tarea quedará registrada en el historial y será visible de inmediato en el portal del paciente.
                </p>
                <textarea
                  rows={5}
                  placeholder="Describe la tarea o ejercicio que el paciente debe realizar entre sesiones..."
                  value={taskText}
                  onChange={e => setTaskText(e.target.value)}
                  className={`${input} resize-y`}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleSaveTask}
                    disabled={savingTask || !taskText.trim()}
                    className="rounded-full bg-[#1E5A85] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#6F98BE] disabled:opacity-50"
                  >
                    {savingTask ? "Guardando..." : "Guardar tarea"}
                  </button>
                  {taskSaved && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6.5" stroke="#22c55e"/>
                        <path d="M4 7l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Tarea guardada y visible al paciente
                    </span>
                  )}
                </div>
                {taskError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-semibold text-red-600">Error al guardar la tarea</p>
                    <p className="mt-1 break-words text-xs text-red-500 leading-5">{taskError}</p>
                    <p className="mt-2 text-xs text-red-400">
                      Si el error menciona &quot;relation tasks does not exist&quot;, ejecuta la migración SQL en Supabase.
                    </p>
                  </div>
                )}
              </div>

              {/* Historial de tareas */}
              <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-4 text-sm font-semibold text-slate-700">
                  Historial de tareas
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                    {taskHistory.length}
                  </span>
                </p>
                {taskHistory.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">Sin tareas asignadas aún.</p>
                ) : (
                  <div className="space-y-3">
                    {taskHistory.map((t, idx) => (
                      <div
                        key={t.id}
                        className={`rounded-2xl border p-4 ${idx === 0 ? "border-[#6F98BE]/40 bg-[#EEF4F8]" : "border-slate-100 bg-slate-50"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {idx === 0 && (
                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#1E5A85]">
                                Tarea actual
                              </p>
                            )}
                            <p className="break-words text-sm leading-6 text-slate-800 whitespace-pre-wrap">{t.text}</p>
                            <p className="mt-2 text-xs text-slate-400">
                              {new Date(t.created_at).toLocaleDateString("es-GT", {
                                weekday: "short", day: "numeric", month: "long", year: "numeric",
                              })}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            title="Eliminar tarea"
                            className="mt-0.5 shrink-0 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-100 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Objetivos ──────────────────────────────────────── */}
          {tab === "objetivos" && (
            <div className="space-y-4">

              {/* Objetivos terapéuticos */}
              <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-medium text-slate-700">Objetivos terapéuticos</p>
                <div className="flex gap-3">
                  <input type="text" placeholder="Ej. Reducir rumiación cognitiva" value={goalText}
                    onChange={e => setGoalText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddGoal(); }}
                    className={`flex-1 ${input}`}/>
                  <button onClick={handleAddGoal} disabled={saving || !goalText.trim()}
                    className="rounded-full bg-[#1E5A85] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#6F98BE] disabled:opacity-50">
                    Agregar
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                {goals.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Sin objetivos aún.</p>}
                {goals.map(goal => (
                  <div key={goal.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 transition hover:bg-slate-50">
                    <button aria-label="Marcar/desmarcar objetivo" onClick={() => handleToggleGoal(goal)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs transition ${goal.done ? "border-[#6F98BE] bg-[#6F98BE] text-white" : "border-slate-300 hover:border-[#6F98BE]"}`}>
                      {goal.done && "✓"}
                    </button>
                    <p className={`min-w-0 flex-1 break-words text-sm leading-6 ${goal.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{goal.text}</p>
                    <button aria-label="Eliminar objetivo" onClick={() => handleDeleteGoal(goal.id)} className="mt-0.5 shrink-0 text-xs text-red-400 hover:text-red-600">✕</button>
                  </div>
                ))}
                {goals.length > 0 && (
                  <div className="pt-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#6F98BE] transition-all duration-500"
                        style={{ width: `${Math.round((goals.filter(g => g.done).length / goals.length) * 100)}%` }}/>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{goals.filter(g => g.done).length} de {goals.length} completados</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Check-ins ──────────────────────────────────────── */}
          {tab === "checkins" && (() => {
            // Mapa de color por emoción (según posición en checkinOpts)
            const emotionColor = (opt: string) => {
              const idx = checkinOpts.indexOf(opt);
              return EMOTION_PALETTE[idx >= 0 ? idx % EMOTION_PALETTE.length : EMOTION_PALETTE.length - 1];
            };

            // Frecuencia por emoción (todos los check-ins cargados)
            const freq: Record<string, number> = {};
            for (const c of checkins) {
              freq[c.content] = (freq[c.content] ?? 0) + 1;
            }
            const freqEntries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
            const maxFreq = freqEntries[0]?.[1] ?? 1;

            // Semana actual según offset
            const weekStart = getWeekMonday(weekOffset);
            const weekEnd   = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const weekDays = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStart);
              d.setDate(weekStart.getDate() + i);
              return d;
            });

            // Check-ins de la semana mostrada
            const weekCheckins = checkins.filter(c => {
              const d = new Date(c.created_at);
              return d >= weekStart && d <= weekEnd;
            });

            // Agrupar por día
            const byDay: Record<number, typeof checkins> = {};
            for (const c of weekCheckins) {
              const d = new Date(c.created_at);
              const dayIdx = weekDays.findIndex(wd => isSameDay(wd, d));
              if (dayIdx >= 0) {
                if (!byDay[dayIdx]) byDay[dayIdx] = [];
                byDay[dayIdx].push(c);
              }
            }

            const weekLabel = `${weekStart.getDate()} ${weekStart.toLocaleDateString("es-GT", { month: "short" })} – ${weekEnd.getDate()} ${weekEnd.toLocaleDateString("es-GT", { month: "short", year: "numeric" })}`;
            const isCurrentWeek = weekOffset === 0;

            return (
              <div className="space-y-5">

                {/* ── Resumen rápido ─────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total check-ins", value: checkins.length, icon: "📊" },
                    { label: "Esta semana",      value: weekCheckins.length, icon: "📅" },
                    { label: "Emoción frecuente", value: freqEntries[0]?.[0] ?? "—", icon: "💭", small: true },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-3.5 text-center shadow-sm">
                      <p className="text-lg">{s.icon}</p>
                      <p className={`mt-1 font-bold text-slate-900 ${s.small ? "text-[13px] leading-tight" : "text-2xl"}`}>{s.value}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* ── Calendario semanal ─────────────────────────── */}
                <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                  {/* Header con navegación */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Semana emocional</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-800">{weekLabel}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button aria-label="Semana anterior" onClick={() => setWeekOffset(w => w - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                      {!isCurrentWeek && (
                        <button onClick={() => setWeekOffset(0)}
                          className="rounded-xl border border-[#6F98BE] px-3 py-1.5 text-[11px] font-medium text-[#1E5A85] transition hover:bg-[#EEF4F8]">
                          Hoy
                        </button>
                      )}
                      <button aria-label="Semana siguiente" onClick={() => setWeekOffset(w => w + 1)} disabled={isCurrentWeek}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Grid de días */}
                  <div className="mt-4 grid grid-cols-7 gap-1.5">
                    {weekDays.map((day, i) => {
                      const dayCheckins = byDay[i] ?? [];
                      const isToday     = isSameDay(day, new Date());
                      const hasCheckin  = dayCheckins.length > 0;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          {/* Día label */}
                          <p className={`text-[10px] font-semibold ${isToday ? "text-[#1E5A85]" : "text-slate-400"}`}>
                            {DAY_LABELS[i]}
                          </p>
                          {/* Número */}
                          <p className={`text-[12px] font-bold ${isToday ? "text-[#1E5A85]" : "text-slate-700"}`}>
                            {day.getDate()}
                          </p>
                          {/* Check-ins del día */}
                          <div className="flex flex-col items-center gap-1 w-full">
                            {hasCheckin ? (
                              dayCheckins.map((c, ci) => {
                                const col = emotionColor(c.content);
                                return (
                                  <div key={ci}
                                    className="group relative w-full cursor-default"
                                    title={`${c.content} · ${new Date(c.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}`}
                                  >
                                    <div
                                      className="w-full rounded-lg px-1 py-1.5 text-center"
                                      style={{ background: col.bg, border: `1px solid ${col.border}` }}
                                    >
                                      <p className="text-[9px] font-semibold leading-tight truncate" style={{ color: col.text }}>
                                        {c.content.split(" ")[0]}
                                      </p>
                                    </div>
                                    {/* Tooltip */}
                                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                      {c.content}
                                      <br/>
                                      <span className="text-slate-400">{new Date(c.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="h-8 w-full rounded-lg border border-dashed border-slate-100 bg-slate-50/50" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {weekCheckins.length === 0 && (
                    <p className="mt-3 text-center text-[12px] text-slate-400">Sin check-ins esta semana.</p>
                  )}
                </div>

                {/* ── Frecuencia emocional ───────────────────────── */}
                {freqEntries.length > 0 && (
                  <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Frecuencia emocional</p>
                    <p className="mt-0.5 text-[12px] text-slate-400">Últimos {checkins.length} registros</p>

                    <div className="mt-4 space-y-3">
                      {freqEntries.map(([emotion, count]) => {
                        const col     = emotionColor(emotion);
                        const pct     = Math.round((count / maxFreq) * 100);
                        return (
                          <div key={emotion}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: col.chip }} />
                                <span className="text-[12.5px] font-medium text-slate-700">{emotion}</span>
                              </div>
                              <span className="text-[11px] font-semibold" style={{ color: col.chip }}>
                                {count}×
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: col.chip }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Historial completo ─────────────────────────── */}
                <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="mb-4 text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Historial completo</p>

                  {checkins.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                      <p className="text-2xl">💭</p>
                      <p className="mt-3 text-sm text-slate-400">El paciente aún no ha enviado check-ins.</p>
                      <p className="mt-1 text-xs text-slate-300">Aparecerán aquí cuando seleccione y envíe una emoción.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {checkins.map(c => {
                        const col  = emotionColor(c.content);
                        const date = new Date(c.created_at);
                        return (
                          <div key={c.id}
                            className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition hover:shadow-sm"
                            style={{ borderColor: col.border, background: col.bg + "80" }}
                          >
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: col.chip }} />
                            <p className="flex-1 text-[13px] font-medium" style={{ color: col.text }}>{c.content}</p>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] font-medium text-slate-500">
                                {date.toLocaleDateString("es-GT", { weekday: "short", day: "numeric", month: "short" })}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Configurar opciones (colapsable) ──────────── */}
                <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowOptsManager(v => !v)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-widest text-[#4A7DA8]">Configurar opciones</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">
                        {checkinOpts.length === 0
                          ? "Sin opciones configuradas"
                          : `${checkinOpts.length} opción${checkinOpts.length > 1 ? "es" : ""}: ${checkinOpts.slice(0, 3).join(", ")}${checkinOpts.length > 3 ? "…" : ""}`}
                      </p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"
                      className={`transition-transform duration-200 ${showOptsManager ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>

                  {showOptsManager && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
                      <p className="text-xs text-slate-400">Define las opciones emocionales que verá {selectedPatient.name} en su portal.</p>

                      {/* Opciones actuales */}
                      <div className="flex flex-wrap gap-2">
                        {checkinOpts.length === 0 && (
                          <p className="text-xs text-slate-400 italic">Sin opciones. Agrega al menos una abajo.</p>
                        )}
                        {checkinOpts.map((opt, idx) => {
                          const col = EMOTION_PALETTE[idx % EMOTION_PALETTE.length];
                          return (
                            <div key={opt}
                              className="flex items-center gap-2 rounded-full pl-3 pr-2 py-1.5"
                              style={{ background: col.bg, border: `1px solid ${col.border}` }}
                            >
                              <span className="text-[12px] font-medium" style={{ color: col.text }}>{opt}</span>
                              <button aria-label="Eliminar opción" onClick={() => removeOpt(opt)}
                                className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] transition hover:bg-red-100 hover:text-red-500"
                                style={{ color: col.text + "80" }}>
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Agregar */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder='Ej. "Me sentí ansioso/a"'
                          value={newOpt}
                          onChange={e => setNewOpt(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") addOpt(); }}
                          className="flex-1 rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#6F98BE] focus:bg-white"
                        />
                        <button onClick={addOpt} disabled={!newOpt.trim()}
                          className="rounded-full border border-[#6F98BE] px-4 py-2 text-sm text-[#1E5A85] transition hover:bg-[#EEF4F8] disabled:opacity-40">
                          + Agregar
                        </button>
                      </div>

                      {/* Guardar */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <button onClick={saveCheckinOpts} disabled={savingOpts}
                            className="rounded-full bg-[#1E5A85] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#6F98BE] disabled:opacity-50">
                            {savingOpts ? "Guardando..." : "Guardar opciones"}
                          </button>
                          {savedOpts && (
                            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="6.5" stroke="#22c55e"/>
                                <path d="M4 7l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Guardado y notificado al paciente
                            </span>
                          )}
                        </div>
                        {optsError && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-xs font-semibold text-red-600">Error al guardar</p>
                            <p className="mt-1 text-xs text-red-500 leading-5 break-all">{optsError}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
