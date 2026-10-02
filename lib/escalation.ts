import { mapsLink } from "@/lib/geolocation"
import { issueTypeLabels } from "@/lib/site"
import type { RtiContext } from "@/lib/rti"

/** Keep comfortably under portal limits (CPGRAMS allows a few thousand characters). */
export const GRIEVANCE_MAX = 2000

/** What to say on the 1033 helpline call: short lines you can read out. */
export function helplineScript(c: RtiContext): string[] {
  const r = c.report
  return [
    `I want to register a complaint about a ${issueTypeLabels[r.issueType].toLowerCase()} on ${c.roadName || "the highway"}.`,
    `Location: ${r.location}.`,
    ...(r.latitude !== undefined && r.longitude !== undefined ? [`GPS coordinates: ${r.latitude}, ${r.longitude}.`] : []),
    `It is ${r.severity} severity and has been unresolved for ${c.days} day${c.days === 1 ? "" : "s"}.`,
    `It is also publicly reported as ${r.reference} on Road Truth India.`,
    "Please register it and give me the complaint number.",
  ]
}

/** Pre-written grievance for CPGRAMS or a state portal. */
export function grievanceText(c: RtiContext): string {
  const r = c.report
  const lines = [
    `Unrepaired ${issueTypeLabels[r.issueType].toLowerCase()} on ${c.roadName || "a highway"}${c.authority.name ? ` (${c.authority.name})` : ""}.`,
    "",
    `Location: ${r.location}`,
    ...(r.latitude !== undefined && r.longitude !== undefined ? [`GPS: ${r.latitude}, ${r.longitude} (${mapsLink(r.latitude, r.longitude)})`] : []),
    `Severity: ${r.severity}`,
    `First reported: ${new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} (${c.days} days ago), reference ${r.reference}`,
    `Public report with photos: ${c.trackUrl}`,
    "",
    `Details: ${r.description}`,
    "",
    "This is a safety risk to road users. I request that the defect be repaired urgently, and that I be informed of the action taken and the agency responsible.",
  ]
  const text = lines.join("\n")
  return text.length > GRIEVANCE_MAX ? `${text.slice(0, GRIEVANCE_MAX - 1)}…` : text
}
