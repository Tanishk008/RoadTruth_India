"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Upload, CheckCircle2, MapPin, Camera, Phone, Mail } from "lucide-react"
import { useState, useRef } from "react"

export default function ReportIssuePage() {
  const [formData, setFormData] = useState({
    issueType: "",
    expressway: "",
    location: "",
    description: "",
    severity: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [images, setImages] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [imagePreview, setImagePreview] = useState([])
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 3) {
      alert("Maximum 3 images allowed")
      return
    }

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [...prev, file])
        setImagePreview((prev) => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Report submitted:", formData, images)
    setSubmitted(true)
    setTimeout(() => {
      setFormData({
        issueType: "",
        expressway: "",
        location: "",
        description: "",
        severity: "",
        name: "",
        email: "",
        phone: "",
        address: "",
      })
      setImages([])
      setImagePreview([])
      setSubmitted(false)
    }, 5000)
  }

  const expressways = [
    "Delhi-Mumbai Expressway",
    "Mumbai-Nagpur Expressway",
    "Mumbai-Pune Expressway",
    "Delhi-Meerut Expressway",
    "Yamuna Expressway",
    "Agra-Lucknow Expressway",
    "Awadh/Lucknow-Kanpur Expressway",
    "Dwarka Expressway",
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-bold">Report Road Issue</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help us improve India's expressways by reporting potholes, road damage, or other infrastructure issues. Your
            feedback is crucial for maintaining safe and well-maintained roads.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card className="p-8">
                  {/* Issue Details Section */}
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-accent" />
                      Issue Details
                    </h2>
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Issue Type *</label>
                        <Select
                          value={formData.issueType}
                          onValueChange={(value) => handleSelectChange("issueType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select issue type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pothole">Pothole</SelectItem>
                            <SelectItem value="road-damage">Road Damage</SelectItem>
                            <SelectItem value="debris">Debris/Obstruction</SelectItem>
                            <SelectItem value="water-logging">Water Logging</SelectItem>
                            <SelectItem value="signage">Missing/Damaged Signage</SelectItem>
                            <SelectItem value="barrier">Damaged Barrier</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Expressway *</label>
                        <Select
                          value={formData.expressway}
                          onValueChange={(value) => handleSelectChange("expressway", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select expressway" />
                          </SelectTrigger>
                          <SelectContent>
                            {expressways.map((exp) => (
                              <SelectItem key={exp} value={exp}>
                                {exp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Severity Level *</label>
                          <Select
                            value={formData.severity}
                            onValueChange={(value) => handleSelectChange("severity", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low (Minor)</SelectItem>
                              <SelectItem value="medium">Medium (Moderate)</SelectItem>
                              <SelectItem value="high">High (Serious)</SelectItem>
                              <SelectItem value="critical">Critical (Urgent)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            <MapPin className="w-4 h-4 inline mr-2" />
                            Location Details *
                          </label>
                          <Input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Kilometer marker or nearest landmark"
                            required
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Issue Description *</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Please provide detailed description of the issue (size, impact, traffic hazard, etc.)"
                          required
                          rows={5}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photo Upload Section */}
                  <div className="pt-8 border-t">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-accent" />
                      Photo Evidence (Max 3 images)
                    </h2>
                    <div className="space-y-4">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/50 rounded-lg p-8 cursor-pointer hover:bg-primary/5 transition-colors text-center"
                      >
                        <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
                        <p className="font-semibold text-foreground mb-1">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB each</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      {imagePreview.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imagePreview.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview || "/placeholder.svg"}
                                alt={`Preview ${index}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                              <p className="text-xs text-muted-foreground mt-1">{images[index]?.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-accent" />
                    Important
                  </h3>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>✓ Clear, well-lit photos help faster resolution</li>
                    <li>✓ Include location landmarks for verification</li>
                    <li>✓ Describe the hazard level accurately</li>
                    <li>✓ Provide valid contact information</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4">Response Timeline</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-accent mb-1">Critical Issues</p>
                      <p className="text-muted-foreground">Within 24 hours</p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="font-semibold text-primary mb-1">High Priority</p>
                      <p className="text-muted-foreground">Within 3-5 days</p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="font-semibold mb-1">Standard</p>
                      <p className="text-muted-foreground">Within 7-10 days</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Personal Information Section */}
            <Card className="p-8">
              <h2 className="text-xl font-bold mb-6">Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name *</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </label>
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
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone *
                  </label>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Submit Section */}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" size="lg">
                Save as Draft
              </Button>
              <Button type="submit" size="lg" className="px-8">
                Submit Report
              </Button>
            </div>
          </form>
        ) : (
          <Card className="p-12 max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-center">Report Submitted Successfully!</h3>
              <p className="text-muted-foreground text-center text-lg mb-8">
                Thank you for helping improve India's expressways. Our team will review your report and take necessary
                action based on the severity level.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 w-full mb-8">
                <p className="text-sm text-muted-foreground mb-2">Reference Number:</p>
                <p className="text-2xl font-bold text-primary">RTI-2025-{Math.floor(Math.random() * 100000)}</p>
              </div>

              <div className="space-y-3 w-full">
                <p className="text-sm">
                  <span className="font-semibold">We will contact you within 24 hours</span> with a status update and
                  timeline for resolution.
                </p>
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to your registered email address with the reference number and full
                  report details.
                </p>
              </div>

              <Button onClick={() => window.location.reload()} size="lg" className="mt-8">
                Submit Another Report
              </Button>
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
