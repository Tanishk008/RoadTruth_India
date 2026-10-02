import type { Fare, TollTariff } from "@/data/tolls"
import type { Expressway } from "@/lib/types"

/** Great-circle distance in km. */
function haversine([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
  const rad = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

/**
 * Approximate km marker of each stop along the corridor: straight-line distances between stops,
 * scaled so the total matches the official length. Only available when every stop has a coordinate.
 */
export function stopChainage(e: Expressway): number[] | null {
  if (e.coords.length !== e.mapStops.length) return null
  const legs = e.coords.slice(1).map((c, i) => haversine(e.coords[i], c))
  const total = legs.reduce((s, d) => s + d, 0)
  if (total === 0) return null
  const scale = e.lengthKm / total
  return legs.reduce<number[]>((acc, d) => [...acc, acc[acc.length - 1] + d * scale], [0])
}

const roundTo5 = (n: number) => Math.round(n / 5) * 5
const mapFare = (f: Fare, fn: (n: number) => number): Fare => (Array.isArray(f) ? [fn(f[0]), fn(f[1])] : fn(f))

export interface TollQuery {
  tariff: TollTariff
  expressway: Expressway
  vehicleId: string
  /** Stop indexes for per-km tariffs; ignored for full-trip tariffs. */
  from?: number
  to?: number
  returnTrip?: boolean
  withoutFastag?: boolean
}

export interface TollResult {
  distanceKm: number
  /** True when the distance is estimated from stop positions rather than the official full length. */
  distanceIsEstimate: boolean
  oneWay: Fare
  total: Fare
  /** ₹ per km of the one-way fare, for comparisons. */
  perKm: Fare
}

export function calculateToll(q: TollQuery): TollResult | null {
  const vehicle = q.tariff.vehicles.find((v) => v.id === q.vehicleId)
  if (!vehicle) return null

  let distanceKm = q.expressway.lengthKm
  let distanceIsEstimate = false
  let oneWay: Fare

  if (q.tariff.kind === "per-km") {
    const chain = stopChainage(q.expressway)
    const lastStop = q.expressway.mapStops.length - 1
    const from = q.from ?? 0
    const to = q.to ?? lastStop
    if (chain && from !== to) {
      distanceKm = Math.abs(chain[to] - chain[from])
      distanceIsEstimate = !(Math.min(from, to) === 0 && Math.max(from, to) === lastStop)
    } else if (from === to) {
      return null
    }
    oneWay = mapFare(vehicle.fare, (rate) => roundTo5(rate * distanceKm))
  } else {
    oneWay = vehicle.fare
  }

  const multiplier = (q.returnTrip ? 2 : 1) * (q.withoutFastag ? 2 : 1)
  return {
    distanceKm: Math.round(distanceKm),
    distanceIsEstimate,
    oneWay,
    total: mapFare(oneWay, (n) => n * multiplier),
    perKm: mapFare(oneWay, (n) => Math.round((n / distanceKm) * 100) / 100),
  }
}

export function formatFare(f: Fare): string {
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`
  return Array.isArray(f) ? (f[0] === f[1] ? inr(f[0]) : `${inr(f[0])}–${f[1].toLocaleString("en-IN")}`) : inr(f)
}
