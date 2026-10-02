/** Accounts switch on once both Supabase env vars are set; see .env.example. */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
export const AUTH_ENABLED = Boolean(supabaseUrl && supabaseKey)
