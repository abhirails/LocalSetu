import React from 'react'
import { CATEGORY_META } from '../data/demoData'

// Maps raw DB slug variants → canonical CATEGORY_META keys
const CATEGORY_ALIASES = {
  civic_issue:   'civic',
  power_cut:     'power',
  ride_share:    'rideshare',
  borrow_lend:   'borrow',
  police_check:  'police',
  lost_and_found:'lost_found',
}

function getCategoryMeta(category) {
  const canonical = CATEGORY_ALIASES[category] || category
  if (CATEGORY_META[canonical]) return { ...CATEGORY_META[canonical], canonical }
  const label = (category || 'Post')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
  return { label, icon: '📌', canonical }
}

export default function CategoryBadge({ category, size = 'sm' }) {
  const meta = getCategoryMeta(category)
  const compact = size === 'xs'
  return (
    <span className={`badge badge-${meta.canonical}`} style={compact ? { fontSize: 10, padding: '2px 6px', flexShrink: 0 } : { flexShrink: 0 }}>
      <span className="badge-icon" aria-hidden="true">{meta.icon}</span>
      <span className="badge-label">{meta.label}</span>
    </span>
  )
}
