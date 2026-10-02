"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { ArrowRight, Maximize2, Minus, Plus } from "lucide-react"
import { expressways } from "@/data/expressways"
import { formatKm } from "@/lib/format"
import { fitProjection, smoothPath, type LngLat } from "@/lib/geo"
import { cn } from "@/lib/utils"
import type { AgeBucket } from "@/lib/report-age"
import type { Expressway, ExpresswayStatus, Severity } from "@/lib/types"

const CITIES: { name: string; at: LngLat; minZoom?: number }[] = [
  { name: "Delhi", at: [77.21, 28.61] },
  { name: "Mumbai", at: [72.88, 19.08] },
  { name: "Bengaluru", at: [77.59, 12.97] },
  { name: "Chennai", at: [80.27, 13.08] },
  { name: "Hyderabad", at: [78.47, 17.38] },
  { name: "Ahmedabad", at: [72.58, 23.02] },
  { name: "Jaipur", at: [75.79, 26.91] },
  { name: "Lucknow", at: [80.95, 26.85] },
  { name: "Nagpur", at: [79.09, 21.15] },
  { name: "Jammu", at: [74.86, 32.73] },
  { name: "Pune", at: [73.86, 18.52] },
  { name: "Prayagraj", at: [81.85, 25.44] },
  { name: "Dehradun", at: [78.03, 30.32] },
  { name: "Mysuru", at: [76.64, 12.3] },
  { name: "Kolkata", at: [88.36, 22.57] },
  { name: "Varanasi", at: [82.99, 25.32] },
  { name: "Raipur", at: [81.63, 21.25] },
  { name: "Visakhapatnam", at: [83.22, 17.69] },
  { name: "Vijayawada", at: [80.65, 16.51] },
  { name: "Jamnagar", at: [70.07, 22.47] },
  { name: "Amritsar", at: [74.87, 31.63] },
  // Shown only when zoomed in, to keep the all-India view clean.
  { name: "Gurugram", at: [77.03, 28.46], minZoom: 3 },
  { name: "Noida", at: [77.39, 28.54], minZoom: 3 },
  { name: "Ghaziabad", at: [77.45, 28.67], minZoom: 3 },
  { name: "Meerut", at: [77.71, 28.98], minZoom: 3 },
  { name: "Sonipat", at: [77.02, 28.99], minZoom: 3 },
  { name: "Faridabad", at: [77.32, 28.41], minZoom: 3 },
  { name: "Agra", at: [78.01, 27.18], minZoom: 2 },
  { name: "Kanpur", at: [80.35, 26.45], minZoom: 2 },
  { name: "Vadodara", at: [73.18, 22.31], minZoom: 2 },
  { name: "Surat", at: [72.83, 21.17], minZoom: 2 },
  { name: "Kota", at: [75.83, 25.18], minZoom: 2 },
  { name: "Bikaner", at: [73.31, 28.02], minZoom: 2 },
  { name: "Gaya", at: [85.0, 24.79], minZoom: 2 },
]

/** Region presets as [west, south, east, north] in degrees. */
const REGIONS: { label: string; bbox: [number, number, number, number] }[] = [
  { label: "Delhi NCR", bbox: [76.7, 27.9, 77.9, 29.2] },
  { label: "North", bbox: [74.3, 25.0, 84.0, 33.3] },
  { label: "West", bbox: [72.3, 18.4, 79.5, 25.5] },
  { label: "South", bbox: [76.2, 11.9, 80.9, 17.9] },
  { label: "East", bbox: [80.8, 16.8, 88.6, 26.2] },
]

type Layer = "Operational" | "Partially Operational" | "Under Construction" | "special"
const WIDTH = 600
const MIN_ZOOM = 1
const MAX_ZOOM = 12

interface View {
  x: number
  y: number
  w: number
  h: number
}

export interface IssuePoint {
  id: string
  at: LngLat
  severity: Severity
  age: AgeBucket
  votes: number
  label: string
}

export const severityColors: Record<Severity, string> = { low: "#0ea5e9", medium: "#f59e0b", high: "#f97316", critical: "#dc2626" }

