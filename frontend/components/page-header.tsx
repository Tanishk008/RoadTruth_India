import type React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  eyebrow: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/** Consistent page intro: small uppercase eyebrow, display title, lead paragraph, optional actions. */
export function PageHeader({ eyebrow, title, description, children, className }: PageHeaderProps) {
  return (
    <header className={cn("border-b bg-card/60", className)}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-primary" />
          {eyebrow}
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
            {description && <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </header>
  )
}
