"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

/** Shared, module-level: survives client-side navigations, resets on full page load. */
export const navHistory = { inSiteNavigations: 0 }

/** Counts client-side route changes so BackButton knows whether "back" stays on this site. */
export function NavTracker() {
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    navHistory.inSiteNavigations++
  }, [pathname])
  return null
}
