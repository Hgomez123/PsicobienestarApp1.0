"use client";

type AppointmentItem = { title: string; date: string; mode: string; status: string };

type PortalSessionPanelProps = {
  checkinOptions: string[];
  selectedCheckin: string;
  checkinSent: boolean;
  checkinError?: string | null;
  nextAppointment: AppointmentItem | null;
  onSelectCheckin: (option: string) => void;
  onSendCheckin: () => void;
  onOpenSessionDetails: () => void;
  onOpenReschedule: () => void;
};

const CHECKIN_EMOJIS: Record<string, string> = {
  "Bien":          "😊",
  "Tranquilo/a":   "😌",
  "Ansioso/a":     "😰",
  "Triste":        "😔",
  "Con energía":   "✨",
  "Agotado/a":     "😴",
  "Enojado/a":     "😤",
  "Confundido/a":  "😕",
};

function getEmoji(option: string) {
  return CHECKIN_EMOJIS[option] ?? "💭";
}

export default function PortalSessionPanel({
  checkinOptions,
  selectedCheckin,
  checkinSent,
  checkinError,
  nextAppointment,
  onSelectCheckin,
  onSendCheckin,
  onOpenSessionDetails,
  onOpenReschedule,
}: PortalSessionPanelProps) {
  return (
    <div className="flex flex-col gap-4 min-w-0">

      {/* ── Próxima cita ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:shadow-md"
        style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>

        {/* Left accent bar */}
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ background: "linear-gradient(180deg, #3B7EC8, #7C72B8)" }} />

        <div className="px-5 py-4 pl-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">Próxima sesión</p>
              {nextAppointment ? (
                <>
                  <p className="mt-1.5 text-[15px] font-bold leading-snug text-slate-900">{nextAppointment.date}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
                      {nextAppointment.mode}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
                      ✓ {nextAppointment.status}
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-1.5 text-[15px] font-semibold text-slate-400">Sin citas programadas</p>
              )}
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: "rgba(59,126,200,0.08)" }}>
              📅
            </div>
          </div>

          {nextAppointment && (
            <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11.5px] text-slate-500">
              Enlace disponible 15 min antes · Modalidad {nextAppointment.mode.toLowerCase()}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            {nextAppointment ? (
              <>
                <button onClick={onOpenSessionDetails}
                  className="rounded-xl px-3.5 py-2 text-[12px] font-semibold text-white transition hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #3B7EC8, #2E6DA4)", boxShadow: "0 3px 10px rgba(59,126,200,0.25)" }}>
                  Ver detalles
                </button>
                <button onClick={onOpenReschedule}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50">
                  Reagendar
                </button>
              </>
            ) : (
              <button onClick={onOpenReschedule}
                className="rounded-xl px-3.5 py-2 text-[12px] font-semibold text-white transition hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #3B7EC8, #2E6DA4)", boxShadow: "0 3px 10px rgba(59,126,200,0.25)" }}>
                Solicitar cita
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Check-in emocional ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{ background: "linear-gradient(145deg, #1A2942 0%, #1E3A5F 50%, #1F2D4A 100%)" }}>

        {/* Decorative blob */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
          style={{ background: "#7C72B8" }} />
        <div className="pointer-events-none absolute -bottom-6 -left-4 h-24 w-24 rounded-full opacity-15 blur-xl"
          style={{ background: "#4A9472" }} />

        <div className="relative p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Check-in emocional
              </p>
              <p className="mt-1 text-[15px] font-bold text-white">¿Cómo te sientes?</p>
            </div>
            <span className="text-2xl select-none">
              {selectedCheckin ? getEmoji(selectedCheckin) : "💭"}
            </span>
          </div>

          {checkinOptions.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white/[0.05] px-4 py-4 text-center">
              <p className="text-[12px] text-white/40">Tu psicóloga configurará las opciones pronto.</p>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {checkinOptions.map((option) => {
                  const active = selectedCheckin === option;
                  return (
                    <button
                      key={option}
                      onClick={() => onSelectCheckin(option)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition-all duration-150"
                      style={active ? {
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        color: "white",
                        transform: "scale(1.02)",
                      } : {
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.55)",
                      }}
                    >
                      <span className="text-base">{getEmoji(option)}</span>
                      <span className="truncate">{option}</span>
                    </button>
                  );
                })}
              </div>

              {checkinSent ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2.5">
                  <span className="text-sm">✓</span>
                  <p className="text-[12px] font-medium text-emerald-300">Check-in enviado a tu psicóloga.</p>
                </div>
              ) : checkinError ? (
                <div className="mt-3 rounded-xl bg-red-500/15 px-4 py-2.5">
                  <p className="text-[11px] font-medium text-red-300">Error: {checkinError}</p>
                  <button onClick={onSendCheckin} disabled={!selectedCheckin}
                    className="mt-2 w-full rounded-xl py-2 text-[12px] font-semibold text-[#1A2942] disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #ffffff, #e8eef5)" }}>
                    Reintentar
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSendCheckin}
                  disabled={!selectedCheckin}
                  className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold text-[#1A2942] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #ffffff, #e8eef5)", boxShadow: selectedCheckin ? "0 4px 12px rgba(0,0,0,0.2)" : "none" }}
                >
                  Enviar check-in
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
