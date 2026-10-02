"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, ThumbsUp } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { useT } from "@/frontend/components/i18n"
import { myVotes, toggleVote } from "@/backend/services/backend"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/types"

/** "Me too": one vote per citizen. Votes rank which problems get escalated first. */
export function MeTooButton({ report, className, size = "sm" }: { report: Report; className?: string; size?: "sm" | "default" }) {
  const { t } = useT()
  const pathname = usePathname()
  const [voted, setVoted] = useState(false)
  const [count, setCount] = useState(report.voteCount)
  const [busy, setBusy] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  useEffect(() => {
    let active = true
    myVotes([report.reference]).then((v) => active && setVoted(v.has(report.reference)))
    return () => {
      active = false
    }
  }, [report.reference])

  async function click() {
    setBusy(true)
    const result = await toggleVote(report, !voted)
    setBusy(false)
    if (result.ok) {
      setVoted(result.voted)
      setCount(result.voteCount)
    } else if (result.reason === "sign-in") {
      setNeedsSignIn(true)
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <Button
        type="button"
        size={size}
        variant={voted ? "default" : "outline"}
        onClick={click}
        disabled={busy || report.pending}
        aria-pressed={voted}
        title={t("vote.hint")}
      >
        {busy ? <Loader2 className="animate-spin" /> : <ThumbsUp />}
        {voted ? t("vote.voted") : t("vote.meToo")}
        <span className="font-mono tabular-nums">{count}</span>
      </Button>
      {needsSignIn && (
        <p className="text-xs text-muted-foreground">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="text-primary underline">{t("vote.signIn")}</Link> {t("vote.signInWhy")}
        </p>
      )}
    </div>
  )
}
