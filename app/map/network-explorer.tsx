"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ExternalLink, Search } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { NetworkMap, severityColors, type IssuePoint } from "@/frontend/components/network-map"
import { StatusBadge } from "@/frontend/components/status-badge"
import { useT } from "@/frontend/components/i18n"
import { MeTooButton } from "@/frontend/components/me-too-button"
import { expressways, getExpressway } from "@/data/expressways"
import { daysBetween } from "@/lib/accountability"
import { formatKm } from "@/lib/format"
import { ageBucket, type AgeBucket } from "@/lib/report-age"
import { BACKEND_CONNECTED, listPublicReports, REPORTS_CHANGED } from "@/backend/services/backend"
import { cn } from "@/lib/utils"
import type { Report, Severity } from "@/lib/types"

type Mode = "corridors" | "issues"
const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"]
const AGES: AgeBucket[] = ["new", "weeks", "overdue", "resolved"]

/** Full-screen map with a corridor list, plus a layer of citizen-reported issues. */
export function NetworkExplorer() {
  const { t, issue, severityShort } = useT()
  const [mode, setMode] = useState<Mode>("corridors")
  const [hovered, setHovered] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [reports, setReports] = useState<Report[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [severities, setSeverities] = useState<Set<Severity>>(new Set(SEVERITIES))
  const [ages, setAges] = useState<Set<AgeBucket>>(new Set<AgeBucket>(["new", "weeks", "overdue"]))
  const [sort, setSort] = useState<"votes" | "newest">("votes")
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = () =>
      listPublicReports()
        .then((r) => active && setReports(r))
        .catch(() => active && setLoadError(true))
    load()
    window.addEventListener(REPORTS_CHANGED, load)
    return () => {
      active = false
      window.removeEventListener(REPORTS_CHANGED, load)
    }
  }, [])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...expressways]
      .sort((a, b) => b.lengthKm - a.lengthKm)
      .filter((e) => !q || [e.name, e.aka ?? "", ...e.states].some((s) => s.toLowerCase().includes(q)))
  }, [query])

  const visibleReports = useMemo(() => {
    const rs = (reports ?? []).filter((r) => r.latitude !== undefined && severities.has(r.severity) && ages.has(ageBucket(r)))
    return rs.sort((a, b) => (sort === "votes" ? b.voteCount - a.voteCount : 0) || b.createdAt.localeCompare(a.createdAt))
  }, [reports, severities, ages, sort])

  const points: IssuePoint[] | undefined = useMemo(
    () =>
      mode === "issues"
        ? visibleReports.map((r) => ({
            id: r.reference,
            at: [r.longitude!, r.latitude!],
            severity: r.severity,
            age: ageBucket(r),
            votes: r.voteCount,
            label: `${issue(r.issueType)} · ${r.location}`,
          }))
        : undefined,
    [mode, visibleReports, issue],
  )
  const selectedReport = visibleReports.find((r) => r.reference === selected) ?? null
  const unmapped = (reports ?? []).filter((r) => r.latitude === undefined).length

  const toggle = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 grid lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1 space-y-3">
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(["corridors", "issues"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("rounded-md py-1.5 text-sm font-medium transition-colors", mode === m ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {m === "corridors" ? t("map.corridors") : t("map.issues", { n: reports?.filter((r) => r.status !== "Resolved").length ?? "…" })}
            </button>
          ))}
        </div>

        {mode === "corridors" ? (
          <>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("map.find")} className="pl-9 h-10" aria-label={t("map.find")} />
            </div>
            <ul className="rounded-lg border bg-card divide-y max-h-[70vh] overflow-y-auto" onMouseLeave={() => setHovered(null)}>
              {list.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/expressways/${e.id}`}
                    onMouseEnter={() => setHovered(e.id)}
                    onFocus={() => setHovered(e.id)}
                    onBlur={() => setHovered(null)}
                    className={cn("block px-4 py-3 transition-colors", hovered === e.id ? "bg-muted" : "hover:bg-muted")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("font-semibold text-sm transition-colors", hovered === e.id && "text-primary")}>{e.name}</span>
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{formatKm(e.lengthKm)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">{e.states.join(", ")}</span>
                      <StatusBadge status={e.status} className="scale-90 origin-right" />
                    </div>
                  </Link>
                </li>
              ))}
              {list.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("map.noCorridors")}</li>}
            </ul>
          </>
        ) : (
          <div className="space-y-3">
            {!BACKEND_CONNECTED && <p className="text-xs rounded-md bg-amber-50 border border-amber-200 text-amber-900 p-2.5">{t("map.deviceOnly")}</p>}
            {loadError && <p className="text-xs rounded-md bg-destructive/5 border border-destructive/20 text-destructive p-2.5 flex gap-2"><AlertTriangle className="size-4" /> {t("map.loadError")}</p>}
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{t("report.severity")}</legend>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITIES.map((s) => (
                  <button key={s} type="button" aria-pressed={severities.has(s)} onClick={() => setSeverities((x) => toggle(x, s))}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium", !severities.has(s) && "opacity-40 line-through")}>
                    <span className="size-2.5 rounded-full" style={{ background: severityColors[s] }} /> {severityShort(s)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{t("map.age")}</legend>
              <div className="flex flex-wrap gap-1.5">
                {AGES.map((a) => (
                  <button key={a} type="button" aria-pressed={ages.has(a)} onClick={() => setAges((x) => toggle(x, a))}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium", !ages.has(a) && "opacity-40 line-through")}>
                    <AgeSwatch age={a} /> {t(`age.${a}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("map.showing", { n: visibleReports.length })}</span>
              <label className="flex items-center gap-1.5">
                {t("map.sort")}
                <select value={sort} onChange={(e) => setSort(e.target.value as "votes" | "newest")} className="rounded border bg-card px-1.5 py-0.5">
                  <option value="votes">{t("map.sortVotes")}</option>
                  <option value="newest">{t("map.sortNewest")}</option>
                </select>
              </label>
            </div>

            {selectedReport && <IssueDetail report={selectedReport} onClose={() => setSelected(null)} />}

            <ul className="rounded-lg border bg-card divide-y max-h-[50vh] overflow-y-auto">
              {visibleReports.map((r) => (
                <li key={r.reference}>
                  <button type="button" onClick={() => setSelected(r.reference)}
                    className={cn("w-full text-left px-4 py-3 hover:bg-muted transition-colors", selected === r.reference && "bg-muted")}>
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full shrink-0" style={{ background: severityColors[r.severity] }} />
                      <span className="font-semibold text-sm flex-1 truncate">{issue(r.issueType)}</span>
                      <span className="text-xs font-mono text-muted-foreground">▲ {r.voteCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getExpressway(r.expresswayId)?.name ?? t("report.otherRoad")} · {t("nearby.daysAgo", { days: daysBetween(r.createdAt) })}
                    </p>
                  </button>
                </li>
              ))}
              {reports && visibleReports.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("map.noIssues")}</li>}
            </ul>
            {unmapped > 0 && <p className="text-xs text-muted-foreground">{t("map.unmapped", { n: unmapped })}</p>}
          </div>
        )}
      </aside>

      <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
        <div className="relative overflow-hidden rounded-xl bg-ink p-4 md:p-6">
          <div className="absolute inset-0 bg-survey text-white" aria-hidden />
          <NetworkMap
            variant="dark"
            controls="full"
            hoveredId={mode === "corridors" ? hovered : null}
            onHoverChange={setHovered}
            highlightIds={mode === "issues" ? [] : query ? list.map((e) => e.id) : undefined}
            issues={points}
            selectedIssueId={selected}
            onIssueSelect={setSelected}
            className="relative"
            svgClassName="max-h-[74vh]"
          />
        </div>
      </div>
    </div>
  )
}

