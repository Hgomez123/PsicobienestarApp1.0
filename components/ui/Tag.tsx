type TagProps = {
  children: React.ReactNode;
};

export default function Tag({ children }: TagProps) {
  return (
    <span className="inline-flex rounded-full bg-[#EEF4F8] px-3 py-1 text-xs font-medium text-[#4A7DA8]">
      {children}
    </span>
  );
}