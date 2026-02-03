import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-2">Road Truth India</h3>
            <p className="text-sm opacity-90 mb-4">
              Empowering transparency and accountability in India's expressway projects for citizens and stakeholders.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors flex items-center justify-center"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors flex items-center justify-center"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors flex items-center justify-center"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="opacity-80 hover:opacity-100 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/expressways" className="opacity-80 hover:opacity-100 transition">
                  Expressways
                </Link>
              </li>
              <li>
                <Link href="/contractors" className="opacity-80 hover:opacity-100 transition">
                  Contractors
                </Link>
              </li>
              <li>
                <Link href="/about" className="opacity-80 hover:opacity-100 transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="opacity-80 hover:opacity-100 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="opacity-80 hover:opacity-100 transition">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="#" className="opacity-80 hover:opacity-100 transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="opacity-80 hover:opacity-100 transition">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>info@roadtruthinda.gov.in</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>+91 1800-TRUTH-IN</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Ministry of Road Transport & Highways, New Delhi</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="opacity-75">© 2025 Road Truth India. All Rights Reserved.</p>
          <p className="opacity-75">Built by Team Runtime Error • Government of India Initiative</p>
          <p className="opacity-75">Last Updated: November 2025</p>
        </div>
      </div>
    </footer>
  )
}
