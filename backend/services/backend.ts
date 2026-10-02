/**
 * Single integration point for persistence. Pages only import from this file.
 *
 * - With Supabase configured (see .env.example and supabase/migrations), reports, votes and stats are shared by everyone.
 *   Reports made without a connection wait in the offline outbox and are sent by syncOutbox().
 * - Without it, everything is stored in this browser so every flow still works end to end (device-only mode).
 */
import { computeCorridorStats } from "@/lib/accountability"
import { boundingBox, nearby } from "@/lib/geo"
import { listOutbox, outboxAvailable, putOutbox, removeOutbox, type OutboxEntry } from "@/lib/outbox"
import { createClient } from "@/backend/supabase/client"
import { AUTH_ENABLED } from "@/backend/supabase/config"
import type { ContactInput, CorridorStats, Report, ReportInput, ReportStatus } from "@/lib/types"

export const BACKEND_CONNECTED = AUTH_ENABLED

/** Fired on window whenever reports or votes change, so lists can refresh. */
export const REPORTS_CHANGED = "rti:reports-changed"

const REPORTS_KEY = "rti:reports" // device-only mode: every report
const MY_REFS_KEY = "rti:my-refs" // shared mode: references submitted from this device
const VOTES_KEY = "rti:votes" // device-only mode: references this device voted for
const MESSAGES_KEY = "rti:messages"
const DRAFT_KEY = "rti:report-draft"

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function changed() {
  window.dispatchEvent(new Event(REPORTS_CHANGED))
}

export function generateReference(date = new Date()): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const code = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6).toUpperCase()
  return `RTR-${date.getFullYear()}-${code}`
}

function toPublic(input: ReportInput, extra: Pick<Report, "reference" | "createdAt"> & Partial<Report>): Report {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip contact details
  const { name, email, phone, ...rest } = input
  return { status: "Received", voteCount: 0, ...rest, ...extra }
}

// ---------------------------------------------------------------------------------------------
// Supabase rows

interface ReportRow {
  id: string
  reference: string
  issue_type: Report["issueType"]
  expressway_id: string
  location: string
  latitude: number | null
  longitude: number | null
  severity: Report["severity"]
  description: string
  photos: string[]
  detection: Report["detection"] | null
  status: ReportStatus
  vote_count: number
  captured_at: string | null
  created_at: string
  status_updated_at: string
  resolved_at: string | null
}

const COLUMNS =
  "id, reference, issue_type, expressway_id, location, latitude, longitude, severity, description, photos, detection, status, vote_count, captured_at, created_at, status_updated_at, resolved_at"

const ids = new Map<string, string>() // reference → row id, needed for votes

function fromRow(r: ReportRow): Report {
  ids.set(r.reference, r.id)
  return {
    reference: r.reference,
    issueType: r.issue_type,
    expresswayId: r.expressway_id,
    location: r.location,
    latitude: r.latitude ?? undefined,
    longitude: r.longitude ?? undefined,
    severity: r.severity,
    description: r.description,
    photos: r.photos,
    detection: r.detection ?? undefined,
    status: r.status,
    voteCount: r.vote_count,
    capturedAt: r.captured_at ?? undefined,
    createdAt: r.created_at,
    statusUpdatedAt: r.status_updated_at,
    resolvedAt: r.resolved_at ?? undefined,
  }
}

function db() {
  const client = createClient()
  if (!client) throw new Error("Supabase is not configured")
  return client
}

/** True for failures that mean "no connection", as opposed to the server rejecting the report. */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : ""
  return /fetch|network|load failed|timed? ?out/i.test(message)
}

async function dataUrlToBlob(url: string) {
  return (await fetch(url)).blob()
}

