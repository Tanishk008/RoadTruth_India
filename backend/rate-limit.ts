/**
 * Best-effort fixed-window rate limiter, per server instance. On serverless hosts each instance keeps its own
 * counts, so this caps bursts from one client rather than enforcing a global quota.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return function check(key: string, now = Date.now()): { ok: boolean; retryAfterSeconds: number } {
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return { ok: true, retryAfterSeconds: 0 }
    }
    entry.count++
    return { ok: entry.count <= limit, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
  }
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}
