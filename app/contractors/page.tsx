import type { Metadata } from "next"
import { PageHeader } from "@/frontend/components/page-header"
import { contractors } from "@/data/contractors"
import { ContractorDirectory } from "./contractor-directory"

export const metadata: Metadata = {
  title: "Contractors",
  description: "Companies that built India's expressways, with the packages they delivered and public financials.",
}

export default function ContractorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Accountability"
        title="Contractors directory"
        description={`${contractors.length} companies behind the corridors on this site, with the work they delivered. Figures come from company filings and reported results. We don't publish star ratings, because no independent public quality score exists yet.`}
      />
      <ContractorDirectory />
    </>
  )
}
