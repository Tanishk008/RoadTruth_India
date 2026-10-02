import Link from "next/link"
import { ArrowRight, ArrowUpRight, Camera, ClipboardCheck, MapPin } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { CountUp } from "@/frontend/components/count-up"
import { NetworkMap } from "@/frontend/components/network-map"
import { RouteSparkline } from "@/frontend/components/route-sparkline"
import { contractors } from "@/data/contractors"
import { expressways } from "@/data/expressways"
import { formatDate, formatKm } from "@/lib/format"

export default function Home() {
  const totalKm = expressways.reduce((sum, e) => sum + e.lengthKm, 0)
  const totalCost = expressways.reduce((sum, e) => sum + (e.costCrore ?? 0), 0)
  const states = new Set(expressways.flatMap((e) => e.states)).size
  const operational = expressways.filter((e) => e.status === "Operational").length

  const recent = expressways
    .filter((e) => e.openedOn)
    .sort((a, b) => b.openedOn!.localeCompare(a.openedOn!))
    .slice(0, 6)

  const builders = contractors
    .map((c) => ({ ...c, count: c.expresswayIds.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8)
  const maxCount = builders[0]?.count ?? 1

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="absolute inset-0 bg-survey text-white" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80 mb-6">
              <span className="size-1.5 rounded-full bg-signal animate-pulse" />
              Updated {formatDate("2026-10-01")} · {expressways.length} corridors tracked
            </p>
            <h1 className="text-[2.6rem] leading-[1.05] md:text-6xl font-extrabold mb-6">
              Every expressway.
              <br />
              Every builder.
              <br />
              <span className="text-signal">Every pothole, reported.</span>
            </h1>
            <p className="text-lg text-white/75 mb-9 max-w-xl leading-relaxed">
              Sourced facts on India&apos;s expressways and the companies that built them, and a one-photo tool for citizens to
              report what&apos;s broken.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" variant="signal" className="group">
                <Link href="/expressways">
                  Explore the network <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white hover:border-white/60">
                <Link href="/pothole-detector">
                  <Camera /> Scan a road photo
                </Link>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-6">
            <NetworkMap variant="dark" svgClassName="max-h-[min(68vh,540px)]" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card">
        <dl className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0">
          {[
            { label: "Corridors", value: <CountUp value={expressways.length} />, note: `${operational} fully open` },
            { label: "Kilometres", value: <CountUp value={Math.round(totalKm)} />, note: "Length covered" },
            { label: "Project value", value: <CountUp value={totalCost / 100000} decimals={2} prefix="₹" suffix="L Cr" />, note: "Reported cost" },
            { label: "Builders", value: <CountUp value={contractors.length} />, note: "Profiled from filings" },
            { label: "States & UTs", value: <CountUp value={states} />, note: "On the network" },
          ].map((s) => (
            <div key={s.label} className="px-5 md:px-8 py-7 group">
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">{s.label}</dt>
              <dd className="font-display font-bold text-3xl md:text-4xl mt-2 transition-colors group-hover:text-primary">{s.value}</dd>
              <dd className="text-xs text-muted-foreground mt-1">{s.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Recently opened */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="Timeline" title="Recently opened" link={{ href: "/expressways", label: "All corridors" }} />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((e) => (
              <li key={e.id}>
                <Link href={`/expressways/${e.id}`} className="group card-interactive flex h-full flex-col rounded-lg border bg-card p-5 overflow-hidden">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <time className="font-mono text-xs text-muted-foreground">{formatDate(e.openedOn!)}</time>
                    <RouteSparkline expressway={e} className="h-10" />
                  </div>
                  <h3 className="text-lg font-bold leading-snug mb-1 group-hover:text-primary transition-colors">{e.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{e.summary}</p>
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <span className="font-mono">{formatKm(e.lengthKm)}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Builders */}
      <section className="py-20 px-4 md:px-8 bg-card border-y">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Accountability" title="Who built the network" />
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every corridor is built in packages by different contractors. We link each package to the company that built it, so
              road quality can be traced to the builder.
            </p>
            <Button asChild variant="outline">
              <Link href="/contractors">Contractor directory <ArrowRight /></Link>
            </Button>
          </div>
          <ul className="lg:col-span-8 space-y-2">
            {builders.map((b) => (
              <li key={b.id}>
                <Link href={`/contractors/${b.id}`} className="group grid grid-cols-[minmax(0,11rem)_1fr_auto] sm:grid-cols-[14rem_1fr_auto] items-center gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-muted">
                  <span className="font-medium text-sm truncate group-hover:text-primary">{b.name.replace(/ Ltd\.$/, "")}</span>
                  <span className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-primary/70 transition-all duration-500 group-hover:bg-primary"
                      style={{ width: `${(b.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="font-mono text-sm tabular w-24 text-right text-muted-foreground">
                    {b.count} corridor{b.count > 1 ? "s" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Detector */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionHeading eyebrow="For citizens" title="Report a pothole in under a minute" />
            <ol className="space-y-6 mt-2">
              {[
                { icon: Camera, title: "Snap the road", body: "Upload a photo or use your phone camera. Hidden location data is stripped before anything leaves your device." },
                { icon: MapPin, title: "Get it marked and graded", body: "AI vision boxes each pothole and grades it low to critical. A private on-device detector works even offline." },
                { icon: ClipboardCheck, title: "File and track", body: "One tap turns the result into a report with GPS location and a reference number you can track." },
              ].map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="group flex gap-4">
                  <span className="relative flex size-11 shrink-0 items-center justify-center rounded-md border bg-card transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                    <span className="absolute -top-2 -right-2 font-mono text-[10px] bg-signal text-ink rounded px-1">{i + 1}</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Button asChild size="lg" className="mt-8 group">
              <Link href="/pothole-detector">
                Try the detector <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <DetectorIllustration />
        </div>
      </section>

      {/* Emergency band */}
      <section className="bg-signal text-ink">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Accident or immediate danger?</h2>
            <p className="text-ink/75">Don&apos;t file a report. Call for help first.</p>
          </div>
          <div className="flex gap-3">
            <a href="tel:112" className="group rounded-lg bg-ink text-ink-foreground px-6 py-3 transition-transform hover:-translate-y-0.5">
              <span className="font-mono text-2xl font-semibold">112</span>
              <span className="block text-xs text-white/70">Emergency</span>
            </a>
            <a href="tel:1033" className="group rounded-lg border-2 border-ink px-6 py-3 transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-ink-foreground">
              <span className="font-mono text-2xl font-semibold">1033</span>
              <span className="block text-xs opacity-70">NHAI helpline</span>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionHeading({ eyebrow, title, link }: { eyebrow: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">{eyebrow}</p>
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="group hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <span className="link-grow">{link.label}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}

/** Static illustration of a detection result, drawn with CSS (no stock photo). */
function DetectorIllustration() {
  return (
    <div className="relative" aria-hidden>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border shadow-xl bg-[radial-gradient(circle_at_30%_20%,#6b6f76,#3f434a_60%,#2f3238)]">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:6px_6px]" />
        <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 [background:repeating-linear-gradient(to_bottom,#f5f5f5_0_28px,transparent_28px_56px)] opacity-70" />
        <div className="absolute left-[18%] top-[52%] w-[34%] h-[26%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,#141618,#24272b_55%,#4a4e55_100%)] shadow-[inset_0_8px_18px_#000]" />
        <div className="absolute left-[15%] top-[48%] w-[40%] h-[34%] rounded-md border-2 border-red-500 bg-red-500/10">
          <span className="absolute -top-6 left-0 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">#1 high · 91%</span>
        </div>
        <div className="absolute right-[14%] top-[30%] w-[12%] h-[10%] rounded-md border-2 border-amber-400 bg-amber-400/10">
          <span className="absolute -top-6 left-0 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">#2 low</span>
        </div>
      </div>
      <div className="absolute -bottom-6 -right-2 md:-right-6 w-64 rounded-lg border bg-card p-4 shadow-xl">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Result</p>
        <div className="flex items-center justify-between mt-1">
          <span className="font-display font-bold text-2xl">2 potholes</span>
          <span className="rounded bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5">High</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="size-3" /> 26.6625, 80.8402 · ±8 m</p>
      </div>
    </div>
  )
}
