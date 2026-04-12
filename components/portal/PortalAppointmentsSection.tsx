import Card from "@/components/ui/Card";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

type AppointmentItem = {
  title: string;
  date: string;
  mode: string;
  status: string;
  isPending?: boolean;
};

type PortalAppointmentsSectionProps = {
  appointments: AppointmentItem[];
  onOpenSessionDetails: () => void;
  onOpenReschedule: () => void;
};

const STATUS_STYLE: Record<string, string> = {
  Confirmada:          "bg-green-50 text-green-700 border-green-200",
  Pendiente:           "bg-amber-50 text-amber-700 border-amber-200",
  "Solicitud enviada": "bg-[#EEF4F8] text-[#4A7DA8] border-[#DCEAF4]",
  Completada:          "bg-slate-100 text-slate-500 border-slate-200",
};

export default function PortalAppointmentsSection({
  appointments,
  onOpenSessionDetails,
  onOpenReschedule,
}: PortalAppointmentsSectionProps) {
  const visible = appointments.filter(a => a.status !== "Cancelada");

  return (
    <section className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Agendar o reagendar</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Gestiona tus próximas sesiones
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Puedes revisar detalles de tu cita, solicitar cambio o elegir
                una nueva fecha disponible.
              </p>
            </div>

            <div className="flex gap-3">
              <PrimaryButton onClick={onOpenSessionDetails}>
                Ver próxima cita
              </PrimaryButton>

              <SecondaryButton onClick={onOpenReschedule}>
                Agendar / cambiar
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Card>

      {visible.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <p className="text-2xl">📅</p>
            <p className="mt-3 text-sm text-slate-500">No tienes citas activas.</p>
            <button
              onClick={onOpenReschedule}
              className="mt-4 text-sm font-medium text-[#1E5A85] hover:underline"
            >
              Solicitar una cita →
            </button>
          </div>
        </Card>
      )}

      {visible.map((item, i) => (
        <Card key={i}>
          <div className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {item.status}
                  </span>
                  {item.isPending && (
                    <span className="text-xs text-slate-400">· Tu psicóloga la revisará pronto</span>
                  )}
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">
                  {item.date}
                </h2>
                {!item.isPending && (
                  <p className="mt-1 text-sm text-slate-500">{item.mode}</p>
                )}
              </div>

              {!item.isPending && (
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={onOpenSessionDetails}
                    className="rounded-full bg-[#6F98BE] px-4 py-2 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#1E5A85]"
                  >
                    Ver detalles
                  </button>
                  <button
                    onClick={onOpenReschedule}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    Solicitar cambio
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
