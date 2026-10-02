import { ImageResponse } from "next/og"
import { contractors } from "@/data/contractors"
import { expressways } from "@/data/expressways"
import { formatKm } from "@/lib/format"
import { OG, OG_SIZE, OgFrame, OgRoutes, OgStat, ogFonts } from "@/lib/og"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Road Truth India – expressway transparency portal"

export default async function Image() {
  const km = expressways.reduce((s, e) => s + e.lengthKm, 0)
  const routes = expressways.map((e) => ({
    coords: e.coords,
    color: e.status === "Operational" ? OG.greenBright : e.status === "Under Construction" ? "rgba(250,248,243,0.7)" : OG.signal,
    dashed: e.status !== "Operational",
    width: 6,
  }))

  return new ImageResponse(
    (
      <OgFrame footer="Expressways · contractors · tolls · pothole reports">
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
            <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>Every expressway.</span>
            <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>Every builder.</span>
            <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5, color: OG.signal }}>Every pothole.</span>
            <div style={{ display: "flex", marginTop: 40 }}>
              <OgStat label="Corridors" value={String(expressways.length)} />
              <OgStat label="Length" value={formatKm(km)} />
              <OgStat label="Builders" value={String(contractors.length)} />
            </div>
          </div>
          <OgRoutes routes={routes} size={400} />
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
