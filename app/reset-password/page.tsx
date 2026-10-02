import type { Metadata } from "next"
import { AuthCard } from "@/frontend/components/auth-form"
import { NewPasswordForm } from "./new-password-form"

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } }

/** Reached from the reset email via /auth/confirm, which signs the user in first. proxy.ts guards it. */
export default function ResetPasswordPage() {
  return (
    <AuthCard title="auth.resetTitle" description="auth.resetLead">
      <NewPasswordForm />
    </AuthCard>
  )
}
