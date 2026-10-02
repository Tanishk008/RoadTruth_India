"use client"

import { ChevronDown, ExternalLink, Megaphone, Phone, Siren } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { useT } from "@/frontend/components/i18n"
import { CopyTextButton } from "@/frontend/components/copy-text-button"
import { grievanceText, helplineScript } from "@/lib/escalation"
import { rtiContext } from "@/lib/rti"
import type { Report } from "@/lib/types"

/** Ready-to-use wording for the official channels, so escalating takes a minute instead of a phone queue of guesswork. */
export function EscalationPanel({ report }: { report: Report }) {
  const { t } = useT()
  const ctx = rtiContext(report, window.location.origin)
  const { helpline, grievancePortal } = ctx.authority
  const script = helplineScript(ctx)
  const grievance = grievanceText(ctx)

  return (
    <details className="group rounded-lg border bg-muted/30 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 font-semibold text-sm">
        <span className="flex items-center gap-2"><Megaphone className="size-4 text-primary" /> {t("esc.title")}</span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 space-y-5 text-sm">
        <p className="text-muted-foreground">{t("esc.intro")}</p>

        {helpline && (
          <section className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2"><Phone className="size-4" /> {t("esc.callTitle", { number: helpline.number, label: helpline.label })}</h4>
            <p className="text-muted-foreground">{t("esc.callIntro")}</p>
            <ol className="list-decimal pl-5 space-y-1 rounded-md bg-card border p-3 pl-8" lang="en">
              {script.map((line) => <li key={line}>{line}</li>)}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm"><a href={`tel:${helpline.number}`}><Phone /> {t("esc.call", { number: helpline.number })}</a></Button>
              <CopyTextButton text={script.join("\n")} />
            </div>
            <p className="text-xs text-muted-foreground">{t("esc.rajmargyatra")}</p>
          </section>
        )}

        <section className="space-y-2">
          <h4 className="font-semibold">{t("esc.portalTitle", { portal: grievancePortal.label })}</h4>
          <p className="text-muted-foreground">{grievancePortal.url.includes("pgportal") ? t("esc.cpgramsSteps") : t("esc.portalSteps")}</p>
          <textarea readOnly value={grievance} rows={8} lang="en" className="w-full rounded-md border bg-card p-3 font-mono text-xs leading-relaxed" aria-label={t("esc.textLabel")} />
          <div className="flex flex-wrap gap-2">
            <CopyTextButton text={grievance} label={t("esc.copyText")} />
            <Button asChild size="sm" variant="outline">
              <a href={grievancePortal.url} target="_blank" rel="noopener noreferrer">{t("esc.openPortal")} <ExternalLink /></a>
            </Button>
          </div>
        </section>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Siren className="size-4 text-destructive" /> {t("esc.emergency")}
        </p>
      </div>
    </details>
  )
}
