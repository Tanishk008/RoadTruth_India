"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Copy as Duplicate, ExternalLink } from "lucide-react"
import { useT } from "@/frontend/components/i18n"
import { MeTooButton } from "@/frontend/components/me-too-button"
import { daysBetween } from "@/lib/accountability"
import { DUPLICATE_RADIUS_M, findNearbyReports } from "@/backend/services/backend"
import { severityStyles } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/types"

/** Shown while reporting: open reports within a few hundred metres, so people can back an existing one instead of duplicating it. */
export function NearbyReports({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { t, issue, severityShort } = useT()
  const [items, setItems] = useState<(Report & { distance: number })[]>([])

  useEffect(() => {
    let active = true
    findNearbyReports({ latitude, longitude })
      .then((r) => active && setItems(r.slice(0, 5)))
      .catch(() => active && setItems([])) // offline: nothing to suggest
    return () => {
      active = false
    }
  }, [latitude, longitude])

  if (items.length === 0) return null

  return (
    <section className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3" aria-live="polite">
      <div>
        <h3 className="font-semibold flex items-center gap-2"><Duplicate className="size-4 text-primary" /> {t("nearby.title", { n: items.length, m: DUPLICATE_RADIUS_M })}</h3>
        <p className="text-sm text-muted-foreground">{t("nearby.lead")}</p>
      </div>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.reference} className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-3">
            {r.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element -- storage URLs / data URLs
              <img src={r.photos[0]} alt="" className="size-14 rounded object-cover" />
            )}
            <div className="flex-1 min-w-[12rem]">
              <p className="text-sm font-medium">
                {issue(r.issueType)}{" "}
                <span className={cn("ml-1 rounded px-1.5 py-0.5 text-[11px] font-semibold", severityStyles[r.severity])}>{severityShort(r.severity)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t("nearby.meta", { m: Math.round(r.distance), days: daysBetween(r.createdAt) })} · {r.location}
              </p>
            </div>
            <MeTooButton report={r} />
            <Link href={`/track?ref=${r.reference}`} target="_blank" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              {t("nearby.view")} <ExternalLink className="size-3" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("nearby.different")}</p>
    </section>
  )
}
