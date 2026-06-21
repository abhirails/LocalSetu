import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { matchesLiveLocality } from '../lib/geocode'
import PostCard from '../components/PostCard'
import BottomNav from '../components/BottomNav'

const CATEGORIES = [
  { id: 'all', label: '🔍 All' },
  { id: 'traffic', label: '🚗 Traffic' },
  { id: 'transport', label: '🚌 Transport' },
  { id: 'police', label: '🚔 Police' },
  { id: 'water', label: '💧 Water' },
  { id: 'power', label: '⚡ Power' },
  { id: 'weather', label: '🌧️ Weather' },
  { id: 'safety', label: '🚨 Safety' },
  { id: 'civic', label: '🏗️ Civic' },
]

export default function RightNowScreen() {
  const { state, helpers } = useApp()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')

  const liveLocality = state.liveLocality
  const allPosts = helpers.getActivePosts('right_now')
  const filtered = activeCategory === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === activeCategory)

  // Sort: nearby first, then pinned, then by still-happening + recency
  const sorted = [...filtered].sort((a, b) => {
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
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>⚡ Nearby Right Now</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {liveLocality ? `📍 Live: ${liveLocality}` : 'Real-time local updates'}
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

        {sorted.length > 0 && (
          <div style={{ background: 'var(--primary-light)', padding: '8px 16px', fontSize: 12, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border-light)' }}>
            <span>🔄</span>
            <span>Tap "Still happening" to confirm an update is current. Auto-expires in 6–12h.</span>
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <div className="empty-title">All clear in your area!</div>
            <div className="empty-sub">
              No active {activeCategory !== 'all' ? activeCategory.replace('_', ' ') + ' ' : ''}updates right now.
              Be the first to post if something is happening.
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
