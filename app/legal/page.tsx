import type { Metadata } from "next"
import { PageHeader } from "@/frontend/components/page-header"
import { site } from "@/lib/site"

export const metadata: Metadata = { title: "Privacy, Terms & Disclaimer" }

export default function LegalPage() {
  return (
    <>
    <PageHeader eyebrow="Legal" title="Privacy, terms & disclaimer" />
    <div className="max-w-3xl mx-auto w-full px-4 md:px-8 py-12 space-y-12 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
      <section id="privacy" className="scroll-mt-24 space-y-3">
        <h2>Privacy Policy</h2>
        <p>We collect only what you choose to give us:</p>
        <ul>
          <li>Report details: issue, location, description and photos.</li>
          <li>Your name and email, plus your mobile number if you add it, so we can follow up on your report.</li>
          <li>GPS coordinates, only when you tap &quot;Use my location&quot;.</li>
          <li>Anonymous page-view statistics through Vercel Analytics, which uses no cookies.</li>
          <li>Expressway pages embed Google Maps route maps. Google may set its own cookies when the map loads (see Google&apos;s privacy policy).</li>
        </ul>
        <p>
          Photos are resized and their hidden metadata (including camera GPS) is removed in your browser before upload. When you use
          AI pothole detection, the resized photo is sent to Anthropic&apos;s Claude API for analysis and is not used to train models.
          Choose &quot;Analyse on this device only&quot; to keep the photo on your phone.
        </p>
        <p>
          We never sell your data. While the site is in preview, reports are stored only in your browser. To delete them, clear
          this site&apos;s data in your browser settings. To ask about your data, email {site.contactEmail}.
        </p>
      </section>

      <section id="terms" className="scroll-mt-24 space-y-3">
        <h2>Terms of Use</h2>
        <ul>
          <li>Only submit reports and photos that are truthful and that you have the right to share.</li>
          <li>Don&apos;t include faces, vehicle number plates or other personal information about other people in photos.</li>
          <li>Never photograph or stop on an expressway carriageway. Your safety comes first.</li>
          <li>We may remove reports that are abusive, false, or contain personal data.</li>
        </ul>
      </section>

      <section id="disclaimer" className="scroll-mt-24 space-y-3">
        <h2>Data Disclaimer</h2>
        <p>
          {site.name} is an independent project and is not affiliated with the Government of India, MoRTH, NHAI or any state
          authority. Expressway and contractor information is compiled from public sources linked on each entry and shown with
          the date it was last verified. Figures such as length, cost and completion dates change often, and different sources can
          disagree. Treat them as indicative, and rely on official sources for anything important.
        </p>
        <p>
          Pothole detection is automated and can be wrong. It may miss potholes or mark shadows and stains as potholes. It does not
          replace an engineering inspection.
        </p>
      </section>
    </div>
    </>
  )
}
