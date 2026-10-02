"use client"

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react"
import { Languages } from "lucide-react"
import { DEFAULT_LOCALE, isLocale, locales, translate, translateMessage, type Locale, type TKey } from "@/lib/i18n/core"
import { issueTypeLabels, severityLabels } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { IssueType, ReportStatus, Severity } from "@/lib/types"

const STORAGE_KEY = "rti:locale"
const listeners = new Set<() => void>()

function getLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isLocale(saved) ? saved : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export function setLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale)
  // Readable by the server later if pages ever render per-locale.
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Pages are prerendered in English; the saved language applies right after hydration. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE)
}

export function useT() {
  const locale = useLocale()
  const t = useCallback((key: TKey, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale])
  const tm = useCallback((message: string | undefined) => (message ? translateMessage(locale, message) : message), [locale])
  const issue = useCallback((type: IssueType) => translateMessage(locale, issueTypeLabels[type]), [locale])
  const severity = useCallback((s: Severity) => translateMessage(locale, severityLabels[s]), [locale])
  const severityShort = useCallback((s: Severity) => translate(locale, `severity.${s}` as TKey), [locale])
  const status = useCallback((s: ReportStatus) => translate(locale, `status.${s}` as TKey), [locale])
  const date = useCallback(
    (iso: string) => new Date(iso).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }),
    [locale],
  )
  return { locale, t, tm, issue, severity, severityShort, status, date }
}

/** For translated text inside Server Components. */
export function T({ k, vars }: { k: TKey; vars?: Record<string, string | number> }): ReactNode {
  return useT().t(k, vars)
}

/** Keeps <html lang> in sync so screen readers and fonts pick the right language. */
export function HtmlLang() {
  const locale = useLocale()
  useEffect(() => {
    document.documentElement.lang = locales.find((l) => l.code === locale)!.htmlLang
  }, [locale])
  return null
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const { t } = useT()
  return (
    <div role="group" aria-label={t("lang.label")} className={cn("inline-flex items-center gap-0.5 rounded-md border p-0.5", className)}>
      <Languages className="size-3.5 mx-1 text-muted-foreground" aria-hidden />
      {locales.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.htmlLang}
          aria-pressed={locale === l.code}
          title={l.label}
          onClick={() => setLocale(l.code)}
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-semibold transition-colors",
            locale === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
