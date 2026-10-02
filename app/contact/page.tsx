import type { Metadata } from "next"
import Link from "next/link"
import { Mail, Phone } from "lucide-react"
import { Card } from "@/frontend/components/ui/card"
import { PageHeader } from "@/frontend/components/page-header"
import { site } from "@/lib/site"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Send feedback, report a data error, or get in touch with the Road Truth India team.",
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Contact us"
        description={
          <>
          Found an error in our data, have feedback, or want to collaborate? Write to us. To report a road problem, use the{" "}
          <Link href="/report-issue" className="text-primary underline">report form</Link> instead so it gets a tracking number.
          </>
        }
      />
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-10">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Mail className="w-4 h-4" /> Email the team</h2>
            <a href={`mailto:${site.contactEmail}`} className="text-primary hover:underline break-all text-sm">{site.contactEmail}</a>
            <p className="text-xs text-muted-foreground mt-2">We&apos;re a small volunteer team and usually reply within a few days.</p>
          </Card>
          <Card className="p-6 border-red-200 bg-red-50/60">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> Official helplines</h2>
            <p className="text-xs text-muted-foreground mb-3">We are not a government body. For action by authorities, contact them directly:</p>
            <ul className="space-y-2 text-sm">
              {site.officialChannels.map((c) => (
                <li key={c.label}>
                  <a href={c.href} className="font-semibold text-primary hover:underline">{c.label}: {c.value}</a>
                  <p className="text-xs text-muted-foreground">{c.note}</p>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
      </div>
    </>
  )
}
