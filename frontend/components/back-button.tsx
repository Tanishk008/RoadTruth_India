"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { navHistory } from "@/frontend/components/nav-tracker"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  /** Where to go when there is no in-site history (e.g. the page was opened from a shared link). */
  fallbackHref: string
  label?: string
  className?: string
}

export function BackButton({ fallbackHref, label = "Back", className }: BackButtonProps) {
  const router = useRouter()

  function goBack() {
    // Only step back if we arrived here by navigating within the site; otherwise go to the listing page.
    if (navHistory.inSiteNavigations > 0) router.back()
    else router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all hover:-translate-x-0.5",
        className,
      )}
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </button>
  )
}
