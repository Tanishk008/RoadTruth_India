import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/frontend/components/page-header"
import { T } from "@/frontend/components/i18n"
import { RtiBuilder } from "./rti-builder"

export const metadata: Metadata = {
  title: "Draft an RTI request",
  description: "Turn a road report that has gone unresolved for 30 days into a Right to Information application.",
  robots: { index: false },
}

export default function RtiPage() {
  return (
    <>
      <PageHeader eyebrow="RTI Act, 2005" title={<T k="rti.title" />} description={<T k="rti.lead" />} className="print:hidden" />
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <Suspense>
          <RtiBuilder />
        </Suspense>
      </div>
    </>
  )
}
