"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { CheckCircle2, CloudOff, Copy, Info, Loader2, MapPin, Phone, Sparkles, X } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { Input } from "@/frontend/components/ui/input"
import { Textarea } from "@/frontend/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Field } from "@/frontend/components/field"
import { ImageDropzone } from "@/frontend/components/image-dropzone"
import { useT } from "@/frontend/components/i18n"
import { NearbyReports } from "@/frontend/components/nearby-reports"
import { expressways, getExpressway } from "@/data/expressways"
import { getCurrentLocation, mapsLink } from "@/lib/geolocation"
import { compressImage } from "@/lib/image"
import { readPhotoGps } from "@/lib/exif"
import { useOnline } from "@/lib/use-online"
import { createClient } from "@/backend/supabase/client"
import { BACKEND_CONNECTED, clearDraft, loadDraft, saveDraft, submitReport } from "@/backend/services/backend"
import { issueTypeLabels, severityLabels, site } from "@/lib/site"
import { fieldErrors, isInIndia, reportSchema } from "@/lib/validation"
import { APPLICANT_KEY } from "@/lib/rti"
import type { IssueType, PotholeAnalysis, Report, Severity } from "@/lib/types"

interface FormState {
  issueType: IssueType | ""
  expresswayId: string
  location: string
  latitude?: number
  longitude?: number
  severity: Severity | ""
  description: string
  name: string
  email: string
  phone: string
  photos: string[]
  detection?: PotholeAnalysis
}

const empty: FormState = {
  issueType: "",
  expresswayId: "",
  location: "",
  severity: "",
  description: "",
  name: "",
  email: "",
  phone: "",
  photos: [],
}

const MAX_PHOTOS = 3

