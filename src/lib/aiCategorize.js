/**
 * aiCategorize.js
 * Client-side helper that calls /api/ai-categorize to suggest
 * post type + category from free-text content.
 *
 * Returns null on any failure — the feature is purely optional.
 */

const RIGHT_NOW_CATEGORIES = [
  { id: 'traffic',   label: 'Traffic',         icon: '🚗' },
  { id: 'transport', label: 'Transport',        icon: '🚌' },
  { id: 'police',    label: 'Police Checking',  icon: '🚔' },
  { id: 'water',     label: 'Water Issue',      icon: '💧' },
  { id: 'power',     label: 'Power Cut',        icon: '⚡' },
  { id: 'weather',   label: 'Weather',          icon: '🌧️' },
  { id: 'safety',    label: 'Safety Alert',     icon: '🚨' },
  { id: 'civic',     label: 'Civic Issue',      icon: '🏗️' },
  { id: 'medical',   label: 'Medical',          icon: '🏥' },
]

const NEED_CATEGORIES = [
  { id: 'borrow',      label: 'Borrow / Lend', icon: '🤝' },
  { id: 'rideshare',   label: 'Ride Share',    icon: '🚕' },
  { id: 'urgent',      label: 'Urgent Help',   icon: '🆘' },
  { id: 'ticket',      label: 'Spare Ticket',  icon: '🎟️' },
  { id: 'errand',      label: 'Local Errand',  icon: '📦' },
  { id: 'need_to_buy', label: 'Need to Buy',   icon: '🛒' },
]

const ALL_CATEGORIES = [...RIGHT_NOW_CATEGORIES, ...NEED_CATEGORIES]

/**
 * @param {string} content   — post text (min 15 chars)
 * @param {string|null} knownType — 'right_now' | 'need_it_now' | null
 * @returns {Promise<{ type: string, category: string, label: string, icon: string, confidence: number } | null>}
 */
export async function categorizePost(content, knownType = null) {
  if (!content || content.trim().length < 15) return null

  try {
    const res = await fetch('/api/ai-categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim(), postType: knownType }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data.type || !data.category) return null

    const meta = ALL_CATEGORIES.find(c => c.id === data.category)
    return {
      type:       data.type,
      category:   data.category,
      label:      meta?.label || data.category,
      icon:       meta?.icon  || '📌',
      confidence: data.confidence,
    }
  } catch {
    // Network error, timeout, or endpoint not available — silently skip
    return null
  }
}

export { RIGHT_NOW_CATEGORIES, NEED_CATEGORIES }
