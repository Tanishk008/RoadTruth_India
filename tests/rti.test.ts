import { describe, expect, it } from "vitest"
import { authorityFor } from "@/lib/authorities"
import { grievanceText, GRIEVANCE_MAX, helplineScript } from "@/lib/escalation"
import { buildRtiLetter, buildRtiOnlineText, isRtiEligible, RTI_ONLINE_LIMIT, rtiContext, rtiEligibleFrom } from "@/lib/rti"
import { day, makeReport } from "./fixtures"

const applicant = { name: "Asha Verma", address: "12 MG Road, Jaipur 302001", phone: "+919876543210", email: "asha@example.com" }
const today = new Date(day(45))

describe("RTI eligibility", () => {
  it("opens exactly 30 days after the report reached the server", () => {
    const r = makeReport()
    expect(rtiEligibleFrom(r).toISOString()).toBe(day(30))
    expect(isRtiEligible(r, new Date(day(29.99)))).toBe(false)
    expect(isRtiEligible(r, new Date(day(30)))).toBe(true)
  })
  it("never applies to resolved or still-queued reports", () => {
    expect(isRtiEligible(makeReport({ status: "Resolved" }), today)).toBe(false)
    expect(isRtiEligible(makeReport({ pending: true }), today)).toBe(false)
  })
})

describe("authorityFor", () => {
  it("maps the data's authority labels, including annotated ones", () => {
    expect(authorityFor("NHAI").rtiPortal?.url).toBe("https://rtionline.gov.in")
    expect(authorityFor("YEIDA (concession: Jaypee Infratech)").key).toBe("YEIDA")
    expect(authorityFor("HMDA (toll lease: IRB Golconda Expressway)").key).toBe("HMDA")
    expect(authorityFor(undefined).key).toBe("")
  })
})

describe("buildRtiLetter", () => {
  const ctx = rtiContext(makeReport({ photos: ["https://x.supabase.co/storage/v1/object/public/report-photos/RTR-2026-ABC123/1.jpg"] }), "https://roadtruth.in/", today)

  it("addresses NHAI's PIO and cites the Act, defect, dates and track link", () => {
    const letter = buildRtiLetter(ctx, applicant, "en")
    expect(letter).toContain("The Public Information Officer,\nNational Highways Authority of India,\nG 5 & 6, Sector 10, Dwarka")
    expect(letter).toContain("Section 6(1) of the Right to Information Act, 2005")
    expect(letter).toContain("RTR-2026-ABC123")
    expect(letter).toContain("Delhi")
    expect(letter).toContain("GPS 26.8935, 76.3376")
    expect(letter).toContain("still unresolved after 45 days")
    expect(letter).toContain("https://roadtruth.in/track?ref=RTR-2026-ABC123")
    expect(letter).toContain("Photographs: 1 attached; also online at https://x.supabase.co")
    expect(letter).toContain("Section 6(3)")
    expect(letter).toMatch(/\n8\. /)
    expect(letter.trimEnd().endsWith("asha@example.com")).toBe(true)
  })

  it("writes the Hindi letter with NHAI's Hindi name", () => {
    const letter = buildRtiLetter(ctx, applicant, "hi")
    expect(letter).toContain("जन सूचना अधिकारी")
    expect(letter).toContain("भारतीय राष्ट्रीय राजमार्ग प्राधिकरण")
    expect(letter).toContain("धारा 6(1)")
    expect(letter).toContain("45 दिन")
    expect(letter).toContain("दोष का प्रकार: गड्ढा")
  })

  it("leaves visible blanks for missing applicant details and unknown roads", () => {
    const other = rtiContext(makeReport({ expresswayId: "other" }), "https://roadtruth.in", today)
    const letter = buildRtiLetter(other, { name: "", address: "", phone: "", email: "" }, "en")
    expect(letter).toContain("The Public Information Officer,\n[to be filled in],\n[to be filled in]")
    expect(letter).toContain("I, [to be filled in], a citizen")
  })
})

describe("buildRtiOnlineText", () => {
  it.each(["en", "hi"] as const)("fits RTI Online's 3000-character box even for long reports (%s)", (lang) => {
    const long = makeReport({ description: "Deep pothole. ".repeat(140), photos: Array.from({ length: 3 }, (_, i) => `https://example.supabase.co/storage/v1/object/public/report-photos/RTR-2026-ABC123/${i + 1}.jpg`) })
    const text = buildRtiOnlineText(rtiContext(long, "https://roadtruth.in", today), lang)
    expect(text.length).toBeLessThanOrEqual(RTI_ONLINE_LIMIT)
    expect(text).toContain("RTR-2026-ABC123")
    expect(text).toMatch(/\n8\. /)
    expect(text).not.toMatch(/^(Subject|विषय):/)
  })
})

describe("escalation", () => {
  const ctx = rtiContext(makeReport(), "https://roadtruth.in", today)
  it("helpline script names the road, GPS, age and reference", () => {
    const script = helplineScript(ctx).join(" ")
    expect(script).toContain("pothole on Delhi")
    expect(script).toContain("26.8935, 76.3376")
    expect(script).toContain("unresolved for 45 days")
    expect(script).toContain("RTR-2026-ABC123")
  })
  it("grievance text is bounded and links the public report", () => {
    const text = grievanceText(rtiContext(makeReport({ description: "x".repeat(3000) }), "https://roadtruth.in", today))
    expect(text.length).toBeLessThanOrEqual(GRIEVANCE_MAX)
    expect(grievanceText(ctx)).toContain("https://roadtruth.in/track?ref=RTR-2026-ABC123")
  })
})
