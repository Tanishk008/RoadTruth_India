import { describe, expect, it } from "vitest"
import { getExpressway } from "@/data/expressways"
import { getTariff, tolls } from "@/data/tolls"
import { calculateToll, formatFare, stopChainage } from "@/lib/toll"

const samruddhi = { tariff: getTariff("mumbai-nagpur")!, expressway: getExpressway("mumbai-nagpur")! }

describe("toll data", () => {
  it("every tariff points to a real expressway and has a source", () => {
    for (const t of tolls) {
      expect(getExpressway(t.expresswayId), t.expresswayId).toBeDefined()
      expect(t.source.url).toMatch(/^https:\/\//)
      expect(t.vehicles.length).toBeGreaterThan(0)
      for (const v of t.vehicles) {
        const [lo, hi] = Array.isArray(v.fare) ? v.fare : [v.fare, v.fare]
        expect(lo).toBeGreaterThan(0)
        expect(hi).toBeGreaterThanOrEqual(lo)
      }
    }
  })

  it("per-km tariffs have a stop position for every stop, so partial trips are possible", () => {
    for (const t of tolls.filter((t) => t.kind === "per-km")) {
      expect(stopChainage(getExpressway(t.expresswayId)!), t.expresswayId).not.toBeNull()
    }
  })
})

describe("calculateToll", () => {
  it("matches the published full-length Samruddhi car toll (₹1,443–1,445)", () => {
    const r = calculateToll({ ...samruddhi, vehicleId: "car" })!
    expect(r.distanceKm).toBe(701)
    expect(r.distanceIsEstimate).toBe(false)
    expect(r.oneWay).toBe(1445)
  })

  it("estimates a partial trip between two stops", () => {
    const r = calculateToll({ ...samruddhi, vehicleId: "car", from: 0, to: 4 })! // Nagpur → Shirdi
    expect(r.distanceIsEstimate).toBe(true)
    // Nagpur–Shirdi is about 520 km by road; the straight-line estimate should land close.
    expect(r.distanceKm).toBeGreaterThan(470)
    expect(r.distanceKm).toBeLessThan(570)
    expect(r.oneWay as number % 5).toBe(0)
  })

  it("works in either direction", () => {
    const a = calculateToll({ ...samruddhi, vehicleId: "car", from: 1, to: 5 })!
    const b = calculateToll({ ...samruddhi, vehicleId: "car", from: 5, to: 1 })!
    expect(a.oneWay).toBe(b.oneWay)
  })

  it("returns nothing for the same entry and exit", () => {
    expect(calculateToll({ ...samruddhi, vehicleId: "car", from: 2, to: 2 })).toBeNull()
  })

  it("doubles for a return trip and again without FASTag", () => {
    const base = calculateToll({ ...samruddhi, vehicleId: "car" })!.oneWay as number
    expect(calculateToll({ ...samruddhi, vehicleId: "car", returnTrip: true })!.total).toBe(base * 2)
    expect(calculateToll({ ...samruddhi, vehicleId: "car", returnTrip: true, withoutFastag: true })!.total).toBe(base * 4)
  })

  it("keeps ranges as ranges for full-trip estimates", () => {
    const r = calculateToll({ tariff: getTariff("delhi-mumbai")!, expressway: getExpressway("delhi-mumbai")!, vehicleId: "car", returnTrip: true })!
    expect(r.oneWay).toEqual([2700, 3400])
    expect(r.total).toEqual([5400, 6800])
  })

  it("rejects unknown vehicle classes", () => {
    expect(calculateToll({ ...samruddhi, vehicleId: "tractor" })).toBeNull()
  })
})

describe("formatFare", () => {
  it("formats single fares and ranges in Indian style", () => {
    expect(formatFare(1445)).toBe("₹1,445")
    expect(formatFare([2700, 3400])).toBe("₹2,700–3,400")
    expect(formatFare([250, 250])).toBe("₹250")
  })
})
