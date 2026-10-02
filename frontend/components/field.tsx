import type React from "react"
import { cn } from "@/lib/utils"

interface FieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}

/** Label + control + error message, wired for screen readers via `${id}-error`. */
export function Field({ id, label, required, error, hint, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium mb-1.5 block">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className={cn("text-xs text-destructive mt-1")} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