export function ReportForm() {
  const { t, tm, issue, severity } = useT()
  const online = useOnline()
  const params = useSearchParams()
  // This component only renders on the client (it sits under a Suspense boundary with useSearchParams),
  // so reading localStorage in the initializer is safe.
  const [form, setForm] = useState<FormState>(() => {
    const draft = loadDraft()
    const expressway = params.get("expressway")
    return {
      ...empty,
      ...(draft as Partial<FormState> | null),
      ...(expressway && getExpressway(expressway) ? { expresswayId: expressway } : {}),
    }
  })
  const [restoredDraft] = useState(() => loadDraft() !== null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [processingPhotos, setProcessingPhotos] = useState(false)
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{ report: Report; queued: boolean } | null>(null)
  const [gpsFromPhoto, setGpsFromPhoto] = useState(false)

  // Signed-in citizens shouldn't have to retype their contact details. Only fills fields that are still empty.
  useEffect(() => {
    createClient()
      ?.auth.getSession()
      .then(({ data }) => {
        const user = data.session?.user
        if (!user) return
        const phone = (user.phone || (user.user_metadata?.phone as string | undefined) || "").replace(/\D/g, "").slice(-10)
        setForm((f) => ({
          ...f,
          name: f.name || ((user.user_metadata?.full_name as string | undefined) ?? ""),
          email: f.email || (user.email ?? ""),
          phone: f.phone || phone,
        }))
      })
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: "" }))
  }

  async function addPhotos(files: File[]) {
    const room = MAX_PHOTOS - form.photos.length
    if (room <= 0) {
      setNotice(t("report.maxPhotos", { max: MAX_PHOTOS }))
      return
    }
    setProcessingPhotos(true)
    try {
      const accepted = files.slice(0, room)
      // Compression strips EXIF, so read the camera's GPS from the originals first.
      const [compressed, gps] = await Promise.all([
        Promise.all(accepted.map((f) => compressImage(f, 1280, 0.75))),
        form.latitude === undefined ? Promise.all(accepted.map((f) => readPhotoGps(f).catch(() => null))) : Promise.resolve([]),
      ])
      // Ignore photos taken outside India (old holiday pictures, wrong camera clock/GPS).
      const position = gps.find((g) => g && isInIndia(g.latitude, g.longitude))
      setForm((f) => ({
        ...f,
        photos: [...f.photos, ...compressed],
        ...(position && f.latitude === undefined ? { latitude: position.latitude, longitude: position.longitude } : {}),
      }))
      if (position) setGpsFromPhoto(true)
      setNotice(files.length > room ? t("report.firstPhotosOnly", { n: room, max: MAX_PHOTOS }) : null)
    } catch {
      setNotice(t("report.photoUnreadable"))
    } finally {
      setProcessingPhotos(false)
    }
  }

  async function useMyLocation() {
    setLocating(true)
    try {
      const { latitude, longitude } = await getCurrentLocation()
      setForm((f) => ({ ...f, latitude, longitude }))
      setGpsFromPhoto(false)
      setErrors((e) => ({ ...e, location: "" }))
    } catch (e) {
      setErrors((prev) => ({ ...prev, location: e instanceof Error ? e.message : "Couldn't get your location." }))
    } finally {
      setLocating(false)
    }
  }

  function handleSaveDraft() {
    saveDraft(form)
    setNotice(t("report.draftSaved"))
  }

  function handleDiscardDraft() {
    clearDraft()
    setForm(empty)
    setErrors({})
    setNotice(t("report.draftDiscarded"))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = reportSchema.safeParse(form)
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error)
      setErrors(errs)
      document.getElementById(Object.keys(errs)[0])?.focus()
      return
    }
    setSubmitting(true)
    try {
      const result = await submitReport({ ...parsed.data, detection: form.detection })
      clearDraft()
      // Pre-fill a future RTI application on this device (the address is added there).
      const saved = JSON.parse(localStorage.getItem(APPLICANT_KEY) ?? "{}")
      localStorage.setItem(
        APPLICANT_KEY,
        JSON.stringify({ ...saved, name: saved.name || parsed.data.name, email: saved.email || parsed.data.email, phone: saved.phone || parsed.data.phone }),
      )
      setSubmitted(result)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setNotice(t("report.submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted)
    return (
      <SubmittedCard
        {...submitted}
        onAnother={() => {
          setSubmitted(null)
          setForm(empty)
          setGpsFromPhoto(false)
        }}
      />
    )

  const describedBy = (id: string) => (errors[id] ? `${id}-error` : undefined)

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {!BACKEND_CONNECTED && (
          <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 flex gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {t("report.previewMode")}
          </p>
        )}
        {BACKEND_CONNECTED && !online && (
          <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 flex gap-2" role="status">
            <CloudOff className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {t("report.offline")}
          </p>
        )}
        {restoredDraft && (
          <p className="text-sm rounded-lg bg-muted p-3 flex items-center justify-between gap-2">
            <span>{t("report.restored")}</span>
            <Button type="button" variant="ghost" size="sm" onClick={handleDiscardDraft}>{t("report.discard")}</Button>
          </p>
        )}
        {form.detection && (
          <p className="text-sm rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            {t("report.fromDetector", {
              n: form.detection.potholes.length,
              severity: form.detection.overallSeverity === "none" ? "—" : severity(form.detection.overallSeverity),
              method: form.detection.method === "ai" ? t("report.methodAi") : t("report.methodDevice"),
            })}
          </p>
        )}

        <Card className="p-6 md:p-8 space-y-5">
          <h2 className="text-xl font-bold">{t("report.issueDetails")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field id="issueType" label={t("report.issueType")} required error={tm(errors.issueType)}>
              <Select value={form.issueType} onValueChange={(v) => update("issueType", v as IssueType)}>
                <SelectTrigger id="issueType" className="w-full" aria-invalid={!!errors.issueType} aria-describedby={describedBy("issueType")}>
                  <SelectValue placeholder={t("report.issueTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(issueTypeLabels) as IssueType[]).map((value) => <SelectItem key={value} value={value}>{issue(value)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field id="severity" label={t("report.severity")} required error={tm(errors.severity)}>
              <Select value={form.severity} onValueChange={(v) => update("severity", v as Severity)}>
                <SelectTrigger id="severity" className="w-full" aria-invalid={!!errors.severity} aria-describedby={describedBy("severity")}>
                  <SelectValue placeholder={t("report.severityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(severityLabels) as Severity[]).map((value) => <SelectItem key={value} value={value}>{severity(value)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field id="expresswayId" label={t("card.road")} required error={tm(errors.expresswayId)}>
            <Select value={form.expresswayId} onValueChange={(v) => update("expresswayId", v)}>
              <SelectTrigger id="expresswayId" className="w-full" aria-invalid={!!errors.expresswayId} aria-describedby={describedBy("expresswayId")}>
                <SelectValue placeholder={t("report.roadPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {expressways.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                <SelectItem value="other">{t("report.otherRoad")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field id="location" label={t("card.location")} required error={tm(errors.location)} hint={t("report.locationHint")}>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder={t("report.locationPlaceholder")}
                aria-invalid={!!errors.location}
                aria-describedby={describedBy("location")}
              />
              <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating} className="whitespace-nowrap">
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} {t("report.useLocation")}
              </Button>
            </div>
            {form.latitude !== undefined && form.longitude !== undefined && (
              <p className="text-xs mt-1.5 flex items-center gap-2">
                {gpsFromPhoto ? t("report.gpsFromPhoto") : t("report.gpsAttached")}{" "}
                <a href={mapsLink(form.latitude, form.longitude)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {form.latitude}, {form.longitude}
                </a>
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setForm((f) => ({ ...f, latitude: undefined, longitude: undefined }))}>
                  {t("report.remove")}
                </button>
              </p>
            )}
          </Field>

          {form.latitude !== undefined && form.longitude !== undefined && <NearbyReports latitude={form.latitude} longitude={form.longitude} />}

          <Field id="description" label={t("card.description")} required error={tm(errors.description)}>
            <Textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={t("report.descriptionPlaceholder")}
              aria-invalid={!!errors.description}
              aria-describedby={describedBy("description")}
            />
          </Field>

          <div>
            <p className="text-sm font-medium mb-1.5">{t("report.photos")} <span className="text-muted-foreground font-normal">{t("report.photosMax", { max: MAX_PHOTOS })}</span></p>
            <p className="text-xs text-muted-foreground mb-2">{t("report.photosGpsHint")}</p>
            {form.photos.length < MAX_PHOTOS && (
              <ImageDropzone onFiles={addPhotos} multiple disabled={processingPhotos} hint={processingPhotos ? t("report.processing") : undefined} />
            )}
            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {form.photos.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                    <img src={src} alt={t("card.photo", { n: i + 1 })} className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                      className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                      aria-label={t("report.removePhoto", { n: i + 1 })}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 md:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold">{t("report.contactTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("report.contactLead")} <Link href="/legal#privacy" className="underline">{t("report.privacy")}</Link></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field id="name" label={t("form.name")} required error={tm(errors.name)}>
              <Input id="name" autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} />
            </Field>
            <Field id="email" label={t("form.email")} required error={tm(errors.email)}>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />
            </Field>
            <Field id="phone" label={t("form.phone")} error={tm(errors.phone)} hint={t("form.optional")}>
              <Input id="phone" type="tel" autoComplete="tel" placeholder="98765 43210" value={form.phone} onChange={(e) => update("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")} />
            </Field>
          </div>
        </Card>

        {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button type="button" variant="outline" size="lg" onClick={handleSaveDraft}>{t("report.saveDraft")}</Button>
          <Button type="submit" size="lg" className="px-8" disabled={submitting || processingPhotos}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {online || !BACKEND_CONNECTED ? t("report.submit") : t("report.submitOffline")}
          </Button>
        </div>
      </div>

      <aside className="space-y-6">
        <Card className="p-6 border-red-200 bg-red-50/60">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> {t("report.urgent")}</h3>
          <ul className="space-y-3 text-sm">
            {site.officialChannels.map((c) => (
              <li key={c.label}>
                <a href={c.href} className="font-semibold text-primary hover:underline" {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {c.label}: {c.value}
                </a>
                <p className="text-muted-foreground text-xs">{c.note}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold mb-3">{t("report.tipsTitle")}</h3>
          <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-5">
            <li>{t("report.tip1")}</li>
            <li>{t("report.tip2")}</li>
            <li>{t("report.tip3")}</li>
            <li>{t("report.tip4")}</li>
            <li><Link href="/pothole-detector" className="text-primary underline">{t("report.tip5")}</Link></li>
          </ul>
        </Card>
      </aside>
    </form>
  )
}

function SubmittedCard({ report, queued, onAnother }: { report: Report; queued: boolean; onAnother: () => void }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  return (
    <Card className="p-8 md:p-12 max-w-2xl mx-auto text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${queued ? "bg-amber-100" : "bg-emerald-100"}`}>
        {queued ? <CloudOff className="w-8 h-8 text-amber-600" /> : <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
      </div>
      <h2 className="text-3xl font-bold mb-3">{queued ? t("submitted.queuedTitle") : t("submitted.title")}</h2>
      <p className="text-muted-foreground mb-8">{queued ? t("submitted.queuedLead") : t("submitted.lead")}</p>
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
        <p className="text-sm text-muted-foreground mb-2">{t("submitted.reference")}</p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl font-bold font-mono text-primary">{report.reference}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("submitted.copyRef")}
            onClick={() => navigator.clipboard.writeText(report.reference).then(() => setCopied(true))}
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      {!BACKEND_CONNECTED && <p className="text-xs text-muted-foreground mb-6">{t("submitted.preview")}</p>}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline"><Link href={`/track?ref=${report.reference}`}>{t("submitted.track")}</Link></Button>
        <Button onClick={onAnother}>{t("submitted.another")}</Button>
      </div>
    </Card>
  )
}
