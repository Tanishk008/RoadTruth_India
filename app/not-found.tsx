import Link from "next/link"
import { Button } from "@/frontend/components/ui/button"

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-sm font-semibold text-accent mb-2">404</p>
      <h1 className="text-4xl font-bold mb-4">Road closed</h1>
      <p className="text-muted-foreground mb-8">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="flex gap-3 justify-center">
        <Button asChild><Link href="/">Go home</Link></Button>
        <Button asChild variant="outline"><Link href="/report-issue">Report an issue</Link></Button>
      </div>
    </div>
  )
}
