"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertTriangle, Cpu, Loader2, MapPin, RotateCcw, Sparkles } from "lucide-react"
import { Badge } from "@/frontend/components/ui/badge"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { ImageDropzone } from "@/frontend/components/image-dropzone"
import { getCurrentLocation, mapsLink, type Coordinates } from "@/lib/geolocation"
import { analyzePhoto, type AnalysisResult } from "@/lib/pothole/analyze"
import { saveDraft } from "@/backend/services/backend"
import { severityStyles } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Severity } from "@/lib/types"

const boxColors: Record<Severity, string> = {
  low: "border-sky-400 bg-sky-400/15",
  medium: "border-amber-400 bg-amber-400/15",
  high: "border-orange-500 bg-orange-500/20",
  critical: "border-red-600 bg-red-600/20",
}

export function PotholeDetector() {
  const router = useRouter()
  const [preferAi, setPreferAi] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [location, setLocation] = useState<Coordinates | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  async function handleFile(files: File[]) {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await analyzePhoto(files[0], preferAi))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while analysing the photo.")
    } finally {
      setBusy(false)
    }
  }

  async function addLocation() {
    setLocating(true)
    setLocationError(null)
    try {
      setLocation(await getCurrentLocation())
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : "Couldn't get your location.")
    } finally {
      setLocating(false)
    }
  }

  function createReport() {
    if (!result) return
    const { analysis, photo } = result
    const count = analysis.potholes.length
    saveDraft({
      issueType: count > 0 ? "pothole" : "road-damage",
      severity: analysis.overallSeverity === "none" ? "low" : analysis.overallSeverity,
      photos: [photo],
      detection: analysis,
      latitude: location?.latitude,
      longitude: location?.longitude,
      description: [
        analysis.summary,
        count > 0 ? `Detector found ${count} pothole${count > 1 ? "s" : ""}.` : "",
        analysis.otherIssues.length ? `Other issues: ${analysis.otherIssues.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    })
    router.push("/report-issue?draft=1")
  }

  const analysis = result?.analysis

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-4">
        {!result && !busy && (
          <>
            <ImageDropzone onFiles={handleFile} hint="Point the camera down at the road surface for best results" />
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={!preferAi} onChange={(e) => setPreferAi(!e.target.checked)} />
              <span>
                <span className="font-medium">Analyse on this device only.</span>{" "}
                <span className="text-muted-foreground">The photo never leaves your phone. Less accurate than AI analysis.</span>
              </span>
            </label>
          </>
        )}

        {busy && (
          <Card className="p-12 flex flex-col items-center justify-center text-center gap-3" aria-live="polite">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-semibold">Analysing road surface…</p>
            <p className="text-sm text-muted-foreground">{preferAi ? "This usually takes a few seconds." : "Running on your device."}</p>
          </Card>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-2" role="alert"><AlertTriangle className="w-4 h-4" />{error}</p>
        )}

        {result && analysis && (
          <Card className="p-3">
            <div className="relative w-full overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
              <img src={result.photo} alt="Uploaded road" className="w-full h-auto block" />
              {analysis.potholes.map((p, i) => (
                <div
                  key={i}
                  className={cn("absolute border-2 rounded-md", boxColors[p.severity])}
                  style={{
                    left: `${p.box.x * 100}%`,
                    top: `${p.box.y * 100}%`,
                    width: `${p.box.width * 100}%`,
                    height: `${p.box.height * 100}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    #{i + 1} {p.severity} · {Math.round(p.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <Button variant="outline" size="sm" onClick={() => { setResult(null); setError(null) }}>
                <RotateCcw className="w-4 h-4" /> Analyse another photo
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {analysis ? (
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Result</h2>
              <Badge variant="outline" className="gap-1">
                {analysis.method === "ai" ? <><Sparkles className="w-3 h-3" /> AI analysis</> : <><Cpu className="w-3 h-3" /> On-device estimate</>}
              </Badge>
            </div>

            {result?.notice && <p className="text-xs rounded-md bg-muted p-3 text-muted-foreground">{result.notice}</p>}

            {!analysis.isRoad ? (
              <p className="text-sm">{analysis.summary}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Potholes found</p>
                    <p className="text-3xl font-bold">{analysis.potholes.length}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Overall severity</p>
                    <span className={cn("inline-block rounded-md px-2 py-1 text-sm font-semibold capitalize", severityStyles[analysis.overallSeverity])}>
                      {analysis.overallSeverity}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{analysis.summary}</p>
                {analysis.otherIssues.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Also noticed</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.otherIssues.map((issue) => <Badge key={issue} variant="secondary">{issue}</Badge>)}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-4 space-y-2">
              {location ? (
                <p className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <a href={mapsLink(location.latitude, location.longitude)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {location.latitude}, {location.longitude}
                  </a>
                  <span className="text-muted-foreground">±{location.accuracy} m</span>
                </p>
              ) : (
                <Button type="button" variant="outline" className="w-full" onClick={addLocation} disabled={locating}>
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} Add my current location
                </Button>
              )}
              {locationError && <p className="text-xs text-destructive">{locationError}</p>}
              <Button type="button" className="w-full" onClick={createReport} disabled={!analysis.isRoad}>
                Create a report from this
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Automated detection can miss potholes or mistake shadows and stains for them. Check the marked areas before
              you report.
            </p>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold">How it works</h2>
            <ol className="space-y-3 text-sm list-decimal pl-5 text-muted-foreground">
              <li><span className="text-foreground font-medium">Take a clear photo</span> of the road in daylight, from a safe spot. Never stop on an expressway carriageway.</li>
              <li><span className="text-foreground font-medium">AI vision marks each pothole</span> and grades it low, medium, high or critical. Without AI, a private on-device detector gives an estimate.</li>
              <li><span className="text-foreground font-medium">Add your location</span> and turn the result into a report with one tap.</li>
            </ol>
            <p className="text-xs text-muted-foreground border-t pt-3">
              Photos are resized and their hidden metadata (including camera GPS) is removed before analysis. Location is only
              added if you choose to share it.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
