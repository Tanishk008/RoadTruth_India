import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink, Flag, Navigation } from "lucide-react"
import { Badge } from "@/frontend/components/ui/badge"
import { AccountabilityCard } from "@/frontend/components/accountability-card"
import { BackButton } from "@/frontend/components/back-button"
import { Button } from "@/frontend/components/ui/button"
import { CopyLinkButton } from "@/frontend/components/copy-link-button"
import { RouteSparkline } from "@/frontend/components/route-sparkline"
import { StatusBadge } from "@/frontend/components/status-badge"
import { expressways, getExpressway, googleMapsDirectionsUrl, googleMapsEmbedUrl } from "@/data/expressways"
import { getTariff } from "@/data/tolls"
import { formatCrore, formatDate, formatKm } from "@/lib/format"
import { formatFare } from "@/lib/toll"

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return expressways.map((e) => ({ id: e.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getExpressway((await params).id)
  if (!e) return {}
  const description = `${e.summary} ${e.lengthKm.toLocaleString("en-IN")} km · ${e.states.join(", ")}.`
  return { title: e.name, description, openGraph: { title: `${e.name} · Road Truth India`, description, siteName: "Road Truth India" } }
}

export default async function ExpresswayPage({ params }: Props) {
  const e = getExpressway((await params).id)
  if (!e) notFound()

  const index = expressways.findIndex((x) => x.id === e.id)
  const prev = expressways[(index - 1 + expressways.length) % expressways.length]
  const next = expressways[(index + 1) % expressways.length]
  const directions = googleMapsDirectionsUrl(e)
  const tariff = getTariff(e.id)
  const carRate = tariff?.vehicles[0]

  const metrics = [
    { label: "Length", value: formatKm(e.lengthKm) },
    { label: "Lanes", value: e.lanes },
    { label: "Cost", value: e.costCrore ? formatCrore(e.costCrore) : "Not published" },
    { label: e.openedYear ? "Fully opened" : "Expected", value: e.openedOn ? formatDate(e.openedOn) : String(e.openedYear ?? e.targetYear ?? "—") },
    { label: "Authority", value: e.authority.split(" (")[0] },
  ]

  return (
    <article>
      <header className="bg-ink text-ink-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-survey text-white" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <BackButton fallbackHref="/expressways" label="Back" className="border-white/25 text-white/85 hover:border-white/60 hover:text-white" />
            <nav aria-label="Breadcrumb" className="text-sm text-white/60 flex items-center gap-1">
              <Link href="/expressways" className="hover:text-white link-grow">Expressways</Link>
              <ChevronRight className="size-3.5" />
              <span className="text-white/90 truncate max-w-[50vw]">{e.name}</span>
            </nav>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl animate-fade-up">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <StatusBadge status={e.status} />
                <Badge variant="outline" className="border-white/25 text-white/80">{e.kind}</Badge>
                {e.aka && <Badge variant="outline" className="border-white/25 text-white/80">{e.aka}</Badge>}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4">{e.name}</h1>
              <p className="text-white/70 text-lg">{e.route}</p>
            </div>
            <div className="hidden lg:block rounded-lg border border-white/15 bg-white/5 p-4 [&_.fill-card]:fill-ink [&_.stroke-foreground]:stroke-white [&_.fill-foreground]:fill-white">
              <RouteSparkline expressway={e} className="h-24" />
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
        <div className="lg:col-span-8 space-y-10">
          <section aria-labelledby="map-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 id="map-heading" className="text-2xl font-bold">Route map</h2>
              <div className="flex gap-2">
                <CopyLinkButton />
                <Button asChild className="group">
                  <a href={directions} target="_blank" rel="noopener noreferrer">
                    <Navigation /> Open in Google Maps
                    <ExternalLink className="size-3.5 opacity-70" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border bg-muted aspect-[16/10]">
              <iframe
                title={`Google Maps route of the ${e.name}`}
                src={googleMapsEmbedUrl(e)}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Driving route through the corridor&apos;s main stops. Google may route parts of the trip on parallel roads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Overview</h2>
            <p className="text-lg leading-relaxed text-foreground/85">{e.summary}</p>
            <ul className="mt-6 space-y-3">
              {e.facts.map((fact) => (
                <li key={fact} className="flex gap-3 rounded-md border bg-card p-4 transition-colors hover:border-primary/40">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Who built it</h2>
            {e.packages.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
                Package-wise contractor details have not been verified yet. <Link href="/contact" className="text-primary link-grow">Know the builders? Send us a source.</Link>
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr><th className="px-4 py-3 font-semibold">Contractor</th><th className="px-4 py-3 font-semibold">Scope</th></tr>
                  </thead>
                  <tbody>
                    {e.packages.map((p) => (
                      <tr key={`${p.contractorName}-${p.scope}`} className="border-t transition-colors hover:bg-primary/5">
                        <td className="px-4 py-3 font-medium align-top whitespace-nowrap">
                          {p.contractorId ? (
                            <Link href={`/contractors/${p.contractorId}`} className="text-primary link-grow">{p.contractorName}</Link>
                          ) : (
                            p.contractorName
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.scope}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <AccountabilityCard scope="corridor" corridors={[{ id: e.id, lengthKm: e.lengthKm }]} />

          <section>
            <h2 className="text-2xl font-bold mb-3">Sources</h2>
            <ul className="space-y-2">
              {e.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-primary">
                    <span className="link-grow">{s.label}</span>
                    <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 font-mono">Last verified {formatDate(e.lastVerified)}</p>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-4">Route stops</h2>
              <ol className="relative">
                {e.mapStops.map((stop, i) => {
                  const last = i === e.mapStops.length - 1
                  return (
                    <li key={stop} className="relative pl-8 pb-4 last:pb-0">
                      {!last && <span className="absolute left-[9px] top-5 bottom-0 w-[3px] bg-primary/80" aria-hidden />}
                      <span
                        className={`absolute left-0 top-1 size-[21px] rounded-full border-[3px] ${i === 0 || last ? "border-primary bg-primary" : "border-primary bg-card"}`}
                        aria-hidden
                      />
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 -mx-2 transition-colors hover:bg-muted"
                      >
                        <span className={i === 0 || last ? "font-semibold" : ""}>{stop}</span>
                        <ExternalLink className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                      </a>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-3">States</h2>
              <div className="flex flex-wrap gap-2">
                {e.states.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>

            {tariff && carRate && (
              <Link
                href={`/toll-calculator?route=${e.id}`}
                className="group block rounded-lg border bg-card p-5 transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
              >
                <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2">Toll · {carRate.label.split(" /")[0]}</h2>
                <p className="font-display text-3xl font-bold">
                  {formatFare(carRate.fare)}
                  <span className="text-base font-medium text-muted-foreground">{tariff.kind === "per-km" ? " per km" : " one way"}</span>
                </p>
                {tariff.confidence === "estimate" && <p className="text-xs text-amber-700 mt-1">Estimate, not an official fare</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  <span className="link-grow">Calculate your trip</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            )}

            <div className="rounded-lg bg-signal text-ink p-5">
              <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><Flag className="size-4" /> Problem on this road?</h2>
              <p className="text-sm text-ink/75 mb-4">Report potholes, damage or unsafe conditions with a photo and location.</p>
              <Button asChild variant="ink" className="w-full">
                <Link href={`/report-issue?expressway=${e.id}`}>Report an issue here</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <nav className="border-t bg-card" aria-label="More corridors">
        <div className="max-w-7xl mx-auto grid grid-cols-2 divide-x">
          {[{ e: prev, dir: "Previous" }, { e: next, dir: "Next" }].map(({ e: x, dir }) => (
            <Link key={dir} href={`/expressways/${x.id}`} className={`group px-4 md:px-8 py-6 transition-colors hover:bg-muted ${dir === "Next" ? "text-right" : ""}`}>
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
