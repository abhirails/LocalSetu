import React from 'react'
import { CATEGORY_META } from '../data/demoData'

export default function CategoryBadge({ category, size = 'sm' }) {
  const meta = CATEGORY_META[category] || { label: category, icon: '📌' }
  return (
    <span className={`badge badge-${category}`} style={size === 'xs' ? { fontSize: 10, padding: '2px 6px' } : {}}>
      {meta.icon} {meta.label}
    </span>
  )
}
