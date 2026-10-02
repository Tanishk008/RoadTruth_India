import { describe, expect, it } from "vitest"
import { contractors, getContractor } from "@/data/contractors"
import { expressways, getExpressway, googleMapsDirectionsUrl, googleMapsEmbedUrl } from "@/data/expressways"

describe("expressway data", () => {
  it("has unique ids", () => {
    expect(new Set(expressways.map((e) => e.id)).size).toBe(expressways.length)
  })

  it.each(expressways.map((e) => [e.name, e] as const))("%s is internally consistent", (_, e) => {
    expect(e.lengthKm).toBeGreaterThan(0)
    if (e.costCrore !== undefined) expect(e.costCrore).toBeGreaterThan(0)
    expect(e.states.length).toBeGreaterThan(0)
    expect(e.sources.length).toBeGreaterThan(0)
    for (const s of e.sources) expect(s.url).toMatch(/^https:\/\//)
    expect(e.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    if (e.openedOn) expect(Number(e.openedOn.slice(0, 4))).toBe(e.openedYear)

    // Map data: at least start and end, every point inside India's bounding box.
    expect(e.mapStops.length).toBeGreaterThanOrEqual(2)
    expect(e.coords.length).toBeGreaterThanOrEqual(2)
    for (const [lng, lat] of e.coords) {
      expect(lng).toBeGreaterThan(68)
      expect(lng).toBeLessThan(98)
      expect(lat).toBeGreaterThan(6)
      expect(lat).toBeLessThan(37)
    }

    // Status and dates must agree: fully open roads have an opening year, others a target year.
    if (e.status === "Operational") {
      expect(e.openedYear).toBeDefined()
      expect(e.targetYear).toBeUndefined()
    } else {
      expect(e.openedYear).toBeUndefined()
      expect(e.targetYear).toBeDefined()
    }
  })

  it("every package contractorId points to a real contractor", () => {
    for (const e of expressways)
      for (const p of e.packages) if (p.contractorId) expect(getContractor(p.contractorId), `${e.id} → ${p.contractorId}`).toBeDefined()
  })
})

describe("google maps links", () => {
  it("builds a directions URL with origin, destination and waypoints", () => {
    const url = new URL(googleMapsDirectionsUrl(getExpressway("delhi-mumbai")!))
    expect(url.hostname).toBe("www.google.com")
    expect(url.searchParams.get("origin")).toBe("Sohna, Haryana")
    expect(url.searchParams.get("destination")).toBe("JNPT, Navi Mumbai")
    expect(url.searchParams.get("waypoints")?.split("|")).toHaveLength(6)
  })

  it("builds a two-stop route without waypoints", () => {
    const url = new URL(googleMapsDirectionsUrl(getExpressway("atal-setu")!))
    expect(url.searchParams.has("waypoints")).toBe(false)
  })

  it("builds a keyless embed URL chaining stops with +to:", () => {
    const url = googleMapsEmbedUrl(getExpressway("mumbai-pune")!)
    expect(url).toMatch(/^https:\/\/maps\.google\.com\/maps\?saddr=Kalamboli%2C%20Navi%20Mumbai&daddr=.*\+to:.*&output=embed$/)
  })
})

describe("contractor data", () => {
  it("has unique ids and no unsourced ratings", () => {
    expect(new Set(contractors.map((c) => c.id)).size).toBe(contractors.length)
    for (const c of contractors) expect(c).not.toHaveProperty("rating")
  })

  it("cross-references match in both directions", () => {
    for (const c of contractors) {
      for (const id of c.expresswayIds) {
        const e = getExpressway(id)
        expect(e, `${c.id} → ${id}`).toBeDefined()
        expect(e!.packages.some((p) => p.contractorId === c.id), `${id} should list ${c.id}`).toBe(true)
      }
    }
    for (const e of expressways)
      for (const p of e.packages)
        if (p.contractorId) expect(getContractor(p.contractorId)!.expresswayIds).toContain(e.id)
  })
})
