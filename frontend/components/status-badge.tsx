import { cn } from "@/lib/utils"
import type { ExpresswayStatus } from "@/lib/types"

const styles: Record<ExpresswayStatus, { className: string; dot: string; label: string }> = {
  Operational: { className: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "Operational" },
  "Partially Operational": { className: "bg-amber-50 text-amber-900 border-amber-200", dot: "bg-amber-500 animate-pulse", label: "Partially open" },
  "Under Construction": { className: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", label: "Under construction" },
}

export function StatusBadge({ status, className }: { status: ExpresswayStatus; className?: string }) {
  const s = styles[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold", s.className, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}
