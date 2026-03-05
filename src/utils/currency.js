const inrCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrencyINR(value) {
  const numeric = Number(value || 0)
  return inrCurrencyFormatter.format(Number.isFinite(numeric) ? numeric : 0)
}
