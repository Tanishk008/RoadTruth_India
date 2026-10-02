import { ImageResponse } from "next/og"
import { contractors, getContractor } from "@/data/contractors"
import { expressways } from "@/data/expressways"
import { monogram } from "@/lib/format"
import { OG, OG_SIZE, OgFrame, OgRoutes, OgStat, ogFonts } from "@/lib/og"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Contractor summary card"

export function generateStaticParams() {
  return contractors.map((c) => ({ id: c.id }))
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const c = getContractor((await params).id)!
  const routes = expressways.map((e) => ({
    coords: e.coords,
    color: c.expresswayIds.includes(e.id) ? OG.greenBright : "rgba(250,248,243,0.14)",
    width: c.expresswayIds.includes(e.id) ? 8 : 4,
  }))

  return new ImageResponse(
    (
      <OgFrame badge="Contractor" footer={`${c.headquarters.split(" (")[0]} · est. ${c.founded}`}>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: 12, backgroundColor: OG.green, fontSize: 36, fontWeight: 700 }}>
                {monogram(c.name)}
              </span>
              <span style={{ fontSize: 24, color: OG.muted, marginLeft: 20 }}>{c.listing}</span>
            </div>
            <span style={{ fontSize: c.name.length > 28 ? 56 : 70, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{c.name}</span>
            <div style={{ display: "flex", marginTop: 36 }}>
              <OgStat label="Corridors" value={String(c.expresswayIds.length)} />
              {c.revenueFY25 ? <OgStat label="Revenue FY25" value={c.revenueFY25.replace(/ \(.*\)$/, "")} /> : null}
            </div>
          </div>
          <OgRoutes routes={routes} size={360} />
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
