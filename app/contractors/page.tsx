"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Star, TrendingUp, CheckCircle2, Award, Briefcase, Calendar, MapPin } from "lucide-react"
import { useState } from "react"

const contractors = [
  {
    id: 1,
    name: "Larsen & Toubro Ltd.",
    projects: 12,
    ongoing: 2,
    rating: 4.6,
    status: "Active",
    specialization: "EPC/Infrastructure",
    description: "One of India's largest EPC firms with expertise in road, bridge, and expressway projects",
    founded: 1938,
    headquarters: "Mumbai, India",
    employees: 75000,
    awards: ["National Award for Excellence", "Best Infrastructure Contractor 2023"],
    experience: "85+ years in infrastructure development",
    capabilities: [
      "Engineering, Procurement & Construction (EPC)",
      "Project Management & Consulting",
      "Operations & Maintenance",
      "Environmental Management",
      "Safety & Quality Systems",
    ],
    activeProjects: [
      "Delhi-Mumbai Expressway (Phase 1-2)",
      "Bangalore-Chennai Expressway (Section A)",
      "Mumbai Port Authority Projects",
    ],
    turnover: "₹2,05,000 Cr (FY 2023)",
    certifications: "ISO 9001, ISO 14001, ISO 45001",
  },
  {
    id: 2,
    name: "Dilip Buildcon Ltd.",
    projects: 8,
    ongoing: 1,
    rating: 4.3,
    status: "Active",
    specialization: "Roads & Highways",
    description: "Strong focus on roads, highways, and EPC contracts with multiple expressway projects",
    founded: 1995,
    headquarters: "New Delhi",
    employees: 15000,
    awards: ["Infrastructure Excellence Award", "Best Highway Contractor"],
    experience: "28 years in road infrastructure",
    capabilities: [
      "Highway Construction & Maintenance",
      "Bridge Engineering",
      "Toll Management Systems",
      "Quality Assurance",
      "Sustainable Practices",
    ],
    activeProjects: ["Mumbai-Nagpur Expressway", "Delhi Ring Road Expansion", "National Highway Upgrades"],
    turnover: "₹8,500 Cr (FY 2023)",
    certifications: "ISO 9001, ISO 14001",
  },
  {
    id: 3,
    name: "Afcons Infrastructure Ltd.",
    projects: 7,
    ongoing: 3,
    rating: 4.1,
    status: "Active",
    specialization: "Infrastructure",
    description: "Infrastructure company specializing in roads, bridges, and expressways",
    founded: 2002,
    headquarters: "Hyderabad",
    employees: 8000,
    awards: ["Innovation in Infrastructure", "Regional Excellence Award"],
    experience: "21 years in infrastructure sector",
    capabilities: [
      "Civil Construction",
      "Bridge & Structural Works",
      "Underground Infrastructure",
      "Quality Management",
      "Tech Integration",
    ],
    activeProjects: ["Bengaluru-Chennai Expressway (Phase 1)", "Hyderabad Metro Projects", "Regional Road Network"],
    turnover: "₹4,200 Cr (FY 2023)",
    certifications: "ISO 9001, ISO 14001, ISO 45001",
  },
  {
    id: 4,
    name: "IRB Infrastructure Developers Ltd.",
    projects: 9,
    ongoing: 2,
    rating: 4.7,
    status: "Active",
    specialization: "BOT Projects",
    description: "Focused on BOT/road projects, expressways, and large portfolio in highways",
    founded: 1998,
    headquarters: "Mumbai",
    employees: 12000,
    awards: ["Best BOT Operator", "Infrastructure Leadership Award"],
    experience: "25 years in highway infrastructure",
    capabilities: [
      "Build-Operate-Transfer (BOT) Projects",
      "Toll Revenue Management",
      "Infrastructure Development",
      "Financial Management",
      "Customer Service Excellence",
    ],
    activeProjects: ["Delhi-Meerut Expressway (Operations)", "Mumbai-Pune Tollway", "Multiple BOT Projects Nationwide"],
    turnover: "₹3,800 Cr (FY 2023)",
    certifications: "ISO 9001, ISO 14001",
  },
  {
    id: 5,
    name: "HG Infra Engineering Ltd.",
    projects: 5,
    ongoing: 1,
    rating: 4.2,
    status: "Active",
    specialization: "Road & Expressway",
    description: "Growing player in road and expressway segments with focus on Maharashtra and Rajasthan",
    founded: 2007,
    headquarters: "Pune",
    employees: 5000,
    awards: ["Regional Growth Excellence", "Project Delivery Award"],
    experience: "16 years in highway sector",
    capabilities: [
      "EPC Contracts",
      "Regional Expertise",
      "Cost-effective Solutions",
      "Quality Delivery",
      "Local Partnerships",
    ],
    activeProjects: ["Pune-Nashik Expressway", "Maharashtra Highway Network", "Regional Development Projects"],
    turnover: "₹2,100 Cr (FY 2023)",
    certifications: "ISO 9001, ISO 14001",
  },
  {
    id: 6,
    name: "PNC Infratech Ltd.",
    projects: 6,
    ongoing: 2,
    rating: 4.4,
    status: "Active",
    specialization: "Roads & Highways",
    description: "Listed company active in expressway packages with strong execution track record",
    founded: 2004,
    headquarters: "Lucknow",
    employees: 9000,
    awards: ["Execution Excellence", "Investor Confidence Award"],
    experience: "20 years in infrastructure",
    capabilities: [
      "Highway Construction",
      "Project Execution",
      "Stakeholder Management",
      "Regulatory Compliance",
      "Financial Transparency",
    ],
    activeProjects: ["Lucknow-Kanpur Expressway", "Uttar Pradesh Highway Network", "Northern Region Projects"],
    turnover: "₹3,200 Cr (FY 2023)",
    certifications: "ISO 9001, ISO 14001",
  },
]

