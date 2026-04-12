import Card from "@/components/ui/Card";
import SecondaryButton from "@/components/ui/SecondaryButton";
import type { UserData } from "@/types/portal";

type PortalSettingsSectionProps = {
  user: UserData | null;
  onOpenLogoutModal: () => void;
};

export default function PortalSettingsSection({
  user,
  onOpenLogoutModal,
}: PortalSettingsSectionProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Card>
        <div className="p-6">
          <p className="text-sm text-slate-500">Cuenta</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Información general
          </h2>

          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-slate-500">Nombre</p>
              <p className="mt-1 font-medium">{user?.name}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-slate-500">Correo</p>
              <p className="mt-1 font-medium">{user?.email}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <p className="text-sm text-slate-500">Seguridad</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Sesión
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Puedes cerrar sesión desde aquí o desde el encabezado superior.
          </p>

          <div className="mt-6">
            <SecondaryButton onClick={onOpenLogoutModal}>
              Cerrar sesión
            </SecondaryButton>
          </div>
        </div>
      </Card>
    </section>
  );
}