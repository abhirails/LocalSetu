import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PostCard from '../components/PostCard'
import ProviderCard from '../components/ProviderCard'
import BottomNav from '../components/BottomNav'
import { SERVICE_TYPES } from '../data/demoData'

const SUB_TABS = [
  { id: 'verified_help', label: '🤝 Verified Help' },
  { id: 'need_it_now', label: '🙋 Need It Now' }
]

export default function HelpScreen() {
  const { state, helpers } = useApp()
  const navigate = useNavigate()
  const [subTab, setSubTab] = useState('verified_help')
  const [search, setSearch] = useState('')
  const [filterService, setFilterService] = useState('all')
  const [needCategory, setNeedCategory] = useState('all')

  const providers = state.providers
    .filter(p => {
      if (helpers.isBlocked(p.id)) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.serviceType.toLowerCase().includes(search.toLowerCase()) &&
          !p.locality.toLowerCase().includes(search.toLowerCase())) return false
      if (filterService !== 'all' && p.serviceType !== filterService) return false
      return true
    })
    .sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1
      if (!a.isVerified && b.isVerified) return 1
      return b.recommendationCount - a.recommendationCount
    })

  const needItNowPosts = helpers.getActivePosts('need_it_now')
    .filter(p => needCategory === 'all' || p.category === needCategory)

  const NEED_CATEGORIES = [
    { id: 'all', label: '🔍 All' },
    { id: 'borrow', label: '🤝 Borrow/Lend' },
    { id: 'rideshare', label: '🚕 Ride Share' },
    { id: 'urgent', label: '🆘 Urgent' },
    { id: 'ticket', label: '🎟️ Ticket' },
    { id: 'errand', label: '📦 Errand' }
  ]

  return (
    <div className="app-container">
      <div className="screen">
        {/* Header */}
        <div className="header">
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Help & Needs</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Verified helpers · Urgent requests</div>
          </div>
          <button
            style={{
              background: 'var(--primary)',
              color: 'white',
              borderRadius: 20,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 700
            }}
            onClick={() => navigate(`/create?type=${subTab}`)}
          >
            + Post
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="tab-bar">
          {SUB_TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${subTab === tab.id ? 'active' : ''}`}
              onClick={() => setSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {subTab === 'verified_help' && (
          <>
            {/* Search */}
            <div className="search-bar">
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search cook, plumber, maid..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Service filter chips */}
            <div className="filter-chips">
              <button
                className={`filter-chip ${filterService === 'all' ? 'active' : ''}`}
                onClick={() => setFilterService('all')}
              >
                All
              </button>
              {SERVICE_TYPES.map(s => (
                <button
                  key={s.id}
                  className={`filter-chip ${filterService === s.id ? 'active' : ''}`}
                  onClick={() => setFilterService(s.id)}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Info Banner */}
            <div style={{
              background: 'var(--success-light)',
              padding: '8px 16px',
              fontSize: 12,
              color: 'var(--success)',
              fontWeight: 600,
              display: 'flex',
              gap: 6,
              borderBottom: '1px solid var(--border-light)'
            }}>
              ✅ "Verified by Locals" badge = 3+ residents recommended this helper
            </div>

            {/* Provider List */}
            {providers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">No helpers found</div>
                <div className="empty-sub">
                  {search ? `No results for "${search}"` : 'Be the first to recommend a local helper.'}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', marginTop: 8 }}
                  onClick={() => navigate('/create?type=verified_help')}
                >
                  + Add a helper
                </button>
              </div>
            ) : (
              <div className="card-list">
                {providers.map(p => <ProviderCard key={p.id} provider={p} />)}
              </div>
            )}
          </>
        )}

        {subTab === 'need_it_now' && (
          <>
            {/* Category filter */}
            <div className="filter-chips">
              {NEED_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-chip ${needCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setNeedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{
              background: '#FFF8F0',
              padding: '8px 16px',
              fontSize: 12,
              color: '#92400E',
              fontWeight: 600,
              display: 'flex',
              gap: 6,
              borderBottom: '1px solid var(--border-light)'
            }}>
              ⚠️ Meet in public · Don't share exact address · Verify before meeting
            </div>

            {needItNowPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🙋</div>
                <div className="empty-title">No active requests</div>
                <div className="empty-sub">Post your urgent local need here.</div>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', marginTop: 8 }}
                  onClick={() => navigate('/create?type=need_it_now')}
                >
                  + Post a need
                </button>
              </div>
            ) : (
              <div className="card-list">
                {needItNowPosts.map(post => <PostCard key={post.id} post={post} />)}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
