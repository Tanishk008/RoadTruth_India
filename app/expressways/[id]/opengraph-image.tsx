import { ImageResponse } from "next/og"
import { expressways, getExpressway } from "@/data/expressways"
import { formatCrore, formatDate, formatKm } from "@/lib/format"
import { OG, OG_SIZE, OgFrame, OgRoutes, OgStat, ogFonts } from "@/lib/og"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Expressway summary card"

export function generateStaticParams() {
  return expressways.map((e) => ({ id: e.id }))
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const e = getExpressway((await params).id)!
  const status = e.status === "Partially Operational" ? "Partially open" : e.status
  const when = e.openedOn ? formatDate(e.openedOn) : String(e.openedYear ?? e.targetYear ?? "—")
  const titleSize = e.name.length > 30 ? 60 : 76

  return new ImageResponse(
    (
      <OgFrame badge={status} footer={`${e.kind} · ${e.states.join(", ")}`}>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            {e.aka && <span style={{ fontSize: 26, color: OG.signal, marginBottom: 8 }}>{e.aka}</span>}
            <span style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{e.name}</span>
            <div style={{ display: "flex", marginTop: 40 }}>
              <OgStat label="Length" value={formatKm(e.lengthKm)} />
              {e.costCrore ? <OgStat label="Cost" value={formatCrore(e.costCrore)} /> : null}
              <OgStat label={e.openedYear ? "Opened" : "Target"} value={when} />
            </div>
          </div>
          <OgRoutes
            routes={[{ coords: e.coords, color: e.status === "Operational" ? OG.greenBright : e.status === "Under Construction" ? "rgba(250,248,243,0.8)" : OG.signal, dashed: e.status !== "Operational" }]}
            size={360}
          />
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
