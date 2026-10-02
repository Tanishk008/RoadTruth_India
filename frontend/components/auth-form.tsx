"use client"

import Link from "next/link"
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react"
import { AlertCircle, CheckCircle2, Loader2, Mail, Smartphone } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { Input } from "@/frontend/components/ui/input"
import { Field } from "@/frontend/components/field"
import { useT } from "@/frontend/components/i18n"
import { PasswordInput } from "@/frontend/components/password-input"
import { sendPhoneOtp, signInWithEmail, signUpWithEmail, verifyPhoneOtp, type AuthState } from "@/app/auth/actions"
import { AUTH_ENABLED } from "@/backend/supabase/config"
import { cn } from "@/lib/utils"
import type { TKey } from "@/lib/i18n/core"

type Mode = "login" | "register"
type Method = "email" | "phone"

/** Runs a server action, keeping field errors and the status message in state. Stays pending through a redirect. */
export function useAuthAction() {
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<AuthState | null>(null)

  function run(action: () => Promise<AuthState | undefined>, onSuccess?: (s: AuthState) => void) {
    setState(null)
    startTransition(async () => {
      const result = await action()
      // A successful redirect() resolves to nothing; Next is already navigating.
      if (!result) return
      setState(result)
      if (result.ok) onSuccess?.(result)
    })
  }

  const clearError = (field: string) =>
    setState((s) => (s?.errors?.[field] ? { ...s, errors: { ...s.errors, [field]: "" } } : s))

  return { pending, state, run, clearError, errors: state?.errors ?? {} }
}

export function StatusMessage({ state }: { state: AuthState | null }) {
  const { tm } = useT()
  if (!state?.message) return null
  const Icon = state.ok ? CheckCircle2 : AlertCircle
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "text-sm rounded-lg border p-3.5 flex gap-2.5",
        state.ok ? "border-primary/25 bg-primary/5" : "border-destructive/25 bg-destructive/5 text-destructive",
      )}
    >
      <Icon className="size-4 mt-0.5 shrink-0" />
      <span>{tm(state.message)}</span>
    </div>
  )
}

export function AuthCard({ title, description, children }: { title: TKey; description: TKey; children: ReactNode }) {
  const { t } = useT()
  return (
    <div className="flex items-center justify-center px-4 py-12 md:py-16">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t(title)}</h1>
        <p className="text-center text-muted-foreground mb-6">{t(description)}</p>
        {!AUTH_ENABLED && (
          <div className="mb-6">
            <StatusMessage state={{ ok: false, message: t("auth.disabled") }} />
          </div>
        )}
        {children}
      </Card>
    </div>
  )
}

const copy = {
  login: { title: "auth.loginTitle", description: "auth.loginLead" },
  register: { title: "auth.registerTitle", description: "auth.registerLead" },
} as const

