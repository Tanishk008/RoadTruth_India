import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/frontend/components/auth-form"
import { getCitizen } from "@/backend/auth"
import { safeNextPath } from "@/lib/validation"

export const metadata: Metadata = { title: "Create an account" }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  if (await getCitizen()) redirect(safeNextPath(next))
  return <AuthForm mode="register" next={next} />
}
