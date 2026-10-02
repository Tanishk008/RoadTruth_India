import type { Source } from "@/lib/types"

/** One fare: a single figure, or a [min, max] range when sources disagree or the fare is an estimate. */
export type Fare = number | [number, number]

export interface VehicleRate {
  id: string
  label: string
  /** ₹ per km for "per-km" tariffs; ₹ for the full one-way trip for "full-trip" tariffs. */
  fare: Fare
}

export interface TollTariff {
  expresswayId: string
  /** per-km: fare scales with distance between any two stops. full-trip: one fare for the whole corridor. */
  kind: "per-km" | "full-trip"
  vehicles: VehicleRate[]
  /** How much to trust the figures. */
  confidence: "official" | "reported" | "estimate"
  validFrom?: string
  validUntil?: string
  /** Shown under the result: scope limits, caveats. */
  note?: string
  source: Source
  lastVerified: string
}

export const tolls: TollTariff[] = [
  {
    expresswayId: "mumbai-nagpur",
    kind: "per-km",
    confidence: "official",
    vehicles: [
      { id: "car", label: "Car / jeep / van", fare: 2.06 },
      { id: "lcv", label: "Light commercial vehicle", fare: 3.32 },
      { id: "bus-truck", label: "Bus / two-axle truck", fare: 6.97 },
      { id: "multi-axle", label: "Multi-axle vehicle", fare: 13.3 },
    ],
    validFrom: "2025-04-01",
    validUntil: "2028-03-31",
    note: "Electric vehicles registered in Maharashtra are exempt under the state EV policy.",
    source: { label: "TollGuru – Maharashtra toll rates", url: "https://tollguru.com/maharashtra-toll-roads" },
    lastVerified: "2026-10-01",
  },
  {
    expresswayId: "yamuna",
    kind: "per-km",
    confidence: "reported",
    vehicles: [{ id: "car", label: "Car / jeep / van", fare: 2.95 }],
    validFrom: "2024-10-01",
    note: "Rate per km as approved by YEIDA in 2024; plaza-to-plaza fares can differ slightly.",
    source: { label: "BW Businessworld – YEIDA approves toll hike", url: "https://www.businessworld.in/article/yeida-approves-12-toll-hike-on-yamuna-expressway-534573" },
    lastVerified: "2026-10-01",
  },
  {
    expresswayId: "mumbai-pune",
    kind: "full-trip",
    confidence: "official",
    vehicles: [
      { id: "car", label: "Car / jeep", fare: 320 },
      { id: "mini-bus", label: "Mini bus / tempo", fare: 495 },
      { id: "two-axle-truck", label: "Two-axle truck", fare: 685 },
      { id: "bus", label: "Bus", fare: 940 },
      { id: "large-truck", label: "Three-axle / multi-axle truck", fare: [1630, 2165] },
    ],
    validFrom: "2023-04-01",
    note: "MSRDC has said rates stay unchanged until April 2030. Battery EVs registered in Maharashtra are exempt.",
    source: { label: "NoBroker – Mumbai–Pune Expressway tolls 2026", url: "https://www.nobroker.in/blog/mumbai-pune-expressway/" },
    lastVerified: "2026-10-01",
  },
  {
    expresswayId: "lucknow-kanpur",
    kind: "full-trip",
    confidence: "reported",
    vehicles: [{ id: "car", label: "Car / jeep / van", fare: 275 }],
    validFrom: "2026-07-14",
    note: "Two-wheelers are not permitted on this expressway.",
    source: { label: "Elets eGov – expressway opens (Jul 2026)", url: "https://egov.eletsonline.com/2026/07/lucknow-kanpur-expressway-opens-cuts-travel-time-to-40-minutes/" },
    lastVerified: "2026-10-01",
  },
  {
    expresswayId: "delhi-dehradun",
    kind: "full-trip",
    confidence: "reported",
    vehicles: [{ id: "car", label: "Car / jeep / van", fare: [670, 675] }],
    note: "Five toll plazas; trips that start and end within Delhi are toll-free.",
    source: { label: "Dhanbhumi – Delhi–Dehradun Expressway toll price", url: "https://www.dhanbhumi.com/blog-details/delhi-dehradun-expressway-new-travel-time-map-route-toll-price" },
    lastVerified: "2026-10-01",
  },
  {
    expresswayId: "atal-setu",
    kind: "full-trip",
    confidence: "reported",
    vehicles: [{ id: "car", label: "Car", fare: [200, 250] }],
    note: "₹250 at launch in January 2024; some sources now list ₹200. Check the current rate before you travel.",
    source: { label: "Wikipedia – Mumbai Trans Harbour Link", url: "https://en.wikipedia.org/wiki/Mumbai_Trans_Harbour_Link" },
    lastVerified: "2026-10-01",
  },
  {
    expresswayId: "bengaluru-chennai",
    kind: "full-trip",
    confidence: "reported",
    vehicles: [{ id: "car", label: "Car / jeep", fare: [185, 195] }],
    note: "Covers only the open Karnataka section (Hoskote–Bethamangala, 71 km), not the full corridor. Sources quote ₹185 or ₹195.",
    source: { label: "NoBroker – Chennai Bangalore Expressway tolls 2026", url: "https://www.nobroker.in/blog/chennai-bangalore-expressway/" },
    lastVerified: "2026-10-01",
  },
  {
    expresswayId: "delhi-mumbai",
    kind: "full-trip",
    confidence: "estimate",
    vehicles: [{ id: "car", label: "Car / jeep / van", fare: [2700, 3400] }],
    note: "Not an official end-to-end fare: an estimate from per-km rates for the full corridor once complete. Sections are still opening.",
    source: { label: "StayVista – Delhi–Mumbai Expressway tolls 2026", url: "https://www.stayvista.com/blog/delhi-mumbai-expressway-route-tolls-entry-exit-points-travel-time-2026/" },
    lastVerified: "2026-10-01",
  },
]

export function getTariff(expresswayId: string): TollTariff | undefined {
  return tolls.find((t) => t.expresswayId === expresswayId)
}
