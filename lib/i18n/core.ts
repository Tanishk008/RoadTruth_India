import { en, enMessages } from "@/lib/i18n/en"
import { hi, hiMessages } from "@/lib/i18n/hi"

export type Dict = Record<keyof typeof en, string>
export type TKey = keyof typeof en

/**
 * To add a language: create lib/i18n/<code>.ts exporting a full `Dict` (TypeScript flags missing keys)
 * plus a message map, then register it here. Have a native speaker review civic and legal wording.
 */
export const locales = [
  { code: "en", label: "English", short: "EN", htmlLang: "en-IN" },
  { code: "hi", label: "हिन्दी", short: "हि", htmlLang: "hi-IN" },
] as const

export type Locale = (typeof locales)[number]["code"]
export const DEFAULT_LOCALE: Locale = "en"

const dictionaries: Record<Locale, { ui: Dict; messages: Record<string, string> }> = {
  en: { ui: en, messages: enMessages },
  hi: { ui: hi, messages: hiMessages },
}

export const isLocale = (v: unknown): v is Locale => locales.some((l) => l.code === v)

function interpolate(text: string, vars?: Record<string, string | number>) {
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text
}

export function translate(locale: Locale, key: TKey, vars?: Record<string, string | number>): string {
  return interpolate(dictionaries[locale].ui[key] ?? en[key], vars)
}

/** Translates a message produced elsewhere in English (Zod validation, server actions). Unknown text passes through. */
export function translateMessage(locale: Locale, message: string): string {
  return dictionaries[locale].messages[message] ?? message
}
