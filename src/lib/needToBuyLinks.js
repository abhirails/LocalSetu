/** Build shareable Need to Buy deep links for website, QR, WhatsApp, etc. */
export function needToBuyUrl({
  localitySlug,
  category,
  item,
  source = 'website',
  base = typeof window !== 'undefined' ? window.location.origin : '',
} = {}) {
  const path = localitySlug
    ? `/${encodeURIComponent(localitySlug)}/need-to-buy`
    : '/need-to-buy'
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (item) params.set('item', item)
  if (source) params.set('source', source)
  const qs = params.toString()
  return `${base}${path}${qs ? `?${qs}` : ''}`
}
