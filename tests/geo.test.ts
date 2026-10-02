import { describe, expect, it } from "vitest"
import { boundingBox, distanceMeters, nearby } from "@/lib/geo"

const delhi = { latitude: 28.6139, longitude: 77.209 }
const mumbai = { latitude: 19.076, longitude: 72.8777 }

describe("distanceMeters", () => {
  it("matches the known Delhi–Mumbai great-circle distance (~1,150 km)", () => {
    expect(distanceMeters(delhi, mumbai) / 1000).toBeCloseTo(1150, -1)
  })
  it("is zero for the same point", () => {
    expect(distanceMeters(delhi, delhi)).toBe(0)
  })
})

describe("nearby", () => {
  // ~111 m per 0.001° of latitude
  const items = [
    { id: "far", latitude: 28.62, longitude: 77.209 },
    { id: "close", latitude: 28.6141, longitude: 77.209 },
    { id: "mid", latitude: 28.616, longitude: 77.209 },
    { id: "no-gps" },
  ]
  it("keeps items inside the radius, nearest first, with distances", () => {
    const result = nearby(items, delhi, 300)
    expect(result.map((r) => r.id)).toEqual(["close", "mid"])
    expect(result[0].distance).toBeLessThan(30)
  })
  it("bounding box contains every point within the radius", () => {
    const box = boundingBox(delhi, 300)
    for (const r of nearby(items, delhi, 300)) {
      expect(r.latitude).toBeGreaterThanOrEqual(box.minLat)
      expect(r.latitude).toBeLessThanOrEqual(box.maxLat)
      expect(r.longitude).toBeGreaterThanOrEqual(box.minLng)
      expect(r.longitude).toBeLessThanOrEqual(box.maxLng)
    }
  })
})
