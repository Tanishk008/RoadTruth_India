import type { User } from "@supabase/supabase-js"
import { createClient } from "@/backend/supabase/server"
import { AUTH_ENABLED } from "@/backend/supabase/config"

export interface Citizen {
  id: string
  name: string
  email: string | null
  phone: string | null
  /** Phone the user signed in with (verified by OTP), as opposed to one typed into their profile. */
  phoneVerified: boolean
  joinedAt: string
}

export function toCitizen(user: User): Citizen {
  const meta = user.user_metadata ?? {}
  const phone = user.phone ? `+${user.phone.replace(/^\+/, "")}` : (meta.phone as string | null) ?? null
  return {
    id: user.id,
    name: (meta.full_name as string | undefined) ?? "",
    email: user.email || null,
    phone,
    phoneVerified: Boolean(user.phone_confirmed_at),
    joinedAt: user.created_at,
  }
}

/** The signed-in citizen, verified against Supabase Auth. Null when signed out or accounts are disabled. */
export async function getCitizen(): Promise<Citizen | null> {
  if (!AUTH_ENABLED) return null
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user ? toCitizen(data.user) : null
}
