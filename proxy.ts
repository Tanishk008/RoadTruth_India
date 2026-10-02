import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { AUTH_ENABLED, supabaseKey, supabaseUrl } from "@/backend/supabase/config"

const PROTECTED = ["/account", "/reset-password"]

/** Refreshes the Supabase session cookie on each navigation and bounces signed-out visitors away from account pages. */
export async function proxy(request: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value)
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const { pathname, search } = request.nextUrl
  if (!data?.claims && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  // Skip static assets, images and the pothole API.
  matcher: ["/((?!_next/static|_next/image|api/|icon.svg|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
