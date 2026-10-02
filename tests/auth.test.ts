import { describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }))

describe("auth actions without Supabase configured", () => {
  it("explain that accounts are off instead of throwing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    const { signInWithEmail, sendPhoneOtp } = await import("@/app/auth/actions")
    const login = await signInWithEmail({ email: "asha@example.com", password: "road2026" })
    expect(login.ok).toBe(false)
    expect(login.message).toMatch(/aren't switched on/)
    expect((await sendPhoneOtp({ phone: "9876543210", createAccount: false })).ok).toBe(false)
  })
})
