"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Info, Loader2, Printer, Scale } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { Input } from "@/frontend/components/ui/input"
import { Textarea } from "@/frontend/components/ui/textarea"
import { Field } from "@/frontend/components/field"
import { CopyTextButton } from "@/frontend/components/copy-text-button"
import { useT } from "@/frontend/components/i18n"
import { createClient } from "@/backend/supabase/client"
import { getReport } from "@/backend/services/backend"
import { APPLICANT_KEY, buildRtiLetter, buildRtiOnlineText, isRtiEligible, RTI_ONLINE_LIMIT, rtiContext, rtiEligibleFrom, type Applicant, type RtiLanguage } from "@/lib/rti"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/types"

const emptyApplicant: Applicant = { name: "", address: "", phone: "", email: "" }

export function RtiBuilder() {
  const { t, locale, date } = useT()
  const ref = useSearchParams().get("ref") ?? ""
  const [report, setReport] = useState<Report | null | undefined>(undefined)
  // Client-only (under Suspense with useSearchParams), so localStorage is safe here.
  const [applicant, setApplicant] = useState<Applicant>(() => ({ ...emptyApplicant, ...JSON.parse(localStorage.getItem(APPLICANT_KEY) ?? "{}") }))
  const [lang, setLang] = useState<RtiLanguage | null>(null)
  const letterLang: RtiLanguage = lang ?? (locale === "hi" ? "hi" : "en")

  useEffect(() => {
    let active = true
    getReport(ref).then((r) => active && setReport(r))
    // Fill gaps in the saved applicant details from the account.
    createClient()
      ?.auth.getSession()
      .then(({ data }) => {
        const u = data.session?.user
        if (!u || !active) return
        setApplicant((a) => ({
          ...a,
          name: a.name || (u.user_metadata?.full_name as string | undefined) || "",
          email: a.email || u.email || "",
          phone: a.phone || (u.phone ? `+${u.phone.replace(/^\+/, "")}` : (u.user_metadata?.phone as string | undefined) ?? ""),
        }))
      })
    return () => {
      active = false
    }
  }, [ref])

  const ctx = useMemo(() => (report ? rtiContext(report, window.location.origin) : null), [report])
  const letter = useMemo(() => (ctx ? buildRtiLetter(ctx, applicant, letterLang) : ""), [ctx, applicant, letterLang])
  const onlineText = useMemo(() => (ctx ? buildRtiOnlineText(ctx, letterLang) : ""), [ctx, letterLang])

  function update(key: keyof Applicant, value: string) {
    setApplicant((a) => {
      const next = { ...a, [key]: value }
      localStorage.setItem(APPLICANT_KEY, JSON.stringify(next))
      return next
    })
  }

  if (report === undefined) return <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t("common.loading")}</p>
  if (report === null)
    return (
      <p className="text-muted-foreground">
        {t("rti.notFound")} <Link href="/track" className="text-primary underline">{t("nav.track")}</Link>
      </p>
    )
  if (!isRtiEligible(report))
    return (
      <Card className="p-6 max-w-2xl">
        <p className="font-semibold mb-2">{report.status === "Resolved" ? t("rti.resolved") : t("rti.tooSoon", { date: date(rtiEligibleFrom(report).toISOString()) })}</p>
        <p className="text-sm text-muted-foreground mb-4">{t("rti.tooSoonWhy")}</p>
        <Button asChild variant="outline"><Link href={`/track?ref=${report.reference}`}>{t("rti.backToReport")}</Link></Button>
      </Card>
    )

  const { authority } = ctx!
  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
      <div className="space-y-6 print:hidden">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold">{t("rti.yourDetails")}</h2>
          <p className="text-sm text-muted-foreground">{t("rti.detailsWhy")}</p>
          <Field id="rti-name" label={t("form.name")} required>
            <Input id="rti-name" autoComplete="name" value={applicant.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field id="rti-address" label={t("rti.address")} required hint={t("rti.addressHint")}>
            <Textarea id="rti-address" rows={3} autoComplete="street-address" value={applicant.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="rti-phone" label={t("form.phone")}>
              <Input id="rti-phone" type="tel" autoComplete="tel" value={applicant.phone} onChange={(e) => update("phone", e.target.value)} />
            </Field>
            <Field id="rti-email" label={t("form.email")}>
              <Input id="rti-email" type="email" autoComplete="email" value={applicant.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
          </div>
          <div>
            <p className="text-sm font-medium mb-1.5">{t("rti.letterLanguage")}</p>
            <div className="inline-flex rounded-md border p-0.5">
              {(["en", "hi"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={letterLang === l}
                  onClick={() => setLang(l)}
                  className={cn("rounded px-3 py-1 text-sm font-medium", letterLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {l === "en" ? "English" : "हिन्दी"}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-bold">{t("rti.howToFile")}</h2>
          {authority.rtiPortal ? (
            <>
              <p className="text-sm text-muted-foreground">{t("rti.onlineSteps", { portal: authority.rtiPortal.label })}</p>
              <div className="flex flex-wrap gap-2">
                <CopyTextButton text={onlineText} label={t("rti.copyOnline")} />
                <Button asChild size="sm" variant="outline">
                  <a href={authority.rtiPortal.url} target="_blank" rel="noopener noreferrer">{authority.rtiPortal.label} <ExternalLink /></a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{t("rti.chars", { n: onlineText.length, max: RTI_ONLINE_LIMIT })}</p>
              <p className="text-sm text-muted-foreground">{t("rti.orPost")}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("rti.postOnly")}</p>
          )}
          {!authority.address && (
            <p className="text-sm rounded-md bg-amber-50 border border-amber-200 text-amber-900 p-3 flex gap-2">
              <Info className="size-4 mt-0.5 shrink-0" /> {authority.name ? t("rti.addAddress", { authority: authority.name }) : t("rti.addAuthority")}
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-2 text-sm">
          <h2 className="text-lg font-bold flex items-center gap-2"><Scale className="size-4" /> {t("rti.nextTitle")}</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
            <li>{t("rti.next1")}</li>
            <li>{t("rti.next2")}</li>
            <li>{t("rti.next3")}</li>
          </ul>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button onClick={() => window.print()}><Printer /> {t("rti.print")}</Button>
          <CopyTextButton text={letter} label={t("rti.copyLetter")} className="h-9" />
        </div>
        <article className="print-area rounded-lg border bg-white text-black shadow-sm p-8 md:p-12" lang={letterLang === "hi" ? "hi-IN" : "en-IN"}>
          <pre className="whitespace-pre-wrap break-words font-serif text-[15px] leading-relaxed">{letter}</pre>
          {report.photos.length > 0 && (
            <section className="mt-10 break-before-page">
              <h3 className="font-serif font-bold mb-3">{letterLang === "hi" ? "संलग्नक: फ़ोटो" : "Annexure: photographs"} ({report.reference})</h3>
              <div className="grid grid-cols-2 gap-4">
                {report.photos.map((src, i) => (
                  <figure key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and storage URLs */}
                    <img src={src} alt="" className="w-full rounded border" />
                    <figcaption className="text-xs mt-1">{letterLang === "hi" ? "फ़ोटो" : "Photo"} {i + 1}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </div>
  )
}
