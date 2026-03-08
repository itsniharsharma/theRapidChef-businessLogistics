function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').trim().replace(/\/+$/, '')
}

function toSafeSegment(value) {
  return encodeURIComponent(String(value ?? '').trim())
}

export function buildCustomerMenuUrl({ baseUrl, slug, tableNumber }) {
  const normalizedBase = normalizeBaseUrl(baseUrl)
  const safeSlug = toSafeSegment(slug)
  const safeTableNumber = toSafeSegment(tableNumber)
  return `${normalizedBase}/r/${safeSlug}/t/${safeTableNumber}`
}

export function buildCustomerCheckoutUrl({ baseUrl, slug, tableNumber }) {
  return `${buildCustomerMenuUrl({ baseUrl, slug, tableNumber })}/checkout`
}

export function buildCustomerStatusUrl({ baseUrl, slug, tableNumber }) {
  return `${buildCustomerMenuUrl({ baseUrl, slug, tableNumber })}/status`
}

export function buildCustomerOrderTrackingUrl({ baseUrl, slug, tableNumber, orderId }) {
  const safeOrderId = toSafeSegment(orderId)
  return `${buildCustomerMenuUrl({ baseUrl, slug, tableNumber })}/order/${safeOrderId}`
}