export function AuthForm({ mode, next, notice }: { mode: Mode; next?: string; notice?: string }) {
  const { t } = useT()
  const [method, setMethod] = useState<Method>("email")
  const switchHref = `${mode === "login" ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`

  return (
    <AuthCard {...copy[mode]}>
      {notice && (
        <div className="mb-6">
          <StatusMessage state={{ ok: false, message: notice }} />
        </div>
      )}

      <div role="tablist" aria-label={t("auth.method")} className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 mb-6">
        {([
          ["email", "form.email", Mail],
          ["phone", "auth.mobileOtp", Smartphone],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={method === value}
            aria-controls={`panel-${value}`}
            onClick={() => setMethod(value)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
              method === value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" /> {t(label)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${method}`} aria-labelledby={`tab-${method}`}>
        {method === "email" ? <EmailForm key={mode} mode={mode} next={next} /> : <PhoneOtpForm key={mode} mode={mode} next={next} />}
      </div>

      <p className="text-sm text-muted-foreground text-center mt-6 border-t pt-6">
        {mode === "login" ? t("auth.newHere") : t("auth.haveAccount")}{" "}
        <Link href={switchHref} className="text-accent font-semibold hover:underline">
          {mode === "login" ? t("auth.createAccount") : t("auth.logIn")}
        </Link>
      </p>
      <p className="text-xs text-muted-foreground text-center mt-3">
        {t("auth.noAccountNeeded")} <Link href="/report-issue" className="underline">{t("nav.report")}</Link> ·{" "}
        <Link href="/track" className="underline">{t("nav.track")}</Link>
      </p>
    </AuthCard>
  )
}

const emailFields: Record<Mode, { id: string; label: TKey; type: string; autoComplete: string; required: boolean; hint?: TKey }[]> = {
  login: [
    { id: "email", label: "form.email", type: "email", autoComplete: "email", required: true },
    { id: "password", label: "auth.password", type: "password", autoComplete: "current-password", required: true },
  ],
  register: [
    { id: "name", label: "form.name", type: "text", autoComplete: "name", required: true },
    { id: "email", label: "form.email", type: "email", autoComplete: "email", required: true },
    { id: "phone", label: "form.phone", type: "tel", autoComplete: "tel", required: false, hint: "auth.phoneHint" },
    { id: "password", label: "auth.password", type: "password", autoComplete: "new-password", required: true, hint: "auth.passwordHint" },
    { id: "confirmPassword", label: "auth.confirmPassword", type: "password", autoComplete: "new-password", required: true },
  ],
}

function EmailForm({ mode, next }: { mode: Mode; next?: string }) {
  const { t, tm } = useT()
  const [values, setValues] = useState<Record<string, string>>({})
  const { pending, state, run, clearError, errors } = useAuthAction()
  const [done, setDone] = useState(false)
  const v = (k: string) => values[k] ?? ""

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    run(
      () =>
        mode === "login"
          ? signInWithEmail({ email: v("email"), password: v("password"), next })
          : signUpWithEmail({ name: v("name"), email: v("email"), phone: v("phone"), password: v("password"), confirmPassword: v("confirmPassword"), next }),
      () => setDone(true),
    )
  }

  if (done) return <StatusMessage state={state} />

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {emailFields[mode].map((f) => {
        const inputProps = {
          id: f.id,
          name: f.id,
          autoComplete: f.autoComplete,
          value: v(f.id),
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setValues((prev) => ({ ...prev, [f.id]: e.target.value }))
            clearError(f.id)
          },
          "aria-invalid": !!errors[f.id],
          "aria-describedby": errors[f.id] ? `${f.id}-error` : undefined,
        }
        return (
          <Field key={f.id} id={f.id} label={t(f.label)} required={f.required} error={tm(errors[f.id])} hint={f.hint ? t(f.hint) : undefined}>
            {f.type === "password" ? <PasswordInput {...inputProps} /> : <Input {...inputProps} type={f.type} placeholder={f.type === "tel" ? "98765 43210" : undefined} />}
          </Field>
        )
      })}

      {mode === "login" && (
        <div className="text-right -mt-1">
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">{t("auth.forgot")}</Link>
        </div>
      )}

      <StatusMessage state={state} />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {mode === "login" ? t("auth.logIn") : t("auth.createAccount")}
      </Button>
    </form>
  )
}

const RESEND_SECONDS = 30

function PhoneOtpForm({ mode, next }: { mode: Mode; next?: string }) {
  const { t, tm } = useT()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [token, setToken] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const { pending, state, run, clearError, errors } = useAuthAction()

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendCode = () =>
    run(
      () => sendPhoneOtp({ phone, name, createAccount: mode === "register" }),
      () => {
        setStep("code")
        setToken("")
        setCooldown(RESEND_SECONDS)
      },
    )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (step === "phone") sendCode()
    else run(() => verifyPhoneOtp({ phone, token, next }))
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {step === "phone" ? (
        <>
          {mode === "register" && (
            <Field id="otp-name" label={t("form.name")} required error={tm(errors.name)}>
              <Input
                id="otp-name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  clearError("name")
                }}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "otp-name-error" : undefined}
              />
            </Field>
          )}
          <Field id="otp-phone" label={t("form.phone")} required error={tm(errors.phone)} hint={t("auth.otpHint")}>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">+91</span>
              <Input
                id="otp-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                className="rounded-l-none"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  clearError("phone")
                }}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "otp-phone-error" : undefined}
              />
            </div>
          </Field>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("auth.codeSentTo")} <span className="font-medium text-foreground">+91 {phone.replace(/[\s-]/g, "").slice(-10)}</span>.{" "}
            <button type="button" className="text-accent hover:underline" onClick={() => setStep("phone")}>
              {t("auth.changeNumber")}
            </button>
          </p>
          <Field id="otp-code" label={t("auth.code")} required error={tm(errors.token)}>
            <Input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              placeholder="••••••"
              className="text-center text-lg tracking-[0.5em] font-mono h-11"
              value={token}
              onChange={(e) => {
                setToken(e.target.value.replace(/\D/g, ""))
                clearError("token")
              }}
              aria-invalid={!!errors.token}
              aria-describedby={errors.token ? "otp-code-error" : undefined}
            />
          </Field>
        </>
      )}

      <StatusMessage state={state} />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {step === "phone" ? t("auth.sendCode") : t("auth.verify")}
      </Button>

      {step === "code" && (
        <p className="text-sm text-center text-muted-foreground">
          {t("auth.didntGet")}{" "}
          {cooldown > 0 ? (
            <span>{t("auth.resendIn", { s: cooldown })}</span>
          ) : (
            <button type="button" className="text-accent font-medium hover:underline" onClick={sendCode} disabled={pending}>
              {t("auth.resend")}
            </button>
          )}
        </p>
      )}
    </form>
  )
}
