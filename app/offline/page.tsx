import type { Metadata } from "next"
import Link from "next/link"
import { CloudOff } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { T } from "@/frontend/components/i18n"

export const metadata: Metadata = { title: "Offline", robots: { index: false } }

/** Served by the service worker when a page isn't cached and there's no connection. */
export default function OfflinePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CloudOff className="size-12 mx-auto text-muted-foreground mb-6" />
      <h1 className="text-3xl font-bold mb-3"><T k="offline.title" /></h1>
      <p className="text-muted-foreground mb-8"><T k="offline.lead" /></p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild><Link href="/report-issue"><T k="nav.report" /></Link></Button>
        <Button asChild variant="outline"><Link href="/track"><T k="nav.track" /></Link></Button>
      </div>
    </div>
  )
}
