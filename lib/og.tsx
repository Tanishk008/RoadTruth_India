/* Share-card (Open Graph) building blocks. Rendered by next/og (Satori): inline styles only, flex layout. */
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { ReactNode } from "react"
import { fitProjection, smoothPath, type LngLat } from "@/lib/geo"

export const OG_SIZE = { width: 1200, height: 630 }

export const OG = {
  ink: "#111c2d",
  paper: "#faf8f3",
  green: "#0e6b43",
  greenBright: "#4fd197",
  signal: "#f2bd2a",
  muted: "rgba(250,248,243,0.62)",
  line: "rgba(250,248,243,0.12)",
}

export async function ogFonts() {
  const dir = path.join(process.cwd(), "assets/fonts")
  const [regular, bold] = await Promise.all([readFile(path.join(dir, "IBMPlexSans-Regular.woff")), readFile(path.join(dir, "IBMPlexSans-Bold.woff"))])
  return [
    { name: "Plex", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Plex", data: bold, weight: 700 as const, style: "normal" as const },
  ]
}

function Logo() {
  return (
    <svg width="56" height="56" viewBox="0 0 40 40">
      <rect x="1" y="1" width="38" height="38" rx="7" fill={OG.green} />
      <rect x="3.5" y="3.5" width="33" height="33" rx="5" fill="none" stroke="white" strokeWidth="1.5" />
      <path d="M9 31 C 16 26, 22 16, 31 9" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M9 31 C 16 26, 22 16, 31 9" stroke={OG.signal} strokeWidth="1.4" strokeDasharray="3 3" fill="none" />
    </svg>
  )
}

/** A route (or several) drawn as lines, fitted into a box. */
export function OgRoutes({ routes, size = 380 }: { routes: { coords: LngLat[]; color: string; dashed?: boolean; width?: number }[]; size?: number }) {
  const all = routes.flatMap((r) => r.coords)
  const proj = fitProjection(all, size, 24, size)
  return (
    <svg width={proj.width} height={proj.height} viewBox={`0 0 ${proj.width} ${proj.height}`}>
      {routes.map((r, i) => {
        const pts = r.coords.map(proj.project)
        return (
          <path
            key={i}
            d={smoothPath(pts)}
            fill="none"
            stroke={r.color}
            strokeWidth={r.width ?? 9}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={r.dashed ? "18 14" : undefined}
          />
        )
      })}
      {routes.length === 1 &&
        [routes[0].coords[0], routes[0].coords[routes[0].coords.length - 1]].map((c, i) => {
          const [x, y] = proj.project(c)
          return <circle key={i} cx={x} cy={y} r={12} fill={i === 0 ? OG.ink : OG.paper} stroke={OG.paper} strokeWidth={5} />
        })}
    </svg>
  )
}

export function OgStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 48 }}>
      <span style={{ fontSize: 18, letterSpacing: 3, textTransform: "uppercase", color: OG.muted }}>{label}</span>
      <span style={{ fontSize: 40, fontWeight: 700, color: OG.paper, marginTop: 4 }}>{value}</span>
    </div>
  )
}

/** Shared frame: survey grid, logo + site name, optional badge, content, footer. */
export function OgFrame({ badge, children, footer }: { badge?: string; children: ReactNode; footer: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        backgroundColor: OG.ink,
        backgroundImage: `linear-gradient(${OG.line} 1px, transparent 1px), linear-gradient(90deg, ${OG.line} 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        color: OG.paper,
        fontFamily: "Plex",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Logo />
          <span style={{ fontSize: 28, fontWeight: 700, marginLeft: 16 }}>Road Truth India</span>
        </div>
        {badge && (
          <span style={{ display: "flex", fontSize: 22, fontWeight: 700, color: OG.ink, backgroundColor: OG.signal, padding: "8px 18px", borderRadius: 999 }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flex: 1 }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: OG.muted, borderTop: `1px solid ${OG.line}`, paddingTop: 20 }}>
        <span>{footer}</span>
        <span>Independent · sourced · open</span>
      </div>
    </div>
  )
}
