"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Mail, Linkedin, Award, Target, Users, Lightbulb, MapPin } from "lucide-react"

const teamMembers = [
  {
    id: 1,
    name: "Tanishk Gupta",
    role: "Project Lead",
    description: "Leads vision and strategy",
    icon: "👨‍💼",
    email: "tanishkgupta8000@gmail.com",
    linkedin: "https://www.linkedin.com/in/tanishk-gupta-5b7536287/",
  },
  {
    id: 2,
    name: "Rammanjal Singh Gangwar",
    role: "Development",
    description: "Backend architecture expert",
    icon: "💻",
    email: "gangwarraamanjal@gmail.com",
    linkedin: "https://www.linkedin.com/in/raamanjal",
  },
  {
    id: 3,
    name: "Srashti Gupta",
    role: "Infrastructure Research & UI/UX",
    description: "Data validation & design specialist",
    icon: "🔍",
    email: "srashtigupta2005@gmail.com",
    linkedin: "https://www.linkedin.com/in/srashti-gupta-114b36325",
  },
  {
    id: 4,
    name: "Ashutosh Gupta",
    role: "Development",
    description: "Full-stack engineer",
    icon: "⚙️",
    email: "ashutoshgupta1287@gmail.com",
    linkedin:
      "https://www.linkedin.com/in/ashutoshkumargupta1287?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  },
  {
    id: 5,
    name: "Kshama Pandey",
    role: "UI/UX Designer",
    description: "Experience designer",
    icon: "🎨",
    email: "kshamapandey797@gmail.com",
    linkedin: "https://www.linkedin.com/in/kshama-pandey-025b21317",
  },
]

const values = [
  {
    icon: Target,
    title: "Transparency",
    description: "We believe in open access to government data for all citizens.",
  },
  {
    icon: Award,
    title: "Accountability",
    description: "Holding contractors and authorities responsible for quality.",
  },
  {
    icon: Users,
    title: "Citizen Empowerment",
    description: "Citizens deserve a voice in infrastructure development.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Using technology to solve infrastructure challenges.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-16">
        <section className="mb-20">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">About Road Truth India</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Transforming infrastructure transparency through citizen empowerment and accountability
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To bring transparency, accountability, and citizen participation to India's expressway projects.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We believe informed citizens are the foundation of good governance. By providing detailed, accessible
                information about expressway projects, contractors, and infrastructure quality, we empower every Indian
                to participate in holding authorities accountable.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Our Vision</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A transparent India, where every road built stands the test of time and trust.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We envision a future where expressway construction is monitored by vigilant citizens, contractor
                performance is publicly visible, and road complaints are resolved swiftly. This is the India we're
                building together.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-3">Our Core Values</h2>
            <p className="text-muted-foreground text-lg">The principles guiding every decision we make</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon
              return (
                <Card key={idx} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 border-0">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg w-fit mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-3">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground">
              Team Runtime Error - Dedicated to Infrastructure Transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {teamMembers.map((member) => (
              <Card
                key={member.id}
                className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 text-center border-0 flex flex-col"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 text-3xl">
                  {member.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                <p className="text-primary font-semibold text-sm mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{member.description}</p>
                <div className="flex justify-center gap-2 pt-4 border-t border-border">
                  <a
                    href={`mailto:${member.email}`}
                    title={`Email ${member.name}`}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${member.name}'s LinkedIn`}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-12 text-center border border-primary/20">
          <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground mb-10 text-lg">Have questions or feedback? We'd love to hear from you.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <p className="font-semibold">info@roadtruthinda.gov.in</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9c0-1.105.895-2 2-2h2.757l2.707-2.707a1 1 0 011.414 1.414L9.878 8h4.244l-1.121-1.293a1 1 0 111.522-1.314l2.5 2.886A2 2 0 0118 10v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <p className="font-semibold">+91 1800-TRUTH-IN</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="text-muted-foreground">Ministry of Road Transport & Highways, New Delhi</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
