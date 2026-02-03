"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Citizen Login Portal</h1>
          <p className="text-center text-muted-foreground mb-8">Access your complaints and tracked reports</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Email / Username</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button type="submit" size="lg" className="w-full">
              Login
            </Button>
          </form>

          <div className="mt-6 space-y-4 border-t pt-6">
            <Link href="#" className="text-sm text-accent hover:underline block">
              Forgot Password?
            </Link>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <Link href="/register" className="text-accent hover:underline font-semibold">
                Create one
              </Link>
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Your data is protected under Road Truth India Security Policy.
          </p>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
