import { daysBetween } from "@/lib/accountability"
import type { Report } from "@/lib/types"

export type AgeBucket = "new" | "weeks" | "overdue" | "resolved"

/** Open reports age from "new" (under a week) to "overdue" (30+ days, when an RTI can be drafted). */
export function ageBucket(report: Pick<Report, "createdAt" | "status">, now = new Date()): AgeBucket {
  if (report.status === "Resolved") return "resolved"
  const days = daysBetween(report.createdAt, now)
  return days < 7 ? "new" : days < 30 ? "weeks" : "overdue"
}
