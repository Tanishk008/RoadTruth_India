"use client"

import { useState, type FormEvent } from "react"
import { BadgeCheck, Loader2 } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Input } from "@/frontend/components/ui/input"
import { Field } from "@/frontend/components/field"
import { useT } from "@/frontend/components/i18n"
import { StatusMessage, useAuthAction } from "@/frontend/components/auth-form"
import { updateProfile } from "@/app/auth/actions"
import type { Citizen } from "@/backend/auth"

export function ProfileForm({ citizen }: { citizen: Citizen }) {
  const { t, tm } = useT()
  const [values, setValues] = useState({ name: citizen.name, phone: citizen.phone?.replace(/^\+91/, "") ?? "" })
  const { pending, state, run, clearError, errors } = useAuthAction()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    run(() => updateProfile(values))
  }

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    clearError(key)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field id="name" label={t("form.name")} required error={tm(errors.name)}>
        <Input id="name" autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
      </Field>
      {citizen.email && (
        <Field id="email" label={t("form.email")}>
          <Input id="email" value={citizen.email} readOnly disabled />
        </Field>
      )}
      {citizen.phoneVerified ? (
        <div>
          <p className="text-sm font-medium mb-1.5">{t("form.phone")}</p>
          <p className="flex items-center gap-2 text-sm">
            {citizen.phone} <BadgeCheck className="size-4 text-primary" aria-label={t("account.verified")} />
          </p>
        </div>
      ) : (
        <Field id="phone" label={t("form.phone")} error={tm(errors.phone)} hint={t("form.optional")}>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="98765 43210" value={values.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
        </Field>
      )}
      <StatusMessage state={state} />
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {t("account.saveProfile")}
      </Button>
    </form>
  )
}
