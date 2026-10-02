import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/frontend/components/auth-form"
import { getCitizen } from "@/backend/auth"
import { safeNextPath } from "@/lib/validation"

export const metadata: Metadata = { title: "Log in" }

const notices: Record<string, string> = {
  link: "That link is invalid or has expired. Log in, or request a new link.",
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  if (await getCitizen()) redirect(safeNextPath(next))
  return <AuthForm mode="login" next={next} notice={error ? notices[error] : undefined} />
}
