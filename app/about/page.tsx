import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Award, FileSearch, GitCompare, Lightbulb, Linkedin, Mail, ShieldCheck, Target, Timer, Users } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { PageHeader } from "@/frontend/components/page-header"
import { contractors } from "@/data/contractors"
import { expressways } from "@/data/expressways"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "About",
  description: `Road Truth India is an independent citizen project built by ${site.creator.name}.`,
}

const values = [
  { icon: Target, title: "Transparency", description: "Every figure links to a public source, with the date it was last checked." },
  { icon: Award, title: "Accountability", description: "Show who built each stretch so quality can be traced back to the builder." },
  { icon: Users, title: "Citizen voice", description: "Make it quick and safe for anyone to report a hazard with evidence." },
  { icon: Lightbulb, title: "Practical tech", description: "Use AI where it saves people time, such as pothole detection from one photo." },
]

const method = [
  { icon: FileSearch, title: "Collect", body: "Start from authority pages (NHAI, UPEIDA, MSRDC, MMRDA), ministry answers in Parliament and company filings." },
  { icon: GitCompare, title: "Cross-check", body: "Confirm each figure against at least two independent sources. Where they disagree, show the range and say so." },
  { icon: ShieldCheck, title: "Test", body: "Automated checks run on every change: dates must match status, and every builder link must resolve in both directions." },
  { icon: Timer, title: "Date-stamp", body: "Each entry carries a last-verified date and its sources, so you can judge how fresh the information is." },
]

export default function AboutPage() {
  const sourceCount = new Set([...expressways.flatMap((e) => e.sources), ...contractors.flatMap((c) => c.sources)].map((s) => s.url)).size

  return (
    <>
      <PageHeader
        eyebrow="About"
        title="About Road Truth India"
        description="An independent portal for clear, sourced information on India's expressways, and a simple way for citizens to report what's wrong with them."
      />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-16 space-y-24">
        <section className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Mission</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Expressway data is scattered across ministry answers, authority PDFs, company filings and news reports. Road Truth India
              brings the key facts together on one page per road, cites every source, and shows which company built which stretch.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Vision</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Roads where problems are spotted early, reported with evidence, and traced back to whoever is responsible for fixing them.
            </p>
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">Methodology</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-10">How the data is verified</h2>
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border">
            {method.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="group bg-card p-6 transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between mb-6">
                  <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
          <dl className="mt-6 grid grid-cols-3 gap-4 max-w-xl">
            {[
              [String(expressways.length), "corridors"],
              [String(contractors.length), "contractors"],
              [String(sourceCount), "linked sources"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-3xl font-bold">{n}</dd>
                <dd className="text-sm text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">Principles</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-10">What guides the project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="group card-interactive rounded-lg border bg-card p-6">
                <Icon className="size-6 text-primary mb-4 transition-transform group-hover:scale-110" />
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 rounded-xl bg-ink text-ink-foreground p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-survey text-white" aria-hidden />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal mb-6">Built by</p>
              <div className="flex items-center gap-5 mb-6">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold">
                  {site.creator.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <div>
                  <h2 className="text-3xl font-bold">{site.creator.name}</h2>
                  <p className="text-white/65">{site.creator.role}</p>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed max-w-xl mb-8">
                Designed, researched and built Road Truth India end to end: the data, the network map and the pothole detector.
                Questions, corrections and collaboration ideas are welcome.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="signal">
                  <a href={`mailto:${site.creator.email}`}><Mail /> Email</a>
                </Button>
                <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white hover:border-white/60">
                  <a href={site.creator.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin /> LinkedIn</a>
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-amber-200 bg-amber-50 p-8 flex flex-col">
            <h2 className="text-xl font-bold mb-3">Independence</h2>
            <p className="text-sm leading-relaxed text-foreground/80 mb-6">
              {site.name} is <strong>not</strong> run by or affiliated with the Government of India, the Ministry of Road Transport
              &amp; Highways, NHAI, or any state road authority. Reports filed here do not replace official complaint channels.
            </p>
            <p className="text-sm leading-relaxed text-foreground/80 mb-6">
              For urgent issues, call the NHAI helpline <a href="tel:1033" className="font-semibold underline">1033</a> or
              emergency services on <a href="tel:112" className="font-semibold underline">112</a>.
            </p>
            <Link href="/contact" className="group mt-auto inline-flex items-center gap-1 font-semibold text-primary">
              <span className="link-grow">Spotted an error? Send a correction</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