/** Uploads photos and stores the report. Idempotent: retrying with the same reference never duplicates. */
async function upload(entry: OutboxEntry): Promise<Report> {
  const supabase = db()
  const photos = await Promise.all(
    entry.input.photos.map(async (src, i) => {
      if (!src.startsWith("data:")) return src
      const path = `${entry.reference}/${i + 1}.jpg`
      const { error } = await supabase.storage.from("report-photos").upload(path, await dataUrlToBlob(src), { contentType: "image/jpeg" })
      // A previous attempt may already have uploaded it.
      if (error && !/exists|duplicate/i.test(error.message)) throw error
      return supabase.storage.from("report-photos").getPublicUrl(path).data.publicUrl
    }),
  )
  const { data, error } = await supabase.rpc("submit_report", {
    payload: { ...entry.input, photos, reference: entry.reference, capturedAt: entry.capturedAt },
  })
  if (error) throw error
  return fromRow(data as ReportRow)
}

function rememberMine(reference: string) {
  write(MY_REFS_KEY, [reference, ...read<string[]>(MY_REFS_KEY, []).filter((r) => r !== reference)])
}

// ---------------------------------------------------------------------------------------------
// Reports

export interface SubmitResult {
  report: Report
  /** Saved in the outbox because there's no connection; it will be sent automatically. */
  queued: boolean
}

export async function submitReport(input: ReportInput): Promise<SubmitResult> {
  const now = new Date()
  const reference = generateReference(now)

  if (!BACKEND_CONNECTED) {
    const report = toPublic(input, { reference, createdAt: now.toISOString() })
    const local = { ...report, contact: { name: input.name, email: input.email, phone: input.phone } }
    const reports = read<Report[]>(REPORTS_KEY, [])
    try {
      write(REPORTS_KEY, [local, ...reports])
    } catch {
      // Storage full (photos are large): keep the report but drop its photos locally.
      write(REPORTS_KEY, [{ ...local, photos: [] }, ...reports])
    }
    changed()
    return { report, queued: false }
  }

  const entry: OutboxEntry = { reference, input, capturedAt: now.toISOString(), attempts: 0 }
  rememberMine(reference)
  try {
    const report = await upload(entry)
    changed()
    return { report, queued: false }
  } catch (error) {
    if (!isNetworkError(error) || !outboxAvailable()) throw error
    await putOutbox(entry)
    changed()
    return { report: toPublic(input, { reference, createdAt: entry.capturedAt, pending: true }), queued: true }
  }
}

let syncing: Promise<number> | null = null

/** Sends queued reports. Safe to call often; returns how many were sent. */
/** Queued reports the server rejected this many times stop retrying and are shown to the user instead. */
export const MAX_SEND_ATTEMPTS = 3

export function syncOutbox(): Promise<number> {
  if (!BACKEND_CONNECTED || !outboxAvailable() || navigator.onLine === false) return Promise.resolve(0)
  syncing ??= (async () => {
    let sent = 0
    let failed = 0
    for (const entry of await listOutbox()) {
      if (entry.attempts >= MAX_SEND_ATTEMPTS) continue
      try {
        await upload(entry)
        await removeOutbox(entry.reference)
        sent++
      } catch (error) {
        if (isNetworkError(error)) break // still offline; try again later
        await putOutbox({ ...entry, attempts: entry.attempts + 1, lastError: error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error) })
        failed++
      }
    }
    if (sent || failed) changed()
    return sent
  })().finally(() => {
    syncing = null
  })
  return syncing
}

async function pendingReports(): Promise<Report[]> {
  return (await listOutbox()).map((e) =>
    toPublic(e.input, {
      reference: e.reference,
      createdAt: e.capturedAt,
      pending: true,
      sendError: e.attempts >= MAX_SEND_ATTEMPTS ? e.lastError ?? "Rejected by the server" : undefined,
    }),
  )
}

/** Retry a queued report that the server rejected (e.g. after a fix on our side). */
export async function retryQueued(reference: string) {
  const entry = (await listOutbox()).find((e) => e.reference === reference)
  if (entry) await putOutbox({ ...entry, attempts: 0, lastError: undefined })
  changed()
  return syncOutbox()
}

