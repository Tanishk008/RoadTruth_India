import { daysBetween } from "@/lib/accountability"
import { authorityFor, type Authority } from "@/lib/authorities"
import { getExpressway } from "@/data/expressways"
import { mapsLink } from "@/lib/geolocation"
import { hiMessages } from "@/lib/i18n/hi"
import { issueTypeLabels } from "@/lib/site"
import type { Report } from "@/lib/types"

/** Days a report must stay unresolved before we offer an RTI draft. Gives the authority a fair chance first. */
export const RTI_WAIT_DAYS = 30
/** rtionline.gov.in limits the request text to 3000 characters. */
export const RTI_ONLINE_LIMIT = 3000

export type RtiLanguage = "en" | "hi"

/** localStorage key for the applicant's details, filled when they report from this device or edit them on the RTI page. */
export const APPLICANT_KEY = "rti:applicant"

export interface Applicant {
  name: string
  address: string
  phone: string
  email: string
}

export function rtiEligibleFrom(report: Pick<Report, "createdAt">): Date {
  return new Date(new Date(report.createdAt).getTime() + RTI_WAIT_DAYS * 86_400_000)
}

export function isRtiEligible(report: Pick<Report, "createdAt" | "status" | "pending">, now = new Date()): boolean {
  return !report.pending && report.status !== "Resolved" && now >= rtiEligibleFrom(report)
}

const fmt = (iso: string | Date, lang: RtiLanguage) =>
  new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export interface RtiContext {
  report: Report
  authority: Authority
  roadName: string
  days: number
  today: Date
  trackUrl: string
}

export function rtiContext(report: Report, siteUrl: string, today = new Date()): RtiContext {
  const expressway = getExpressway(report.expresswayId)
  return {
    report,
    authority: authorityFor(expressway?.authority),
    roadName: expressway?.name ?? "",
    days: daysBetween(report.createdAt, today),
    today,
    trackUrl: `${siteUrl.replace(/\/$/, "")}/track?ref=${report.reference}`,
  }
}

const QUESTIONS: Record<RtiLanguage, string[]> = {
  en: [
    "Whether the authority is aware of this defect, and the date on which it was first recorded in its inspection, complaint or maintenance records.",
    "Copies of inspection reports and site diaries for this stretch for the period above.",
    "The name of the contractor or concessionaire responsible for maintaining this stretch, and a copy of the maintenance obligations in its contract, including the defect liability clauses.",
    "Whether this stretch is within its defect liability period or under an operation & maintenance / toll concession, and the date on which that period ends.",
    "The action taken on this defect, with dates, and copies of any work orders or rectification notices issued.",
    "Details of any penalty or damages levied on the contractor or concessionaire for not rectifying this defect within the time allowed by the contract.",
    "The name and designation of the officer responsible for ensuring that this defect is rectified.",
    "The date by which the defect is expected to be repaired.",
  ],
  hi: [
    "क्या प्राधिकरण को इस दोष की जानकारी है, और इसे निरीक्षण, शिकायत या रखरखाव अभिलेखों में पहली बार किस तिथि को दर्ज किया गया।",
    "उपर्युक्त अवधि के लिए इस खंड की निरीक्षण रिपोर्टों और साइट डायरी की प्रतियाँ।",
    "इस खंड के रखरखाव के लिए उत्तरदायी ठेकेदार या रियायतग्राही (कन्सेशनेयर) का नाम, तथा उसके अनुबंध में रखरखाव संबंधी दायित्वों की प्रति, दोष दायित्व (डिफेक्ट लायबिलिटी) से संबंधित शर्तों सहित।",
    "क्या यह खंड दोष दायित्व अवधि में है या संचालन एवं रखरखाव / टोल रियायत के अंतर्गत है, और वह अवधि किस तिथि को समाप्त होती है।",
    "इस दोष पर की गई कार्रवाई, तिथियों सहित, तथा जारी किए गए किसी भी कार्य आदेश या सुधार नोटिस की प्रतियाँ।",
    "अनुबंध में निर्धारित समय में यह दोष ठीक न करने पर ठेकेदार या रियायतग्राही पर लगाए गए किसी भी दंड या क्षतिपूर्ति का विवरण।",
    "इस दोष को ठीक कराने के लिए उत्तरदायी अधिकारी का नाम और पदनाम।",
    "वह तिथि जब तक इस दोष की मरम्मत किए जाने की संभावना है।",
  ],
}

const PLACEHOLDER = { en: "[to be filled in]", hi: "[भरें]" }

function defectLines(c: RtiContext, lang: RtiLanguage, descriptionMax: number): string[] {
  const r = c.report
  const gps = r.latitude !== undefined && r.longitude !== undefined ? ` (GPS ${r.latitude}, ${r.longitude} — ${mapsLink(r.latitude, r.longitude)})` : ""
  const road = c.roadName || PLACEHOLDER[lang]
  const photos = r.photos.filter((p) => p.startsWith("http"))
  const severity = { en: { low: "low", medium: "medium", high: "high", critical: "critical" }, hi: { low: "कम", medium: "मध्यम", high: "अधिक", critical: "गंभीर" } }[lang][r.severity]
  if (lang === "hi") {
    return [
      `संदर्भ संख्या: ${r.reference}`,
      `सड़क: ${road}`,
      `स्थान: ${r.location}${gps}`,
      `दोष का प्रकार: ${hiMessages[issueTypeLabels[r.issueType]] ?? issueTypeLabels[r.issueType]} (गंभीरता: ${severity})`,
      `सार्वजनिक रूप से दर्ज: ${fmt(r.createdAt, lang)}, Road Truth India पर (${c.trackUrl}); ${fmt(c.today, lang)} तक ${c.days} दिन बाद भी ठीक नहीं हुआ`,
      `विवरण: ${clip(r.description, descriptionMax)}`,
      ...(r.photos.length ? [`फ़ोटो: ${r.photos.length} संलग्न${photos.length ? ` / ऑनलाइन उपलब्ध: ${photos.join(" ")}` : ""}`] : []),
    ]
  }
  return [
    `Reference: ${r.reference}`,
    `Road: ${road}`,
    `Location: ${r.location}${gps}`,
    `Nature of defect: ${issueTypeLabels[r.issueType]} (severity: ${severity})`,
    `Reported publicly: ${fmt(r.createdAt, lang)} on Road Truth India (${c.trackUrl}); still unresolved after ${c.days} days as of ${fmt(c.today, lang)}`,
    `Description: ${clip(r.description, descriptionMax)}`,
    ...(r.photos.length ? [`Photographs: ${r.photos.length} attached${photos.length ? `; also online at ${photos.join(" ")}` : ""}`] : []),
  ]
}

