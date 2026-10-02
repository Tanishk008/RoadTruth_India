import { compressImage, imageDataFor } from "@/lib/image"
import { detectPotholes } from "@/lib/pothole/detector"
import type { PotholeAnalysis } from "@/lib/types"

export interface AnalysisResult {
  analysis: PotholeAnalysis
  /** Compressed JPEG data URL (EXIF stripped), reused as report evidence. */
  photo: string
  /** Why AI analysis wasn't used, when it was requested but unavailable. */
  notice?: string
}

export async function analyzePhoto(file: File, preferAi: boolean): Promise<AnalysisResult> {
  const photo = await compressImage(file, 1280, 0.82)
  let notice: string | undefined

  if (preferAi) {
    try {
      const res = await fetch("/api/detect-pothole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo.split(",")[1], mediaType: "image/jpeg" }),
      })
      if (res.ok) return { analysis: (await res.json()) as PotholeAnalysis, photo }
      notice =
        res.status === 503
          ? "AI analysis isn't enabled on this server yet, so the on-device detector was used."
          : `AI analysis failed (${((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.statusText}). The on-device detector was used instead.`
    } catch {
      notice = "Couldn't reach the AI service, so the on-device detector was used."
    }
  }

  const pixels = await imageDataFor(file, 320)
  return { analysis: detectPotholes(pixels), photo, notice }
}