function AgeSwatch({ age }: { age: AgeBucket }) {
  return (
    <svg width="12" height="12" aria-hidden>
      {age === "overdue" && <circle cx="6" cy="6" r="5.25" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" />}
      <circle cx="6" cy="6" r={age === "overdue" ? 3 : 4} fill={age === "resolved" ? "none" : "currentColor"} stroke="currentColor" strokeWidth={age === "resolved" ? 1.5 : 0} opacity={age === "new" ? 1 : 0.7} />
    </svg>
  )
}

function IssueDetail({ report: r, onClose }: { report: Report; onClose: () => void }) {
  const { t, issue, severityShort, status, date } = useT()
  return (
    <div className="rounded-lg border-2 border-primary/40 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{issue(r.issueType)} · {severityShort(r.severity)}</p>
          <p className="text-xs text-muted-foreground">{status(r.status)} · {date(r.createdAt)} · <span className="font-mono">{r.reference}</span></p>
        </div>
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">{t("common.close")}</button>
      </div>
      {r.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- storage URLs / data URLs
        <img src={r.photos[0]} alt="" className="w-full h-32 object-cover rounded" />
      )}
      <p className="text-sm">{r.location}</p>
      <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
      <div className="flex flex-wrap items-start gap-2">
        <MeTooButton key={r.reference} report={r} />
        <Link href={`/track?ref=${r.reference}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1.5">
          {t("map.openReport")} <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
