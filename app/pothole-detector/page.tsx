import type { Metadata } from "next"
import { PageHeader } from "@/frontend/components/page-header"
import { PotholeDetector } from "./pothole-detector"

export const metadata: Metadata = {
  title: "Pothole Detector",
  description: "Upload a road photo to detect potholes, estimate severity and turn it into a report.",
}

export default function PotholeDetectorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Citizen tool"
        title="Pothole detector"
        description="Upload or take a photo of the road. We'll mark any potholes, grade how serious they are, and let you turn the result into a report with your location in one step."
      />
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <PotholeDetector />
      </div>
    </>
  )
}
