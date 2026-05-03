"use client";

import { useEffect, useState, useCallback } from "react";
import { getRecommendationsAsDoctor, createRecommendation, updateRecommendation, deleteRecommendation, updatePatient } from "@/lib/supabase/db";
import type { Patient, Recommendation, RecommendationType } from "@/lib/supabase/types";
import { useModalA11y } from "@/lib/hooks/useModalA11y";

type Props = {
  doctorId: string;
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (p: Patient) => void;
};

const EMPTY = { type: "Mensaje" as RecommendationType, title: "", content: "" };
const TYPE_ICON: Record<RecommendationType, string> = { Mensaje: "💬", Ejercicio: "🧘", Reflexión: "🌿" };

export default function DoctorRecommendations({ doctorId, patients, selectedPatient, onSelectPatient }: Props) {
  const [items, setItems]             = useState<Recommendation[]>([]);
  const [form, setForm]               = useState(EMPTY);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [showForm, setShowForm]       = useState(false);

  // Check-in options state
  const [checkinOptions, setCheckinOptions] = useState<string[]>([]);
  const [newOption, setNewOption]           = useState("");
  const [savingOptions, setSavingOptions]   = useState(false);

  useModalA11y(showForm, () => setShowForm(false));

  const load = useCallback(async () => {
    if (!selectedPatient) return;
    const { data } = await getRecommendationsAsDoctor(selectedPatient.id);
    if (data) setItems(data);
    setCheckinOptions(selectedPatient.checkin_options ?? []);
  }, [selectedPatient]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(r: Recommendation) { setEditingId(r.id); setForm({ type: r.type, title: r.title, content: r.content }); setShowForm(true); }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim() || !selectedPatient) return;
    setSaving(true);
    if (editingId) {
      await updateRecommendation(editingId, { ...form });
    } else {
      await createRecommendation({ ...form, patient_id: selectedPatient.id, doctor_id: doctorId, active: true });
    }
    setSaving(false); setShowForm(false); load();
  }

  async function handleToggleActive(r: Recommendation) {
    await updateRecommendation(r.id, { active: !r.active }); load();
  }

  async function handleDelete(id: string) {
    await deleteRecommendation(id); load();
  }

  async function handleAddOption() {
    const val = newOption.trim();
    if (!val || !selectedPatient) return;
    const updated = [...checkinOptions, val];
    setCheckinOptions(updated);
    setNewOption("");
    setSavingOptions(true);
    await updatePatient(selectedPatient.id, { checkin_options: updated });
    setSavingOptions(false);
  }

  async function handleRemoveOption(opt: string) {
    if (!selectedPatient) return;
    const updated = checkinOptions.filter(o => o !== opt);
    setCheckinOptions(updated);
    setSavingOptions(true);
    await updatePatient(selectedPatient.id, { checkin_options: updated });
    setSavingOptions(false);
  }

  const input = "w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#6F98BE] focus:bg-white focus:ring-2 focus:ring-[#6F98BE]/20";

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      {/* Selector de paciente */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#4A7DA8]">Pacientes</p>
        <div className="mt-4 space-y-2">
          {patients.map(p => (
            <button key={p.id} onClick={() => onSelectPatient(p)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${selectedPatient?.id === p.id ? "bg-[#EEF4F8] font-medium text-[#1E5A85]" : "text-slate-600 hover:bg-slate-50"}`}>
              <p className="font-medium">{p.name}</p>
              {p.process && <p className="mt-0.5 truncate text-xs text-slate-500">{p.process}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {!selectedPatient ? (
        <div className="flex items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
          <p className="text-sm">Selecciona un paciente para gestionar sus recomendaciones.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{items.length} recomendacion{items.length !== 1 ? "es" : ""} para <span className="font-medium text-slate-800">{selectedPatient.name}</span></p>
            <button onClick={openCreate} className="rounded-full bg-[#1E5A85] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#6F98BE]">
              + Nueva
            </button>
          </div>

          {items.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-2xl">💬</p>
              <p className="mt-3 text-sm text-slate-600">Sin recomendaciones aún.</p>
            </div>
          )}

          {items.map(r => (
            <div key={r.id} className={`rounded-[24px] border bg-white p-5 shadow-sm transition ${r.active ? "border-slate-100" : "border-dashed border-slate-200 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{TYPE_ICON[r.type]}</span>
                  <span className="rounded-full bg-[#EEF4F8] px-2.5 py-1 text-xs font-medium text-[#4A7DA8]">{r.type}</span>
                  {!r.active && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-400">Inactiva</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(r)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-[#6F98BE] hover:text-[#1E5A85]">Editar</button>
                  <button onClick={() => handleToggleActive(r)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50">
                    {r.active ? "Desactivar" : "Activar"}
                  </button>
                  <button aria-label="Eliminar recomendación" onClick={() => handleDelete(r.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-1 text-xs text-red-500 hover:bg-red-100">✕</button>
                </div>
              </div>
              <p className="mt-3 font-semibold text-slate-900">{r.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{r.content}</p>
              <p className="mt-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString("es-GT", { day: "numeric", month: "long" })}</p>
            </div>
          ))}

          {/* ── Check-in emocional ─────────────────────────── */}
          <div className="mt-2 rounded-[24px] border border-[#DCEAF4] bg-[#EEF5FB] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#1E5A85]">Check-in emocional</p>
                <p className="mt-1 text-sm text-slate-500">Opciones que verá el/la paciente en su portal</p>
              </div>
              {savingOptions && (
                <span className="text-xs text-slate-400">Guardando...</span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {checkinOptions.map(opt => (
                <span
                  key={opt}
                  className="flex items-center gap-1.5 rounded-full border border-[#DCEAF4] bg-white px-3 py-1.5 text-xs text-slate-700"
                >
                  {opt}
                  <button
                    onClick={() => handleRemoveOption(opt)}
                    className="ml-0.5 text-slate-400 hover:text-red-500 transition"
                    aria-label="Eliminar opción"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {checkinOptions.length === 0 && (
                <p className="text-xs text-slate-500">Sin opciones configuradas — el portal usará las predeterminadas.</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                aria-label="Nueva opción de check-in"
                type="text"
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAddOption(); }}
                placeholder="Ej. Me sentí con energía"
                className="flex-1 rounded-[14px] border border-[#DCEAF4] bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#6F98BE] focus:ring-2 focus:ring-[#6F98BE]/20"
              />
              <button
                onClick={handleAddOption}
                disabled={!newOption.trim()}
                className="rounded-[14px] bg-[#1E5A85] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#164a70] disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar recomendación" : "Nueva recomendación"}</h2>
              <button aria-label="Cerrar" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
                <div className="flex gap-3">
                  {(["Mensaje", "Ejercicio", "Reflexión"] as RecommendationType[]).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 rounded-2xl border py-2.5 text-sm font-medium transition ${form.type === t ? "border-[#6F98BE] bg-[#EEF4F8] text-[#1E5A85]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                      {TYPE_ICON[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="recommendation-title" className="mb-1.5 block text-sm font-medium text-slate-700">Título</label>
                <input id="recommendation-title" type="text" placeholder="Ej. Respiración consciente" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={input}/>
              </div>
              <div>
                <label htmlFor="recommendation-content" className="mb-1.5 block text-sm font-medium text-slate-700">Contenido</label>
                <textarea id="recommendation-content" rows={5} placeholder="Descripción detallada del mensaje o ejercicio..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={`${input} resize-none`}/>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}
                className="flex-1 rounded-[14px] bg-[#1E5A85] py-3 text-sm font-semibold text-white transition hover:bg-[#6F98BE] disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear recomendación"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-[14px] border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
