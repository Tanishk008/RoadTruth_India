"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, CloudOff, Loader2 } from "lucide-react"
import { useT } from "@/frontend/components/i18n"
import { listOutbox, outboxAvailable } from "@/lib/outbox"
import { BACKEND_CONNECTED, MAX_SEND_ATTEMPTS, REPORTS_CHANGED, syncOutbox } from "@/backend/services/backend"
import { useOnline } from "@/lib/use-online"

const RETRY_MS = 60_000

/** Registers the service worker and sends queued reports whenever a connection is available. Shows a small status pill. */
export function OfflineSupport() {
  const { t } = useT()
  const online = useOnline()
  const [queued, setQueued] = useState(0)
  const [failed, setFailed] = useState(0)
  const [sent, setSent] = useState(0)

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    if (!BACKEND_CONNECTED || !outboxAvailable()) return
    let active = true
    let hideTimer: ReturnType<typeof setTimeout>
    const count = () =>
      listOutbox().then((entries) => {
        if (!active) return
        setFailed(entries.filter((e) => e.attempts >= MAX_SEND_ATTEMPTS).length)
        setQueued(entries.filter((e) => e.attempts < MAX_SEND_ATTEMPTS).length)
      })
    const sync = async () => {
      const n = await syncOutbox()
      if (!active) return
      if (n) {
        setSent(n)
        clearTimeout(hideTimer)
        hideTimer = setTimeout(() => active && setSent(0), 6000)
      }
      count()
    }
    sync()
    const timer = setInterval(sync, RETRY_MS)
    window.addEventListener("online", sync)
    window.addEventListener(REPORTS_CHANGED, count)
    return () => {
      active = false
      clearInterval(timer)
      clearTimeout(hideTimer)
      window.removeEventListener("online", sync)
      window.removeEventListener(REPORTS_CHANGED, count)
    }
  }, [])

  if (!queued && !sent && !failed) return null
  return (
    <div role="status" className="fixed bottom-4 left-4 z-50 max-w-xs rounded-full border bg-card px-4 py-2 text-sm shadow-lg flex items-center gap-2 print:hidden">
      {failed && !queued ? (
        <Link href="/track" className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4" /> {t("outbox.failed", { n: failed })}
        </Link>
      ) : sent && !queued ? (
        <>
          <CheckCircle2 className="size-4 text-emerald-600" /> {t("outbox.sent", { n: sent })}
        </>
      ) : online ? (
        <>
          <Loader2 className="size-4 animate-spin text-primary" /> {t("outbox.sending", { n: queued })}
        </>
      ) : (
        <>
          <CloudOff className="size-4 text-amber-600" /> {t("outbox.waiting", { n: queued })}
        </>
      )}
    </div>
  )
}