export default function ContractorsPage() {
  const [selectedContractor, setSelectedContractor] = useState(null)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Major Contractors Directory</h1>
          <p className="text-lg text-muted-foreground">
            Leading infrastructure firms working on India's expressway projects. Click on any contractor to view
            detailed information.
          </p>
        </div>

        {/* Contractors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contractors.map((contractor) => (
            <Card
              key={contractor.id}
              className="p-6 hover:shadow-lg transition-all group cursor-pointer hover:border-accent"
              onClick={() => setSelectedContractor(contractor)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{contractor.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {contractor.specialization}
                  </Badge>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {contractor.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{contractor.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-muted-foreground">Projects Completed</p>
                  <p className="text-2xl font-bold">{contractor.projects}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ongoing</p>
                  <p className="text-2xl font-bold">{contractor.ongoing}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {contractor.rating}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-accent font-medium group-hover:gap-3 transition-all">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">View Details</span>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {selectedContractor && (
        <Dialog open={!!selectedContractor} onOpenChange={() => setSelectedContractor(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold">{selectedContractor.name}</DialogTitle>
              <DialogClose />
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Founded</p>
                  <p className="font-bold text-lg">{selectedContractor.founded}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Employees</p>
                  <p className="font-bold text-lg">{selectedContractor.employees.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Experience</p>
                  <p className="font-bold break-words line-clamp-2">{selectedContractor.experience}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <p className="font-bold text-lg flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    {selectedContractor.rating}/5
                  </p>
                </div>
              </div>

              {/* Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    Headquarters
                  </h3>
                  <p className="text-muted-foreground">{selectedContractor.headquarters}</p>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-accent" />
                    Turnover
                  </h3>
                  <p className="text-muted-foreground">{selectedContractor.turnover}</p>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Certifications & Standards
                </h3>
                <Badge variant="secondary">{selectedContractor.certifications}</Badge>
              </div>

              {/* Capabilities */}
              <div>
                <h3 className="font-bold text-lg mb-3">Core Capabilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedContractor.capabilities.map((capability, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      <p className="text-sm">{capability}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Awards */}
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Awards & Recognition
                </h3>
                <div className="space-y-2">
                  {selectedContractor.awards.map((award, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50"
                    >
                      <Star className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm font-medium">{award}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Projects */}
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Current Active Projects
                </h3>
                <div className="space-y-2">
                  {selectedContractor.activeProjects.map((project, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/50"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      <p className="text-sm">{project}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg border border-primary/20">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completed Projects</p>
                    <p className="text-2xl font-bold">{selectedContractor.projects}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ongoing Projects</p>
                    <p className="text-2xl font-bold">{selectedContractor.ongoing}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Experience</p>
                    <p className="text-lg font-bold">{new Date().getFullYear() - selectedContractor.founded}+ Years</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  )
}
