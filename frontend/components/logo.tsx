import { cn } from "@/lib/utils"

/** Highway-sign style mark: green plate, white border, lane line. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="7" fill="var(--primary)" />
      <rect x="3.5" y="3.5" width="33" height="33" rx="5" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M9 31 C 16 26, 22 16, 31 9" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M9 31 C 16 26, 22 16, 31 9" stroke="var(--signal)" strokeWidth="1.4" strokeDasharray="3 3" fill="none" />
    </svg>
  )
}
