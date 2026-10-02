import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/frontend/components/page-header"
import { T } from "@/frontend/components/i18n"
import { TrackReports } from "./track-reports"

export const metadata: Metadata = {
  title: "Track a Report",
  description: "Check the status of a road issue report using its reference number.",
}

export default function TrackPage() {
  return (
    <>
      <PageHeader eyebrow={<T k="track.eyebrow" />} title={<T k="track.title" />} description={<T k="track.lead" />} />
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-10">
        <Suspense>
          <TrackReports />
        </Suspense>
      </div>
    </>
  )
}
