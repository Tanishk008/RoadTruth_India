"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Gauge, Info } from "lucide-react"
import { useT } from "@/frontend/components/i18n"
import { MIN_REPORTS_FOR_RATES, summarize, type AccountabilitySummary } from "@/lib/accountability"
import { getCorridorStats, REPORTS_CHANGED } from "@/backend/services/backend"
import type { Expressway } from "@/lib/types"

/**
 * Citizen-report accountability figures for a contractor's corridors (or one corridor).
 * Reports are attributed per corridor, not per package, so a contractor shares the figures of every corridor it worked on.
 */
export function AccountabilityCard({ corridors, scope }: { corridors: Pick<Expressway, "id" | "lengthKm">[]; scope: "contractor" | "corridor" }) {
  const { t } = useT()
  const [summary, setSummary] = useState<AccountabilitySummary | null>(null)
  const [failed, setFailed] = useState(false)
  const key = corridors.map((c) => c.id).join(",")

  useEffect(() => {
    let active = true
    const load = () =>
      getCorridorStats(key.split(","))
        .then((stats) => active && setSummary(summarize(corridors, stats)))
        .catch(() => active && setFailed(true))
    load()
    window.addEventListener(REPORTS_CHANGED, load)
    return () => {
      active = false
      window.removeEventListener(REPORTS_CHANGED, load)
    }
    // corridors is derived from key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const metrics = summary && [
    { label: t("acc.openPer100"), value: summary.enoughData ? summary.openPer100Km.toFixed(1) : "—" },
    { label: t("acc.medianFix"), value: summary.enoughData && summary.medianFixDays !== null ? t("acc.days", { n: Math.round(summary.medianFixDays) }) : "—" },
    { label: t("acc.within30"), value: summary.enoughData && summary.fixedWithin30DaysRate !== null ? `${Math.round(summary.fixedWithin30DaysRate * 100)}%` : "—" },
    { label: t("acc.total"), value: `${summary.total} (${t("acc.open", { n: summary.open })})` },
  ]

  return (
    <section className="rounded-lg border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Gauge className="size-5 text-primary" /> {t("acc.title")}</h2>
        <p className="text-sm text-muted-foreground">{scope === "contractor" ? t("acc.leadContractor", { n: corridors.length }) : t("acc.leadCorridor")}</p>
      </div>
      {failed ? (
        <p className="text-sm text-muted-foreground">{t("acc.error")}</p>
      ) : !metrics ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-md bg-muted/50 p-3">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</dt>
                <dd className="font-mono font-semibold text-lg mt-0.5">{m.value}</dd>
              </div>
            ))}
          </dl>
          {!summary!.enoughData && <p className="text-sm text-muted-foreground">{t("acc.notEnough", { min: MIN_REPORTS_FOR_RATES })}</p>}
        </>
      )}
      <p className="text-xs text-muted-foreground flex gap-1.5">
        <Info className="size-3.5 mt-0.5 shrink-0" />
        <span>
          {scope === "contractor" ? t("acc.caveatContractor") : t("acc.caveatCorridor")}{" "}
          <Link href="/report-issue" className="text-primary underline">{t("nav.report")}</Link>
        </span>
      </p>
    </section>
  )
}
