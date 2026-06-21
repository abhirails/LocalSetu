import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PostCard from '../components/PostCard'
import ProviderCard from '../components/ProviderCard'
import BottomNav from '../components/BottomNav'

const TABS = [
  { id: 'all', label: '🏠 All' },
  { id: 'right_now', label: '⚡ Right Now' },
  { id: 'need_it_now', label: '🙋 Need It Now' },
  { id: 'verified_help', label: '🤝 Help' }
]

export default function HomeScreen() {
  const { state, helpers } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const rightNowPosts = helpers.getActivePosts('right_now')
  const needItNowPosts = helpers.getActivePosts('need_it_now')
  const providers = state.providers
    .filter(p => !helpers.isBlocked(p.id))
    .sort((a, b) => b.recommendationCount - a.recommendationCount)

  const allFeed = [
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
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // dedupe

  const renderFeed = () => {
    if (activeTab === 'all') {
      if (allFeed.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">🏘️</div>
            <div className="empty-title">Quiet right now</div>
            <div className="empty-sub">Be the first to share a local update in your area.</div>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create')}>
              + Post something
            </button>
          </div>
        )
      }
      return (
        <div className="card-list">
          {allFeed.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )
    }

    if (activeTab === 'right_now') {
      if (rightNowPosts.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <div className="empty-title">No active updates</div>
            <div className="empty-sub">Post a real-time update like traffic, water issues, or power cuts.</div>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create')}>
              + Right Now update
            </button>
          </div>
        )
      }
      return (
        <div className="card-list">
          {rightNowPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )
    }

    if (activeTab === 'need_it_now') {
      if (needItNowPosts.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">🙋</div>
            <div className="empty-title">No urgent requests</div>
            <div className="empty-sub">Post a local need — borrow, rideshare, or urgent help.</div>
            <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create')}>
              + Post a need
            </button>
          </div>
        )
      }
      return (
        <div className="card-list">
          {needItNowPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )
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
        {/* Header */}
        <div className="header">
          <div>
            <div className="header-logo">Local<span>Setu</span></div>
            <div className="header-locality">📍 {state.currentUser?.locality || 'Kharghar'}</div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => navigate('/profile')} title="Profile">
              👤
            </button>
            {state.currentUser?.role === 'admin' && (
              <button className="icon-btn" onClick={() => navigate('/admin')} title="Admin">
                🛡️
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Stats Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-light) 0%, #FFF8F5 100%)',
          padding: '10px 16px',
          display: 'flex',
          gap: 16,
          borderBottom: '1px solid var(--border-light)'
        }}>
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
          <div style={{ flex: 1 }} />
          <button
            style={{
              background: 'var(--primary)',
              color: 'white',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              alignSelf: 'center'
            }}
            onClick={() => navigate('/create')}
          >
            + Post
          </button>
        </div>

        {/* Feed */}
        {renderFeed()}
      </div>

      <BottomNav />
    </div>
  )
}
