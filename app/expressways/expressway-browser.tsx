"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpRight, LayoutGrid, Rows3, Search, X } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { NetworkMap } from "@/frontend/components/network-map"
import { RouteSparkline } from "@/frontend/components/route-sparkline"
import { StatusBadge } from "@/frontend/components/status-badge"
import { expressways } from "@/data/expressways"
import { formatCrore, formatKm } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Expressway, ExpresswayStatus } from "@/lib/types"

type SortKey = "name" | "lengthKm" | "costCrore" | "year"
const statuses: ExpresswayStatus[] = ["Operational", "Partially Operational", "Under Construction"]
const allStates = [...new Set(expressways.flatMap((e) => e.states))].sort()
const year = (e: Expressway) => e.openedYear ?? e.targetYear ?? 0

export function ExpresswayBrowser() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<ExpresswayStatus | "all">("all")
  const [state, setState] = useState("all")
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "lengthKm", dir: -1 })
  const [view, setView] = useState<"cards" | "table">("cards")

  // Press "/" anywhere to jump to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    return expressways
      .filter((e) => !q || [e.name, e.aka ?? "", e.route, ...e.states].some((s) => s.toLowerCase().includes(q)))
      .filter((e) => state === "all" || e.states.includes(state))
  }, [query, state])

  const results = useMemo(() => {
    const value = (e: Expressway) => (sort.key === "year" ? year(e) : sort.key === "costCrore" ? e.costCrore ?? -1 : e[sort.key])
    return base
      .filter((e) => status === "all" || e.status === status)
      .sort((a, b) => {
        const va = value(a)
        const vb = value(b)
        return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir
      })
  }, [base, status, sort])

  const countFor = (s: ExpresswayStatus | "all") => (s === "all" ? base.length : base.filter((e) => e.status === s).length)
  const filtersActive = query || status !== "all" || state !== "all"

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }))

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Toolbar */}
      <div className="sticky top-16 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-background/90 backdrop-blur border-b mb-8">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search name, city or state"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-10 h-10"
              aria-label="Search expressways"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground">/</kbd>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {(["all", ...statuses] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                disabled={s !== "all" && countFor(s) === 0}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm font-medium transition-all disabled:opacity-40",
                  status === s ? "bg-ink text-ink-foreground border-ink" : "bg-card hover:border-foreground/40",
                )}
              >
                {s === "all" ? "All" : s === "Partially Operational" ? "Partially open" : s}
                <span className={cn("ml-2 font-mono text-xs", status === s ? "text-white/70" : "text-muted-foreground")}>{countFor(s)}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 lg:ml-auto">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="h-10 w-44" aria-label="Filter by state"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {allStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border bg-card p-0.5" role="group" aria-label="View">
              {([["cards", LayoutGrid], ["table", Rows3]] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  aria-label={`${v} view`}
                  className={cn("rounded px-2.5 transition-colors", view === v ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8">
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <p aria-live="polite">
              Showing <span className="font-semibold text-foreground">{results.length}</span> of {expressways.length} corridors
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={() => { setQuery(""); setStatus("all"); setState("all") }}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <X className="size-3.5" /> Clear filters
              </button>
            )}
          </div>

          {view === "cards" ? (
            <ul className="grid sm:grid-cols-2 gap-4">
              {results.map((e) => (
                <li key={e.id}>
                  <Link href={`/expressways/${e.id}`} className="group card-interactive flex h-full flex-col rounded-lg border bg-card p-5 overflow-hidden">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <StatusBadge status={e.status} />
                      <RouteSparkline expressway={e} className="h-10 -mt-1" />
                    </div>
                    <h2 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">{e.name}</h2>
                    <p className="text-xs text-muted-foreground mb-3">{[e.aka, e.kind !== "Expressway" ? e.kind : null].filter(Boolean).join(" · ") || e.authority}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{e.route}</p>
                    <dl className="mt-auto grid grid-cols-3 border-t pt-3 text-sm">
                      <div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Length</dt><dd className="font-mono font-medium">{formatKm(e.lengthKm)}</dd></div>
                      <div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Cost</dt><dd className="font-mono font-medium">{e.costCrore ? formatCrore(e.costCrore) : "—"}</dd></div>
                      <div className="flex items-end justify-between">
                        <div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{e.openedYear ? "Opened" : "Target"}</dt><dd className="font-mono font-medium">{year(e) || "—"}</dd></div>
                        <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    {([["name", "Corridor"], ["lengthKm", "Length"], ["costCrore", "Cost"], ["year", "Year"]] as const).map(([key, label]) => (
                      <th key={key} className={cn("px-4 py-3 font-semibold", key !== "name" && "text-right")} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                        <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-primary">
                          {label}
                          {sort.key === key && (sort.dir === 1 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />)}
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => router.push(`/expressways/${e.id}`)}
                      className="group border-t cursor-pointer transition-colors hover:bg-primary/5"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/expressways/${e.id}`} className="font-semibold group-hover:text-primary">{e.name}</Link>
                        <p className="text-xs text-muted-foreground">{e.states.join(", ")}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular">{formatKm(e.lengthKm)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular">{e.costCrore ? formatCrore(e.costCrore) : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono tabular">{year(e) || "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.length === 0 && (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">No corridors match these filters.</div>
          )}
        </div>

        <aside className="xl:col-span-4">
          <div className="xl:sticky xl:top-36 rounded-lg border bg-card p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2">Network map</p>
            <NetworkMap variant="light" highlightIds={results.map((e) => e.id)} svgClassName="max-h-[440px]" />
          </div>
        </aside>
      </div>
    </div>
  )
}
