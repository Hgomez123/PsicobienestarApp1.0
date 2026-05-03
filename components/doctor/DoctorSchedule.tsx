"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getDoctorPatientAppointments, createAppointment, updateAppointment, deleteAppointment } from "@/lib/supabase/db";
import { supabaseDoctor } from "@/lib/supabase/client";
import type { Patient, Appointment, AppointmentStatus, AppointmentRequest } from "@/lib/supabase/types";
import { buildGCalUrl } from "@/lib/utils/calendar";

type Props = {
  doctorId: string;
  patients: Patient[];
  selectedPatient: Patient | null;
  appointmentRequests: AppointmentRequest[];
  onSelectPatient: (p: Patient) => void;
  onUpdateRequestStatus: (id: string, status: "Aceptada" | "Rechazada") => Promise<void>;
};

const EMPTY_FORM = {
  scheduled_at: "",
  modality: "Virtual" as "Virtual" | "Presencial",
  duration_minutes: 60,
  notes: "",
  status: "Pendiente" as AppointmentStatus,
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  Confirmada: "bg-green-50 text-green-700",
  Pendiente:  "bg-amber-50 text-amber-700",
  Cancelada:  "bg-red-50 text-red-600",
  Completada: "bg-slate-100 text-slate-500",
};

export default function DoctorSchedule({ doctorId, patients, selectedPatient, appointmentRequests, onSelectPatient, onUpdateRequestStatus }: Props) {
  const [items, setItems]         = useState<Appointment[]>([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [updatingReqId, setUpdatingReqId] = useState<string | null>(null);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    if (!selectedPatient) return;
    const { data } = await getDoctorPatientAppointments(selectedPatient.id);
    if (data) setItems(data);
  }, [selectedPatient]);

  useEffect(() => { load(); }, [load]);

  // Real-time: recarga al cambiar citas del paciente seleccionado
  useEffect(() => {
    if (!selectedPatient) return;
    const ch = supabaseDoctor
      .channel(`schedule-${selectedPatient.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${selectedPatient.id}` },
        () => load()
      )
      .subscribe();
    return () => { supabaseDoctor.removeChannel(ch); };
  }, [selectedPatient, load]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(a: Appointment) {
    setEditingId(a.id);
    setForm({
      scheduled_at: a.scheduled_at.slice(0, 16), // "YYYY-MM-DDTHH:mm"
      modality: a.modality,
      duration_minutes: a.duration_minutes,
      notes: a.notes ?? "",
      status: a.status,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.scheduled_at || !selectedPatient || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    const payload = {
      patient_id: selectedPatient.id,
      doctor_id: doctorId,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      modality: form.modality,
      duration_minutes: form.duration_minutes,
      notes: form.notes.trim() || null,
      status: form.status,
    };

    if (editingId) {
      await updateAppointment(editingId, payload);
    } else {
      await createAppointment(payload);
    }

    setSaving(false);
    savingRef.current = false;
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: string) {
    await deleteAppointment(id);
    setConfirmDelete(null);
    load();
  }

  async function handleStatusChange(a: Appointment, status: AppointmentStatus) {
    await updateAppointment(a.id, { status });
    load();
  }

  const input = "w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#6F98BE] focus:bg-white focus:ring-2 focus:ring-[#6F98BE]/20";

  const upcoming = items.filter(a => new Date(a.scheduled_at) >= new Date() && a.status !== "Cancelada" && a.status !== "Completada");
  const past     = items.filter(a => new Date(a.scheduled_at) <  new Date() || a.status === "Completada" || a.status === "Cancelada");

  const pendingRequests = appointmentRequests.filter(r => r.status === "Pendiente");

  return (
    <div className="space-y-6">

      {/* ── Solicitudes pendientes de pacientes ─────────────── */}
      {pendingRequests.length > 0 && (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xl">📨</span>
            <h2 className="text-base font-bold text-slate-900">
              Solicitudes de cita pendientes
              <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {pendingRequests.length}
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map(r => {
              const patientName = (r as AppointmentRequest & { patients?: { name: string } }).patients?.name ?? "Paciente";
              return (
                <div key={r.id} className="flex items-start justify-between gap-4 rounded-[20px] border border-amber-200 bg-white p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{patientName}</p>
                    {r.preferred_date && (
                      <p className="mt-1 text-sm text-slate-600">
                        <span className="font-medium">Fecha solicitada:</span> {r.preferred_date}
                      </p>
                    )}
                    {r.preferred_modality && (
                      <p className="text-xs text-slate-400">Modalidad: {r.preferred_modality}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString("es-GT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={async () => { setUpdatingReqId(r.id); await onUpdateRequestStatus(r.id, "Aceptada"); setUpdatingReqId(null); }}
                      disabled={updatingReqId === r.id}
                      className="rounded-xl bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-600 disabled:opacity-60"
                    >
                      {updatingReqId === r.id ? "..." : "Aceptar"}
                    </button>
                    <button
                      onClick={async () => { setUpdatingReqId(r.id); await onUpdateRequestStatus(r.id, "Rechazada"); setUpdatingReqId(null); }}
                      disabled={updatingReqId === r.id}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {updatingReqId === r.id ? "..." : "Rechazar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      {/* Selector de paciente */}
      <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#4A7DA8]">Pacientes</p>
        <div className="mt-4 space-y-2">
          {patients.length === 0 && <p className="text-sm text-slate-400">Sin pacientes.</p>}
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
          <p className="text-sm">Selecciona un paciente para gestionar su agenda.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {items.length} cita{items.length !== 1 ? "s" : ""} para{" "}
              <span className="font-medium text-slate-800">{selectedPatient.name}</span>
            </p>
            <button onClick={openCreate} className="rounded-full bg-[#1E5A85] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#6F98BE]">
              + Nueva cita
            </button>
          </div>

          {/* Próximas */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#4A7DA8]">Próximas</p>
              {upcoming.map(a => (
                <AppointmentCard
                  key={a.id}
                  appt={a}
                  patientName={selectedPatient.name}
                  confirmDelete={confirmDelete}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onConfirmDelete={setConfirmDelete}
                  onStatusChange={handleStatusChange}
                  STATUS_COLOR={STATUS_COLOR}
                />
              ))}
            </div>
          )}

          {/* Pasadas */}
          {past.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Historial</p>
              {past.map(a => (
                <AppointmentCard
                  key={a.id}
                  appt={a}
                  patientName={selectedPatient.name}
                  confirmDelete={confirmDelete}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onConfirmDelete={setConfirmDelete}
                  onStatusChange={handleStatusChange}
                  STATUS_COLOR={STATUS_COLOR}
                  muted
                />
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <p className="text-2xl">📅</p>
              <p className="mt-3 text-sm text-slate-400">Sin citas registradas. Crea la primera.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar cita" : "Nueva cita"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha y hora</label>
                <input type="datetime-local" value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className={input}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Modalidad</label>
                  <select value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value as "Virtual" | "Presencial" }))} className={input}>
                    <option>Virtual</option>
                    <option>Presencial</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Duración (min)</label>
                  <input type="number" min={15} max={180} step={15} value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} className={input}/>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Estado</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AppointmentStatus }))} className={input}>
                  <option>Pendiente</option>
                  <option>Confirmada</option>
                  <option>Completada</option>
                  <option>Cancelada</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notas (opcional)</label>
                <textarea rows={3} placeholder="Observaciones previas a la sesión..." value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${input} resize-none`}/>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.scheduled_at}
                className="flex-1 rounded-[14px] bg-[#1E5A85] py-3 text-sm font-semibold text-white transition hover:bg-[#6F98BE] disabled:opacity-60">
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cita"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-[14px] border border-slate-200 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

/* ── Tarjeta de cita ──────────────────────────────────────── */
function AppointmentCard({
  appt, patientName, confirmDelete, onEdit, onDelete, onConfirmDelete, onStatusChange, STATUS_COLOR, muted = false,
}: {
  appt: Appointment;
  patientName: string;
  confirmDelete: string | null;
  onEdit: (a: Appointment) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string | null) => void;
  onStatusChange: (a: Appointment, s: AppointmentStatus) => void;
  STATUS_COLOR: Record<AppointmentStatus, string>;
  muted?: boolean;
}) {
  const dt = new Date(appt.scheduled_at);
  const dateStr = dt.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`rounded-[24px] border bg-white p-5 shadow-sm transition ${muted ? "opacity-60 border-slate-100" : "border-slate-100 hover:shadow-md"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[appt.status]}`}>{appt.status}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">{appt.modality}</span>
            <span className="text-xs text-slate-400">{appt.duration_minutes} min</span>
          </div>
          <p className={`mt-2 font-semibold capitalize ${appt.status === "Cancelada" ? "line-through text-slate-400" : "text-slate-900"}`}>{dateStr}</p>
          <p className={`mt-0.5 text-sm ${appt.status === "Cancelada" ? "line-through text-slate-400" : "text-slate-500"}`}>{timeStr}</p>
          {appt.notes && <p className="mt-2 text-sm text-slate-600 leading-6">{appt.notes}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {appt.status === "Pendiente" && (
            <button onClick={() => onStatusChange(appt, "Confirmada")}
              className="rounded-xl border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700 hover:bg-green-100 transition">
              Confirmar
            </button>
          )}
          {(appt.status === "Confirmada" || appt.status === "Pendiente") && (
            <button onClick={() => onStatusChange(appt, "Completada")}
              className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 transition">
              Completar
            </button>
          )}
          <button onClick={() => onEdit(appt)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-[#6F98BE] hover:text-[#1E5A85] transition">
            Editar
          </button>
          {(appt.status === "Pendiente" || appt.status === "Confirmada") && (() => {
            const gcalUrl = buildGCalUrl(appt.scheduled_at, patientName, appt.modality, appt.duration_minutes);
            if (!gcalUrl) return null;
            return (
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[#6F98BE]/30 bg-[#EEF4F8] px-3 py-1 text-xs text-[#1E5A85] hover:bg-[#6F98BE]/15 transition"
                title="Agregar a Google Calendar"
              >
                📅 Calendar
              </a>
            );
          })()}
          {confirmDelete === appt.id ? (
            <>
              <button onClick={() => onDelete(appt.id)} className="rounded-xl bg-red-500 px-3 py-1 text-xs text-white">Confirmar</button>
              <button onClick={() => onConfirmDelete(null)} className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-600">Cancelar</button>
            </>
          ) : (
            <button onClick={() => onConfirmDelete(appt.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-1 text-xs text-red-500 hover:bg-red-100 transition">✕</button>
          )}
        </div>
      </div>
    </div>
  );
}
