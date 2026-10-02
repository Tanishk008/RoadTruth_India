import { describe, expect, it } from "vitest"
import { translate, translateMessage, type TKey } from "@/lib/i18n/core"
import { en } from "@/lib/i18n/en"
import { hi, hiMessages } from "@/lib/i18n/hi"
import { issueTypeLabels, severityLabels } from "@/lib/site"

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe("Hindi dictionary", () => {
  it.each(Object.keys(en) as TKey[])("%s keeps the same placeholders and isn't left in English", (key) => {
    expect(placeholders(hi[key])).toEqual(placeholders(en[key]))
    expect(hi[key].trim()).not.toBe("")
  })

  it("translates every issue type and severity label", () => {
    for (const label of [...Object.values(issueTypeLabels), ...Object.values(severityLabels)]) expect(hiMessages[label]).toBeTruthy()
  })
})

describe("translate", () => {
  it("interpolates and falls back to the English text for unknown messages", () => {
    expect(translate("hi", "account.greeting", { name: "आशा" })).toBe("नमस्ते, आशा")
    expect(translate("en", "nearby.meta", { m: 120, days: 3 })).toBe("120 m away · 3 days old")
    expect(translateMessage("hi", "Enter your name")).toBe("अपना नाम लिखें")
    expect(translateMessage("hi", "Some new server message")).toBe("Some new server message")
  })
})
