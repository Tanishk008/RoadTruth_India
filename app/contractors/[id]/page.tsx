import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight, ExternalLink, Globe } from "lucide-react"
import { AccountabilityCard } from "@/frontend/components/accountability-card"
import { BackButton } from "@/frontend/components/back-button"
import { NetworkMap } from "@/frontend/components/network-map"
import { RouteSparkline } from "@/frontend/components/route-sparkline"
import { StatusBadge } from "@/frontend/components/status-badge"
import { contractors, getContractor } from "@/data/contractors"
import { getExpressway } from "@/data/expressways"
import { formatDate, formatKm, monogram } from "@/lib/format"
import type { Expressway } from "@/lib/types"

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return contractors.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getContractor((await params).id)
  if (!c) return {}
  return { title: c.name, description: c.description, openGraph: { title: `${c.name} · Road Truth India`, description: c.description, siteName: "Road Truth India" } }
}

export default async function ContractorPage({ params }: Props) {
  const c = getContractor((await params).id)
  if (!c) notFound()

  const work = c.expresswayIds
    .map((id) => getExpressway(id))
    .filter((e): e is Expressway => Boolean(e))
    .map((e) => ({ e, scope: e.packages.filter((p) => p.contractorId === c.id).map((p) => p.scope) }))

  const index = contractors.findIndex((x) => x.id === c.id)
  const prev = contractors[(index - 1 + contractors.length) % contractors.length]
  const next = contractors[(index + 1) % contractors.length]

  const metrics = [
    { label: "Founded", value: String(c.founded) },
    { label: "Headquarters", value: c.headquarters.split(" (")[0] },
    { label: "Listing", value: c.listing },
    { label: "Revenue FY25", value: c.revenueFY25?.replace(/ \(.*\)$/, "") ?? "Not verified" },
    { label: "Corridors", value: String(work.length) },
  ]

  return (
    <article>
      <header className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="absolute inset-0 bg-survey text-white" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <BackButton fallbackHref="/contractors" label="Back" className="border-white/25 text-white/85 hover:border-white/60 hover:text-white" />
            <nav aria-label="Breadcrumb" className="text-sm text-white/60 flex items-center gap-1">
              <Link href="/contractors" className="hover:text-white link-grow">Contractors</Link>
              <ChevronRight className="size-3.5" />
              <span className="text-white/90 truncate max-w-[50vw]">{c.name}</span>
            </nav>
          </div>
          <div className="flex items-center gap-5 animate-fade-up">
            <span className="flex size-16 md:size-20 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-2xl md:text-3xl font-bold">
              {monogram(c.name)}
            </span>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold">{c.name}</h1>
              <p className="text-white/65 mt-1">{c.headquarters}</p>
            </div>
          </div>
        </div>
      </header>

      <dl className="border-b bg-card">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0">
          {metrics.map((m) => (
            <div key={m.label} className="px-5 md:px-6 py-5">
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{m.label}</dt>
              <dd className="font-mono font-semibold mt-1">{m.value}</dd>
            </div>
          ))}
        </div>
      </dl>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-3">Overview</h2>
            <p className="text-lg leading-relaxed text-foreground/85">{c.description}</p>
            {c.revenueFY25 && <p className="text-sm text-muted-foreground mt-3">Revenue: {c.revenueFY25}</p>}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Expressway work</h2>
            <ul className="space-y-3">
              {work.map(({ e, scope }) => (
                <li key={e.id}>
                  <Link href={`/expressways/${e.id}`} className="group card-interactive flex items-center gap-4 rounded-lg border bg-card p-4">
                    <RouteSparkline expressway={e} className="h-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold group-hover:text-primary transition-colors">{e.name}</span>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{scope.join("; ")}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">{formatKm(e.lengthKm)} corridor · {e.states.join(", ")}</p>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {work.length > 0 && <AccountabilityCard scope="contractor" corridors={work.map(({ e }) => ({ id: e.id, lengthKm: e.lengthKm }))} />}

          <section>
            <h2 className="text-2xl font-bold mb-3">Sources</h2>
            <ul className="space-y-2">
              {c.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-primary">
                    <span className="link-grow">{s.label}</span>
                    <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 font-mono">Last verified {formatDate(c.lastVerified)}</p>
          </section>
        </div>

        <aside className="lg:col-span-5 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2">Where they built</p>
              <NetworkMap variant="light" controls="none" highlightIds={c.expresswayIds} svgClassName="max-h-[420px]" />
            </div>
            <a
              href={c.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
            >
              <span className="flex items-center gap-3">
                <Globe className="size-5 text-primary" />
                <span>
                  <span className="block text-xs text-muted-foreground">Official website</span>
                  <span className="font-semibold">{c.website.replace(/^https?:\/\/(www\.)?/, "")}</span>
                </span>
              </span>
              <ExternalLink className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </aside>
      </div>

      <nav className="border-t bg-card" aria-label="More contractors">
        <div className="max-w-7xl mx-auto grid grid-cols-2 divide-x">
          {[{ x: prev, dir: "Previous" }, { x: next, dir: "Next" }].map(({ x, dir }) => (
            <Link key={dir} href={`/contractors/${x.id}`} className={`group px-4 md:px-8 py-6 transition-colors hover:bg-muted ${dir === "Next" ? "text-right" : ""}`}>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground inline-flex items-center gap-1">
                {dir === "Previous" && <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />}
                {dir}
                {dir === "Next" && <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />}
              </span>
              <span className="block font-display font-bold text-lg md:text-xl group-hover:text-primary transition-colors">{x.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </article>
  )
}
