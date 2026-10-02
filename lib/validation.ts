import { z } from "zod"
import { issueTypeLabels } from "@/lib/site"
import type { IssueType } from "@/lib/types"

const issueTypes = Object.keys(issueTypeLabels) as [IssueType, ...IssueType[]]

/** Indian mobile: optional +91 / 0 prefix, then 10 digits starting 6-9. Spaces and dashes allowed. */
export const indianPhone = z
  .string()
  .trim()
  .refine((v) => /^(?:\+?91|0)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")), "Enter a valid 10-digit Indian mobile number")

/** Generous bounding box for India; matches the database check on reports. */
export const INDIA_BOUNDS = { minLat: 6, maxLat: 38, minLng: 68, maxLng: 98 }
export const isInIndia = (lat: number, lng: number) =>
  lat >= INDIA_BOUNDS.minLat && lat <= INDIA_BOUNDS.maxLat && lng >= INDIA_BOUNDS.minLng && lng <= INDIA_BOUNDS.maxLng

export const reportSchema = z
  .object({
    issueType: z.enum(issueTypes, { errorMap: () => ({ message: "Choose the type of issue" }) }),
    expresswayId: z.string().min(1, "Choose the road").max(64),
    location: z
      .string()
      .trim()
      .min(3, "Describe where the issue is (km marker, landmark or direction)")
      .max(300, "Keep the location under 300 characters"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    severity: z.enum(["low", "medium", "high", "critical"], { errorMap: () => ({ message: "Choose a severity" }) }),
    description: z
      .string()
      .trim()
      .min(20, "Please describe the issue in at least 20 characters")
      .max(2000, "Keep the description under 2000 characters"),
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
    phone: z.union([z.literal(""), indianPhone]),
    photos: z.array(z.string()).max(3),
  })
  .refine((r) => (r.latitude === undefined) === (r.longitude === undefined), { message: "GPS position is incomplete", path: ["location"] })
  .refine((r) => r.latitude === undefined || isInIndia(r.latitude, r.longitude!), {
    message: "The GPS position is outside India. Remove it, or use your location at the spot.",
    path: ["location"],
  })

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(254),
  category: z.enum(["data-correction", "feedback", "partnership", "other"], { errorMap: () => ({ message: "Choose a category" }) }),
  subject: z.string().trim().min(3, "Add a subject").max(200),
  message: z.string().trim().min(20, "Please write at least 20 characters").max(3000),
})

/** "+91 98765-43210", "098765 43210", "9876543210" → "+919876543210" (E.164, as the SMS provider expects). */
export function toE164IndianPhone(value: string): string {
  return `+91${value.replace(/[\s-]/g, "").slice(-10)}`
}

const email = z.string().trim().toLowerCase().email("Enter a valid email address")

const newPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number")

const matchingPasswords = <T extends { password: string; confirmPassword: string }>(d: T) => d.password === d.confirmPassword
const mismatch = { message: "Passwords don't match", path: ["confirmPassword"] }

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email,
    phone: z.union([z.literal(""), indianPhone]),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(matchingPasswords, mismatch)

export const phoneOtpRequestSchema = z.object({
  phone: indianPhone.transform(toE164IndianPhone),
  /** Only sent when creating an account by mobile. */
  name: z.string().trim().min(2, "Enter your name").max(80).optional(),
})

export const phoneOtpVerifySchema = z.object({
  phone: indianPhone.transform(toE164IndianPhone),
  token: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({ password: newPassword, confirmPassword: z.string() }).refine(matchingPasswords, mismatch)

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.union([z.literal(""), indianPhone]),
})

/** Only allow same-site relative paths as post-login destinations (blocks open redirects like //evil.com). */
export function safeNextPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback
  return value
}

/** Flatten zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form")
    out[key] ??= issue.message
  }
  return out
}
