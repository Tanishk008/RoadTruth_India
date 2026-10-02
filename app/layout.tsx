import type React from "react"
import type { Metadata } from "next"
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans, Noto_Sans_Devanagari } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Header } from "@/frontend/components/header"
import { Footer } from "@/frontend/components/footer"
import { NavTracker } from "@/frontend/components/nav-tracker"
import { HtmlLang } from "@/frontend/components/i18n"
import { OfflineSupport } from "@/frontend/components/offline-support"
import { site } from "@/lib/site"
import "./globals.css"

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] })
const body = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] })
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono-face", weight: ["400", "500", "600"] })
// Hindi. Not preloaded: only fetched when Devanagari text is on screen.
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari", weight: ["400", "500", "600", "700"], preload: false })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { siteName: site.name, type: "website", locale: "en_IN", title: `${site.name} – Expressway Transparency Portal`, description: site.description },
  twitter: { card: "summary_large_image" },
  title: { default: `${site.name} – Expressway Transparency Portal`, template: `%s · ${site.name}` },
  description: site.description,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable} ${mono.variable} ${devanagari.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-ink-foreground">
          Skip to content
        </a>
        <NavTracker />
        <HtmlLang />
        <OfflineSupport />
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  )
}
