import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/frontend/components/page-header"
import { TollCalculator } from "./toll-calculator"

export const metadata: Metadata = {
  title: "Toll calculator",
  description: "Estimate expressway tolls by vehicle, entry and exit, with sourced rates for Samruddhi, Mumbai–Pune, Yamuna and more.",
}

export default function TollCalculatorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Plan your trip"
        title="Toll calculator"
        description="Estimate what you'll pay on India's expressways. Every rate links to its source and says whether it's official, reported or an estimate."
      />
      <Suspense>
        <TollCalculator />
      </Suspense>
    </>
  )
}
