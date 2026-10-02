export type ExpresswayStatus = "Operational" | "Partially Operational" | "Under Construction"

export interface Source {
  label: string
  url: string
}

export interface ConstructionPackage {
  /** Contractor id from lib/data/contractors.ts, or null when the builder is not in our directory. */
  contractorId: string | null
  contractorName: string
  scope: string
}

export type CorridorKind = "Expressway" | "Ring road" | "Sea link" | "Urban expressway"

export interface Expressway {
  id: string
  name: string
  aka?: string
  kind: CorridorKind
  route: string
  states: string[]
  lengthKm: number
  lanes: string
  status: ExpresswayStatus
  /** Human-readable, as reported by the authority. */
  cost: string
  /** Approximate cost in ₹ crore, used for totals. Omitted when no reliable figure exists. */
  costCrore?: number
  authority: string
  /** Year fully opened, or target year for incomplete projects. */
  openedYear?: number
  /** Exact date the full road opened (ISO), when reliably reported. */
  openedOn?: string
  targetYear?: number
  /** Only set when an official or widely reported figure exists. */
  openLengthKm?: number
  summary: string
  facts: string[]
  /** Google-searchable stops from start to end, used for the route map and directions link. */
  mapStops: string[]
  /** Approximate [longitude, latitude] of each stop, for the schematic network map. */
  coords: [number, number][]
  packages: ConstructionPackage[]
  sources: Source[]
  lastVerified: string
}

export interface Contractor {
  id: string
  name: string
  founded: number
  headquarters: string
  listing: string
  website: string
  /** FY2024-25 consolidated revenue from operations. */
  revenueFY25?: string
  description: string
  /** Expressway work, cross-referenced against lib/data/expressways.ts. */
  expresswayIds: string[]
  sources: Source[]
  lastVerified: string
}

export type IssueType =
  | "pothole"
  | "road-damage"
  | "waterlogging"
  | "debris"
  | "signage"
  | "barrier"
  | "lighting"
  | "toll"
  | "construction-delay"
  | "other"

export type Severity = "low" | "medium" | "high" | "critical"

export interface ReportInput {
  issueType: IssueType
  expresswayId: string
  location: string
  latitude?: number
  longitude?: number
  severity: Severity
  description: string
  name: string
  email: string
  phone: string
  /** Data URLs of compressed photos. */
  photos: string[]
  detection?: PotholeAnalysis
}

export type ReportStatus = "Received" | "Under Review" | "Forwarded" | "Resolved"

/** A report as anyone can see it. Contact details are never part of this shape. */
export interface Report extends Omit<ReportInput, "name" | "email" | "phone"> {
  reference: string
  status: ReportStatus
  /** When it reached the server (or, for device-only reports, when it was saved). The RTI clock starts here. */
  createdAt: string
  /** When the citizen captured it, if earlier (sent later from the offline outbox). */
  capturedAt?: string
  statusUpdatedAt?: string
  resolvedAt?: string
  voteCount: number
  /** Saved in this device's outbox, waiting for a connection. */
  pending?: boolean
  /** The server rejected a queued report; it won't be retried until the user acts. */
  sendError?: string
}

export interface CorridorStats {
  expresswayId: string
  total: number
  open: number
  resolved: number
  /** Median days from report to resolution, null until something is resolved. */
  medianFixDays: number | null
  resolvedWithin30Days: number
}

export interface ContactInput {
  name: string
  email: string
  category: string
  subject: string
  message: string
}

/** Box coordinates are fractions (0-1) of the image width/height. */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface PotholeDetection {
  box: Box
  confidence: number
  severity: Severity
}

export interface PotholeAnalysis {
  method: "ai" | "on-device"
  isRoad: boolean
  potholes: PotholeDetection[]
  overallSeverity: Severity | "none"
  summary: string
  otherIssues: string[]
}
