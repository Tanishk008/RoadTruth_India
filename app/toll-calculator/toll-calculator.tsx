"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowRight, ArrowUpDown, ExternalLink, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { RouteSparkline } from "@/frontend/components/route-sparkline"
import { getExpressway } from "@/data/expressways"
import { getTariff, tolls, type TollTariff } from "@/data/tolls"
import { formatDate } from "@/lib/format"
import { calculateToll, formatFare, stopChainage } from "@/lib/toll"
import { cn } from "@/lib/utils"

const confidenceStyles: Record<TollTariff["confidence"], { label: string; className: string }> = {
  official: { label: "Official rate", className: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30" },
  reported: { label: "Reported rate", className: "bg-sky-400/15 text-sky-300 border-sky-400/30" },
  estimate: { label: "Estimate", className: "bg-amber-400/15 text-amber-300 border-amber-400/30" },
}

const byName = [...tolls].sort((a, b) => getExpressway(a.expresswayId)!.name.localeCompare(getExpressway(b.expresswayId)!.name))

export function TollCalculator() {
  const params = useSearchParams()
  const initial = getTariff(params.get("route") ?? "") ?? getTariff("mumbai-nagpur")!

  const [routeId, setRouteId] = useState(initial.expresswayId)
  const [vehicleId, setVehicleId] = useState(initial.vehicles[0].id)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(getExpressway(initial.expresswayId)!.mapStops.length - 1)
  const [returnTrip, setReturnTrip] = useState(false)
  const [withoutFastag, setWithoutFastag] = useState(false)

  const tariff = getTariff(routeId)!
  const expressway = getExpressway(routeId)!
  const partialTrips = tariff.kind === "per-km" && stopChainage(expressway) !== null
  const result = calculateToll({ tariff, expressway, vehicleId, from, to, returnTrip, withoutFastag })
  const confidence = confidenceStyles[tariff.confidence]

  function chooseRoute(id: string) {
    const t = getTariff(id)!
    setRouteId(id)
    setVehicleId(t.vehicles.find((v) => v.id === vehicleId)?.id ?? t.vehicles[0].id)
    setFrom(0)
    setTo(getExpressway(id)!.mapStops.length - 1)
  }

  const comparison = useMemo(
    () =>
      tolls
        .map((t) => {
          const e = getExpressway(t.expresswayId)!
          const r = calculateToll({ tariff: t, expressway: e, vehicleId: t.vehicles[0].id })!
          const perKm = Array.isArray(r.perKm) ? (r.perKm[0] + r.perKm[1]) / 2 : r.perKm
          return { t, e, r, perKm }
        })
        .sort((a, b) => a.perKm - b.perKm),
    [],
  )
  const maxPerKm = Math.max(...comparison.map((c) => c.perKm))

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-14">
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <section className="lg:col-span-7 rounded-xl border bg-card p-6 md:p-8 space-y-7" aria-label="Trip details">
          <div>
            <label htmlFor="route" className="text-sm font-semibold mb-2 block">Expressway</label>
            <Select value={routeId} onValueChange={chooseRoute}>
              <SelectTrigger id="route" className="w-full h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {byName.map((t) => (
                  <SelectItem key={t.expresswayId} value={t.expresswayId}>{getExpressway(t.expresswayId)!.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Showing the {tolls.length} corridors with sourced toll data. More will be added as rates are verified.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold mb-2">Vehicle</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {tariff.vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleId(v.id)}
                  aria-pressed={vehicleId === v.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-all",
                    vehicleId === v.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30 hover:-translate-y-0.5",
                  )}
                >
                  <span className="font-medium">{v.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatFare(v.fare)}
                    {tariff.kind === "per-km" ? "/km" : ""}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {partialTrips ? (
            <div className="grid sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div>
                <label htmlFor="from" className="text-sm font-semibold mb-2 block">Enter at</label>
                <Select value={String(from)} onValueChange={(v) => setFrom(Number(v))}>
                  <SelectTrigger id="from" className="w-full h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expressway.mapStops.map((s, i) => <SelectItem key={s} value={String(i)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => { setFrom(to); setTo(from) }}
                aria-label="Swap entry and exit"
                className="mb-1 flex size-9 items-center justify-center rounded-full border transition-all hover:rotate-180 hover:border-primary hover:text-primary"
              >
                <ArrowUpDown className="size-4" />
              </button>
              <div>
                <label htmlFor="to" className="text-sm font-semibold mb-2 block">Exit at</label>
                <Select value={String(to)} onValueChange={(v) => setTo(Number(v))}>
                  <SelectTrigger id="to" className="w-full h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expressway.mapStops.map((s, i) => <SelectItem key={s} value={String(i)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/60 p-4 text-sm">
              <p className="font-semibold mb-1">Full corridor, one fare</p>
              <p className="text-muted-foreground">{expressway.route}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Toggle checked={returnTrip} onChange={setReturnTrip} label="Return trip" hint="×2" />
            <Toggle checked={withoutFastag} onChange={setWithoutFastag} label="No valid FASTag" hint="up to ×2" />
          </div>
        </section>

        {/* Result */}
        <section className="lg:col-span-5 relative overflow-hidden rounded-xl bg-ink text-ink-foreground p-6 md:p-8" aria-live="polite" aria-label="Estimated toll">
          <div className="absolute inset-0 bg-survey text-white" aria-hidden />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 mb-6">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", confidence.className)}>{confidence.label}</span>
              <div className="[&_.fill-card]:fill-ink [&_.stroke-foreground]:stroke-white [&_.fill-foreground]:fill-white">
                <RouteSparkline expressway={expressway} className="h-12" />
              </div>
            </div>

            {result ? (
              <>
                <p className="text-sm text-white/60">{returnTrip ? "Return trip" : "One way"} · {expressway.name}</p>
                <p className="font-display text-5xl md:text-6xl font-extrabold tracking-tight my-2 text-signal tabular">
                  {formatFare(result.total)}
                </p>
                <dl className="mt-4 divide-y divide-white/10 border-y border-white/10 text-sm">
                  <Row label="Distance" value={`${result.distanceIsEstimate ? "≈ " : ""}${result.distanceKm.toLocaleString("en-IN")} km`} />
                  <Row label="One-way fare" value={formatFare(result.oneWay)} />
                  <Row label="Works out to" value={`${formatFare(result.perKm)} per km`} />
                  {tariff.validFrom && (
                    <Row label="Rates valid" value={`${formatDate(tariff.validFrom)}${tariff.validUntil ? ` – ${formatDate(tariff.validUntil)}` : " onwards"}`} />
                  )}
                </dl>
              </>
            ) : (
              <p className="text-white/70 py-10">Choose different entry and exit points.</p>
            )}

            <div className="mt-5 space-y-2 text-xs text-white/60">
              {tariff.note && <p className="flex gap-2"><Info className="size-3.5 mt-0.5 shrink-0" />{tariff.note}</p>}
              {result?.distanceIsEstimate && (
                <p className="flex gap-2"><Info className="size-3.5 mt-0.5 shrink-0" />Partial-trip distance is estimated from the stops&apos; positions; plaza fares may differ slightly.</p>
              )}
              {withoutFastag && <p className="flex gap-2"><Info className="size-3.5 mt-0.5 shrink-0" />Vehicles without a valid FASTag can be charged up to double at plazas.</p>}
              {returnTrip && <p className="flex gap-2"><Info className="size-3.5 mt-0.5 shrink-0" />Some plazas offer a discount on returns within 24 hours.</p>}
            </div>

            <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <a href={tariff.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-white/70 hover:text-white">
                <span className="link-grow">Source</span> <ExternalLink className="size-3.5" />
              </a>
              <Link href={`/expressways/${expressway.id}`} className="group inline-flex items-center gap-1 font-semibold text-signal">
                <span className="link-grow">Corridor details</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Comparison */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">Compare</p>
        <h2 className="text-3xl font-bold mb-2">What each expressway charges per km</h2>
        <p className="text-muted-foreground mb-6">Car, one way, full corridor. Click a row to calculate it above.</p>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Expressway</th>
                <th className="px-4 py-3 font-semibold text-right">Car fare</th>
                <th className="px-4 py-3 font-semibold w-1/3">Per km</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(({ t, e, r, perKm }) => (
                <tr
                  key={t.expresswayId}
                  onClick={() => { chooseRoute(t.expresswayId); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                  className={cn("group border-t cursor-pointer transition-colors hover:bg-primary/5", routeId === t.expresswayId && "bg-primary/5")}
                >
                  <td className="px-4 py-3 font-semibold group-hover:text-primary">{e.name}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">{formatFare(r.oneWay)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                        <span className="block h-full rounded-full bg-primary/70 transition-all group-hover:bg-primary" style={{ width: `${(perKm / maxPerKm) * 100}%` }} />
                      </span>
                      <span className="font-mono text-xs tabular w-14 text-right">₹{perKm.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{confidenceStyles[t.confidence].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Short urban links like Atal Setu cost more per km because they carry very expensive structures (sea bridges, tunnels)
          over short distances.
        </p>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-white/60">{label}</dt>
      <dd className="font-mono font-medium text-right">{value}</dd>
    </div>
  )
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        checked ? "border-primary bg-primary/5" : "hover:border-foreground/30",
      )}
    >
      <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted-foreground/30")}>
        <span className={cn("absolute left-0 top-0.5 size-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
      {label}
      <span className="font-mono text-xs text-muted-foreground">{hint}</span>
    </button>
  )
}
