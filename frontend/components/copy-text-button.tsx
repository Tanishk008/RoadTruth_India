"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { useT } from "@/frontend/components/i18n"

export function CopyTextButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={className}
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }
    >
      {copied ? <Check className="text-primary" /> : <Copy />}
      {copied ? t("common.copied") : label ?? t("common.copy")}
    </Button>
  )
}
