"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronRight, AlertCircle, MapPin, DollarSign, Zap, Users, CheckCircle2 } from "lucide-react"

export default function Home() {
  const stats = [
    {
      icon: MapPin,
      title: "Total Expressways",
      value: "42+",
      description: "Monitored across India",
      color: "from-blue-500/20 to-blue-600/20",
    },
    {
      icon: DollarSign,
      title: "Total Investment",
      value: "₹2.5L Cr",
      description: "Infrastructure commitment",
      color: "from-orange-500/20 to-orange-600/20",
    },
    {
      icon: AlertCircle,
      title: "Active Projects",
      value: "18+",
      description: "Currently being built",
      color: "from-green-500/20 to-green-600/20",
    },
  ]

  const features = [
    {
      icon: Zap,
      title: "Real-time Tracking",
      description: "Track project progress, timelines, and contractor performance in real-time.",
    },
    {
      icon: Users,
      title: "Contractor Directory",
      description: "Access detailed information on major infrastructure contractors.",
    },
    {
      icon: CheckCircle2,
      title: "Complaint System",
      description: "Report road issues, potholes, and project delays directly to authorities.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="relative w-full h-[700px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1486781622519-c21cc028cb0d?w=1920&h=800&fit=crop")',
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
        </div>

        <div className="relative z-10 text-white px-4 md:px-8 max-w-3xl">
          <div className="inline-block bg-accent/30 px-3.5 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-accent/50">
            <span className="text-accent text-xs font-bold uppercase tracking-wider">
              Government of India Initiative
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-balance">Road Truth India</h1>
          <p className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl text-balance">
            Empowering Citizens with Transparency in India's Infrastructure Development
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href="/expressways">
              <Button size="lg" className="gap-2 px-8 font-semibold shadow-lg hover:shadow-xl transition-shadow">
                Explore Projects
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/complain">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 font-semibold text-white border-white/40 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
              >
                Report Issue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">India's Expressway Network at a Glance</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tracking of national expressway projects, investments, and infrastructure quality
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <Card
                  key={idx}
                  className="relative overflow-hidden p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border-0"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {stat.title}
                        </p>
                        <p className="text-4xl font-bold mt-2 text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-3">{stat.description}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Platform Capabilities</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive tools for infrastructure transparency and citizen engagement
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="flex flex-col items-center text-center group">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl mb-6 group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-8 bg-gradient-to-r from-primary via-primary/90 to-primary/80">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Report Road Issues Directly</h2>
          <p className="text-lg text-white/90 mb-10 leading-relaxed">
            Have you spotted potholes, construction delays, or quality issues? Help us maintain accountability by
            reporting directly through our complaint portal.
          </p>
          <Link href="/complain">
            <Button
              size="lg"
              variant="secondary"
              className="px-8 font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              File a Complaint
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
