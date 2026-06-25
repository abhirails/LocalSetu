import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PostCard from '../components/PostCard'
import ProviderCard from '../components/ProviderCard'
import BottomNav from '../components/BottomNav'
import { SERVICE_TYPES, BUSINESS_CATEGORIES, DEMO_BUSINESSES } from '../data/demoData'

const PLAN_META = {
  premium:  { label: 'Premium', color: '#d97706', bg: '#fef3c7', icon: '⭐' },
  standard: { label: 'Standard', color: '#7c3aed', bg: '#ede9fe', icon: '✓' },
  basic:    { label: 'Basic', color: '#4b5563', bg: '#f3f4f6', icon: '' },
}

const SUB_TABS = [
  { id: 'verified_help', label: '🤝 Verified Help' },
  { id: 'need_it_now',   label: '🙋 Need It Now' },
  { id: 'businesses',    label: '🏪 Businesses' },
]

function MiniBusinessCard({ biz, onClick }) {
  const plan = PLAN_META[biz.plan] || PLAN_META.basic
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        borderRadius: 12, padding: '12px 14px', marginBottom: 10,
        border: biz.plan === 'premium' ? '1.5px solid #f59e0b' : '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{biz.name}</span>
          {biz.isVerified && (
            <span style={{ marginLeft: 6, fontSize: 10, background: '#dcfce7', color: '#15803d', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>✓ Verified</span>
          )}
        </div>
        {biz.plan !== 'basic' && (
          <span style={{ fontSize: 10, background: plan.bg, color: plan.color, borderRadius: 5, padding: '1px 7px', fontWeight: 700 }}>{plan.icon} {plan.label}</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>📍 {biz.locality}</div>
      {biz.tagline && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 6 }}>"{biz.tagline}"</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {biz.phone && (
          <a href={`tel:${biz.phone}`} onClick={e => e.stopPropagation()}
            style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 7, background: 'var(--primary)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            📞 Call
          </a>
        )}
        {biz.whatsapp && (
          <a href={`https://wa.me/91${biz.whatsapp}?text=Hi, I found you on LocalSetu`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 7, background: '#25d366', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            💬 WhatsApp
          </a>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
        ⭐ {biz.rating.toFixed(1)} · {biz.reviewCount} reviews · Ad
      </div>
    </div>
  )
}

export default function HelpScreen() {
  const { state, helpers } = useApp()
  const navigate = useNavigate()
  const [subTab, setSubTab] = useState('verified_help')
  const [search, setSearch] = useState('')
  const [filterService, setFilterService] = useState('all')
  const [needCategory, setNeedCategory] = useState('all')
  const [bizCategory, setBizCategory] = useState('all')

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

  const businesses = (state.businesses || [])
    .filter(b => bizCategory === 'all' || b.category === bizCategory)
    .sort((a, b) => {
      const order = { premium: 0, standard: 1, basic: 2 }
      const diff = (order[a.plan] ?? 2) - (order[b.plan] ?? 2)
      return diff !== 0 ? diff : b.rating - a.rating
    })

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
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Verified helpers · Urgent requests · Local businesses</div>
          </div>
          {subTab !== 'businesses' && (
            <button
              style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 700 }}
              onClick={() => navigate(`/create?type=${subTab}`)}
            >
              + Post
            </button>
          )}
          {subTab === 'businesses' && (
            <button
              style={{ background: '#764ba2', color: 'white', borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 700 }}
              onClick={() => navigate('/businesses')}
            >
              See all →
            </button>
          )}
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
                  <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', fontSize: 16 }}>×</button>
                )}
              </div>
            </div>
            <div className="filter-chips">
              <button className={`filter-chip ${filterService === 'all' ? 'active' : ''}`} onClick={() => setFilterService('all')}>All</button>
              {SERVICE_TYPES.map(s => (
                <button key={s.id} className={`filter-chip ${filterService === s.id ? 'active' : ''}`} onClick={() => setFilterService(s.id)}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--success-light)', padding: '8px 16px', fontSize: 12, color: 'var(--success)', fontWeight: 600, display: 'flex', gap: 6, borderBottom: '1px solid var(--border-light)' }}>
              ✅ "Verified by Locals" badge = 3+ residents recommended this helper
            </div>
            <div style={{
            margin: '8px 0 4px', padding: '10px 14px',
            background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)',
            borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.55
          }}>
            ⚠️ <strong>Verify before hiring:</strong> Meet providers in a common area first.
            Don't pay cash in advance without checking references. LocalSetu verifies locality, not professional credentials.
          </div>
          {providers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">No helpers found</div>
                <div className="empty-sub">{search ? `No results for "${search}"` : 'Be the first to recommend a local helper.'}</div>
                <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create?type=verified_help')}>+ Add a helper</button>
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
            <div className="filter-chips">
              {NEED_CATEGORIES.map(cat => (
                <button key={cat.id} className={`filter-chip ${needCategory === cat.id ? 'active' : ''}`} onClick={() => setNeedCategory(cat.id)}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div style={{ background: '#FFF8F0', padding: '8px 16px', fontSize: 12, color: '#92400E', fontWeight: 600, display: 'flex', gap: 6, borderBottom: '1px solid var(--border-light)' }}>
              ⚠️ Meet in public · Don't share exact address · Verify before meeting
            </div>
            {needItNowPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🙋</div>
                <div className="empty-title">No active requests</div>
                <div className="empty-sub">Post your urgent local need here.</div>
                <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create?type=need_it_now')}>+ Post a need</button>
              </div>
            ) : (
              <div className="card-list">
                {needItNowPosts.map(post => <PostCard key={post.id} post={post} />)}
              </div>
            )}
          </>
        )}

        {subTab === 'businesses' && (
          <>
            {/* Category filter */}
            <div className="filter-chips">
              {BUSINESS_CATEGORIES.map(cat => (
                <button key={cat.id} className={`filter-chip ${bizCategory === cat.id ? 'active' : ''}`} onClick={() => setBizCategory(cat.id)}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <div style={{ background: '#f8f4ff', padding: '8px 16px', fontSize: 12, color: '#5b21b6', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
              <span>💼 Paid listings — always verify before payment</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ad</span>
            </div>
            {businesses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏪</div>
                <div className="empty-title">No businesses listed yet</div>
                <div className="empty-sub">Verified local businesses will appear here.</div>
              </div>
            ) : (
              <div className="card-list">
                {businesses.map(biz => (
                  <MiniBusinessCard key={biz.id} biz={biz} onClick={() => navigate(`/business/${biz.id}`)} />
                ))}
                <button
                  onClick={() => navigate('/businesses')}
                  style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 4 }}
                >
                  🏪 View all {(state.businesses || []).length} listings →
                </button>

                {/* List your business CTA */}
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, padding: 14, textAlign: 'center', color: '#fff', marginTop: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>🏪 List Your Business</div>
                  <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10 }}>Reach 1,000+ local residents. Plans from ₹299/month.</div>
                  <button
                    onClick={() => navigate('/businesses')}
                    style={{ padding: '7px 20px', borderRadius: 16, background: '#fff', color: '#764ba2', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    See plans →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
