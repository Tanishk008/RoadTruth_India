"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function ComplainPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    expressway: "",
    location: "",
    issueType: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 5000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">File a Complaint</h1>
          <p className="text-lg text-muted-foreground">
            Help us improve India's expressways. Report road quality issues, delays, or infrastructure concerns.
          </p>
        </div>

        {/* Note about Login */}
        <Card className="p-4 mb-8 border-accent/50 bg-accent/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Authentication Required</p>
            <p className="text-sm text-muted-foreground">
              For verified complaints, please{" "}
              <Link href="/login" className="text-accent hover:underline">
                login
              </Link>{" "}
              first. You can also submit as a guest, but your complaint may have lower priority.
            </p>
          </div>
        </Card>

        {/* Complaint Form */}
        <Card className="p-8">
          {isSubmitted && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">Complaint Submitted Successfully!</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Our team will verify it soon. You'll receive updates via email.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-bold mb-4">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  <Input
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Address</label>
                  <Input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Phone Number</label>
                  <Input
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Issue Details */}
            <div>
              <h3 className="text-lg font-bold mb-4">Issue Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Expressway</label>
                  <Select
                    value={formData.expressway}
                    onValueChange={(value) => setFormData({ ...formData, expressway: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expressway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delhi-mumbai">Delhi-Mumbai Expressway</SelectItem>
                      <SelectItem value="mumbai-nagpur">Mumbai-Nagpur Expressway</SelectItem>
                      <SelectItem value="delhi-meerut">Delhi-Meerut Expressway</SelectItem>
                      <SelectItem value="pune-nashik">Pune-Nashik Expressway</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Issue Type</label>
                  <Select
                    value={formData.issueType}
                    onValueChange={(value) => setFormData({ ...formData, issueType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pothole">Pothole/Damage</SelectItem>
                      <SelectItem value="delay">Project Delay</SelectItem>
                      <SelectItem value="quality">Quality Issues</SelectItem>
                      <SelectItem value="safety">Safety Concern</SelectItem>
                      <SelectItem value="toll">Toll Issues</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location/City</label>
                <Input
                  placeholder="e.g., Delhi, Kilometer 45"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">Detailed Description</label>
              <Textarea
                required
                placeholder="Please describe the issue in detail. Include when you noticed it, impact on traffic, and any other relevant information."
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can also attach photos directly in the form or send them via email after submission.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" size="lg" className="flex-1">
                Submit Complaint
              </Button>
              <Button type="button" variant="outline" size="lg">
                <Link href="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
