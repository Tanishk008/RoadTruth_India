/**
 * Runs against a real Supabase stack: `npx supabase start`, then `npm run test:db`.
 * Skipped unless SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY and SUPABASE_TEST_SERVICE_KEY are set.
 * Exercises the migration's security model as anonymous and signed-in users.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { beforeAll, describe, expect, it } from "vitest"

const url = process.env.SUPABASE_TEST_URL ?? ""
const anonKey = process.env.SUPABASE_TEST_ANON_KEY ?? ""
const serviceKey = process.env.SUPABASE_TEST_SERVICE_KEY ?? ""
const enabled = Boolean(url && anonKey && serviceKey)

const client = (key = anonKey) => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const ref = () => `RTR-2026-${Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0")}`
const payload = (reference: string, extra: Record<string, unknown> = {}) => ({
  reference,
  issueType: "pothole",
  expresswayId: "delhi-mumbai",
  location: "Km 112 near Dausa exit",
  latitude: 26.89,
  longitude: 76.33,
  severity: "high",
  description: "Large pothole in the left lane, about one metre wide.",
  name: "Asha",
  email: "Asha@Example.com",
  phone: "+919876543210",
  photos: [],
  ...extra,
})

async function signedInUser(): Promise<{ db: SupabaseClient; id: string }> {
  const email = `citizen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  const { data, error } = await client(serviceKey).auth.admin.createUser({ email, password: "road2026x", email_confirm: true })
  if (error) throw error
  const db = client()
  const { error: signInError } = await db.auth.signInWithPassword({ email, password: "road2026x" })
  if (signInError) throw signInError
  return { db, id: data.user.id }
}

describe.skipIf(!enabled)("Supabase schema (integration)", () => {
  let anon: SupabaseClient
  let admin: SupabaseClient
  beforeAll(() => {
    anon = client()
    admin = client(serviceKey)
  })

  describe("reports", () => {
    it("anonymous submit stores the report, hides the author, and is idempotent", async () => {
      const reference = ref()
      const first = await anon.rpc("submit_report", { payload: payload(reference) })
      expect(first.error).toBeNull()
      expect(first.data).toMatchObject({ reference, status: "Received", vote_count: 0, user_id: null })
      const again = await anon.rpc("submit_report", { payload: payload(reference) })
      expect(again.data.id).toBe(first.data.id)
      const { count } = await admin.from("report_contacts").select("*", { count: "exact", head: true }).eq("report_id", first.data.id)
      expect(count).toBe(1)
      const { data: contact } = await admin.from("report_contacts").select("email").eq("report_id", first.data.id).single()
      expect(contact?.email).toBe("asha@example.com")
    })

    it("public can read reports but not user_id, contacts, or write directly", async () => {
      const reference = ref()
      await anon.rpc("submit_report", { payload: payload(reference) })
      expect((await anon.from("reports").select("reference, vote_count").eq("reference", reference).single()).data?.reference).toBe(reference)
      expect((await anon.from("reports").select("user_id").limit(1)).error).not.toBeNull()
      expect((await anon.from("report_contacts").select("*").limit(1)).error).not.toBeNull()
      expect((await anon.from("reports").insert({ reference: ref(), issue_type: "pothole" })).error).not.toBeNull()
      const update = await anon.from("reports").update({ status: "Resolved" }).eq("reference", reference).select()
      expect(update.error !== null || (update.data ?? []).length === 0).toBe(true)
      const { data } = await admin.from("reports").select("status").eq("reference", reference).single()
      expect(data?.status).toBe("Received")
    })

    it("rejects photos that aren't this report's own uploads, GPS outside India, and bad references", async () => {
      const reference = ref()
      const foreign = await anon.rpc("submit_report", { payload: payload(reference, { photos: ["https://evil.example/x.jpg"] }) })
      expect(foreign.error?.message).toMatch(/Invalid photo URL/)
      const own = `${url}/storage/v1/object/public/report-photos/${reference}/1.jpg`
      expect((await anon.rpc("submit_report", { payload: payload(reference, { photos: [own] }) })).error).toBeNull()
      expect((await anon.rpc("submit_report", { payload: payload(ref(), { latitude: 51.5, longitude: -0.1 }) })).error).not.toBeNull()
      expect((await anon.rpc("submit_report", { payload: payload("RTR-NOPE") })).error).not.toBeNull()
    })

    it("clamps device capture time to the last 30 days", async () => {
      const { data } = await anon.rpc("submit_report", { payload: payload(ref(), { capturedAt: "2020-01-01T00:00:00Z" }) })
      const ageDays = (Date.now() - new Date(data.captured_at).getTime()) / 86_400_000
      expect(ageDays).toBeGreaterThan(29.9)
      expect(ageDays).toBeLessThan(30.1)
    })

    it("signed-in reports appear in my_reports for their author only", async () => {
      const a = await signedInUser()
      const b = await signedInUser()
      const reference = ref()
      expect((await a.db.rpc("submit_report", { payload: payload(reference) })).error).toBeNull()
      expect(((await a.db.rpc("my_reports")).data as { reference: string }[]).map((r) => r.reference)).toContain(reference)
      expect(((await b.db.rpc("my_reports")).data as { reference: string }[]).map((r) => r.reference)).not.toContain(reference)
      expect((await anon.rpc("my_reports")).error).not.toBeNull()
    })
  })

  describe("votes", () => {
    it("one vote per citizen, kept in sync on reports.vote_count", async () => {
      const { data: report } = await anon.rpc("submit_report", { payload: payload(ref()) })
      const count = async () => (await anon.from("reports").select("vote_count").eq("id", report.id).single()).data?.vote_count
      expect((await anon.from("report_votes").insert({ report_id: report.id })).error).not.toBeNull()

      const a = await signedInUser()
      const b = await signedInUser()
      expect((await a.db.from("report_votes").insert({ report_id: report.id })).error).toBeNull()
      expect((await a.db.from("report_votes").insert({ report_id: report.id })).error?.code).toBe("23505")
      expect((await b.db.from("report_votes").insert({ report_id: report.id })).error).toBeNull()
      expect(await count()).toBe(2)
      // A can't remove B's vote, and can't vote on someone else's behalf.
      await a.db.from("report_votes").delete().eq("report_id", report.id).eq("user_id", b.id)
      expect(await count()).toBe(2)
      expect((await a.db.from("report_votes").insert({ report_id: report.id, user_id: b.id })).error).not.toBeNull()
      expect((await a.db.from("report_votes").select("user_id").eq("report_id", report.id)).data).toEqual([{ user_id: a.id }])
      await a.db.from("report_votes").delete().eq("report_id", report.id).eq("user_id", a.id)
      expect(await count()).toBe(1)
    })
  })

  describe("status and stats", () => {
    it("stamps resolution and reports median fix time per corridor", async () => {
      const corridor = `test-${Date.now()}`
      const ids: string[] = []
      for (let i = 0; i < 3; i++) {
        const { data } = await anon.rpc("submit_report", { payload: payload(ref(), { expresswayId: corridor }) })
        ids.push(data.id)
      }
      // Backdate creation so fix times are 10 and 40 days.
      await admin.from("reports").update({ created_at: new Date(Date.now() - 10 * 86_400_000).toISOString() }).eq("id", ids[0])
      await admin.from("reports").update({ created_at: new Date(Date.now() - 40 * 86_400_000).toISOString() }).eq("id", ids[1])
      await admin.from("reports").update({ status: "Resolved" }).in("id", [ids[0], ids[1]])
      const { data: resolved } = await admin.from("reports").select("resolved_at, status_updated_at").eq("id", ids[0]).single()
      expect(resolved?.resolved_at).toBeTruthy()

      const { data: stats, error } = await anon.rpc("corridor_report_stats", { expressway_ids: [corridor] })
      expect(error).toBeNull()
      expect(stats[0]).toMatchObject({ expressway_id: corridor, total: 3, open: 1, resolved: 2, resolved_within_30_days: 1 })
      expect(stats[0].median_fix_days).toBeCloseTo(25, 0)

      // Reopening clears resolved_at.
      await admin.from("reports").update({ status: "Forwarded" }).eq("id", ids[0])
      expect((await admin.from("reports").select("resolved_at").eq("id", ids[0]).single()).data?.resolved_at).toBeNull()
    })
  })

  describe("contact messages", () => {
    it("anyone can send, nobody can read back through the API", async () => {
      const id = `MSG-2026-${Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0")}`
      const msg = { id, name: "Asha", email: "asha@example.com", category: "feedback", subject: "Great site", message: "Thanks for building this, very useful." }
      expect((await anon.from("contact_messages").insert(msg)).error).toBeNull()
      const read = await anon.from("contact_messages").select("*").eq("id", id)
      expect(read.error !== null || (read.data ?? []).length === 0).toBe(true)
      expect((await admin.from("contact_messages").select("id").eq("id", id).single()).data?.id).toBe(id)
    })
  })

  describe("photo storage", () => {
    it("accepts JPEG uploads into a report folder only, publicly readable, no overwrites", async () => {
      const reference = ref()
      const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" })
      expect((await anon.storage.from("report-photos").upload(`${reference}/1.jpg`, jpeg, { contentType: "image/jpeg" })).error).toBeNull()
      expect((await anon.storage.from("report-photos").upload(`${reference}/1.jpg`, jpeg, { contentType: "image/jpeg" })).error).not.toBeNull()
      expect((await anon.storage.from("report-photos").upload(`random/1.jpg`, jpeg, { contentType: "image/jpeg" })).error).not.toBeNull()
      const png = new Blob([new Uint8Array([0x89, 0x50])], { type: "image/png" })
      expect((await anon.storage.from("report-photos").upload(`${reference}/2.png`, png, { contentType: "image/png" })).error).not.toBeNull()
      const res = await fetch(anon.storage.from("report-photos").getPublicUrl(`${reference}/1.jpg`).data.publicUrl)
      expect(res.status).toBe(200)
    })
  })

  describe("phone OTP (local test number)", () => {
    it("signs up and in with an SMS code", async () => {
      const db = client()
      const phone = "+919812345678"
      expect((await db.auth.signInWithOtp({ phone, options: { data: { full_name: "Ravi" } } })).error).toBeNull()
      const { data, error } = await db.auth.verifyOtp({ phone, token: "123456", type: "sms" })
      expect(error).toBeNull()
      expect(data.session).toBeTruthy()
      expect(data.user?.phone).toBe("919812345678")
    })
  })
})
