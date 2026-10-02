"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { Card } from "@/frontend/components/ui/card"
import { Input } from "@/frontend/components/ui/input"
import { Textarea } from "@/frontend/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select"
import { Field } from "@/frontend/components/field"
import { sendContactMessage } from "@/backend/services/backend"
import { site } from "@/lib/site"
import { contactSchema, fieldErrors } from "@/lib/validation"

const categories = [
  { value: "data-correction", label: "Data correction" },
  { value: "feedback", label: "Feedback on the site" },
  { value: "partnership", label: "Partnership / media" },
  { value: "other", label: "Other" },
]

const empty = { name: "", email: "", category: "", subject: "", message: "" }

export function ContactForm() {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sentId, setSentId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const update = (key: keyof typeof empty, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: "" }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = contactSchema.safeParse(form)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setSending(true)
    setFailed(false)
    try {
      const { id } = await sendContactMessage(parsed.data)
      setSentId(id)
      setForm(empty)
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }

  if (sentId) {
    return (
      <Card className="p-10 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Message received</h2>
        <p className="text-muted-foreground mb-6">Thanks for writing. Your message ID is <span className="font-mono font-semibold">{sentId}</span>.</p>
        <Button variant="outline" onClick={() => setSentId(null)}>Send another message</Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field id="name" label="Full name" required error={errors.name}>
            <Input id="name" autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} aria-invalid={!!errors.name} />
          </Field>
          <Field id="email" label="Email" required error={errors.email}>
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!errors.email} />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field id="category" label="Category" required error={errors.category}>
            <Select value={form.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.category}><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field id="subject" label="Subject" required error={errors.subject}>
            <Input id="subject" value={form.subject} onChange={(e) => update("subject", e.target.value)} aria-invalid={!!errors.subject} />
          </Field>
        </div>
        <Field id="message" label="Message" required error={errors.message} hint="For data corrections, please include a source link.">
          <Textarea id="message" rows={6} value={form.message} onChange={(e) => update("message", e.target.value)} aria-invalid={!!errors.message} />
        </Field>
        {failed && (
          <p className="text-sm text-destructive" role="alert">
            Your message couldn&apos;t be sent. Check your connection and try again, or email {site.contactEmail}.
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={sending}>
          {sending && <Loader2 className="w-4 h-4 animate-spin" />} Send message
        </Button>
      </form>
    </Card>
  )
}
