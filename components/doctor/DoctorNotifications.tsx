"use client";

import { useState } from "react";
import { markNotificationRead } from "@/lib/supabase/db";
import type { Notification, NotificationType, AppointmentRequest } from "@/lib/supabase/types";
import { buildGCalUrl } from "@/lib/utils/calendar";

type Props = {
  notifications: Notification[];
  appointmentRequests: AppointmentRequest[];
  onMarkAllRead: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateRequestStatus: (id: string, status: "Aceptada" | "Rechazada") => Promise<void>;
};

const TYPE_ICON: Record<NotificationType, string> = {
  checkin: "📋",
  appointment_request: "📅",
  message: "💬",
};

const TYPE_LABEL: Record<NotificationType, string> = {
  checkin: "Check-in",
  appointment_request: "Solicitud de cita",
  message: "Mensaje",
};

const STATUS_STYLE: Record<AppointmentRequest["status"], string> = {
  Pendiente: "bg-amber-50 text-amber-700 border-amber-200",
  Aceptada:  "bg-green-50 text-green-700 border-green-200",
  Rechazada: "bg-red-50 text-red-500 border-red-200",
};

export default function DoctorNotifications({
  notifications,
  appointmentRequests,
  onMarkAllRead,
  onRefresh,
  onUpdateRequestStatus,
}: Props) {
  const [marking, setMarking]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating]   = useState<string | null>(null);

  const unread   = notifications.filter(n => !n.read).length;
  const pending  = appointmentRequests.filter(r => r.status === "Pendiente").length;
  const totalNew = unread + pending;

  async function handleMarkAll() {
    setMarking(true);
    await onMarkAllRead();
    setMarking(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  async function handleMarkOne(id: string) {
    await markNotificationRead(id);
    onRefresh();
  }

  async function handleRequest(id: string, status: "Aceptada" | "Rechazada") {
    setUpdating(id);
    await onUpdateRequestStatus(id, status);
    setUpdating(null);
  }

  return (
    <div className="space-y-8">

      {/* ── Solicitudes de cita ─────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Solicitudes de cita</h2>
            <p className="text-sm text-slate-400">{appointmentRequests.length} solicitud{appointmentRequests.length !== 1 ? "es" : ""}{pending > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{pending} pendiente{pending !== 1 ? "s" : ""}</span>}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
          >
            {refreshing ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {appointmentRequests.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-3xl">📅</p>
            <p className="mt-3 text-sm text-slate-400">No hay solicitudes de cita aún.</p>
            <p className="mt-1 text-xs text-slate-300">Cuando un paciente solicite una cita, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointmentRequests.map(r => {
              const patientName = (r as AppointmentRequest & { patients?: { name: string } }).patients?.name ?? "Paciente";
              return (
                <div
                  key={r.id}
                  className={`rounded-[24px] border bg-white p-5 shadow-sm transition ${
                    r.status === "Pendiente" ? "border-amber-200 bg-amber-50/30" : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4F8] text-lg">
                        📅
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                            {r.status}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{patientName}</span>
                        </div>
                        {r.preferred_date && (
                          <p className="mt-1.5 text-sm text-slate-700">
                            <span className="font-medium">Fecha solicitada:</span> {r.preferred_date}
                          </p>
                        )}
                        {r.preferred_modality && (
                          <p className="text-xs text-slate-400 mt-0.5">Modalidad: {r.preferred_modality}</p>
                        )}
                        {r.message && (
                          <p className="mt-2 text-sm text-slate-600 italic">"{r.message}"</p>
                        )}
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleDateString("es-GT", {
                            day: "numeric", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {r.status === "Aceptada" && r.preferred_date && (() => {
                          const gcalUrl = buildGCalUrl(r.preferred_date, patientName, r.preferred_modality ?? "Virtual");
                          if (!gcalUrl) return null;
                          return (
                            <a
                              href={gcalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#6F98BE]/30 bg-[#EEF4F8] px-3 py-2 text-xs font-medium text-[#1E5A85] transition hover:bg-[#6F98BE]/15"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              Agregar a Google Calendar
                            </a>
                          );
                        })()}
                      </div>
                    </div>

                    {r.status === "Pendiente" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => handleRequest(r.id, "Aceptada")}
                          disabled={updating === r.id}
                          className="rounded-xl bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-600 disabled:opacity-60"
                        >
                          {updating === r.id ? "..." : "Aceptar"}
                        </button>
                        <button
                          onClick={() => handleRequest(r.id, "Rechazada")}
                          disabled={updating === r.id}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          {updating === r.id ? "..." : "Rechazar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Notificaciones generales ────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Notificaciones</h2>
            <p className="text-sm text-slate-400">
              {notifications.length} notificacion{notifications.length !== 1 ? "es" : ""}
              {unread > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                  {unread} sin leer
                </span>
              )}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={marking}
              className="rounded-full bg-[#1E5A85] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6F98BE] disabled:opacity-60"
            >
              {marking ? "Marcando..." : "Marcar todo como leído"}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-3xl">🔔</p>
            <p className="mt-3 text-sm text-slate-400">No hay notificaciones aún.</p>
            <p className="mt-1 text-xs text-slate-300">Los check-ins de tus pacientes aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`rounded-[24px] border bg-white p-5 shadow-sm transition ${
                  n.read ? "border-slate-100 opacity-70" : "border-[#6F98BE]/30 bg-[#F7FAFC]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4F8] text-lg">
                      {TYPE_ICON[n.type]}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-[#EEF4F8] px-2.5 py-0.5 text-xs font-medium text-[#4A7DA8]">
                          {TYPE_LABEL[n.type]}
                        </span>
                        {n.patient && (
                          <span className="text-sm font-medium text-slate-800">
                            {(n.patient as { name: string }).name}
                          </span>
                        )}
                        {!n.read && <span className="h-2 w-2 rounded-full bg-red-500" title="Sin leer" />}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{n.content}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(n.created_at).toLocaleDateString("es-GT", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkOne(n.id)}
                      className="shrink-0 rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-[#6F98BE] hover:text-[#1E5A85] transition"
                    >
                      Leído
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
