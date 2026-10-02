"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, ArrowUpRight, ExternalLink, Search } from "lucide-react"
import { Input } from "@/frontend/components/ui/input"
import { contractors } from "@/data/contractors"
import { getExpressway } from "@/data/expressways"
import { formatDate, monogram } from "@/lib/format"
import { cn } from "@/lib/utils"

type Sort = "corridors" | "name" | "founded"


export function ContractorDirectory() {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort>("corridors")

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contractors
      .filter((c) => !q || [c.name, c.headquarters, c.listing, ...c.expresswayIds.map((id) => getExpressway(id)?.name ?? "")].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : sort === "founded" ? a.founded - b.founded : b.expresswayIds.length - a.expresswayIds.length || a.name.localeCompare(b.name),
      )
  }, [query, sort])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-8">
        <div className="relative w-full md:max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, city or corridor" className="pl-9 h-10" aria-label="Search contractors" />
        </div>
        <div className="flex gap-2" role="group" aria-label="Sort contractors">
          {([["corridors", "Most corridors"], ["name", "A–Z"], ["founded", "Oldest first"]] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={cn("h-10 rounded-full border px-4 text-sm font-medium transition-all", sort === key ? "bg-ink text-ink-foreground border-ink" : "bg-card hover:border-foreground/40")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid md:grid-cols-2 gap-5">
        {list.map((c) => (
          <li key={c.id}>
            <article id={c.id} className="group card-interactive h-full scroll-mt-24 rounded-lg border bg-card p-6 target:ring-2 target:ring-primary">
              <header className="flex items-start gap-4 mb-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-ink font-display text-lg font-bold text-ink-foreground transition-colors group-hover:bg-primary">
                  {monogram(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold leading-tight">
                    <Link href={`/contractors/${c.id}`} className="hover:text-primary transition-colors">{c.name}</Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">{c.headquarters} · est. {c.founded}</p>
                </div>
                <span className="font-mono text-xs rounded border px-2 py-1 text-muted-foreground whitespace-nowrap">{c.listing}</span>
              </header>

              <p className="text-sm text-foreground/80 mb-5 leading-relaxed">{c.description}</p>

              <dl className="grid grid-cols-2 gap-4 mb-5 rounded-md bg-muted/60 p-4 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Revenue FY25</dt>
                  <dd className="font-mono font-medium">{c.revenueFY25 ?? "Not verified yet"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Corridors on this site</dt>
                  <dd className="font-mono font-medium">{c.expresswayIds.length}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 mb-5">
                {c.expresswayIds.map((id) => {
                  const e = getExpressway(id)
                  return e ? (
                    <Link
                      key={id}
                      href={`/expressways/${id}`}
                      className="group/chip inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {e.name.replace(/ Expressway$/, "")}
                      <ArrowUpRight className="size-3 opacity-50 group-hover/chip:opacity-100" />
                    </Link>
                  ) : null
                })}
              </div>

              <Link href={`/contractors/${c.id}`} className="group/profile mb-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                <span className="link-grow">View full profile</span>
                <ArrowRight className="size-4 transition-transform group-hover/profile:translate-x-1" />
              </Link>

              <footer className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
                <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary">
                  <span className="link-grow">{c.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  <ExternalLink className="size-3" />
                </a>
                <span>
                  {c.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && " · "}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" title={s.label} className="link-grow hover:text-foreground">
                        {c.sources.length > 1 ? `Source ${i + 1}` : "Source"}
                      </a>
                    </span>
                  ))}{" "}
                  · verified {formatDate(c.lastVerified)}
                </span>
              </footer>
            </article>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">No contractors match “{query}”.</p>}
    </div>
  )
}
