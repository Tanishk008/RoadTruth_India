"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"

export function CopyLinkButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={() =>
        navigator.clipboard.writeText(window.location.href).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }
    >
      {copied ? <Check className="text-primary" /> : <Link2 />}
      {copied ? "Link copied" : "Copy link"}
    </Button>
  )
}
