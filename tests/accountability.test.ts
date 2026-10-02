import { describe, expect, it } from "vitest"
import { computeCorridorStats, daysBetween, MIN_REPORTS_FOR_RATES, summarize } from "@/lib/accountability"
import { ageBucket } from "@/lib/report-age"
import { day, makeReport } from "./fixtures"

const resolved = (ref: string, fixDays: number, expresswayId = "a") =>
  makeReport({ reference: ref, expresswayId, status: "Resolved", createdAt: day(0), resolvedAt: day(fixDays) })
const open = (ref: string, expresswayId = "a") => makeReport({ reference: ref, expresswayId })

describe("computeCorridorStats", () => {
  it("counts open/resolved and the median fix time per corridor, ignoring queued reports", () => {
    const stats = computeCorridorStats([resolved("1", 10), resolved("2", 40), resolved("3", 20), open("4"), open("5", "b"), makeReport({ pending: true })])
    const a = stats.find((s) => s.expresswayId === "a")!
    expect(a).toEqual({ expresswayId: "a", total: 4, open: 1, resolved: 3, medianFixDays: 20, resolvedWithin30Days: 2 })
    expect(stats.find((s) => s.expresswayId === "b")!.medianFixDays).toBeNull()
  })
})

describe("summarize", () => {
  const corridors = [
    { id: "a", lengthKm: 400 },
    { id: "b", lengthKm: 100 },
  ]
  it("normalises open reports per 100 km over every corridor, including ones without reports", () => {
    const stats = computeCorridorStats([open("1"), open("2"), open("3"), open("4", "b"), resolved("5", 10)])
    const s = summarize(corridors, stats)
    expect(s.lengthKm).toBe(500)
    expect(s.open).toBe(4)
    expect(s.openPer100Km).toBeCloseTo(0.8)
    expect(s.fixedWithin30DaysRate).toBe(1)
    expect(s.enoughData).toBe(true)
  })
  it(`withholds rates below ${MIN_REPORTS_FOR_RATES} reports`, () => {
    expect(summarize(corridors, computeCorridorStats([open("1")])).enoughData).toBe(false)
  })
})

describe("ageBucket", () => {
  const now = new Date(day(0))
  it.each([
    [-3, "Received", "new"],
    [-10, "Received", "weeks"],
    [-30, "Forwarded", "overdue"],
    [-90, "Resolved", "resolved"],
  ] as const)("%i days, %s → %s", (offset, status, bucket) => {
    expect(ageBucket(makeReport({ createdAt: day(offset), status }), now)).toBe(bucket)
  })
  it("daysBetween floors partial days", () => {
    expect(daysBetween(day(0), day(1.9))).toBe(1)
  })
})
