import type { Metadata } from "next"
import { PageHeader } from "@/frontend/components/page-header"
import { expressways } from "@/data/expressways"
import { NetworkExplorer } from "./network-explorer"

export const metadata: Metadata = {
  title: "Network map",
  description: "Interactive map of India's expressway network and citizen-reported road issues, coloured by severity and age.",
}

export default function MapPage() {
  return (
    <>
      <PageHeader
        eyebrow="Interactive"
        title="Network map"
        description={`All ${expressways.length} corridors on one map, plus every pothole and hazard citizens have reported. Switch to “Reported issues” to see them by severity and age.`}
      />
      <NetworkExplorer />
    </>
  )
}
