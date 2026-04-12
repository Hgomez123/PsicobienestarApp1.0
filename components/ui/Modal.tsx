type ModalProps = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function Modal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)]">
        <p className="text-sm text-slate-500">Confirmación</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50"
          >
            No
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#6F98BE] px-5 py-3 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#1E5A85] hover:shadow-[0_12px_24px_rgba(30,90,133,0.20)]"
          >
            Sí, cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}