"use client";

import { doctorPatients } from "@/data/doctorPortalData";
import { useDoctorPortal } from "@/components/doctor/DoctorPortalContext";

type DoctorPatientSwitcherProps = {
  onGoToPatients: () => void;
  onGoToFollowUp: () => void;
  onGoToSchedule: () => void;
};

export default function DoctorPatientSwitcher({
  onGoToPatients,
  onGoToFollowUp,
  onGoToSchedule,
}: DoctorPatientSwitcherProps) {
  const { selectedPatientId, setSelectedPatientId, selectedPatient } =
    useDoctorPortal();

  return (
    <section className="mt-6 rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FBFD_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Paciente activo</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {selectedPatient.name}
            </h2>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                selectedPatient.status === "Activa"
                  ? "bg-[#EEF4F8] text-[#1E5A85]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {selectedPatient.status}
            </span>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {selectedPatient.process}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Próxima cita</p>
            <p className="mt-2 font-medium text-slate-900">
              {selectedPatient.nextSession}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Último check-in</p>
            <p className="mt-2 font-medium text-slate-900">
              {selectedPatient.lastCheckin}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-[380px]">
          <label className="text-sm text-slate-500">Cambiar paciente</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#BBD2E4]"
          >
            {doctorPatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onGoToPatients}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ver ficha
          </button>

          <button
            onClick={onGoToFollowUp}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ir a seguimiento
          </button>

          <button
            onClick={onGoToSchedule}
            className="rounded-full bg-[linear-gradient(180deg,#7EA8C7_0%,#5D8EB5_100%)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
          >
            Preparar sesión
          </button>
        </div>
      </div>
    </section>
  );
}