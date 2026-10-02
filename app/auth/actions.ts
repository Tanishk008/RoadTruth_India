"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { AuthError } from "@supabase/supabase-js"
import { createClient } from "@/backend/supabase/server"
import { AUTH_ENABLED } from "@/backend/supabase/config"
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
  safeNextPath,
  toE164IndianPhone,
} from "@/lib/validation"

export interface AuthState {
  ok: boolean
  message?: string
  errors?: Record<string, string>
}

const NOT_CONFIGURED: AuthState = {
  ok: false,
  message: "Citizen accounts aren't switched on for this site yet. You can still report issues and track them with your reference number.",
}

/** Supabase error codes → wording a citizen can act on. Anything unexpected gets a generic message. */
function friendly(error: AuthError): AuthState {
  const messages: Record<string, string> = {
    invalid_credentials: "That email and password don't match. Check them, or reset your password.",
    email_not_confirmed: "Please confirm your email first — we sent you a link when you signed up.",
    user_already_exists: "An account with this email already exists. Try logging in instead.",
    email_exists: "An account with this email already exists. Try logging in instead.",
    weak_password: "That password is too easy to guess. Try a longer one.",
    same_password: "Your new password must be different from the old one.",
    otp_expired: "That code is wrong or has expired. Request a new one.",
    otp_disabled: "No account uses this mobile number yet. Create an account first.",
    phone_provider_disabled: "Sign-in by mobile isn't available right now. Please use email instead.",
    sms_send_failed: "We couldn't send the SMS. Check the number and try again.",
    over_email_send_rate_limit: "Too many emails sent. Please wait a few minutes and try again.",
    over_sms_send_rate_limit: "Too many codes requested. Please wait a minute and try again.",
    over_request_rate_limit: "Too many attempts. Please wait a few minutes and try again.",
    session_not_found: "Your session has expired. Please log in again.",
  }
  const known = error.code ? messages[error.code] : undefined
  if (!known) console.error("[auth]", error.code, error.message)
  return { ok: false, message: known ?? "Something went wrong. Please try again." }
}

async function siteOrigin() {
  return (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

export async function signInWithEmail(input: { email: string; password: string; next?: string }): Promise<AuthState> {
  if (!AUTH_ENABLED) return NOT_CONFIGURED
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return friendly(error)
  redirect(safeNextPath(input.next))
}

export async function signUpWithEmail(input: {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  next?: string
}): Promise<AuthState> {
  if (!AUTH_ENABLED) return NOT_CONFIGURED
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) }

  const { name, email, phone, password } = parsed.data
  const supabase = await createClient()
  const next = safeNextPath(input.next)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, phone: phone ? toE164IndianPhone(phone) : null },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) return friendly(error)
  // Email confirmation off → signed in immediately.
  if (data.session) redirect(next)
  // Same response whether or not the email was already registered, so the form can't be used to probe for accounts.
  return { ok: true, message: "Almost done! We've emailed you a confirmation link. Open it on this device to activate your account." }
}

export async function sendPhoneOtp(input: { phone: string; name?: string; createAccount: boolean }): Promise<AuthState> {
  if (!AUTH_ENABLED) return NOT_CONFIGURED
  const parsed = phoneOtpRequestSchema.safeParse({ phone: input.phone, name: input.createAccount ? input.name : undefined })
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) }
  if (input.createAccount && !parsed.data.name) return { ok: false, errors: { name: "Enter your name" } }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.data.phone,
    options: {
      shouldCreateUser: input.createAccount,
      data: parsed.data.name ? { full_name: parsed.data.name, phone: parsed.data.phone } : undefined,
    },
  })
  if (error) return friendly(error)
  return { ok: true, message: "We've sent a 6-digit code to your mobile." }
}

export async function verifyPhoneOtp(input: { phone: string; token: string; next?: string }): Promise<AuthState> {
  if (!AUTH_ENABLED) return NOT_CONFIGURED
  const parsed = phoneOtpVerifySchema.safeParse(input)
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ phone: parsed.data.phone, token: parsed.data.token, type: "sms" })
  if (error) return friendly(error)
  redirect(safeNextPath(input.next))
}

export async function requestPasswordReset(input: { email: string }): Promise<AuthState> {
  if (!AUTH_ENABLED) return NOT_CONFIGURED
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  })
  // Only surface rate limits; otherwise always say the same thing so emails can't be probed.
  if (error?.code?.startsWith("over_")) return friendly(error)
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder." }
}

export async function updatePassword(input: { password: string; confirmPassword: string }): Promise<AuthState> {
  if (!AUTH_ENABLED) return NOT_CONFIGURED
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return friendly(error)
  redirect("/account?updated=password")
}

export async function updateProfile(input: { name: string; phone: string }): Promise<AuthState> {
  if (!AUTH_ENABLED) return NOT_CONFIGURED
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.name, phone: parsed.data.phone ? toE164IndianPhone(parsed.data.phone) : null },
  })
  if (error) return friendly(error)
  revalidatePath("/account")
  return { ok: true, message: "Profile saved." }
}

export async function signOut() {
  if (AUTH_ENABLED) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  revalidatePath("/", "layout")
  redirect("/")
}
