export function FileBadge({ kind, small }: { kind: string; small?: boolean }) {
  const map: Record<string, [string, string]> = {
    docx: ["W", "bg-[#2b579a] text-white"],
    pdf: ["PDF", "bg-[#b3261e] text-white"],
    answer_key: ["KEY", "bg-teal text-white"],
  };
  const [t, c] = map[kind] ?? ["FILE", "bg-ink text-white"];
  const size = small ? "h-8 w-8 text-[10px] rounded-lg" : "h-11 w-11 text-xs rounded-xl";
  return <span className={`grid shrink-0 place-items-center font-bold ${size} ${c}`}>{t}</span>;
}
