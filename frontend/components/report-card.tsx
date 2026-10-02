"use client"

import Link from "next/link"
import { AlertTriangle, CloudOff, FileText, MapPin, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { useT } from "@/frontend/components/i18n"
import { MeTooButton } from "@/frontend/components/me-too-button"
import { EscalationPanel } from "@/frontend/components/escalation-panel"
import { getExpressway } from "@/data/expressways"
import { mapsLink } from "@/lib/geolocation"
import { daysBetween } from "@/lib/accountability"
import { isRtiEligible, rtiEligibleFrom } from "@/lib/rti"
import { discardQueued, retryQueued } from "@/backend/services/backend"
import { severityStyles } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Report, ReportStatus } from "@/lib/types"

const steps: ReportStatus[] = ["Received", "Under Review", "Forwarded", "Resolved"]

export function ReportCard({ report: r }: { report: Report }) {
  const { t, issue, status, severityShort, date } = useT()
  const current = steps.indexOf(r.status)
  const road = getExpressway(r.expresswayId)?.name ?? t("report.otherRoad")
  const days = daysBetween(r.createdAt)
  const eligible = isRtiEligible(r)

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-bold">{r.reference}</p>
          <p className="text-sm text-muted-foreground">
            {r.pending ? t("card.queued") : t("card.submitted", { date: date(r.createdAt) })}
            {r.status !== "Resolved" && !r.pending && ` · ${t("card.openDays", { days })}`}
          </p>
        </div>
        <span className={cn("rounded-md px-2 py-1 text-sm font-semibold", severityStyles[r.severity])}>{severityShort(r.severity)}</span>
      </div>

      {r.sendError ? (
        <div className="text-sm rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2" role="alert">
          <p className="flex gap-2 text-destructive font-medium">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" /> {t("card.sendFailed")}
          </p>
          <p className="text-xs text-muted-foreground font-mono break-words">{r.sendError}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => retryQueued(r.reference)}><RotateCcw /> {t("card.retry")}</Button>
            <Button size="sm" variant="ghost" onClick={() => discardQueued(r.reference)}><Trash2 /> {t("card.discard")}</Button>
          </div>
        </div>
      ) : r.pending ? (
        <p className="text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-3 flex gap-2">
          <CloudOff className="size-4 mt-0.5 shrink-0" /> {t("card.pendingNote")}
        </p>
      ) : (
        <ol className="grid grid-cols-4 gap-2" aria-label={t("card.progress")}>
          {steps.map((step, i) => (
            <li key={step} className="text-center">
              <div className={cn("h-2 rounded-full mb-2", i <= current ? "bg-primary" : "bg-muted")} />
              <span className={cn("text-xs", i === current ? "font-semibold" : "text-muted-foreground")}>{status(step)}</span>
            </li>
          ))}
        </ol>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div><dt className="text-muted-foreground">{t("card.issue")}</dt><dd className="font-medium">{issue(r.issueType)}</dd></div>
        <div><dt className="text-muted-foreground">{t("card.road")}</dt><dd className="font-medium">{road}</dd></div>
        <div>
          <dt className="text-muted-foreground">{t("card.location")}</dt>
          <dd className="font-medium">
            {r.location}
            {r.latitude !== undefined && r.longitude !== undefined && (
              <a href={mapsLink(r.latitude, r.longitude)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-normal">
                <MapPin className="size-3.5" /> {t("card.viewOnMap")}
              </a>
            )}
          </dd>
        </div>
        <div><dt className="text-muted-foreground">{t("card.description")}</dt><dd>{r.description}</dd></div>
        {r.resolvedAt && <div><dt className="text-muted-foreground">{t("card.resolvedOn")}</dt><dd className="font-medium">{date(r.resolvedAt)}</dd></div>}
      </dl>

      {r.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {r.photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- data URLs and storage URLs of any size
            <img key={i} src={src} alt={t("card.photo", { n: i + 1 })} className="w-full h-28 object-cover rounded-lg" />
          ))}
        </div>
      )}

      {!r.pending && (
        <div className="flex flex-wrap items-start gap-3 border-t pt-5">
          <MeTooButton report={r} />
          {r.status !== "Resolved" &&
            (eligible ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/track/rti?ref=${r.reference}`}><FileText /> {t("rti.draftButton")}</Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground self-center">
                <FileText className="inline size-3.5 mr-1" />
                {t("rti.availableFrom", { date: date(rtiEligibleFrom(r).toISOString()) })}
              </p>
            ))}
        </div>
      )}

      {!r.pending && r.status !== "Resolved" && <EscalationPanel report={r} />}
    </Card>
  )
}
