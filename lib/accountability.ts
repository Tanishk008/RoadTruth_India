import type { CorridorStats, Expressway, Report } from "@/lib/types"

const DAY = 86_400_000

/** Below this many reports, rates are too noisy to publish against a company's name. */
export const MIN_REPORTS_FOR_RATES = 5

export function daysBetween(fromIso: string, to: Date | string = new Date()): number {
  return Math.floor((new Date(to).getTime() - new Date(fromIso).getTime()) / DAY)
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Same figures as the corridor_report_stats() SQL function, for device-only mode and tests. */
export function computeCorridorStats(reports: Report[]): CorridorStats[] {
  const groups = new Map<string, Report[]>()
  for (const r of reports) if (!r.pending) groups.set(r.expresswayId, [...(groups.get(r.expresswayId) ?? []), r])
  return [...groups].map(([expresswayId, rs]) => {
    const fixDays = rs.filter((r) => r.resolvedAt).map((r) => (new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime()) / DAY)
    return {
      expresswayId,
      total: rs.length,
      open: rs.filter((r) => r.status !== "Resolved").length,
      resolved: rs.filter((r) => r.status === "Resolved").length,
      medianFixDays: median(fixDays),
      resolvedWithin30Days: fixDays.filter((d) => d <= 30).length,
    }
  })
}

export interface AccountabilitySummary {
  corridors: number
  lengthKm: number
  total: number
  open: number
  resolved: number
  /** Open reports per 100 km of corridor. */
  openPer100Km: number
  /** Median of the per-corridor medians (the exact pooled median would need every row). */
  medianFixDays: number | null
  /** Share of resolved reports fixed within 30 days, 0-1. */
  fixedWithin30DaysRate: number | null
  enoughData: boolean
}

/** Rolls corridor stats up for a contractor (or a single corridor). Corridors with no reports still count towards length. */
export function summarize(corridors: Pick<Expressway, "id" | "lengthKm">[], stats: CorridorStats[]): AccountabilitySummary {
  const byId = new Map(stats.map((s) => [s.expresswayId, s]))
  const rows = corridors.map((c) => byId.get(c.id)).filter((s): s is CorridorStats => Boolean(s))
  const sum = (k: "total" | "open" | "resolved" | "resolvedWithin30Days") => rows.reduce((n, s) => n + s[k], 0)
  const lengthKm = corridors.reduce((n, c) => n + c.lengthKm, 0)
  const total = sum("total")
  const resolved = sum("resolved")
  return {
    corridors: corridors.length,
    lengthKm,
    total,
    open: sum("open"),
    resolved,
    openPer100Km: lengthKm ? (sum("open") / lengthKm) * 100 : 0,
    medianFixDays: median(rows.map((s) => s.medianFixDays).filter((d): d is number => d !== null)),
    fixedWithin30DaysRate: resolved ? sum("resolvedWithin30Days") / resolved : null,
    enoughData: total >= MIN_REPORTS_FOR_RATES,
  }
}
