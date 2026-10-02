const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })

/** 96547 → "₹96,547 Cr"; 196547 → "₹1.97 lakh Cr". */
export function formatCrore(crore: number): string {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(2)} lakh Cr`
  return `₹${inr.format(crore)} Cr`
}

export function formatKm(km: number): string {
  return `${inr.format(Math.round(km))} km`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

/** "Dilip Buildcon Ltd." → "DB"; acronym-led names keep the acronym ("IRB …" → "IRB"). */
export function monogram(name: string): string {
  const first = name.split(" ")[0]
  if (/^[A-Z]{2,4}$/.test(first)) return first // IRB, NCC, PNC
  return name
    .replace(/\(.*?\)|Ltd\.|Limited/g, "")
    .split(/[\s&.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}
