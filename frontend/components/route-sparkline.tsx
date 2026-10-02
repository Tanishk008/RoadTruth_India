import { fitProjection, smoothPath } from "@/lib/geo"
import { cn } from "@/lib/utils"
import type { Expressway } from "@/lib/types"

/** The corridor's own shape, drawn small: start dot, end dot, route line. */
export function RouteSparkline({ expressway, className }: { expressway: Expressway; className?: string }) {
  const { project, width, height } = fitProjection(expressway.coords, 120, 8, 60)
  const pts = expressway.coords.map(project)
  const [sx, sy] = pts[0]
  const [ex, ey] = pts[pts.length - 1]
  const operational = expressway.status === "Operational"
  const underConstruction = expressway.status === "Under Construction"
  // Short, wide corridors become very flat; keep a minimum height so the line stays visible.
  const h = Math.max(height, 36)
  const offset = (h - height) / 2

  return (
    <svg viewBox={`0 0 ${width} ${h}`} className={cn("h-12 w-auto", className)} aria-hidden>
      <g transform={`translate(0 ${offset})`}>
        <path
          d={smoothPath(pts)}
          fill="none"
          stroke={operational ? "var(--primary)" : underConstruction ? "currentColor" : "var(--signal)"}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={operational ? undefined : underConstruction ? "1.5 5" : "5 4"}
          strokeOpacity={underConstruction ? 0.55 : 1}
          className="transition-[stroke-width] duration-200 group-hover:[stroke-width:4]"
        />
        <circle cx={sx} cy={sy} r={3.5} className="fill-card stroke-foreground" strokeWidth={1.5} />
        <circle cx={ex} cy={ey} r={3.5} className="fill-foreground" />
      </g>
    </svg>
  )
}
