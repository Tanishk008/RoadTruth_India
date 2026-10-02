"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { CloudOff, Search } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { useT } from "@/frontend/components/i18n"
import { ReportCard } from "@/frontend/components/report-card"
import { getExpressway } from "@/data/expressways"
import { BACKEND_CONNECTED, getReport, listMyReports, REPORTS_CHANGED } from "@/backend/services/backend"
import type { Report } from "@/lib/types"

export function TrackReports() {
  const { t, issue, date } = useT()
  const initialRef = useSearchParams().get("ref") ?? ""
  const [reference, setReference] = useState(initialRef)
  const [found, setFound] = useState<Report | null | undefined>(undefined)
  const [mine, setMine] = useState<Report[]>([])

  useEffect(() => {
    let active = true
    const refresh = () => listMyReports().then((reports) => active && setMine(reports))
    refresh()
    if (initialRef) getReport(initialRef).then((r) => active && setFound(r))
    window.addEventListener(REPORTS_CHANGED, refresh)
    return () => {
      active = false
      window.removeEventListener(REPORTS_CHANGED, refresh)
    }
  }, [initialRef])

  // Keep the open report current too (a queued report gets sent, fails, or is discarded).
  const openRef = found?.reference
  useEffect(() => {
    if (!openRef) return
    let active = true
    const reload = () => getReport(openRef).then((r) => active && setFound(r))
    window.addEventListener(REPORTS_CHANGED, reload)
    return () => {
      active = false
      window.removeEventListener(REPORTS_CHANGED, reload)
    }
  }, [openRef])

  async function lookup(e: FormEvent) {
    e.preventDefault()
    setFound(reference.trim() ? await getReport(reference) : undefined)
  }

  return (
    <div className="space-y-10">
      <form onSubmit={lookup} className="flex gap-2">
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="RTR-2026-XXXXXX"
          className="font-mono uppercase"
          aria-label={t("track.refLabel")}
        />
        <Button type="submit"><Search className="w-4 h-4" /> {t("track.button")}</Button>
      </form>

      {found === null && (
        <p className="text-sm text-muted-foreground" role="status">
          {BACKEND_CONNECTED ? t("track.notFound") : t("track.notFoundDevice")}
        </p>
      )}
      {found && <ReportCard key={found.reference} report={found} />}

      <section>
        <h2 className="text-xl font-bold mb-4">{t("track.mine")}</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("track.none")} <Link href="/report-issue" className="text-primary underline">{t("nav.report")}</Link>
          </p>
        ) : (
          <ul className="divide-y border rounded-lg">
            {mine.map((r) => (
              <li key={r.reference}>
                <button
                  type="button"
                  onClick={() => {
                    setReference(r.reference)
                    setFound(r)
                  }}
                  className="w-full text-left p-4 hover:bg-muted/50 flex justify-between gap-4"
                >
                  <span>
                    <span className="font-mono font-semibold text-sm flex items-center gap-2">
                      {r.reference}
                      {r.pending && <CloudOff className="size-3.5 text-amber-600" aria-label={t("card.queued")} />}
                    </span>
                    <span className="block text-sm text-muted-foreground">{issue(r.issueType)} · {getExpressway(r.expresswayId)?.name ?? t("report.otherRoad")}</span>
                  </span>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{date(r.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
