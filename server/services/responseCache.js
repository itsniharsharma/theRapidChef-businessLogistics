const cacheStore = new Map()
const tagIndex = new Map()

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

    const key = keyBuilder ? keyBuilder(req) : req.originalUrl
    const cached = cacheStore.get(key)

    if (cached && cached.expiresAt > nowMs()) {
      return res.status(cached.status).json(cached.payload)
    }

    if (cached) {
      clearKey(key)
    }

    const originalJson = res.json.bind(res)

    res.json = (payload) => {
      const status = res.statusCode || 200
      if (status >= 200 && status < 300) {
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

      return originalJson(payload)
    }

    return next()
  }
}