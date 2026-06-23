import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useNotifications } from '../hooks/useNotifications'
import PostCard from '../components/PostCard'
import BottomNav from '../components/BottomNav'
import LocalitySwitcherModal from '../components/LocalitySwitcherModal'

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

export default function ProfileScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('posts')
  const [showSettings, setShowSettings] = useState(false)
  const [showLocalitySwitcher, setShowLocalitySwitcher] = useState(false)

  const cu = state.currentUser
  if (!cu) { navigate('/login'); return null }

  const { status: notifStatus, requestPermission, unsubscribe } = useNotifications(cu.id)

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

  const savedLocalities = state.savedLocalities || []

  return (
    <div className="app-container">
      <div className="screen">
        <div className="header">
          <div style={{ fontWeight: 800, fontSize: 16 }}>My Profile</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {cu.role === 'admin' && (
              <button className="icon-btn" onClick={() => navigate('/admin')} title="Admin Dashboard" style={{ fontSize: 20 }}>🛡️</button>
            )}
            {cu.role === 'society_admin' && (
              <button className="icon-btn" onClick={() => navigate('/society-admin')} title="Society Admin" style={{ fontSize: 20 }}>🏘️</button>
            )}
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings" style={{ fontSize: 20 }}>⚙️</button>
          </div>
        </div>

        <div className="profile-hero">
          <div className="profile-avatar-lg">{getInitials(cu.name)}</div>
          <div className="profile-name">{cu.name}</div>
          <div className="profile-locality-tag">{cu.locality}</div>
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
            {cu.isVerified && <span className="trust-badge">Verified Resident</span>}
            {cu.role === 'admin' && <span className="trust-badge" style={{ background: 'rgba(255,107,43,0.3)' }}>Moderator</span>}
            {cu.trustScore >= 80 && <span className="trust-badge">Trusted Neighbor</span>}
          </div>
        </div>

        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
            My Posts ({myPosts.length})
          </button>
          <button className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            Saved ({savedPosts.length})
          </button>
          <button className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
            About
          </button>
        </div>

        {activeTab === 'posts' && (
          myPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">No posts yet</div>
              <div className="empty-sub">Share a local update or need with your neighbors.</div>
              <button className="btn btn-primary" style={{ width: 'auto', marginTop: 8 }} onClick={() => navigate('/create')}>
                + Create first post
              </button>
            </div>
          ) : (
            <div className="card-list">{myPosts.map(post => <PostCard key={post.id} post={post} />)}</div>
          )
        )}

        {activeTab === 'saved' && (
          savedPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔖</div>
              <div className="empty-title">No saved posts</div>
              <div className="empty-sub">Tap save on any post to save it for later.</div>
            </div>
          ) : (
            <div className="card-list">{savedPosts.map(post => <PostCard key={post.id} post={post} />)}</div>
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

              {/* Home locality — tappable to open switcher */}
              <button className="menu-item" onClick={() => setShowLocalitySwitcher(true)}>
                <div className="menu-item-icon">📍</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Home Locality</div>
                  <div className="menu-item-sub">{cu.locality}</div>
                </div>
                <div className="menu-item-arrow">›</div>
              </button>

              {/* Saved localities */}
              {savedLocalities.length > 0 && (
                <div className="menu-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <div className="menu-item-text" style={{ width: '100%' }}>
                    <div className="menu-item-label">Saved Localities</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 4 }}>
                    {savedLocalities.map(loc => (
                      <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--primary-light)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                        <span>{loc}</span>
                        <button onClick={() => actions.removeSavedLocality(loc)} style={{ fontSize: 14, color: 'var(--primary)', marginLeft: 2, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                    {savedLocalities.length < 2 && (
                      <button onClick={() => setShowLocalitySwitcher(true)} style={{ background: 'transparent', border: '1px dashed var(--primary)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              )}

              {savedLocalities.length === 0 && (
                <button className="menu-item" onClick={() => setShowLocalitySwitcher(true)}>
                  <div className="menu-item-icon">➕</div>
                  <div className="menu-item-text">
                    <div className="menu-item-label">Add saved locality</div>
                    <div className="menu-item-sub">Pin your office, parents area, etc. (max 2)</div>
                  </div>
                  <div className="menu-item-arrow">›</div>
                </button>
              )}

              <div className="menu-item">
                <div className="menu-item-icon">📞</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Phone</div>
                  <div className="menu-item-sub">+91 {cu.phone} (verified)</div>
                </div>
              </div>
              <div className="menu-item">
                <div className="menu-item-icon">📅</div>
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
                Your exact location is never shared.<br />
                We only show your locality name.<br />
                Phone visible only to verified users.<br />
                Other users cannot see your phone unless you share it.
              </div>
            </div>

            <button className="btn btn-danger" style={{ margin: '0 14px 24px', width: 'calc(100% - 28px)' }} onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Settings</div>
              <div className="menu-list" style={{ margin: 0 }}>
              <button className="menu-item" onClick={() => { setShowSettings(false); setActiveTab('about') }}>
                <div className="menu-item-icon">🔒</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Privacy Settings</div>
                  <div className="menu-item-sub">Control what others see</div>
                </div>
                <div className="menu-item-arrow">›</div>
              </button>
              <button className="menu-item" onClick={() => { setShowSettings(false); setShowLocalitySwitcher(true) }}>
                <div className="menu-item-icon">📍</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">My Localities</div>
                  <div className="menu-item-sub">
                    {savedLocalities.length > 0 ? `${cu.locality} + ${savedLocalities.length} saved` : cu.locality}
                  </div>
                </div>
                <div className="menu-item-arrow">›</div>
              </button>
              <button className="menu-item"
                onClick={async () => {
                  if (notifStatus === 'granted') { await unsubscribe() }
                  else if (notifStatus !== 'unsupported') { await requestPermission() }
                }}
                disabled={notifStatus === 'unsupported' || notifStatus === 'subscribing'}>
                <div className="menu-item-icon">🔔</div>
                <div className="menu-item-text">
                  <div className="menu-item-label">Push Notifications</div>
                  <div className="menu-item-sub">
                    {notifStatus === 'granted' && 'On — tap to turn off'}
                    {notifStatus === 'denied' && 'Blocked in browser settings'}
                    {notifStatus === 'unsupported' && 'Not supported in this browser'}
                    {notifStatus === 'subscribing' && 'Enabling...'}
                    {(notifStatus === 'idle' || notifStatus === 'error') && 'Tap to enable'}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: notifStatus === 'granted' ? 'var(--success)' : 'var(--text-muted)' }}>
                  {notifStatus === 'granted' ? 'ON' : 'OFF'}
                </div>
              </button>
              <button className="menu-item" onClick={() => { setShowSettings(false); window.open('mailto:support@localsetu.in', '_blank') }}>
                <div className="menu-item-icon">📧</div>
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
      {showLocalitySwitcher && <LocalitySwitcherModal onClose={() => setShowLocalitySwitcher(false)} />}
    </div>
  )
}
