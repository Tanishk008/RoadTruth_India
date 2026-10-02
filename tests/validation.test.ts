import { describe, expect, it } from "vitest"
import { formatCrore, formatKm } from "@/lib/format"
import {
  fieldErrors,
  indianPhone,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
  registerSchema,
  reportSchema,
  safeNextPath,
  toE164IndianPhone,
} from "@/lib/validation"

const validReport = {
  issueType: "pothole",
  expresswayId: "delhi-mumbai",
  location: "Km 112 near Dausa exit",
  severity: "high",
  description: "Large pothole in the left lane, about one metre wide.",
  name: "Asha",
  email: "asha@example.com",
  phone: "",
  photos: [],
}

describe("reportSchema", () => {
  it("accepts a complete report with optional phone left blank", () => {
    expect(reportSchema.safeParse(validReport).success).toBe(true)
  })

  it("reports a friendly message per missing field", () => {
    const result = reportSchema.safeParse({ ...validReport, issueType: "", severity: "", email: "nope", description: "short" })
    expect(result.success).toBe(false)
    const errors = fieldErrors(result.error!)
    expect(errors.issueType).toBe("Choose the type of issue")
    expect(errors.severity).toBe("Choose a severity")
    expect(errors.email).toBe("Enter a valid email address")
    expect(errors.description).toMatch(/20 characters/)
  })

  it("limits photos to three", () => {
    expect(reportSchema.safeParse({ ...validReport, photos: ["a", "b", "c", "d"] }).success).toBe(false)
  })
})

describe("indianPhone", () => {
  it.each(["9876543210", "+91 98765 43210", "098765-43210", "6000000000"])("accepts %s", (p) => {
    expect(indianPhone.safeParse(p).success).toBe(true)
  })
  it.each(["12345", "5876543210", "98765432101", "abcdefghij"])("rejects %s", (p) => {
    expect(indianPhone.safeParse(p).success).toBe(false)
  })
})

describe("registerSchema", () => {
  const base = { name: "Asha", email: "asha@example.com", phone: "9876543210", password: "road2026", confirmPassword: "road2026" }
  it("accepts matching strong passwords", () => {
    expect(registerSchema.safeParse(base).success).toBe(true)
  })
  it("rejects mismatched passwords on the confirm field", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "road2025" })
    expect(fieldErrors(result.error!).confirmPassword).toBe("Passwords don't match")
  })
  it("rejects passwords without a number", () => {
    expect(registerSchema.safeParse({ ...base, password: "roadroad", confirmPassword: "roadroad" }).success).toBe(false)
  })
})

describe("registerSchema optional phone", () => {
  it("allows signing up by email without a mobile number", () => {
    const result = registerSchema.safeParse({ name: "Asha", email: " Asha@Example.com ", phone: "", password: "road2026", confirmPassword: "road2026" })
    expect(result.success).toBe(true)
    expect(result.data!.email).toBe("asha@example.com")
  })
})

describe("phone OTP", () => {
  it.each(["9876543210", "+91 98765 43210", "098765-43210", "919876543210"])("normalises %s to E.164", (p) => {
    expect(toE164IndianPhone(p)).toBe("+919876543210")
    expect(phoneOtpRequestSchema.parse({ phone: p }).phone).toBe("+919876543210")
  })
  it("requires a 6-digit code", () => {
    expect(phoneOtpVerifySchema.safeParse({ phone: "9876543210", token: "123456" }).success).toBe(true)
    expect(fieldErrors(phoneOtpVerifySchema.safeParse({ phone: "9876543210", token: "12345" }).error!).token).toBe("Enter the 6-digit code")
  })
})

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/track?ref=RTR-2026-ABC123")).toBe("/track?ref=RTR-2026-ABC123")
  })
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", undefined, ""])("rejects %s", (v) => {
    expect(safeNextPath(v)).toBe("/account")
  })
})

describe("format", () => {
  it("formats crore and lakh crore in Indian style", () => {
    expect(formatCrore(96547)).toBe("₹96,547 Cr")
    expect(formatCrore(259466)).toBe("₹2.59 lakh Cr")
    expect(formatKm(1350)).toBe("1,350 km")
  })
})

describe("reportSchema matches database constraints", () => {
  const base = {
    issueType: "pothole", expresswayId: "delhi-mumbai", location: "Km 112 near Dausa exit", severity: "high",
    description: "Large pothole in the left lane, about one metre wide.", name: "Asha", email: "Asha@Example.com", phone: "", photos: [],
  }
  it("accepts GPS inside India and lowercases email", () => {
    const r = reportSchema.safeParse({ ...base, latitude: 26.9, longitude: 76.3 })
    expect(r.success).toBe(true)
    expect(r.data!.email).toBe("asha@example.com")
  })
  it("rejects GPS outside India, half a GPS pair and over-long location", () => {
    expect(fieldErrors(reportSchema.safeParse({ ...base, latitude: 51.5, longitude: -0.1 }).error!).location).toMatch(/outside India/)
    expect(fieldErrors(reportSchema.safeParse({ ...base, latitude: 26.9 }).error!).location).toMatch(/incomplete/)
    expect(fieldErrors(reportSchema.safeParse({ ...base, location: "x".repeat(301) }).error!).location).toMatch(/300/)
  })
})
