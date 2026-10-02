import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { LogOut, Plus } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { PageHeader } from "@/frontend/components/page-header"
import { StatusMessage } from "@/frontend/components/auth-form"
import { T } from "@/frontend/components/i18n"
import { signOut } from "@/app/auth/actions"
import { getCitizen } from "@/backend/auth"
import { formatDate } from "@/lib/format"
import { NewPasswordForm } from "@/app/reset-password/new-password-form"
import { ProfileForm } from "./profile-form"
import { MyReports } from "./my-reports"

export const metadata: Metadata = { title: "Your account", robots: { index: false } }

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  // Reading searchParams first keeps this page per-request even when accounts are switched off.
  const { updated } = await searchParams
  const citizen = await getCitizen()
  if (!citizen) redirect("/login?next=/account")

  return (
    <>
      <PageHeader
        eyebrow={<T k="account.title" />}
        title={citizen.name ? <T k="account.greeting" vars={{ name: citizen.name.split(" ")[0] }} /> : <T k="account.title" />}
        description={<T k="account.memberSince" vars={{ date: formatDate(citizen.joinedAt) }} />}
      >
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/report-issue"><Plus /> <T k="header.report" /></Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="outline"><LogOut /> <T k="account.signOut" /></Button>
          </form>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10 grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <div className="space-y-6">
          {updated === "password" && <StatusMessage state={{ ok: true, message: "Your password has been updated." }} />}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-1"><T k="account.reports" /></h2>
            <p className="text-sm text-muted-foreground mb-5"><T k="account.reportsLead" /></p>
            <MyReports />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-5"><T k="account.profile" /></h2>
            <ProfileForm citizen={citizen} />
          </Card>
          {citizen.email && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-1"><T k="auth.password" /></h2>
              <p className="text-sm text-muted-foreground mb-5"><T k="account.passwordLead" vars={{ email: citizen.email }} /></p>
              <NewPasswordForm submitLabel="auth.updatePassword" />
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
