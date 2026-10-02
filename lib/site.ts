import type { TKey } from "@/lib/i18n/core"
import type { IssueType, Severity } from "@/lib/types"

export const site = {
  name: "Road Truth India",
  tagline: "Citizen transparency for India's expressways",
  description:
    "Independent, sourced information on India's expressways and their contractors, plus a citizen road-issue reporting tool with AI pothole detection.",
  creator: {
    name: "Tanishk Gupta",
    role: "Creator & developer",
    email: "tanishkgupta8000@gmail.com",
    linkedin: "https://www.linkedin.com/in/tanishk-gupta-5b7536287/",
  },
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "tanishkgupta8000@gmail.com",
  /** Official channels for issues that need an authority to act. */
  officialChannels: [
    { label: "NHAI helpline", value: "1033", href: "tel:1033", note: "National highways & expressways, 24×7" },
    { label: "Emergency", value: "112", href: "tel:112", note: "Accidents and immediate danger" },
    { label: "NHAI website", value: "nhai.gov.in", href: "https://nhai.gov.in", note: "Official National Highways Authority of India portal" },
  ],
}

export const navItems: { label: string; key: TKey; href: string }[] = [
  { label: "Expressways", key: "nav.expressways", href: "/expressways" },
  { label: "Map", key: "nav.map", href: "/map" },
  { label: "Tolls", key: "nav.tolls", href: "/toll-calculator" },
  { label: "Contractors", key: "nav.contractors", href: "/contractors" },
  { label: "Pothole Detector", key: "nav.detector", href: "/pothole-detector" },
  { label: "Report Issue", key: "nav.report", href: "/report-issue" },
  { label: "Track", key: "nav.track", href: "/track" },
  { label: "About", key: "nav.about", href: "/about" },
]

export const issueTypeLabels: Record<IssueType, string> = {
  pothole: "Pothole",
  "road-damage": "Road surface damage / cracks",
  waterlogging: "Waterlogging",
  debris: "Debris / obstruction",
  signage: "Missing or damaged signage",
  barrier: "Damaged crash barrier / fencing",
  lighting: "Street lighting not working",
  toll: "Toll plaza issue",
  "construction-delay": "Construction delay / quality",
  other: "Other",
}

export const severityLabels: Record<Severity, string> = {
  low: "Low – minor",
  medium: "Medium – needs attention",
  high: "High – risk to vehicles",
  critical: "Critical – immediate danger",
}

export const severityStyles: Record<Severity | "none", string> = {
  none: "bg-emerald-100 text-emerald-800",
  low: "bg-sky-100 text-sky-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}
