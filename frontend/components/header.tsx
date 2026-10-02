"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { LogoMark } from "@/frontend/components/logo"
import { AccountButton } from "@/frontend/components/account-button"
import { LanguageSwitcher, useT } from "@/frontend/components/i18n"
import { cn } from "@/lib/utils"
import { navItems, site } from "@/lib/site"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { t } = useT()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md transition-shadow duration-300",
        scrolled ? "shadow-[0_6px_24px_-16px_rgb(15_27_45/0.45)]" : "border-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label={`${site.name} home`}>
          <LogoMark className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
          <span className="leading-tight">
            <span className="block font-display font-bold text-[15px] tracking-tight">{site.name}</span>
            <span className="hidden sm:block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Expressway transparency</span>
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-1" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
                "after:absolute after:left-3 after:right-3 after:-bottom-[13px] after:h-[3px] after:rounded-full after:bg-primary after:origin-left after:transition-transform after:duration-300",
                isActive(item.href)
                  ? "text-foreground after:scale-x-100"
                  : "text-muted-foreground hover:text-foreground after:scale-x-0 hover:after:scale-x-100 hover:after:bg-foreground/20",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          <LanguageSwitcher />
          <AccountButton />
          <Button asChild size="sm">
            <Link href="/report-issue">{t("header.report")}</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="xl:hidden p-2 -mr-2 rounded-md hover:bg-muted transition-colors"
          aria-label={isMenuOpen ? t("header.closeMenu") : t("header.openMenu")}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="xl:hidden border-t bg-background animate-fade-up" aria-label="Mobile">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "py-3 border-b last:border-0 text-[15px] font-medium flex items-center justify-between",
                  isActive(item.href) ? "text-primary" : "text-foreground",
                )}
              >
                {t(item.key)}
                {isActive(item.href) && <span className="size-1.5 rounded-full bg-primary" />}
              </Link>
            ))}
            <LanguageSwitcher className="mt-3 self-start sm:hidden" />
            <div className="flex gap-2 pt-3 sm:hidden">
              <AccountButton full className="flex-1" onNavigate={() => setIsMenuOpen(false)} />
              <Button asChild className="flex-1">
                <Link href="/report-issue" onClick={() => setIsMenuOpen(false)}>{t("header.report")}</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
