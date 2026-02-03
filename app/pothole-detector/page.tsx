"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Clock } from "lucide-react"

export default function PotholeDetectorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Coming Soon Card */}
          <Card className="p-12 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>
              <p className="text-xl text-muted-foreground mb-2">Pothole Detector</p>
              <p className="text-muted-foreground mb-8">
                Our AI-powered pothole detection system is under development. This feature will allow citizens to
                automatically report road defects using photos and GPS coordinates.
              </p>
            </div>

            {/* Feature Preview */}
            <div className="bg-muted/50 rounded-lg p-8 mb-8 text-left">
              <h3 className="font-semibold mb-4">Coming Features</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>AI-powered image recognition to detect potholes automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>GPS location tracking and mapping</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Real-time damage severity assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Automatic notification to local authorities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent font-bold">✓</span>
                  <span>Repair tracking and follow-up status</span>
                </li>
              </ul>
            </div>

            <div className="inline-block bg-accent/10 px-6 py-3 rounded-full">
              <p className="text-sm text-accent font-medium">🚀 Launching in Q2 2025</p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
