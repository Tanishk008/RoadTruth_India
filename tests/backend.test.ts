import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReportInput } from "@/lib/types"

// Device-only mode (no Supabase): exercise the full submit → list → nearby → vote → stats loop.
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")

const store = new Map<string, string>()
const events: string[] = []
vi.stubGlobal("window", {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  dispatchEvent: (e: Event) => events.push(e.type),
})

const input: ReportInput = {
  issueType: "pothole",
  expresswayId: "delhi-mumbai",
  location: "Km 112 near Dausa",
  latitude: 26.8935,
  longitude: 76.3376,
  severity: "high",
  description: "Large pothole in the left lane, about one metre wide.",
  name: "Asha",
  email: "asha@example.com",
  phone: "",
  photos: [],
}

describe("backend (device-only mode)", () => {
  beforeEach(() => {
    store.clear()
    events.length = 0
  })

  it("submits, lists without contact details, finds duplicates, votes and computes stats", async () => {
    const b = await import("@/backend/services/backend")
    expect(b.BACKEND_CONNECTED).toBe(false)

    const { report, queued } = await b.submitReport(input)
    expect(queued).toBe(false)
    expect(report.reference).toMatch(/^RTR-\d{4}-[A-Z0-9]{6}$/)
    expect(report).not.toHaveProperty("email")
    expect(events).toContain(b.REPORTS_CHANGED)

    const [mine] = await b.listMyReports()
    expect(mine.reference).toBe(report.reference)
    expect(mine).not.toHaveProperty("contact")
    expect(await b.getReport(report.reference.toLowerCase())).toMatchObject({ reference: report.reference })

    // 50 m away: suggested as a duplicate; 2 km away: not.
    expect((await b.findNearbyReports({ latitude: 26.8939, longitude: 76.3376 })).map((r) => r.reference)).toEqual([report.reference])
    expect(await b.findNearbyReports({ latitude: 26.9115, longitude: 76.3376 })).toEqual([])

    expect(await b.toggleVote(report, true)).toEqual({ ok: true, voted: true, voteCount: 1 })
    expect((await b.myVotes([report.reference])).has(report.reference)).toBe(true)
    expect(await b.toggleVote({ ...report, voteCount: 1 }, false)).toEqual({ ok: true, voted: false, voteCount: 0 })

    const [stats] = await b.getCorridorStats(["delhi-mumbai"])
    expect(stats).toMatchObject({ expresswayId: "delhi-mumbai", total: 1, open: 1 })
  })
})
