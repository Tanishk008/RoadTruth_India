"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { Field } from "@/frontend/components/field"
import { useT } from "@/frontend/components/i18n"
import { AuthCard, StatusMessage, useAuthAction } from "@/frontend/components/auth-form"
import { requestPasswordReset } from "@/app/auth/actions"

export function ForgotPasswordForm() {
  const { t, tm } = useT()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const { pending, state, run, clearError, errors } = useAuthAction()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    run(() => requestPasswordReset({ email }), () => setSent(true))
  }

  return (
    <AuthCard title="auth.forgotTitle" description="auth.forgotLead">
      {sent ? (
        <StatusMessage state={state} />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="email" label={t("form.email")} required error={tm(errors.email)}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError("email")
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>
          <StatusMessage state={state} />
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} {t("auth.sendReset")}
          </Button>
        </form>
      )}
      <p className="text-sm text-muted-foreground text-center mt-6 border-t pt-6">
        {t("auth.signedUpMobile")} <Link href="/login" className="text-accent font-semibold hover:underline">{t("auth.loginOtp")}</Link>
      </p>
    </AuthCard>
  )
}