/** Drop a queued report from this device. */
export async function discardQueued(reference: string) {
  await removeOutbox(reference)
  write(MY_REFS_KEY, read<string[]>(MY_REFS_KEY, []).filter((r) => r !== reference))
  changed()
}

export async function getReport(reference: string): Promise<Report | null> {
  const ref = reference.trim().toUpperCase()
  if (!BACKEND_CONNECTED) return localReports().find((r) => r.reference === ref) ?? null
  const pending = (await pendingReports()).find((r) => r.reference === ref)
  if (pending) return pending
  const { data } = await db().from("reports").select(COLUMNS).eq("reference", ref).maybeSingle()
  return data ? fromRow(data as ReportRow) : null
}

function localReports(): Report[] {
  return read<(Report & { contact?: unknown })[]>(REPORTS_KEY, []).map(({ contact, ...r }) => {
    void contact
    return { ...r, voteCount: r.voteCount ?? 0 }
  })
}

/** Reports from this device, plus (when signed in) every report on the citizen's account. Queued ones first. */
export async function listMyReports(): Promise<Report[]> {
  if (!BACKEND_CONNECTED) return localReports()
  const supabase = db()
  const refs = read<string[]>(MY_REFS_KEY, [])
  const [pending, byRef, mine] = await Promise.all([
    pendingReports(),
    refs.length ? supabase.from("reports").select(COLUMNS).in("reference", refs.slice(0, 200)) : Promise.resolve({ data: [] }),
    supabase.auth.getSession().then(async ({ data }): Promise<{ data: unknown }> => (data.session ? await supabase.rpc("my_reports") : { data: [] })),
  ])
  const seen = new Set(pending.map((r) => r.reference))
  const sent = [...((byRef.data ?? []) as ReportRow[]), ...((mine.data ?? []) as ReportRow[])]
    .map(fromRow)
    .filter((r) => !seen.has(r.reference) && seen.add(r.reference))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return [...pending, ...sent]
}

/** Everything for the public issues map: all open reports plus those resolved in the last 90 days. */
export async function listPublicReports(): Promise<Report[]> {
  if (!BACKEND_CONNECTED) return localReports()
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const { data, error } = await db()
    .from("reports")
    .select(COLUMNS)
    .or(`status.neq.Resolved,resolved_at.gte."${since}"`)
    .order("created_at", { ascending: false })
    .limit(2000)
  if (error) throw error
  return (data as ReportRow[]).map(fromRow)
}

export const DUPLICATE_RADIUS_M = 300

/** Unresolved reports within `radius` metres, nearest first: likely the same problem. */
export async function findNearbyReports(point: { latitude: number; longitude: number }, radius = DUPLICATE_RADIUS_M) {
  let candidates: Report[]
  if (!BACKEND_CONNECTED) {
    candidates = localReports()
  } else {
    const box = boundingBox(point, radius)
    const { data } = await db()
      .from("reports")
      .select(COLUMNS)
      .neq("status", "Resolved")
      .gte("latitude", box.minLat)
      .lte("latitude", box.maxLat)
      .gte("longitude", box.minLng)
      .lte("longitude", box.maxLng)
      .limit(50)
    candidates = ((data ?? []) as ReportRow[]).map(fromRow)
  }
  return nearby(
    candidates.filter((r) => r.status !== "Resolved"),
    point,
    radius,
  )
}

// ---------------------------------------------------------------------------------------------
// "Me too" votes

export type VoteResult = { ok: true; voted: boolean; voteCount: number } | { ok: false; reason: "sign-in" | "error" }

