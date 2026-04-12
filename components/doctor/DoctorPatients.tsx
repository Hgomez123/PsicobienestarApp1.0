"use client";

import { useState } from "react";
import { supabaseDoctor } from "@/lib/supabase/client";
import { createPatient, updatePatient, deletePatient } from "@/lib/supabase/db";
import type { Patient, Modality, PatientStatus } from "@/lib/supabase/types";

type Props = {
  doctorId: string;
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (p: Patient) => void;
  onPatientsChange: () => void;
};

const EMPTY = { name:"", age:"", email:"", phone:"", modality:"Virtual" as Modality, status:"Activa" as PatientStatus, process:"", password:"" };

const STATUS_COLOR: Record<PatientStatus, string> = {
  Activa:    "bg-green-50 text-green-700",
  Pendiente: "bg-amber-50 text-amber-700",
  Inactiva:  "bg-slate-100 text-slate-500",
};

export default function DoctorPatients({ doctorId, patients, selectedPatient, onSelectPatient, onPatientsChange }: Props) {
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [form, setForm]                     = useState(EMPTY);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");
  const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);
  const [creatingPortal, setCreatingPortal] = useState(false);
  const [portalSuccess, setPortalSuccess]   = useState<string | null>(null);

  const f = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  function openCreate() { setEditingId(null); setForm(EMPTY); setError(""); setShowForm(true); }
  function openEdit(p: Patient) {
    setEditingId(p.id);
    setForm({ name: p.name, age: String(p.age ?? ""), email: p.email ?? "", phone: p.phone ?? "",
              modality: p.modality, status: p.status, process: p.process ?? "", password: "" });
    setError(""); setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true); setError("");

    if (editingId) {
      // Actualizar: NO incluir user_id ni checkin_options para no borrar vínculos ya creados
      const updatePayload = {
        name: form.name.trim(),
        age: form.age ? parseInt(form.age) : null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        modality: form.modality,
        status: form.status,
        process: form.process.trim() || null,
      };
      const { error: e } = await updatePatient(editingId, updatePayload);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      // Crear: user_id y checkin_options comienzan en null
      const createPayload = {
        doctor_id: doctorId,
        name: form.name.trim(),
        age: form.age ? parseInt(form.age) : null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        modality: form.modality,
        status: form.status,
        process: form.process.trim() || null,
        user_id: null as null,
        checkin_options: null as null,
      };
      const { error: e } = await createPatient(createPayload);
      if (e) { setError(e.message); setSaving(false); return; }
    }

    setSaving(false); setShowForm(false); onPatientsChange();
  }

  async function handleDelete(id: string) { await deletePatient(id); setConfirmDelete(null); onPatientsChange(); }

  async function handleCreatePortalAccess(patient: Patient) {
    if (!patient.email) { setError("El paciente necesita correo para acceder al portal."); return; }
    if (!form.password || form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    setCreatingPortal(true); setError("");
    const { data: { session } } = await supabaseDoctor.auth.getSession();
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ name: patient.name, email: patient.email, password: form.password, patientId: patient.id, doctorId }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Error al crear acceso."); setCreatingPortal(false); return; }
    setCreatingPortal(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    setPortalSuccess(patient.id);
    onPatientsChange();
    setTimeout(() => setPortalSuccess(null), 5000);
  }

  const input = "w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#6F98BE] focus:bg-white focus:ring-2 focus:ring-[#6F98BE]/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-500">{patients.length} paciente{patients.length !== 1 ? "s" : ""}</p>
        <button onClick={openCreate} className="rounded-full bg-[#1E5A85] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#6F98BE]">
          + Nuevo paciente
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {patients.length === 0 && (
          <div className="col-span-full rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-3xl">👥</p>
            <p className="mt-3 text-sm text-slate-400">Aún no hay pacientes registrados.</p>
            <button onClick={openCreate} className="mt-4 text-sm font-medium text-[#1E5A85] hover:underline">Crear el primero →</button>
          </div>
        )}

        {patients.map(p => (
          <div key={p.id} className={`rounded-[28px] border bg-white p-5 shadow-sm transition hover:shadow-md ${selectedPatient?.id === p.id ? "border-[#6F98BE]" : "border-slate-100"}`}>
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onSelectPatient(p)} className="flex-1 text-left">
                <p className="font-semibold text-slate-900">{p.name}</p>
                {p.age && <p className="mt-0.5 text-xs text-slate-400">{p.age} años</p>}
                {p.process && <p className="mt-2 text-sm leading-5 text-slate-600">{p.process}</p>}
              </button>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[p.status]}`}>{p.status}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-slate-50 px-2.5 py-1">{p.modality}</span>
              {p.email && <span className="max-w-[160px] truncate rounded-full bg-slate-50 px-2.5 py-1">{p.email}</span>}
            </div>

            <div className="mt-3 text-xs">
              {p.user_id
                ? <span className="inline-flex items-center gap-1.5 text-green-600"><span className="h-1.5 w-1.5 rounded-full bg-green-500"/>Portal activo</span>
                : <span className="inline-flex items-center gap-1.5 text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-slate-300"/>Sin acceso al portal</span>}
            </div>

            {portalSuccess === p.id && (
              <div className="mt-2 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">✓ Acceso creado exitosamente.</div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => openEdit(p)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-[#6F98BE] hover:text-[#1E5A85]">Editar</button>
              {confirmDelete === p.id ? (
                <>
                  <button onClick={() => handleDelete(p.id)} className="rounded-xl bg-red-500 px-3 py-1.5 text-xs text-white">Confirmar</button>
                  <button onClick={() => setConfirmDelete(null)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(p.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-500 transition hover:bg-red-100">Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar paciente" : "Nuevo paciente"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-6 space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre completo *</label><input type="text" placeholder="Nombre del paciente" value={form.name} onChange={f("name")} className={input}/></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Edad</label><input type="number" placeholder="Ej. 28" value={form.age} onChange={f("age")} className={input}/></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Correo electrónico</label><input type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={f("email")} className={input}/></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Teléfono</label><input type="tel" placeholder="+502 0000-0000" value={form.phone} onChange={f("phone")} className={input}/></div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Modalidad</label>
                <select value={form.modality} onChange={f("modality")} className={input}>
                  <option>Virtual</option><option>Presencial</option><option>Ambas</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Estado</label>
                <select value={form.status} onChange={f("status")} className={input}>
                  <option>Activa</option><option>Pendiente</option><option>Inactiva</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Enfoque terapéutico</label>
                <textarea rows={2} placeholder="Ej. Ansiedad y regulación emocional" value={form.process} onChange={f("process")} className={`${input} resize-none`}/>
              </div>

              {editingId && form.email && !patients.find(p => p.id === editingId)?.user_id && (
                <div className="rounded-[18px] border border-[#6F98BE]/30 bg-[#EEF4F8] p-4">
                  <p className="text-sm font-medium text-[#1E5A85]">Activar acceso al portal del paciente</p>
                  <p className="mt-1 text-xs text-slate-500">El paciente podrá ingresar con su correo y esta contraseña.</p>
                  <input type="password" placeholder="Contraseña temporal (mín. 8 caracteres)" value={form.password} onChange={f("password")} className="mt-3 w-full rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#6F98BE]"/>
                  <button
                    onClick={() => { const p = patients.find(pt => pt.id === editingId); if (p) handleCreatePortalAccess({ ...p, email: form.email }); }}
                    disabled={creatingPortal}
                    className="mt-3 rounded-full bg-[#1E5A85] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#6F98BE] disabled:opacity-60"
                  >
                    {creatingPortal ? "Creando..." : "Crear acceso al portal"}
                  </button>
                </div>
              )}

              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-[14px] bg-[#1E5A85] py-3 text-sm font-semibold text-white transition hover:bg-[#6F98BE] disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear paciente"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-[14px] border border-slate-200 px-5 py-3 text-sm text-slate-600 transition hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
