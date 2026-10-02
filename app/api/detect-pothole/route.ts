import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { z } from "zod"
import { aiAnalysisJsonSchema, aiAnalysisSchema } from "@/lib/pothole/schema"
import { clientIp, createRateLimiter } from "@/backend/rate-limit"
import type { PotholeAnalysis } from "@/lib/types"

export const runtime = "nodejs"

// ~4 MB of base64 ≈ 3 MB image. The client compresses to well under this.
const MAX_BASE64_LENGTH = 4_000_000

const requestSchema = z.object({
  image: z.string().min(100).max(MAX_BASE64_LENGTH),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
})

const SYSTEM_PROMPT = `You inspect citizen-submitted road photos for Road Truth India, a public road-quality reporting portal.

Find every pothole in the photo. A pothole is a bowl-shaped depression or hole in the road surface where material is missing. Do not count shadows, oil stains, patched (filled) repairs, manhole covers, speed breakers or painted markings.

For each pothole give a tight bounding box as fractions of the image (0 = left/top edge, 1 = right/bottom edge) and a severity:
- low: small or shallow, minor discomfort
- medium: noticeable, can damage tyres at speed
- high: large or deep, risk to two-wheelers
- critical: very large/deep or clustered, immediate accident risk

Set is_road to false if the photo does not show a road surface, and return no potholes. Write the summary for a member of the public, in plain English, in at most two sentences.`

// Each analysis is a paid API call: cap bursts per client.
const rateLimit = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 })

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI analysis is not configured on this server." }, { status: 503 })
  }

  // Only our own pages may call this (browsers always send Origin on cross-site POSTs).
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  const limited = rateLimit(clientIp(request))
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many photos analysed from this connection. Try again later, or use on-device analysis." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    )
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Send a JPEG, PNG or WebP image under 3 MB." }, { status: 400 })
  }

  const client = new Anthropic()
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: aiAnalysisJsonSchema },
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: parsed.data.mediaType, data: parsed.data.image } },
            { type: "text", text: "Analyse this road photo." },
          ],
        },
      ],
    })

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "The AI declined to analyse this image." }, { status: 422 })
    }

    const text = response.content.find((block) => block.type === "text")
    let json: unknown = null
    try {
      // A max_tokens stop can truncate the JSON; treat that like any other malformed reply.
      json = text && response.stop_reason !== "max_tokens" ? JSON.parse(text.text) : null
    } catch {
      json = null
    }
    const result = aiAnalysisSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json({ error: "The AI returned an unexpected response." }, { status: 502 })
    }

    const ai = result.data
    const clamp = (v: number) => Math.min(1, Math.max(0, v))
    const analysis: PotholeAnalysis = {
      method: "ai",
      isRoad: ai.is_road,
      potholes: ai.potholes.map((p) => ({
        box: { x: clamp(p.x), y: clamp(p.y), width: clamp(p.width), height: clamp(p.height) },
        confidence: clamp(p.confidence),
        severity: p.severity,
      })),
      overallSeverity: ai.overall_severity,
      summary: ai.summary,
      otherIssues: ai.other_issues,
    }
    return NextResponse.json(analysis)
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 })
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error", error.status, error.message)
      return NextResponse.json({ error: "AI analysis is temporarily unavailable." }, { status: 502 })
    }
    throw error
  }
}
