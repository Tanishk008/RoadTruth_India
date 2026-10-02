"use client"

import { useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Field } from "@/frontend/components/field"
import { useT } from "@/frontend/components/i18n"
import { PasswordInput } from "@/frontend/components/password-input"
import { StatusMessage, useAuthAction } from "@/frontend/components/auth-form"
import { updatePassword } from "@/app/auth/actions"

/** Used after a reset-link sign-in, and from the account page to change or set a password. */
export function NewPasswordForm({ submitLabel = "auth.saveNewPassword" }: { submitLabel?: "auth.saveNewPassword" | "auth.updatePassword" }) {
  const { t, tm } = useT()
  const [values, setValues] = useState({ password: "", confirmPassword: "" })
  const { pending, state, run, clearError, errors } = useAuthAction()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    run(() => updatePassword(values))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {(["password", "confirmPassword"] as const).map((id) => (
        <Field
          key={id}
          id={id}
          label={id === "password" ? t("auth.newPassword") : t("auth.confirmNewPassword")}
          required
          error={tm(errors[id])}
          hint={id === "password" ? t("auth.passwordHint") : undefined}
        >
          <PasswordInput
            id={id}
            autoComplete="new-password"
            value={values[id]}
            onChange={(e) => {
              setValues((v) => ({ ...v, [id]: e.target.value }))
              clearError(id)
            }}
            aria-invalid={!!errors[id]}
            aria-describedby={errors[id] ? `${id}-error` : undefined}
          />
        </Field>
      ))}
      <StatusMessage state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {t(submitLabel)}
      </Button>
    </form>
  )
}
