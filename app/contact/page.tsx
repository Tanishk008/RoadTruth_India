"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, CheckCircle2 } from "lucide-react"
import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    setSubmitted(true)
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "",
        message: "",
      })
      setSubmitted(false)
    }, 5000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions or feedback about Road Truth India? Reach out to our team. We'll get back to you within 24
            hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Information Cards */}
          <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-muted-foreground text-sm">support@roadtruthindia.gov.in</p>
                <p className="text-muted-foreground text-sm">feedback@roadtruthindia.gov.in</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-accent hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Phone</h3>
                <p className="text-muted-foreground text-sm">+91-11-XXXX-XXXX</p>
                <p className="text-muted-foreground text-sm">Mon-Fri: 9 AM - 6 PM IST</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-primary/60 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Address</h3>
                <p className="text-muted-foreground text-sm">Ministry of Road Transport</p>
                <p className="text-muted-foreground text-sm">New Delhi, India</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="p-8">
              {!submitted ? (
                <>
                  <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Full Name *</label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email *</label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Phone *</label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91-XXXXXXXXXX"
                          required
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Category *</label>
                      <Select value={formData.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="complaint">Road Complaint</SelectItem>
                          <SelectItem value="pothole">Pothole Report</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="contractor">Contractor Related</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject *</label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Brief subject of your message"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please provide detailed information..."
                        required
                        rows={5}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Submit Message
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Message Submitted!</h3>
                  <p className="text-muted-foreground text-center">
                    Thank you for contacting us. Our team will review your message and get back to you within 24 hours.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Information Section */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Response Time</h3>
                  <p className="text-muted-foreground">
                    We commit to responding to all inquiries within <span className="font-semibold">24 hours</span>. For
                    urgent matters, please indicate in your message.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Common Questions</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-sm mb-1">What should I include in a pothole report?</p>
                  <p className="text-sm text-muted-foreground">
                    Location, road name, photos, and severity level help us prioritize repairs.
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-semibold text-sm mb-1">How do I report a contractor issue?</p>
                  <p className="text-sm text-muted-foreground">
                    Select "Contractor Related" in the category dropdown and provide details with evidence.
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="font-semibold text-sm mb-1">Can I track my complaint status?</p>
                  <p className="text-sm text-muted-foreground">
                    Yes, we'll provide a reference number via email for tracking purposes.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
              <h3 className="font-bold text-lg mb-3">Office Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Friday:</span>
                  <span className="font-semibold">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saturday:</span>
                  <span className="font-semibold">10:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sunday & Holidays:</span>
                  <span className="font-semibold">Closed</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
