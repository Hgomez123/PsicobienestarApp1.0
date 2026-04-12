import type { UserData } from "@/types/portal";

type PortalWelcomeCardProps = {
  user: UserData | null;
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function PortalWelcomeCard({ user }: PortalWelcomeCardProps) {
  return (
    <div className="lg:hidden mx-4 mt-4 sm:mx-5">
      <div className="relative overflow-hidden rounded-2xl px-5 py-4"
        style={{ background: "linear-gradient(135deg, #1A2942 0%, #1E3A5F 100%)" }}>
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-30 blur-2xl"
          style={{ background: "#3B7EC8" }} />
        <div className="pointer-events-none absolute -bottom-4 left-10 h-20 w-20 rounded-full opacity-20 blur-xl"
          style={{ background: "#7C72B8" }} />

        <div className="relative flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #3B7EC8 0%, #7C72B8 100%)" }}>
            {user?.name ? getInitials(user.name) : "P"}
          </div>
          <div>
            <p className="text-[11px] text-white/50">{getGreeting()}</p>
            <p className="text-[15px] font-semibold text-white">{user?.name || "Paciente"}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #34d399" }} />
            <span className="text-[10px] font-medium text-white/60">Activa</span>
          </div>
        </div>

        <div className="relative mt-3.5 rounded-xl bg-white/[0.06] px-4 py-2.5">
          <p className="text-[11.5px] leading-5 text-white/50">
            Tu espacio de acompañamiento. Todo lo que compartes aquí es confidencial.
          </p>
        </div>
      </div>
    </div>
  );
}