/** References (from the given list) the current citizen has voted for. */
export async function myVotes(references: string[]): Promise<Set<string>> {
  if (!BACKEND_CONNECTED) return new Set(read<string[]>(VOTES_KEY, []).filter((r) => references.includes(r)))
  const supabase = db()
  const { data: session } = await supabase.auth.getSession()
  const rowIds = references.map((r) => ids.get(r)).filter(Boolean) as string[]
  if (!session.session || rowIds.length === 0) return new Set()
  const { data } = await supabase.from("report_votes").select("report_id").in("report_id", rowIds)
  const voted = new Set((data ?? []).map((v) => v.report_id as string))
  return new Set(references.filter((r) => voted.has(ids.get(r) ?? "")))
}

export async function toggleVote(report: Report, vote: boolean): Promise<VoteResult> {
  if (!BACKEND_CONNECTED) {
    const votes = new Set(read<string[]>(VOTES_KEY, []))
    if (vote) votes.add(report.reference)
    else votes.delete(report.reference)
    write(VOTES_KEY, [...votes])
    const all = read<Report[]>(REPORTS_KEY, [])
    let voteCount = report.voteCount
    write(
      REPORTS_KEY,
      all.map((r) => {
        if (r.reference !== report.reference) return r
        voteCount = Math.max(0, (r.voteCount ?? 0) + (vote ? 1 : -1))
        return { ...r, voteCount }
      }),
    )
    changed()
    return { ok: true, voted: vote, voteCount }
  }

  const supabase = db()
  const { data: session } = await supabase.auth.getSession()
  if (!session.session) return { ok: false, reason: "sign-in" }
  const reportId = ids.get(report.reference)
  if (!reportId) return { ok: false, reason: "error" }
  const { error } = vote
    ? await supabase.from("report_votes").insert({ report_id: reportId })
    : await supabase.from("report_votes").delete().eq("report_id", reportId).eq("user_id", session.session.user.id)
  // 23505: already voted (e.g. from another tab), which is the state we wanted.
  if (error && error.code !== "23505") return { ok: false, reason: "error" }
  const { data } = await supabase.from("reports").select("vote_count").eq("id", reportId).single()
  changed()
  return { ok: true, voted: vote, voteCount: (data?.vote_count as number | undefined) ?? report.voteCount }
}

// ---------------------------------------------------------------------------------------------
// Accountability

export async function getCorridorStats(expresswayIds: string[]): Promise<CorridorStats[]> {
  if (!BACKEND_CONNECTED) return computeCorridorStats(localReports()).filter((s) => expresswayIds.includes(s.expresswayId))
  const { data, error } = await db().rpc("corridor_report_stats", { expressway_ids: expresswayIds })
  if (error) throw error
  return (data as { expressway_id: string; total: number; open: number; resolved: number; median_fix_days: number | null; resolved_within_30_days: number }[]).map(
    (r) => ({
      expresswayId: r.expressway_id,
      total: Number(r.total),
      open: Number(r.open),
      resolved: Number(r.resolved),
      medianFixDays: r.median_fix_days,
      resolvedWithin30Days: Number(r.resolved_within_30_days),
    }),
  )
}

// ---------------------------------------------------------------------------------------------
// Contact and drafts

/** Stored in Supabase (staff read it in the dashboard); in device-only mode, kept in this browser. */
export async function sendContactMessage(input: ContactInput): Promise<{ id: string }> {
  const id = generateReference().replace("RTR", "MSG")
  if (BACKEND_CONNECTED) {
    // No .select(): the public can write messages but never read them back.
    const { error } = await db().from("contact_messages").insert({ id, ...input })
    if (error) throw error
    return { id }
  }
  write(MESSAGES_KEY, [{ ...input, id, createdAt: new Date().toISOString() }, ...read<unknown[]>(MESSAGES_KEY, [])])
  return { id }
}

export function saveDraft(draft: object) {
  try {
    write(DRAFT_KEY, draft)
  } catch {
    write(DRAFT_KEY, { ...draft, photos: [] })
  }
}

export function loadDraft(): Partial<ReportInput> | null {
  return read<Partial<ReportInput> | null>(DRAFT_KEY, null)
}

export function clearDraft() {
  window.localStorage.removeItem(DRAFT_KEY)
}
