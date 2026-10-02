"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronRight, CloudOff, ThumbsUp } from "lucide-react"
import { useT } from "@/frontend/components/i18n"
import { listMyReports, REPORTS_CHANGED } from "@/backend/services/backend"
import { severityStyles } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/types"

export function MyReports() {
  const { t, issue, status, severityShort, date } = useT()
  const [reports, setReports] = useState<Report[] | null>(null)

  useEffect(() => {
    let active = true
    const load = () => listMyReports().then((r) => active && setReports(r))
    load()
    window.addEventListener(REPORTS_CHANGED, load)
    return () => {
      active = false
      window.removeEventListener(REPORTS_CHANGED, load)
    }
  }, [])

  if (!reports) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
  if (reports.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        {t("track.none")} <Link href="/report-issue" className="text-primary underline">{t("nav.report")}</Link>
      </p>
    )

  return (
    <ul className="divide-y -my-3">
      {reports.map((r) => (
        <li key={r.reference}>
          <Link href={`/track?ref=${r.reference}`} className="flex items-center gap-3 py-3 group">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold flex items-center gap-2">
                {r.reference}
                {r.pending && <CloudOff className="size-3.5 text-amber-600" aria-label={t("card.queued")} />}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {issue(r.issueType)} · {r.location} · {date(r.createdAt)}
              </p>
            </div>
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", severityStyles[r.severity])}>{severityShort(r.severity)}</span>
            <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1"><ThumbsUp className="size-3" /> {r.voteCount}</span>
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">{r.pending ? t("card.queued") : status(r.status)}</span>
            <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
