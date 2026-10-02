import { z } from "zod"

const severity = z.enum(["low", "medium", "high", "critical"])

/** Shape Claude is asked to return; validated again on the server before it reaches the client. */
export const aiAnalysisSchema = z.object({
  is_road: z.boolean(),
  potholes: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      confidence: z.number(),
      severity,
    }),
  ),
  overall_severity: z.enum(["none", "low", "medium", "high", "critical"]),
  summary: z.string(),
  other_issues: z.array(z.string()),
})

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>

/** JSON Schema sent as the structured-output format (kept in sync with aiAnalysisSchema). */
export const aiAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["is_road", "potholes", "overall_severity", "summary", "other_issues"],
  properties: {
    is_road: { type: "boolean", description: "True if the photo shows a road or pavement surface." },
    potholes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["x", "y", "width", "height", "confidence", "severity"],
        properties: {
          x: { type: "number", description: "Left edge as a fraction (0-1) of image width." },
          y: { type: "number", description: "Top edge as a fraction (0-1) of image height." },
          width: { type: "number", description: "Box width as a fraction (0-1) of image width." },
          height: { type: "number", description: "Box height as a fraction (0-1) of image height." },
          confidence: { type: "number", description: "0-1 confidence that this is a pothole." },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
        },
      },
    },
    overall_severity: { type: "string", enum: ["none", "low", "medium", "high", "critical"] },
    summary: { type: "string", description: "One or two plain-English sentences for a citizen." },
    other_issues: {
      type: "array",
      items: { type: "string" },
      description: "Other visible defects: cracks, waterlogging, missing signage, damaged barriers, debris.",
    },
  },
} as const
