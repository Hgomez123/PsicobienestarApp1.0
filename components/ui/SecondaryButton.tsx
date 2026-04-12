type SecondaryButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function SecondaryButton({
  children,
  className = "",
  onClick,
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-50 ${className}`}
    >
      {children}
    </button>
  );
}