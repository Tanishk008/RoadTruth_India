import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { LogoMark } from "@/frontend/components/logo"
import { DATA_LAST_VERIFIED, expressways } from "@/data/expressways"
import { navItems, site } from "@/lib/site"

export function Footer() {
  const verified = new Date(DATA_LAST_VERIFIED).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-10 pb-10 border-b border-white/10">
          <div className="col-span-2 lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoMark />
              <span className="font-display font-bold text-lg">{site.name}</span>
            </div>
            <p className="text-sm text-white/65 max-w-sm leading-relaxed">
              Sourced facts on {expressways.length} expressway corridors and the companies that built them. An independent
              citizen project, not affiliated with the Government of India, MoRTH, NHAI or any state authority.
            </p>
          </div>

          <FooterColumn title="Explore" className="lg:col-span-2">
            {navItems.map((item) => (
              <FooterLink key={item.href} href={item.href}>{item.label}</FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Information" className="lg:col-span-2">
            <FooterLink href="/contact">Contact us</FooterLink>
            <FooterLink href="/legal#privacy">Privacy policy</FooterLink>
            <FooterLink href="/legal#terms">Terms of use</FooterLink>
            <FooterLink href="/legal#disclaimer">Data disclaimer</FooterLink>
          </FooterColumn>

          <div className="col-span-2 lg:col-span-4">
            <h4 className="text-[11px] uppercase tracking-[0.16em] text-white/50 font-semibold mb-4">Emergency on the road?</h4>
            <div className="grid grid-cols-2 gap-3">
              {site.officialChannels.slice(0, 2).map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  className="group rounded-lg border border-white/15 p-4 transition-colors hover:border-signal hover:bg-white/5"
                >
                  <span className="block font-mono text-2xl font-semibold text-signal">{channel.value}</span>
                  <span className="block text-xs text-white/65 mt-1 group-hover:text-white">{channel.label}</span>
                </a>
              ))}
            </div>
            <a href={`mailto:${site.contactEmail}`} className="link-grow inline-block mt-4 text-sm text-white/75 hover:text-white break-all">
              {site.contactEmail}
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {site.name} · Built by {site.creator.name}</p>
          <p className="font-mono">Data last verified {verified}</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h4 className="text-[11px] uppercase tracking-[0.16em] text-white/50 font-semibold mb-4">{title}</h4>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group inline-flex items-center gap-1 text-white/75 hover:text-white transition-colors">
        <span className="link-grow">{children}</span>
        <ArrowUpRight className="size-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
      </Link>
    </li>
  )
}
