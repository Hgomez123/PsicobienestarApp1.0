type PrimaryButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

export default function PrimaryButton({
  children,
  className = "",
  onClick,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full bg-[#6F98BE] px-5 py-3 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#1E5A85] hover:shadow-[0_12px_24px_rgba(30,90,133,0.20)] ${className}`}
    >
      {children}
    </button>
  );
}