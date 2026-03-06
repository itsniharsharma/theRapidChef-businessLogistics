function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '')
}

export function buildCustomerMenuUrl({ baseUrl, slug, tableNumber }) {
  const normalizedBase = normalizeBaseUrl(baseUrl)
  const safeSlug = encodeURIComponent(String(slug || '').trim())
  const safeTableNumber = encodeURIComponent(String(tableNumber || '').trim())
  return `${normalizedBase}/r/${safeSlug}/t/${safeTableNumber}`
}
