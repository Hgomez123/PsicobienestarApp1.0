type SimpleModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export default function SimpleModal({
  open,
  title,
  children,
  onClose,
}: SimpleModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Portal del paciente</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}