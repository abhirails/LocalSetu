import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { matchesLiveLocality, distanceMeters } from '../lib/geocode'
import PostCard from '../components/PostCard'
import ProviderCard from '../components/ProviderCard'
import BottomNav from '../components/BottomNav'
import LocalitySwitcherModal from '../components/LocalitySwitcherModal'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'right_now', label: 'Right Now' },
  { id: 'need_it_now', label: 'Need It Now' },
  { id: 'verified_help', label: 'Help' }
]

export default function HomeScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [showLocalitySwitcher, setShowLocalitySwitcher] = useState(false)

  const { locality: liveLocality, coords: liveCoords, status: locationStatus, requestLocation } = useCurrentLocation()
  const radiusFilter = state.radiusFilter

  useEffect(() => {
    if (liveLocality) {
      actions.setLiveLocality(liveLocality, liveCoords, 'granted')
    } else if (locationStatus === 'denied' || locationStatus === 'error') {
      actions.setLocationStatus(locationStatus)
    }
  }, [liveLocality, liveCoords, locationStatus])

  // ── Active locality (multi-locality Phase 2.5) ──
  const activeLocality = state.activeLocality  // null = Home, '__gps__' = GPS, string = saved
  const effectiveLocality = activeLocality === '__gps__'
    ? liveLocality
    : activeLocality || state.currentUser?.locality || 'Kharghar'

  const localityLabel = activeLocality === '__gps__'
    ? (liveLocality ? `GPS: ${liveLocality}` : 'GPS')
    : activeLocality || state.currentUser?.locality || 'Kharghar'

  const isLocalityFiltered = !!activeLocality

  // ── Locality-aware post filtering ──
  const matchesActiveLocality = (post) => {
    if (!isLocalityFiltered) return true
    return matchesLiveLocality(post.locality, effectiveLocality)
  }

  const allActivePosts = helpers.getActivePosts
  const rightNowPosts  = helpers.getActivePosts('right_now').filter(matchesActiveLocality)
  const needItNowPosts = helpers.getActivePosts('need_it_now').filter(matchesActiveLocality)
  const providers = state.providers
    .filter(p => !helpers.isBlocked(p.id))
    .sort((a, b) => b.recommendationCount - a.recommendationCount)
  const feedSocietyPosts = helpers.getFeedSocietyPosts ? helpers.getFeedSocietyPosts() : []

  const RADIUS_OPTIONS = [
    { label: 'All', value: null },
    { label: '500m', value: 500 },
    { label: '1 km', value: 1000 },
    { label: '2 km', value: 2000 },
  ]

  const getPostDistance = (post) => {
    if (!state.liveCoords || !post.lat || !post.lng) return null
    return distanceMeters(state.liveCoords.lat, state.liveCoords.lng, post.lat, post.lng)
  }

  const isWithinRadius = (post) => {
    if (!radiusFilter || !state.liveCoords) return true
    const dist = getPostDistance(post)
    if (dist === null) return true
    return dist <= radiusFilter
  }

  const sortWithNearby = (posts) => {
    const filtered = posts.filter(isWithinRadius)
    return [...filtered].sort((a, b) => {
      const aDist = getPostDistance(a)
      const bDist = getPostDistance(b)
      const refLocality = effectiveLocality || liveLocality
      const aNear = refLocality ? matchesLiveLocality(a.locality, refLocality) : false
      const bNear = refLocality ? matchesLiveLocality(b.locality, refLocality) : false
      if (aDist !== null && bDist !== null) return aDist - bDist
      if (aNear && !bNear) return -1
      if (!aNear && bNear) return 1
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }

  const regularFeed = [
    ...rightNowPosts.filter(p => {
      const ageHrs = (Date.now() - new Date(p.createdAt)) / 3600000
      return ageHrs < 2
    }).slice(0, 3),
    ...needItNowPosts.filter(p => {
      const timeLeft = new Date(p.expiresAt) - Date.now()
      return timeLeft < 6 * 3600000
    }).slice(0, 2),
    ...rightNowPosts.slice(3),
    ...needItNowPosts.slice(2),
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

  const allFeed = [
    ...sortWithNearby(regularFeed),
    ...feedSocietyPosts.slice(0, 5)
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const renderLocationBanner = () => {
    if (locationStatus === 'loading') {
      return (
        <div style={{ background: '#F0F9FF', borderBottom: '1px solid #BAE6FD', padding: '8px 16px', fontSize: 12, color: '#0369A1', display: 'flex', alignItems: 'center', gap: 8 }}>
          Detecting your location...
        </div>
      )
    }
    if (liveLocality) {
      const isHome = state.currentUser?.locality?.toLowerCase().includes(liveLocality.toLowerCase())
        || liveLocality.toLowerCase().includes((state.currentUser?.locality || '').toLowerCase().split(' ')[0])
      return (
        <div style={{ background: 'linear-gradient(90deg, #F0FDF4, #DCFCE7)', borderBottom: '1px solid #BBF7D0', padding: '8px 16px', fontSize: 12, color: '#15803D', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <span>Live: <strong>{liveLocality}</strong></span>
          {isHome && <span style={{ color: '#86EFAC', fontWeight: 400 }}>Home area</span>}
          <div style={{ flex: 1 }} />
          <button onClick={requestLocation} style={{ fontSize: 11, color: '#15803D', fontWeight: 700, textDecoration: 'underline' }}>Refresh</button>
        </div>
      )
    }
    if (locationStatus === 'denied') {
      return (
        <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 16px', fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Location blocked. Enable in browser settings.</span>
          <div style={{ flex: 1 }} />
          <button onClick={requestLocation} style={{ fontSize: 11, color: '#92400E', fontWeight: 700, textDecoration: 'underline' }}>Retry</button>
        </div>
      )
    }
    if (locationStatus === 'idle') {
      return (
        <div style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-light)', padding: '8px 16px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{state.currentUser?.locality || 'Kharghar'}</span>
          <div style={{ flex: 1 }} />
          <button onClick={requestLocation} style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>Use live location</button>
        </div>
      )
    }
    return null
  }

  const renderFeed = () => {
    if (activeTab === 'all') {
      if (allFeed.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">Home</div>
            <div className="empty-title">Quiet right now</div>
            <div className="empty-sub">Be the first to share a local update in your area.</div>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create')}>+ Post something</button>
          </div>
        )
      }
      return (
        <div className="card-list">
          {allFeed.map(post =>
            post.societyId
              ? <SocietyFeedCard key={post.id} post={post} onClick={() => navigate(`/society/${post.societyId}`)} />
              : <PostCard key={post.id} post={post} />
          )}
        </div>
      )
    }
    if (activeTab === 'right_now') {
      const sorted = sortWithNearby(rightNowPosts)
      if (sorted.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">Flash</div>
            <div className="empty-title">No active updates</div>
            <div className="empty-sub">Post a real-time update like traffic, water issues, or power cuts.</div>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create')}>+ Right Now update</button>
          </div>
        )
      }
      return <div className="card-list">{sorted.map(post => <PostCard key={post.id} post={post} />)}</div>
    }
    if (activeTab === 'need_it_now') {
      const sorted = sortWithNearby(needItNowPosts)
      if (sorted.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">Hand</div>
            <div className="empty-title">No urgent requests</div>
            <div className="empty-sub">Post a local need — borrow, rideshare, or urgent help.</div>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create')}>+ Post a need</button>
          </div>
        )
      }
      return <div className="card-list">{sorted.map(post => <PostCard key={post.id} post={post} />)}</div>
    }
    if (activeTab === 'verified_help') {
      return (
        <div>
          <div className="section-header">
            <span className="section-title">Verified Local Helpers</span>
            <button className="section-link" onClick={() => navigate('/help')}>See all</button>
          </div>
          <div className="card-list">
            {providers.slice(0, 5).map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="app-container">
      <div className="screen">
        <div className="header">
          <div>
            <div className="header-logo">Local<span>Setu</span></div>
            <button
              onClick={() => setShowLocalitySwitcher(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: isLocalityFiltered ? 'var(--primary)' : 'transparent',
                color: isLocalityFiltered ? 'white' : 'var(--text-secondary)',
                border: isLocalityFiltered ? 'none' : '1px solid var(--border-light)',
                borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                marginTop: 2, cursor: 'pointer'
              }}
            >
              <span>📍</span>
              <span>{localityLabel}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
            </button>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => navigate('/profile')} title="Profile">Profile</button>
            {state.currentUser?.role === 'admin' && (
              <button className="icon-btn" onClick={() => navigate('/admin')} title="Admin">Admin</button>
            )}
          </div>
        </div>

        {renderLocationBanner()}

        {liveLocality && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border-light)', background: '#FAFAFA', overflowX: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Radius:</span>
            {RADIUS_OPTIONS.map(opt => (
              <button key={String(opt.value)} onClick={() => actions.setRadiusFilter(opt.value)}
                style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  border: radiusFilter === opt.value ? '2px solid var(--primary)' : '1.5px solid var(--border-light)',
                  background: radiusFilter === opt.value ? 'var(--primary)' : 'white',
                  color: radiusFilter === opt.value ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="tab-bar">
          {TABS.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, #FFF8F5 100%)', padding: '10px 16px', display: 'flex', gap: 16, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{rightNowPosts.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Live Updates</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--success)' }}>{needItNowPosts.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Active Needs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy)' }}>{providers.filter(p => p.isVerified).length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Verified Helpers</div>
          </div>
          <div onClick={() => navigate('/societies')} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#6366f1' }}>{(state.societies || []).length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Societies</div>
          </div>
          <div style={{ flex: 1 }} />
          <button style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, alignSelf: 'center' }}
            onClick={() => navigate('/create')}>
            + Post
          </button>
        </div>

        {/* Active locality filter banner */}
        {isLocalityFiltered && (
          <div style={{ background: 'var(--primary)', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'white', fontWeight: 600, flex: 1 }}>
              Showing posts from: <strong>{effectiveLocality}</strong>
            </span>
            <button
              onClick={() => actions.setActiveLocality(null)}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 700, textDecoration: 'underline' }}
            >
              Show all
            </button>
          </div>
        )}

        {renderFeed()}
      </div>
      <BottomNav />
      {showLocalitySwitcher && <LocalitySwitcherModal onClose={() => setShowLocalitySwitcher(false)} />}
    </div>
  )
}

function SocietyFeedCard({ post, onClick }) {
  const isEvent = post.type === 'event'
  const societyName = post.society?.name || 'Society'
  const age = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }
  const formatEventDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  return (
    <div onClick={onClick} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', borderLeft: '3px solid #6366f1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#6366f120', color: '#4338ca', padding: '2px 8px', borderRadius: 20 }}>
          {societyName}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, background: isEvent ? 'rgba(99,102,241,0.1)' : 'rgba(234,179,8,0.1)', color: isEvent ? '#4338ca' : '#a16207', padding: '2px 8px', borderRadius: 20 }}>
          {isEvent ? 'Event' : 'Notice'}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-light)', marginLeft: 'auto' }}>{age(post.createdAt)}</span>
      </div>
      <h3 style={{ margin: '0 0 5px', fontSize: 14.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{post.title}</h3>
      {isEvent && post.eventDate && (
        <p style={{ margin: '0 0 5px', fontSize: 12.5, color: '#4338ca', fontWeight: 600 }}>
          {formatEventDate(post.eventDate)}{post.eventLocation && ` · ${post.eventLocation}`}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.content}
      </p>
    </div>
  )
}
