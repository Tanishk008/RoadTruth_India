import type { Report } from "@/lib/types"

export const day = (n: number, from = "2026-10-01T00:00:00.000Z") => new Date(new Date(from).getTime() + n * 86_400_000).toISOString()

export function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    reference: "RTR-2026-ABC123",
    issueType: "pothole",
    expresswayId: "delhi-mumbai",
    location: "Km 112 near Dausa exit, towards Jaipur",
    latitude: 26.8935,
    longitude: 76.3376,
    severity: "high",
    description: "Large pothole in the left lane, about one metre wide and deep enough to damage tyres.",
    photos: [],
    status: "Received",
    createdAt: day(0),
    voteCount: 0,
    ...overrides,
  }
}
