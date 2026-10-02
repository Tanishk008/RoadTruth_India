import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/api/detect-pothole/route"

const request = (body: unknown) =>
  new Request("http://localhost/api/detect-pothole", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })

describe("POST /api/detect-pothole", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("returns 503 when no API key is configured, so the client falls back to on-device detection", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "")
    const res = await POST(request({ image: "a".repeat(200), mediaType: "image/jpeg" }))
    expect(res.status).toBe(503)
  })

  it.each([
    ["malformed JSON", "{not json"],
    ["missing image", { mediaType: "image/jpeg" }],
    ["unsupported type", { image: "a".repeat(200), mediaType: "image/gif" }],
    ["oversized image", { image: "a".repeat(4_000_001), mediaType: "image/jpeg" }],
  ])("rejects %s with 400", async (_, body) => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key")
    const res = await POST(request(body))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/detect-pothole abuse protection", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("rejects cross-site callers", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key")
    const res = await POST(
      new Request("http://localhost/api/detect-pothole", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ image: "a".repeat(200), mediaType: "image/jpeg" }),
      }),
    )
    expect(res.status).toBe(403)
  })
})
