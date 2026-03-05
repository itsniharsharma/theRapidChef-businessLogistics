const cacheStore = new Map()
const tagIndex = new Map()
const inflightStore = new Map()
const MAX_CACHE_ENTRIES = 500
const MAX_INFLIGHT_MS = 30000
let requestCounter = 0

function nowMs() {
  return Date.now()
}

function attachKeyToTag(tag, key) {
  if (!tag) return
  if (!tagIndex.has(tag)) {
    tagIndex.set(tag, new Set())
  }
  tagIndex.get(tag).add(key)
}

function clearKey(key) {
  const entry = cacheStore.get(key)
  if (!entry) return

  for (const tag of entry.tags) {
    const keys = tagIndex.get(tag)
    if (!keys) continue
    keys.delete(key)
    if (keys.size === 0) {
      tagIndex.delete(tag)
    }
  }

  cacheStore.delete(key)
}

function cleanupExpiredEntries() {
  const now = nowMs()
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      clearKey(key)
    }
  }
}

function ensureCacheCapacity() {
  while (cacheStore.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value
    if (!oldestKey) break
    clearKey(oldestKey)
  }
}

function cleanupStaleInflight() {
  const now = nowMs()
  for (const [key, entry] of inflightStore.entries()) {
    if (now - entry.startedAt > MAX_INFLIGHT_MS) {
      inflightStore.delete(key)
      entry.reject(new Error('in-flight request timed out'))
    }
  }
}

export function invalidateCacheByTags(tags = []) {
  for (const tag of tags) {
    const keys = tagIndex.get(tag)
    if (!keys) continue

    for (const key of [...keys]) {
      clearKey(key)
    }
  }
}

export function cacheResponse({ ttlSeconds = 20, keyBuilder, tagsBuilder } = {}) {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next()
    }

    requestCounter += 1
    if (requestCounter % 100 === 0) {
      cleanupExpiredEntries()
      cleanupStaleInflight()
    }

    const key = keyBuilder ? keyBuilder(req) : req.originalUrl
    const cached = cacheStore.get(key)

    if (cached && cached.expiresAt > nowMs()) {
      return res.status(cached.status).json(cached.payload)
    }

    if (cached) {
      clearKey(key)
    }

    const inflight = inflightStore.get(key)
    if (inflight) {
      return inflight.promise
        .then((result) => res.status(result.status).json(result.payload))
        .catch(() => next())
    }

    let settled = false
    let resolveInflight
    let rejectInflight
    const inflightPromise = new Promise((resolve, reject) => {
      resolveInflight = resolve
      rejectInflight = reject
    })

    inflightStore.set(key, {
      startedAt: nowMs(),
      promise: inflightPromise,
      reject: rejectInflight,
    })

    const originalJson = res.json.bind(res)

    res.json = (payload) => {
      const status = res.statusCode || 200
      if (status >= 200 && status < 300) {
        ensureCacheCapacity()
        const tags = new Set(tagsBuilder ? tagsBuilder(req, payload) : [])
        cacheStore.set(key, {
          status,
          payload,
          tags,
          expiresAt: nowMs() + ttlSeconds * 1000,
        })

        for (const tag of tags) {
          attachKeyToTag(tag, key)
        }
      }

      if (!settled) {
        settled = true
        inflightStore.delete(key)
        resolveInflight({ status, payload })
      }

      return originalJson(payload)
    }

    res.on('close', () => {
      if (settled) return
      settled = true
      inflightStore.delete(key)
      rejectInflight(new Error('request closed before response'))
    })

    return next()
  }
}