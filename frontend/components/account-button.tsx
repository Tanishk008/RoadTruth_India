"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/frontend/components/ui/button"
import { useT } from "@/frontend/components/i18n"
import { createClient } from "@/backend/supabase/client"
import { AUTH_ENABLED } from "@/backend/supabase/config"
import { cn } from "@/lib/utils"

type Session = { name: string } | null

/**
 * Reads the session cookie in the browser rather than in the layout, so pages stay statically rendered.
 * Re-checks on navigation because sign-in/out happen in server actions, which the browser client doesn't observe.
 */
function useSession(): Session | undefined {
  const pathname = usePathname()
  // undefined = still checking; known up front when accounts are disabled.
  const [session, setSession] = useState<Session | undefined>(AUTH_ENABLED ? undefined : null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const user = data.session?.user
      setSession(user ? { name: (user.user_metadata?.full_name as string | undefined) || user.email || "Account" } : null)
    })
    return () => {
      active = false
    }
  }, [pathname])

  return session
}

export function AccountButton({ className, onNavigate, full }: { className?: string; onNavigate?: () => void; full?: boolean }) {
  const session = useSession()
  const { t } = useT()

  if (session) {
    return (
      <Button asChild variant={full ? "outline" : "ghost"} size={full ? "default" : "sm"} className={className}>
        <Link href="/account" onClick={onNavigate} aria-label={t("account.title")}>
          <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {session.name.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[10ch] truncate">{session.name.split(/[\s@]/)[0]}</span>
        </Link>
      </Button>
    )
  }

  return (
    <Button asChild variant={full ? "outline" : "ghost"} size={full ? "default" : "sm"} className={cn(session === undefined && "invisible", className)}>
      <Link href="/login" onClick={onNavigate}>{t("header.signIn")}</Link>
    </Button>
  )
}