interface NetworkMapProps {
  /** Citizen reports drawn over the network: colour = severity, ring = age, size = "me too" votes. */
  issues?: IssuePoint[]
  selectedIssueId?: string | null
  onIssueSelect?: (id: string) => void
  variant?: "dark" | "light"
  /** Dims corridors not in this list (mirrors list filters). */
  highlightIds?: string[]
  /** Controlled hover, so a side list and the map can highlight together. */
  hoveredId?: string | null
  onHoverChange?: (id: string | null) => void
  /** "full" adds region presets and layer toggles; "zoom" adds zoom buttons only. */
  controls?: "none" | "zoom" | "full"
  className?: string
  svgClassName?: string
}

export function NetworkMap({
  issues,
  selectedIssueId,
  onIssueSelect,
  variant = "dark",
  highlightIds,
  hoveredId,
  onHoverChange,
  controls = "zoom",
  className,
  svgClassName,
}: NetworkMapProps) {
  const router = useRouter()
  const dark = variant === "dark"
  const svgRef = useRef<SVGSVGElement>(null)
  const figureRef = useRef<HTMLElement>(null)
  const [internalHover, setInternalHover] = useState<string | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; maxLeft: number } | null>(null)
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ Operational: true, "Partially Operational": true, "Under Construction": true, special: true })
  const drag = useRef<{ x: number; y: number; view: View; unitsPerPx: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const hovered = hoveredId !== undefined ? hoveredId : internalHover
  const setHovered = useCallback(
    (id: string | null) => {
      setInternalHover(id)
      onHoverChange?.(id)
    },
    [onHoverChange],
  )

  const { projection, lines, base } = useMemo(() => {
    const projection = fitProjection([...expressways.flatMap((e) => e.coords), ...CITIES.filter((c) => !c.minZoom).map((c) => c.at)], WIDTH, 30)
    const lines = expressways.map((e) => {
      const pts = e.coords.map(projection.project)
      return { e, d: smoothPath(pts), start: pts[0], end: pts[pts.length - 1] }
    })
    return { projection, lines, base: { x: 0, y: 0, w: projection.width, h: projection.height } }
  }, [])

  const [view, setView] = useState<View>(base)
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])
  const zoom = base.w / view.w

  const clampView = useCallback(
    (v: View): View => {
      const w = Math.min(base.w, Math.max(base.w / MAX_ZOOM, v.w))
      const h = w * (base.h / base.w)
      return { w, h, x: Math.min(base.w - w, Math.max(0, v.x)), y: Math.min(base.h - h, Math.max(0, v.y)) }
    },
    [base],
  )

  const animRef = useRef(0)
  useEffect(() => () => cancelAnimationFrame(animRef.current), [])
  const animateTo = useCallback(
    (target: View) => {
      const to = clampView(target)
      cancelAnimationFrame(animRef.current)
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setView(to)
        return
      }
      const from = { ...viewRef.current }
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 420)
        const k = 1 - Math.pow(1 - t, 3)
        setView({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k })
        if (t < 1) animRef.current = requestAnimationFrame(step)
      }
      animRef.current = requestAnimationFrame(step)
    },
    [clampView],
  )

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number, animate = true) => {
      const v = viewRef.current
      const px = cx ?? v.x + v.w / 2
      const py = cy ?? v.y + v.h / 2
      const next = { w: v.w / factor, h: v.h / factor, x: px - (px - v.x) / factor, y: py - (py - v.y) / factor }
      if (animate) animateTo(next)
      else setView(clampView(next))
    },
    [animateTo, clampView],
  )

  const toSvg = (clientX: number, clientY: number) => {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  const fitRegion = (bbox: [number, number, number, number]) => {
    const [x1, y1] = projection.project([bbox[0], bbox[3]])
    const [x2, y2] = projection.project([bbox[2], bbox[1]])
    const aspect = base.h / base.w
    let w = x2 - x1
    let h = y2 - y1
    if (h / w > aspect) w = h / aspect
    else h = w * aspect
    animateTo({ x: (x1 + x2) / 2 - w / 2, y: (y1 + y2) / 2 - h / 2, w, h })
  }

  // Ctrl/⌘ + wheel (and trackpad pinch) zooms; plain scrolling still scrolls the page.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || controls === "none") return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const ctm = svg.getScreenCTM()
      if (!ctm) return
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
      zoomAt(Math.exp(-e.deltaY * 0.01), p.x, p.y, false)
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [controls, zoomAt])

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (controls === "none" || e.button !== 0) return
    // Use the actual render scale (the SVG may be letterboxed when its height is capped).
    const ctm = svgRef.current?.getScreenCTM()
    drag.current = { x: e.clientX, y: e.clientY, view: viewRef.current, unitsPerPx: ctm ? 1 / ctm.a : 1, moved: false }
  }
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) {
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setTip(null)
    }
    setView(clampView({ ...d.view, x: d.view.x - dx * d.unitsPerPx, y: d.view.y - dy * d.unitsPerPx }))
  }
  const onPointerUp = () => {
    suppressClick.current = !!drag.current?.moved
    drag.current = null
  }

  const strokeFor = (status: ExpresswayStatus) =>
    status === "Operational" ? (dark ? "oklch(0.78 0.15 158)" : "var(--primary)") : status === "Partially Operational" ? "var(--signal)" : dark ? "white" : "var(--muted-foreground)"

  const layerOf = (e: Expressway): Layer => (e.kind !== "Expressway" ? "special" : e.status)
  const isDimmed = (id: string) => (hovered ? hovered !== id : highlightIds ? !highlightIds.includes(id) : false)
  const hoveredExpressway = hovered ? expressways.find((e) => e.id === hovered) ?? null : null
  const hoveredLine = hovered ? lines.find((l) => l.e.id === hovered && layers[layerOf(l.e)]) : undefined

  const showTipAt = (clientX: number, clientY: number) => {
    const rect = figureRef.current?.getBoundingClientRect()
    if (rect) setTip({ x: clientX - rect.left, y: clientY - rect.top, maxLeft: rect.width - 272 })
  }

  const unit = 1 / zoom // keeps dots and labels the same on-screen size at any zoom
  const muted = dark ? "text-white/60" : "text-muted-foreground"
  const strong = dark ? "text-white" : "text-foreground"

  return (
    <figure ref={figureRef} className={cn("relative select-none", className)}>
      {controls === "full" && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {REGIONS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => fitRegion(r.bbox)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all hover:-translate-y-0.5",
                dark ? "border-white/20 text-white/80 hover:border-signal hover:text-signal" : "bg-card hover:border-primary hover:text-primary",
              )}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => animateTo(base)}
            className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors", dark ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-foreground")}
          >
            All India
          </button>
        </div>
      )}

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className={cn("w-full h-auto touch-pan-y", controls !== "none" && "cursor-grab active:cursor-grabbing", svgClassName)}
          role="img"
          aria-label="Schematic map of the expressway network covered on this site"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => {
            if (controls === "none") return
            const p = toSvg(e.clientX, e.clientY)
            if (p) zoomAt(2, p.x, p.y)
          }}
          onMouseLeave={() => {
            setHovered(null)
            setTip(null)
          }}
        >
          {CITIES.filter((c) => zoom >= (c.minZoom ?? 0)).map((c) => {
            const [x, y] = projection.project(c.at)
            return (
              <g key={c.name} className="pointer-events-none">
                <circle cx={x} cy={y} r={3.5 * unit} className={dark ? "fill-white/70" : "fill-foreground/60"} />
                <text x={x + 7 * unit} y={y + 4 * unit} fontSize={12 * unit} className={cn("font-medium", dark ? "fill-white/55" : "fill-foreground/55")}>
                  {c.name}
                </text>
              </g>
            )
          })}

          {lines.map(({ e, d }, i) =>
            layers[layerOf(e)] ? (
              <a
                key={e.id}
                href={`/expressways/${e.id}`}
                aria-label={`${e.name}, ${formatKm(e.lengthKm)}, ${e.status}`}
                onClick={(ev) => {
                  ev.preventDefault()
                  if (suppressClick.current) {
                    suppressClick.current = false
                    return
                  }
                  router.push(`/expressways/${e.id}`)
                }}
                onMouseEnter={(ev) => {
                  setHovered(e.id)
                  showTipAt(ev.clientX, ev.clientY)
                }}
                onMouseMove={(ev) => !drag.current?.moved && showTipAt(ev.clientX, ev.clientY)}
                onFocus={() => {
                  setHovered(e.id)
                  setTip(null)
                }}
                onBlur={() => setHovered(null)}
                className="outline-none cursor-pointer transition-opacity duration-200"
                style={{ opacity: isDimmed(e.id) ? 0.15 : 1 }}
              >
                <path d={d} fill="none" stroke="transparent" strokeWidth={20} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
                <path
                  d={d}
                  fill="none"
                  stroke={strokeFor(e.status)}
                  strokeWidth={hovered === e.id ? 6 : 3.2}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={e.status === "Operational" ? undefined : e.status === "Under Construction" ? "3 6" : "8 6"}
                  className={cn("transition-[stroke-width] duration-200", e.status === "Operational" ? "animate-fade-up" : "animate-lane")}
                  style={{ animationDelay: e.status === "Operational" ? `${i * 45}ms` : undefined }}
                />
              </a>
            ) : null,
          )}

          {issues && (
            <g aria-hidden>
              {issues.map((p) => {
                const [x, y] = projection.project(p.at)
                const r = Math.min(4 + 2 * Math.sqrt(p.votes), 12) * unit
                const selected = p.id === selectedIssueId
                const resolved = p.age === "resolved"
                return (
                  <g
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (suppressClick.current) {
                        suppressClick.current = false
                        return
                      }
                      onIssueSelect?.(p.id)
                    }}
                  >
                    <title>{p.label}</title>
                    {p.age === "overdue" && (
                      <circle cx={x} cy={y} r={r + 3.5 * unit} fill="none" stroke={severityColors[p.severity]} strokeWidth={1.5} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={selected ? r * 1.5 : r}
                      fill={resolved ? "transparent" : severityColors[p.severity]}
                      fillOpacity={p.age === "new" ? 1 : 0.8}
                      stroke={resolved ? severityColors[p.severity] : selected ? (dark ? "white" : "black") : dark ? "rgba(255,255,255,0.85)" : "white"}
                      strokeWidth={selected ? 3 : resolved ? 2 : 1.2}
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                )
              })}
            </g>
          )}

          {hoveredLine && (
            <g className="pointer-events-none">
              {[hoveredLine.start, hoveredLine.end].map(([x, y], k) => (
                <circle
                  key={k}
                  cx={x}
                  cy={y}
                  r={6 * unit}
                  strokeWidth={2.5}
                  vectorEffect="non-scaling-stroke"
                  className={k === 0 ? (dark ? "fill-ink stroke-white" : "fill-card stroke-foreground") : dark ? "fill-white stroke-white" : "fill-foreground stroke-foreground"}
                />
              ))}
            </g>
          )}
        </svg>

        {controls !== "none" && (
          <div className={cn("absolute right-2 top-2 flex flex-col overflow-hidden rounded-md border shadow-sm", dark ? "border-white/15 bg-ink/80 backdrop-blur" : "bg-card")}>
            <ControlButton label="Zoom in" dark={dark} disabled={zoom >= MAX_ZOOM - 0.01} onClick={() => zoomAt(1.6)}>
              <Plus className="size-4" />
            </ControlButton>
            <ControlButton label="Zoom out" dark={dark} disabled={zoom <= MIN_ZOOM + 0.01} onClick={() => zoomAt(1 / 1.6)}>
              <Minus className="size-4" />
            </ControlButton>
            <ControlButton label="Reset view" dark={dark} disabled={zoom <= MIN_ZOOM + 0.01} onClick={() => animateTo(base)}>
              <Maximize2 className="size-4" />
            </ControlButton>
          </div>
        )}

        {/* Tooltip follows the pointer; docks bottom-left for keyboard focus or list hover. */}
        <div
          className={cn(
            "pointer-events-none absolute z-10 w-64 rounded-lg border p-3.5 shadow-xl transition-opacity duration-150",
            dark ? "bg-ink/95 border-white/15 text-white backdrop-blur" : "bg-card/95 backdrop-blur",
            hoveredExpressway ? "opacity-100" : "opacity-0",
          )}
          style={tip ? { left: Math.max(0, Math.min(tip.x + 16, tip.maxLeft)), top: Math.max(tip.y - 20, 0) } : { left: 12, bottom: 12 }}
          aria-live="polite"
        >
          {hoveredExpressway && (
            <>
              <p className={cn("text-[10px] uppercase tracking-[0.14em] mb-1", muted)}>
                {hoveredExpressway.kind} · {hoveredExpressway.status === "Partially Operational" ? "Partially open" : hoveredExpressway.status}
              </p>
              <p className="font-display font-bold text-base leading-tight">{hoveredExpressway.name}</p>
              <dl className={cn("mt-2 grid grid-cols-3 gap-2 text-xs", muted)}>
                <div>
                  <dt>Length</dt>
                  <dd className={cn("font-mono font-semibold", strong)}>{formatKm(hoveredExpressway.lengthKm)}</dd>
                </div>
                <div>
                  <dt>{hoveredExpressway.openedYear ? "Opened" : "Target"}</dt>
                  <dd className={cn("font-mono font-semibold", strong)}>{hoveredExpressway.openedYear ?? hoveredExpressway.targetYear}</dd>
                </div>
                <div>
                  <dt>Builders</dt>
                  <dd className={cn("font-mono font-semibold", strong)}>{hoveredExpressway.packages.length || "—"}</dd>
                </div>
              </dl>
              <p className={cn("mt-2 text-xs", muted)}>{hoveredExpressway.states.join(" · ")}</p>
              <p className={cn("mt-2 text-xs font-semibold", dark ? "text-signal" : "text-primary")}>Click to open →</p>
            </>
          )}
        </div>
      </div>

      <figcaption className={cn("mt-3 flex flex-wrap items-center gap-2 text-xs", muted)}>
        {(
          [
            ["Operational", "Operational", dark ? "oklch(0.78 0.15 158)" : "var(--primary)", false],
            ["Partially Operational", "Partially open", "var(--signal)", true],
            ["Under Construction", "Under construction", dark ? "rgba(255,255,255,0.75)" : "var(--muted-foreground)", true],
            ["special", "Ring roads & sea links", dark ? "oklch(0.78 0.15 158)" : "var(--primary)", false],
          ] as const
        ).map(([key, label, color, dashed]) => (
          <button
            key={key}
            type="button"
            aria-pressed={layers[key]}
            onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
            disabled={controls === "none"}
            title={controls === "none" ? undefined : `Show or hide: ${label}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 transition-all disabled:cursor-default",
              dark ? "border-white/15" : "bg-card",
              controls !== "none" && (dark ? "hover:border-white/40" : "hover:border-foreground/30"),
              !layers[key] && "opacity-40 line-through",
            )}
          >
            <svg width="20" height="8" aria-hidden>
              {key === "special" ? (
                <circle cx="10" cy="4" r="3" fill="none" stroke={color} strokeWidth="2" />
              ) : (
                <line x1="1" y1="4" x2="19" y2="4" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed ? "5 4" : undefined} />
              )}
            </svg>
            {label}
          </button>
        ))}
        {controls !== "none" && (
          <span className="ml-auto hidden md:inline">
            Drag to pan · <kbd className="font-mono">⌘/Ctrl</kbd> + scroll to zoom{zoom > 1.01 ? ` · ${zoom.toFixed(1)}×` : ""}
          </span>
        )}
      </figcaption>
      {controls === "zoom" && (
        <Link href="/map" className={cn("group mt-3 inline-flex items-center gap-1 text-sm font-semibold", dark ? "text-signal" : "text-primary")}>
          <span className="link-grow">Open the full interactive map</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </figure>
  )
}

function ControlButton({ label, dark, disabled, onClick, children }: { label: string; dark: boolean; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center border-b last:border-b-0 transition-colors disabled:opacity-30",
        dark ? "border-white/10 text-white/80 hover:bg-white/10" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
