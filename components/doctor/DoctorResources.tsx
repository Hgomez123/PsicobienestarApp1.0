"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getResources, createResource, updateResource, deleteResource, deleteFile } from "@/lib/supabase/db";
import { supabaseDoctor } from "@/lib/supabase/client";
import type { Patient, Resource, ResourceType } from "@/lib/supabase/types";

type Props = {
  doctorId: string;
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (p: Patient) => void;
};

const EMPTY = { type: "PDF" as ResourceType, title: "", description: "" };
const TYPE_ICON: Record<ResourceType, string> = { PDF: "📄", Audio: "🎧", Lectura: "📖", Video: "🎬" };

export default function DoctorResources({ doctorId, patients, selectedPatient, onSelectPatient }: Props) {
  const [items, setItems]         = useState<Resource[]>([]);
  const [form, setForm]           = useState(EMPTY);
  const [file, setFile]           = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!selectedPatient) return;
    const { data } = await getResources(selectedPatient.id);
    if (data) setItems(data);
  }, [selectedPatient]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(EMPTY); setFile(null); setShowForm(true); setUploadProgress(""); }
  function openEdit(r: Resource) { setEditingId(r.id); setForm({ type: r.type, title: r.title, description: r.description ?? "" }); setFile(null); setShowForm(true); }

  async function handleSave() {
    if (!form.title.trim() || !selectedPatient) return;
    setSaving(true); setUploadProgress("");

    let fileUrl: string | null = null;
    let filePath: string | null = null;

    if (file) {
      setUploadProgress("Subiendo archivo...");
      const { data: { session: doctorSession } } = await supabaseDoctor.auth.getSession();
      if (!doctorSession?.access_token) {
        setSaving(false); setUploadProgress("Sin sesión activa."); return;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("patientId", selectedPatient.id);
      const uploadRes = await fetch("/api/upload-resource", {
        method: "POST",
        headers: { Authorization: `Bearer ${doctorSession.access_token}` },
        body: fd,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json() as { error?: string };
        setSaving(false); setUploadProgress(err.error ?? "Error al subir el archivo."); return;
      }
      const uploadJson = await uploadRes.json() as { path: string; url: string };
      fileUrl = uploadJson.url; filePath = uploadJson.path;
      setUploadProgress("Archivo subido correctamente.");
    }

    if (editingId) {
      await updateResource(editingId, { type: form.type, title: form.title, description: form.description || null, ...(fileUrl ? { file_url: fileUrl, file_path: filePath } : {}) });
    } else {
      await createResource({ patient_id: selectedPatient.id, doctor_id: doctorId, type: form.type, title: form.title, description: form.description || null, file_url: fileUrl, file_path: filePath, active: true });
    }

    setSaving(false); setShowForm(false); load();
  }

  async function handleToggleActive(r: Resource) {
    await updateResource(r.id, { active: !r.active }); load();
  }

  async function handleDelete(r: Resource) {
    if (r.file_path) await deleteFile(r.file_path);
    await deleteResource(r.id); load();
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
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {!selectedPatient ? (
        <div className="flex items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
          <p className="text-sm">Selecciona un paciente para gestionar sus recursos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{items.length} recurso{items.length !== 1 ? "s" : ""} para <span className="font-medium text-slate-800">{selectedPatient.name}</span></p>
            <button onClick={openCreate} className="rounded-full bg-[#1E5A85] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#6F98BE]">
              + Nuevo recurso
            </button>
          </div>

          {items.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-2xl">📁</p>
              <p className="mt-3 text-sm text-slate-400">Sin recursos aún. Sube un archivo o crea un enlace.</p>
            </div>
          )}

          {items.map(r => (
            <div key={r.id} className={`rounded-[24px] border bg-white p-5 shadow-sm transition ${r.active ? "border-slate-100" : "border-dashed border-slate-200 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4F8] text-lg">{TYPE_ICON[r.type]}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{r.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{r.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                      className="rounded-xl border border-[#6F98BE]/30 bg-[#EEF4F8] px-3 py-1 text-xs text-[#1E5A85] hover:bg-[#6F98BE]/20">
                      Ver archivo
                    </a>
                  )}
                  <button onClick={() => openEdit(r)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-[#6F98BE] hover:text-[#1E5A85]">Editar</button>
                  <button onClick={() => handleToggleActive(r)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50">
                    {r.active ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => handleDelete(r)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-1 text-xs text-red-500 hover:bg-red-100">✕</button>
                </div>
              </div>
              {r.description && <p className="mt-3 text-sm leading-6 text-slate-600">{r.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar recurso" : "Nuevo recurso"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
                <div className="flex gap-2">
                  {(["PDF", "Audio", "Lectura", "Video"] as ResourceType[]).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 rounded-2xl border py-2 text-xs font-medium transition ${form.type === t ? "border-[#6F98BE] bg-[#EEF4F8] text-[#1E5A85]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                      {TYPE_ICON[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Título</label>
                <input type="text" placeholder="Ej. Registro emocional" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={input}/>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Descripción</label>
                <textarea rows={2} placeholder="Descripción breve del recurso..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${input} resize-none`}/>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Archivo (opcional)</label>
                <input ref={fileRef} type="file" accept=".pdf,.mp3,.mp4,.wav,.docx,.txt" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden"/>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500 transition hover:border-[#6F98BE] hover:bg-[#EEF4F8] hover:text-[#1E5A85]">
                  {file ? `📎 ${file.name}` : "Haz clic para seleccionar un archivo"}
                </button>
                {uploadProgress && <p className="mt-2 text-xs text-slate-500">{uploadProgress}</p>}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                className="flex-1 rounded-[14px] bg-[#1E5A85] py-3 text-sm font-semibold text-white transition hover:bg-[#6F98BE] disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear recurso"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-[14px] border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
