function nowMs() {
  return Date.now()
}

function secondsFromMs(ms) {
  return Math.max(1, Math.ceil(ms / 1000))
}

export function createRateLimiter({
  capacity,
  windowMs,
  keyFn,
  id = 'rate-limit',
  skip,
}) {
  const maxTokens = Math.max(1, Number(capacity) || 60)
  const refillWindowMs = Math.max(1000, Number(windowMs) || 60_000)
  const refillRatePerMs = maxTokens / refillWindowMs
  const store = new Map()

  const cleanupInterval = setInterval(() => {
    const cutoff = nowMs() - Math.max(refillWindowMs * 3, 10 * 60 * 1000)
    for (const [key, entry] of store.entries()) {
      if (entry.lastSeenAt < cutoff) {
        store.delete(key)
      }
    }
  }, Math.max(refillWindowMs, 60_000))

  if (typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref()
  }

  return function rateLimitMiddleware(req, res, next) {
    if (typeof skip === 'function' && skip(req) === true) {
      return next()
    }

    const key = (typeof keyFn === 'function' ? keyFn(req) : req.ip) || req.ip || 'unknown'
    const currentMs = nowMs()
    const existing = store.get(key) || {
      tokens: maxTokens,
      lastRefillAt: currentMs,
      blockedUntilMs: 0,
      lastSeenAt: currentMs,
    }

    if (existing.blockedUntilMs > currentMs) {
      const retryAfterMs = existing.blockedUntilMs - currentMs
      res.setHeader('Retry-After', String(secondsFromMs(retryAfterMs)))
      res.setHeader('X-RateLimit-Limit', String(maxTokens))
      res.setHeader('X-RateLimit-Policy', `${id};w=${Math.round(refillWindowMs / 1000)};c=${maxTokens}`)
      return res.status(429).json({ message: 'Too many requests. Please retry shortly.' })
    }

    const elapsed = Math.max(0, currentMs - existing.lastRefillAt)
    const refilled = elapsed * refillRatePerMs
    existing.tokens = Math.min(maxTokens, existing.tokens + refilled)
    existing.lastRefillAt = currentMs
    existing.lastSeenAt = currentMs

    if (existing.tokens < 1) {
      const deficit = 1 - existing.tokens
      const retryAfterMs = Math.ceil(deficit / refillRatePerMs)
      existing.blockedUntilMs = currentMs + Math.max(retryAfterMs, 1000)
      store.set(key, existing)

      res.setHeader('Retry-After', String(secondsFromMs(retryAfterMs)))
      res.setHeader('X-RateLimit-Limit', String(maxTokens))
      res.setHeader('X-RateLimit-Policy', `${id};w=${Math.round(refillWindowMs / 1000)};c=${maxTokens}`)
      return res.status(429).json({ message: 'Too many requests. Please retry shortly.' })
    }

    existing.tokens -= 1
    store.set(key, existing)

    res.setHeader('X-RateLimit-Limit', String(maxTokens))
    res.setHeader('X-RateLimit-Remaining', String(Math.floor(existing.tokens)))
    res.setHeader('X-RateLimit-Policy', `${id};w=${Math.round(refillWindowMs / 1000)};c=${maxTokens}`)

    return next()
  }
}
