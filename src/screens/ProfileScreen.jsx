import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PostCard from '../components/PostCard'
import BottomNav from '../components/BottomNav'

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

export default function ProfileScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('posts')
  const [showSettings, setShowSettings] = useState(false)

  const cu = state.currentUser
  if (!cu) { navigate('/login'); return null }

  const myPosts = state.posts
    .filter(p => p.userId === cu.id && p.status !== 'removed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const savedPosts = state.posts
    .filter(p => cu.savedPosts?.includes(p.id) && p.status !== 'removed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const handleLogout = () => {
    if (window.confirm('Log out of LocalSetu?')) {
      actions.logout()
      navigate('/login')
    }
  }

  return (
    <div className="app-container">
      <div className="screen">
        {/* Header */}
        <div className="header">
          <div style={{ fontWeight: 800, fontSize: 16 }}>My Profile</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {cu.role === 'admin' && (
              <button className="icon-btn" onClick={() => navigate('/admin')} title="Admin Dashboard">
                🛡️
              </button>
            )}
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
              ⚙️
            </button>
          </div>
        </div>

        {/* Profile Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-lg">{getInitials(cu.name)}</div>
          <div className="profile-name">{cu.name}</div>
          <div className="profile-locality-tag">📍 {cu.locality}</div>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="profile-stat-value">{myPosts.length}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{cu.helpCount || 0}</div>
              <div className="profile-stat-label">Helped</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{cu.trustScore || 0}</div>
              <div className="profile-stat-label">Trust Score</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {cu.isVerified && (
              <span className="trust-badge">✅ Verified Resident</span>
            )}
            {cu.role === 'admin' && (
              <span className="trust-badge" style={{ background: 'rgba(255,107,43,0.3)' }}>👑 Moderator</span>
            )}
            {cu.trustScore >= 80 && (
              <span className="trust-badge">⭐ Trusted Neighbor</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            My Posts ({myPosts.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved ({savedPosts.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        {activeTab === 'posts' && (
          myPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">No posts yet</div>
              <div className="empty-sub">Share a local update or need with your neighbors.</div>
              <button
                className="btn btn-primary"
                style={{ width: 'auto', marginTop: 8 }}
                onClick={() => navigate('/create')}
              >
                + Create first post
              </button>
            </div>
          ) : (
            <div className="card-list">
              {myPosts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )
        )}

        {activeTab === 'saved' && (
          savedPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔖</div>
              <div className="empty-title">No saved posts</div>
              <div className="empty-sub">Tap 📌 on any post to save it for later.</div>
            </div>
          ) : (
            <div className="card-list">
              {savedPosts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )
        )}

        {activeTab === 'about' && (
          <div>
            <div className="menu-list">
              <div className="menu-item">
                <div className="menu-item-icon">👤</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Name</div>
                  <div className="menu-item-sub">{cu.name}</div>
                </div>
              </div>
              <div className="menu-item">
                <div className="menu-item-icon">📍</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Locality</div>
                  <div className="menu-item-sub">{cu.locality}</div>
                </div>
              </div>
              <div className="menu-item">
                <div className="menu-item-icon">📱</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Phone</div>
                  <div className="menu-item-sub">+91 {cu.phone} (verified)</div>
                </div>
              </div>
              <div className="menu-item">
                <div className="menu-item-icon">🗓️</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Member since</div>
                  <div className="menu-item-sub">{new Date(cu.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                Privacy Settings
              </div>
              <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, border: '1px solid var(--border-light)' }}>
                🔒 Your exact location is never shared.<br />
                📍 We only show your locality name.<br />
                📱 Phone visible only to verified users.<br />
                🚫 Other users cannot see your phone unless you share it.
              </div>
            </div>

            <button
              className="btn btn-danger"
              style={{ margin: '0 14px 24px', width: 'calc(100% - 28px)' }}
              onClick={handleLogout}
            >
              🚪 Log out
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">⚙️ Settings</div>
            <div className="menu-list" style={{ margin: 0 }}>
              <button className="menu-item" onClick={() => { setShowSettings(false); setActiveTab('about') }}>
                <div className="menu-item-icon">🔒</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Privacy Settings</div>
                  <div className="menu-item-sub">Control what others see</div>
                </div>
                <div className="menu-item-arrow">›</div>
              </button>
              <button className="menu-item" onClick={() => setShowSettings(false)}>
                <div className="menu-item-icon">🔔</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Notifications</div>
                  <div className="menu-item-sub">Manage alerts</div>
                </div>
                <div className="menu-item-arrow">›</div>
              </button>
              <button className="menu-item" onClick={() => {
                setShowSettings(false)
                window.open('mailto:support@localsetu.in', '_blank')
              }}>
                <div className="menu-item-icon">🆘</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Report an Issue</div>
                  <div className="menu-item-sub">Contact support</div>
                </div>
                <div className="menu-item-arrow">›</div>
              </button>
              <button className="menu-item" onClick={() => { setShowSettings(false); handleLogout() }}>
                <div className="menu-item-icon">🚪</div>
                <div className="menu-item-text">
                  <div className="menu-item-label" style={{ color: 'var(--error)' }}>Log Out</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
