"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Expressways", href: "/expressways" },
    { label: "Contractors", href: "/contractors" },
    { label: "Pot Hole Detector", href: "/pothole-detector" },
    { label: "Report Issue", href: "/report-issue" },
    { label: "Contact Us", href: "/contact" },
    { label: "About Us", href: "/about" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-lg">
              🇮🇳
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm leading-tight text-foreground">Road Truth India</p>
              <p className="text-xs text-muted-foreground">Infrastructure Transparency</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 text-sm font-medium transition-all rounded-md hover:bg-muted text-foreground/80 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Login/Register */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="px-4">
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pt-4 border-t border-border flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-medium transition-colors hover:text-accent py-2 px-2 rounded-md hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Login
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
