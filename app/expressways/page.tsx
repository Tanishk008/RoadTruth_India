import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/frontend/components/page-header"
import { expressways } from "@/data/expressways"
import { formatKm } from "@/lib/format"
import { ExpresswayBrowser } from "./expressway-browser"

export const metadata: Metadata = {
  title: "Expressways",
  description: "Length, cost, status, builders and route maps of India's major expressways, with sources.",
}

export default function ExpresswaysPage() {
  const km = expressways.reduce((s, e) => s + e.lengthKm, 0)
  return (
    <>
      <PageHeader
        eyebrow="The network"
        title="India's expressways"
        description={
          <>
            {expressways.length} corridors and {formatKm(km)} of access-controlled road, each with a route map, its builders and its
            sources. Spotted a mistake? <Link href="/contact" className="text-primary link-grow">Tell us</Link>.
          </>
        }
      />
      <ExpresswayBrowser />
    </>
  )
}
