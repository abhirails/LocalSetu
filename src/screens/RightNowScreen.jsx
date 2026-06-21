import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { matchesLiveLocality, distanceMeters } from '../lib/geocode'
import PostCard from '../components/PostCard'
import BottomNav from '../components/BottomNav'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'transport', label: 'Transport' },
  { id: 'police', label: 'Police' },
  { id: 'water', label: 'Water' },
  { id: 'power', label: 'Power' },
  { id: 'weather', label: 'Weather' },
  { id: 'safety', label: 'Safety' },
  { id: 'civic', label: 'Civic' },
]

const RADIUS_OPTIONS = [
  { label: 'All', value: null },
  { label: '500m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
]

export default function RightNowScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')

  const liveLocality = state.liveLocality
  const liveCoords = state.liveCoords
  const radiusFilter = state.radiusFilter

  const getPostDistance = (post) => {
    if (!liveCoords || !post.lat || !post.lng) return null
    return distanceMeters(liveCoords.lat, liveCoords.lng, post.lat, post.lng)
  }

  const allPosts = helpers.getActivePosts('right_now')
  const byCat = activeCategory === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === activeCategory)

  const filtered = byCat.filter(p => {
    if (!radiusFilter || !liveCoords) return true
    const dist = getPostDistance(p)
    return dist === null ? true : dist <= radiusFilter
  })

  const sorted = [...filtered].sort((a, b) => {
    const aDist = getPostDistance(a)
    const bDist = getPostDistance(b)
    if (aDist !== null && bDist !== null) return aDist - bDist
    const aNear = liveLocality ? matchesLiveLocality(a.locality, liveLocality) : false
    const bNear = liveLocality ? matchesLiveLocality(b.locality, liveLocality) : false
    if (aNear && !bNear) return -1
    if (!aNear && bNear) return 1
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    const scoreA = (a.stillHappeningCount || 0) * 2 + (Date.now() - new Date(a.createdAt)) / -3600000
    const scoreB = (b.stillHappeningCount || 0) * 2 + (Date.now() - new Date(b.createdAt)) / -3600000
    return scoreB - scoreA
  })

  return (
    <div className="app-container">
      <div className="screen">
        <div className="header">
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Right Now</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {liveLocality ? `Live: ${liveLocality}` : 'Real-time local updates'}
            </div>
          </div>
          <button
            style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 700 }}
            onClick={() => navigate('/create?type=right_now')}
          >
            + Update
          </button>
        </div>

        <div className="filter-chips">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {liveLocality && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border-light)', background: '#FAFAFA', overflowX: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Radius:</span>
            {RADIUS_OPTIONS.map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => actions.setRadiusFilter(opt.value)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: radiusFilter === opt.value ? '2px solid var(--primary)' : '1.5px solid var(--border-light)',
                  background: radiusFilter === opt.value ? 'var(--primary)' : 'white',
                  color: radiusFilter === opt.value ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {sorted.length > 0 && (
          <div style={{ background: 'var(--primary-light)', padding: '8px 16px', fontSize: 12, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border-light)' }}>
            <span>Tap "Still happening" to confirm an update is current. Auto-expires in 6-12h.</span>
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">All clear!</div>
            <div className="empty-title">No active updates right now</div>
            <div className="empty-sub">
              No active {activeCategory !== 'all' ? activeCategory + ' ' : ''}updates.
              {radiusFilter ? ' Try expanding the radius filter.' : ' Be the first to post.'}
            </div>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create?type=right_now')}>
              + Post an update
            </button>
          </div>
        ) : (
          <div className="card-list">
            {sorted.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
