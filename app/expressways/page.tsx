"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { MapPin, DollarSign, Clock, Users, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { useState } from "react"

const expressways = [
  {
    id: 1,
    name: "Delhi-Mumbai Expressway",
    route: "Delhi → Mumbai",
    distance: "1,380 km",
    status: "Operational",
    budget: "₹98,000-1,00,000 Cr",
    contractor: "Larsen & Toubro Ltd.",
    timeline: "2027",
    rating: 4.5,
    tolls: 68,
    tollPlazas: ["Ecotech Extn.", "Meerut", "Agra", "Gwalior", "Indore", "Ujjain", "Madhya Pradesh", "Haryana Border"],
    images: [
      "https://images.unsplash.com/photo-1486781622519-c21cc028cb0d?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=500&fit=crop",
    ],
    description:
      "India's longest expressway connecting the capital with the financial hub. Features modern 6-8 lane infrastructure with advanced toll systems.",
    highlights: [
      "World-class highway infrastructure",
      "Eco-friendly design features",
      "Smart toll management system",
      "Rest areas every 50 km",
      "24/7 emergency response",
    ],
    completionPercentage: 45,
    keyFeatures:
      "Multi-lane expressway with grade separations, digitized toll collection, and real-time traffic management.",
  },
  {
    id: 2,
    name: "Mumbai-Nagpur Expressway",
    route: "Mumbai → Nagpur",
    distance: "701 km",
    status: "Operational",
    budget: "₹55,000 Cr",
    contractor: "Dilip Buildcon Ltd.",
    timeline: "2024",
    rating: 4.2,
    tolls: 34,
    tollPlazas: ["Kasara", "Nashik", "Aurangabad", "Parbhani", "Parli Vaijnath", "Latur"],
    images: [
      "https://images.unsplash.com/photo-1511528635268-f9b1ddb4c1c9?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1442512595331-e89e6e3d67d0?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop",
    ],
    description:
      "Connects two major economic centers, reducing travel time and boosting logistics. Features cutting-edge traffic management.",
    highlights: [
      "6-lane premium expressway",
      "Advanced ITS implementation",
      "Enhanced road safety features",
      "Environmental conservation zones",
      "Community rest facilities",
    ],
    completionPercentage: 85,
    keyFeatures: "Premium 6-lane expressway with intelligent transportation systems and dedicated logistics zones.",
  },
  {
    id: 3,
    name: "Bengaluru-Chennai Expressway",
    route: "Bengaluru → Chennai",
    distance: "270 km",
    status: "Under Construction",
    budget: "₹22,000 Cr",
    contractor: "Afcons Infrastructure Ltd.",
    timeline: "2026",
    rating: 3.8,
    tolls: 15,
    tollPlazas: ["Chikballapur", "Kolar", "Chintamani", "Tirupati Region"],
    images: [
      "https://images.unsplash.com/photo-1494145904049-0dca7b3fad3f?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1511378592104-21149ab33208?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1443890923872-c1fb25b45885?w=800&h=500&fit=crop",
    ],
    description:
      "Southern India's most ambitious project connecting tech hubs. Will revolutionize South Indian connectivity.",
    highlights: [
      "Green expressway design",
      "SEZ connectivity",
      "Smart lighting systems",
      "Water management systems",
      "Tech park integration",
    ],
    completionPercentage: 65,
    keyFeatures: "Sustainable 6-lane expressway with smart infrastructure and integrated tech park connectivity.",
  },
  {
    id: 4,
    name: "Delhi-Meerut Expressway",
    route: "Delhi → Meerut",
    distance: "96 km",
    status: "Operational",
    budget: "₹5,200 Cr",
    contractor: "IRB Infrastructure Developers Ltd.",
    timeline: "2023",
    rating: 4.7,
    tolls: 8,
    tollPlazas: ["Ecotech", "Gazipur", "Dasna", "UP Border"],
    images: [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop",
    ],
    description: "Model expressway project showcasing best practices in infrastructure. Reduced travel time by 60%.",
    highlights: [
      "8-lane premium corridor",
      "Electronic toll collection",
      "Safety features excellence",
      "Landscape beautification",
      "Industrial area connectivity",
    ],
    completionPercentage: 100,
    keyFeatures: "Award-winning 8-lane expressway with premium safety features and best-in-class toll infrastructure.",
  },
  {
    id: 5,
    name: "Pune-Nashik Expressway",
    route: "Pune → Nashik",
    distance: "189 km",
    status: "Operational",
    budget: "₹8,500 Cr",
    contractor: "HG Infra Engineering Ltd.",
    timeline: "2023",
    rating: 4.3,
    tolls: 12,
    tollPlazas: ["Paud", "Lonavala", "Sinhagad", "Maludi"],
    images: [
      "https://images.unsplash.com/photo-1568143335443-46e0b2c6a108?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1461896953014-85cb44e25828?w=800&h=500&fit=crop",
    ],
    description: "Vital link for agricultural and industrial transportation. Scenic route through Western Ghats.",
    highlights: [
      "6-lane divided highway",
      "Mountain pass engineering",
      "Agricultural logistics hub",
      "Tourist-friendly stops",
      "Weather monitoring systems",
    ],
    completionPercentage: 95,
    keyFeatures: "6-lane expressway with specialized mountain engineering and agricultural market integration.",
  },
  {
    id: 6,
    name: "Lucknow-Kanpur Expressway",
    route: "Lucknow ↔ Kanpur",
    distance: "62-63 km",
    status: "Under Construction",
    budget: "₹6,800 Cr",
    contractor: "PNC Infratech Ltd.",
    timeline: "2025",
    rating: 3.9,
    tolls: 6,
    tollPlazas: ["Kanpur", "Jajmau", "Rania", "Lucknow"],
    images: [
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1503126613408-eca07ce68773?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop",
    ],
    description: "Connects two major Uttar Pradesh cities. Will strengthen North India's transport corridor.",
    highlights: [
      "6-lane modern expressway",
      "Industrial estate links",
      "Smart parking areas",
      "Community engagement zones",
      "Safety training centers",
    ],
    completionPercentage: 70,
    keyFeatures: "Modern 6-lane expressway with integrated industrial connectivity and advanced safety features.",
  },
]

