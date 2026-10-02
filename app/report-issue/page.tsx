import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/frontend/components/page-header"
import { T } from "@/frontend/components/i18n"
import { ReportForm } from "./report-form"

export const metadata: Metadata = {
  title: "Report a Road Issue",
  description: "Report potholes, road damage, waterlogging and other hazards on India's expressways.",
}

export default function ReportIssuePage() {
  return (
    <>
      <PageHeader
        eyebrow={<T k="report.eyebrow" />}
        title={<T k="report.title" />}
        description={<T k="report.lead" />}
      />
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <Suspense>
          <ReportForm />
        </Suspense>
      </div>
    </>
  )
}
