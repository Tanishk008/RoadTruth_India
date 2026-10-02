import { ImageResponse } from "next/og"
import { getExpressway } from "@/data/expressways"
import { getTariff, tolls } from "@/data/tolls"
import { calculateToll, formatFare } from "@/lib/toll"
import { OG, OG_SIZE, OgFrame, ogFonts } from "@/lib/og"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Expressway toll calculator"

export default async function Image() {
  const example = calculateToll({ tariff: getTariff("mumbai-nagpur")!, expressway: getExpressway("mumbai-nagpur")!, vehicleId: "car" })!
  return new ImageResponse(
    (
      <OgFrame badge="Toll calculator" footer={`Sourced rates for ${tolls.length} expressways`}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: 30, color: OG.muted }}>Mumbai–Nagpur · car · one way</span>
          <span style={{ fontSize: 150, fontWeight: 700, color: OG.signal, letterSpacing: -4, lineHeight: 1.1 }}>{formatFare(example.oneWay)}</span>
          <span style={{ fontSize: 44, fontWeight: 700 }}>Know your expressway toll before you drive.</span>
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
