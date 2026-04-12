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

  // Drive link per patient
  const [editingDriveId, setEditingDriveId]   = useState<string | null>(null);
  const [driveLinkValues, setDriveLinkValues] = useState<Record<string, string>>({});
  const [driveLinkSaving, setDriveLinkSaving] = useState<Record<string, boolean>>({});
  const [driveLinkError, setDriveLinkError]   = useState<Record<string, string>>({});

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
        drive_link: null as null,
      };
      const { error: e } = await createPatient(createPayload);
      if (e) { setError(e.message); setSaving(false); return; }
    }

    setSaving(false); setShowForm(false); onPatientsChange();
  }

  async function handleDelete(id: string) { await deletePatient(id); setConfirmDelete(null); onPatientsChange(); }

  async function handleSaveDriveLink(patientId: string) {
    const raw = (driveLinkValues[patientId] ?? "").trim();
    // Validar que sea una URL o vacío (para borrar el enlace)
    if (raw && !/^https?:\/\/.+/.test(raw)) {
      setDriveLinkError(prev => ({ ...prev, [patientId]: "Ingresa una URL válida (https://...)." }));
      return;
    }
    setDriveLinkSaving(prev => ({ ...prev, [patientId]: true }));
    setDriveLinkError(prev => ({ ...prev, [patientId]: "" }));
    const { error: e } = await updatePatient(patientId, { drive_link: raw || null });
    setDriveLinkSaving(prev => ({ ...prev, [patientId]: false }));
    if (e) {
      const msg = e.message.includes("drive_link")
        ? "La columna 'drive_link' no existe aún. Ejecuta en Supabase SQL Editor: ALTER TABLE patients ADD COLUMN drive_link text;"
        : e.message;
      setDriveLinkError(prev => ({ ...prev, [patientId]: msg }));
      return;
    }
    setEditingDriveId(null);
    onPatientsChange();
  }

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

            {/* ── Google Drive ──────────────────────────────── */}
            <div className="mt-3 border-t border-slate-100 pt-3">
              {editingDriveId === p.id ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Enlace de Google Drive</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={driveLinkValues[p.id] ?? p.drive_link ?? ""}
                      onChange={e => setDriveLinkValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[#6F98BE] focus:bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveDriveLink(p.id)}
                      disabled={driveLinkSaving[p.id]}
                      className="shrink-0 rounded-xl bg-[#1E5A85] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#6F98BE] disabled:opacity-60"
                    >
                      {driveLinkSaving[p.id] ? "..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => { setEditingDriveId(null); setDriveLinkError(prev => ({ ...prev, [p.id]: "" })); }}
                      className="shrink-0 rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500 transition hover:bg-slate-50"
                    >
                      ✕
                    </button>
                  </div>
                  {driveLinkError[p.id] && (
                    <p className="text-[11px] text-red-500">{driveLinkError[p.id]}</p>
                  )}
                </div>
              ) : p.drive_link ? (
                <div className="flex items-center gap-2">
                  <a
                    href={p.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center gap-2 rounded-xl bg-[#EEF4F8] px-3 py-2 text-xs font-medium text-[#1E5A85] transition hover:bg-[#6F98BE]/15"
                  >
                    <svg width="13" height="13" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.27 7.27 0 0 0 1 3.65l5.6 10.2z" fill="#0066DA"/>
                      <path d="M43.65 25L29.9 1.2a7.17 7.17 0 0 0-3.3 3.3L1 47.5a7.27 7.27 0 0 0-1 3.65h27.5L43.65 25z" fill="#00AC47"/>
                      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25a7.27 7.27 0 0 0 1-3.65H59.6l5.85 11.5 8.1 11.45z" fill="#EA4335"/>
                      <path d="M43.65 25L57.4 1.2A7.52 7.52 0 0 0 53.75 0H33.55a7.52 7.52 0 0 0-3.65 1.2L43.65 25z" fill="#00832D"/>
                      <path d="M59.6 51.15h-31.9L13.95 76.8c1.35.8 2.9 1.2 4.5 1.2h50.4c1.6 0 3.15-.45 4.5-1.2L59.6 51.15z" fill="#2684FC"/>
                      <path d="M73.4 25.5L57.4 1.2a7.17 7.17 0 0 0-3.3-3.3... " fill="#FFBA00"/>
                      <path d="M73.4 25.5l-13.8 25.65H87.3a7.27 7.27 0 0 0-1-3.65L73.4 25.5z" fill="#FFBA00"/>
                    </svg>
                    Abrir Google Drive
                  </a>
                  <button
                    onClick={() => { setEditingDriveId(p.id); setDriveLinkValues(prev => ({ ...prev, [p.id]: p.drive_link ?? "" })); }}
                    title="Editar enlace"
                    className="shrink-0 rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-400 transition hover:border-[#6F98BE] hover:text-[#1E5A85]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingDriveId(p.id); setDriveLinkValues(prev => ({ ...prev, [p.id]: "" })); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-[#1E5A85]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Agregar enlace de Drive
                </button>
              )}
            </div>

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