function subject(c: RtiContext, lang: RtiLanguage) {
  const road = c.roadName || PLACEHOLDER[lang]
  return lang === "hi"
    ? `विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत आवेदन — ${road} पर सड़क दोष (${c.report.reference})`
    : `Subject: Application under Section 6(1) of the Right to Information Act, 2005 — road defect on ${road} (${c.report.reference})`
}

function questions(c: RtiContext, lang: RtiLanguage) {
  const from = fmt(c.report.createdAt, lang)
  const intro = lang === "hi" ? `माँगी गई सूचना (उपर्युक्त स्थान के लिए, ${from} से इस आवेदन के उत्तर की तिथि तक):` : `Information sought (for the location above, for the period from ${from} to the date of your reply):`
  return [intro, ...QUESTIONS[lang].map((q, i) => `${i + 1}. ${q}`)]
}

/** Full letter for printing or posting. */
export function buildRtiLetter(c: RtiContext, applicant: Applicant, lang: RtiLanguage): string {
  const a = c.authority
  const name = applicant.name.trim() || PLACEHOLDER[lang]
  const authorityName = (lang === "hi" ? a.nameHi ?? a.name : a.name) || PLACEHOLDER[lang]
  const address = a.address ?? PLACEHOLDER[lang]
  const contact = [applicant.address.trim() || PLACEHOLDER[lang], applicant.phone.trim(), applicant.email.trim()].filter(Boolean)

  if (lang === "hi") {
    return [
      "सेवा में,",
      "जन सूचना अधिकारी,",
      authorityName + ",",
      address,
      "",
      subject(c, lang),
      "",
      "महोदय/महोदया,",
      "",
      `मैं, ${name}, भारत का/की नागरिक, नीचे वर्णित सड़क दोष के संबंध में सूचना का अधिकार अधिनियम, 2005 के अंतर्गत निम्नलिखित सूचना चाहता/चाहती हूँ।`,
      "",
      "दोष का विवरण",
      ...defectLines(c, lang, 2000).map((l) => `  ${l}`),
      "",
      ...questions(c, lang),
      "",
      "मैं ₹10 का आवेदन शुल्क [भारतीय पोस्टल ऑर्डर / डिमांड ड्राफ्ट / ऑनलाइन भुगतान] द्वारा जमा कर रहा/रही हूँ। (गरीबी रेखा से नीचे के आवेदक शुल्क से मुक्त हैं; प्रमाण संलग्न करें।)",
      "यदि यह सूचना या इसका कोई भाग किसी अन्य लोक प्राधिकरण के पास है, तो कृपया धारा 6(3) के अंतर्गत आवेदन को स्थानांतरित करें।",
      "कृपया सूचना नीचे दिए गए पते या ईमेल पर भेजें।",
      "",
      `स्थान: ${PLACEHOLDER.hi}`,
      `दिनांक: ${fmt(c.today, lang)}`,
      "",
      "भवदीय,",
      "",
      name,
      ...contact,
    ].join("\n")
  }

  return [
    "To,",
    "The Public Information Officer,",
    authorityName + ",",
    address,
    "",
    subject(c, lang),
    "",
    "Sir/Madam,",
    "",
    `I, ${name}, a citizen of India, request the following information under the Right to Information Act, 2005, about the road defect described below.`,
    "",
    "Details of the defect",
    ...defectLines(c, lang, 2000).map((l) => `  ${l}`),
    "",
    ...questions(c, lang),
    "",
    "I am paying the application fee of ₹10 by [Indian Postal Order / Demand Draft / online payment]. (Applicants below the poverty line are exempt; proof attached.)",
    "If this information, or any part of it, is held by another public authority, please transfer the application under Section 6(3).",
    "Please send the information to the address or email below.",
    "",
    `Place: ${PLACEHOLDER.en}`,
    `Date: ${fmt(c.today, lang)}`,
    "",
    "Yours faithfully,",
    "",
    name,
    ...contact,
  ].join("\n")
}

/** Request text for online RTI portals: no addresses or signature, and always within RTI_ONLINE_LIMIT. */
export function buildRtiOnlineText(c: RtiContext, lang: RtiLanguage): string {
  const build = (descriptionMax: number) =>
    [subject(c, lang).replace(/^(Subject|विषय): /, ""), "", ...defectLines(c, lang, descriptionMax), "", ...questions(c, lang)].join("\n")
  for (const max of [600, 300, 120]) {
    const text = build(max)
    if (text.length <= RTI_ONLINE_LIMIT) return text
  }
  return clip(build(60), RTI_ONLINE_LIMIT)
}