export default function ExpresswaysPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedExpressway, setSelectedExpressway] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const filteredExpressways = expressways.filter((eway) => {
    const matchesSearch = eway.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || eway.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const nextImage = () => {
    if (selectedExpressway) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedExpressway.images.length)
    }
  }

  const prevImage = () => {
    if (selectedExpressway) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedExpressway.images.length) % selectedExpressway.images.length)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">India's Expressway Network</h1>
          <p className="text-lg text-muted-foreground">
            Browse detailed information about all operational and under-construction expressways
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="text-sm font-medium mb-2 block">Search by Name</label>
            <Input
              placeholder="Search expressways..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Under Construction">Under Construction</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expressways Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredExpressways.map((eway) => (
            <Card
              key={eway.id}
              className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer flex flex-col"
              onClick={() => {
                setSelectedExpressway(eway)
                setCurrentImageIndex(0)
              }}
            >
              <div className="relative h-40 bg-gradient-to-r from-primary to-accent overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    backgroundImage: `url("${eway.images[0]}")`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant={eway.status === "Operational" ? "default" : "secondary"} className="text-white">
                    {eway.status === "Operational" ? "🟢 Operational" : "🟡 Under Construction"}
                  </Badge>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{eway.name}</h3>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-muted-foreground line-clamp-1">{eway.route}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-muted-foreground">{eway.distance}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-muted-foreground line-clamp-1">{eway.budget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-muted-foreground">{eway.tolls} Toll Plazas</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Completion Target</p>
                    <p className="font-semibold text-sm">{eway.timeline}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <p className="font-semibold">⭐ {eway.rating}/5</p>
                  </div>
                </div>

                <p className="text-xs text-accent mt-3 font-semibold">Click for details →</p>
              </div>
            </Card>
          ))}
        </div>

        {filteredExpressways.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No expressways found matching your criteria.</p>
          </div>
        )}
      </main>

      {selectedExpressway && (
        <Dialog open={!!selectedExpressway} onOpenChange={() => setSelectedExpressway(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl">{selectedExpressway.name}</DialogTitle>
              <DialogClose />
            </DialogHeader>

            <div className="space-y-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedExpressway.images[currentImageIndex] || "/placeholder.svg"}
                    alt={`${selectedExpressway.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <button
                      onClick={prevImage}
                      className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {selectedExpressway.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Image {currentImageIndex + 1} of {selectedExpressway.images.length}
                </p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Distance</p>
                  <p className="font-bold text-sm">{selectedExpressway.distance}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Budget</p>
                  <p className="font-bold text-xs">{selectedExpressway.budget}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="font-bold text-sm">{selectedExpressway.status}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Tolls</p>
                  <p className="font-bold text-lg">{selectedExpressway.tolls}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <p className="font-bold">⭐ {selectedExpressway.rating}/5</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/50">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Toll Plazas ({selectedExpressway.tolls} Total)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedExpressway.tollPlazas.map((plaza, idx) => (
                    <Badge key={idx} variant="outline" className="justify-center py-2">
                      {plaza}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Completion Percentage */}
              <div>
                <p className="text-sm font-semibold mb-2">Project Completion</p>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500"
                    style={{ width: `${selectedExpressway.completionPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedExpressway.completionPercentage}% Complete
                </p>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold mb-2">About</h3>
                <p className="text-muted-foreground">{selectedExpressway.description}</p>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="font-bold mb-3">Key Features</h3>
                <p className="text-muted-foreground mb-3">{selectedExpressway.keyFeatures}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedExpressway.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                      <p className="text-sm">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contractor Info */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Main Contractor
                </h3>
                <p className="text-sm font-semibold">{selectedExpressway.contractor}</p>
                <p className="text-xs text-muted-foreground mt-1">Target Completion: {selectedExpressway.timeline}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  )
}
