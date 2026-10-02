"use client"

import { createBrowserClient } from "@supabase/ssr"
import { AUTH_ENABLED, supabaseKey, supabaseUrl } from "@/backend/supabase/config"

/** Browser client, or null when accounts aren't configured. Used only for UI state such as the header's account button. */
export function createClient() {
  return AUTH_ENABLED ? createBrowserClient(supabaseUrl, supabaseKey) : null
}
