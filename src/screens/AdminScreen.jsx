import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CategoryBadge from '../components/CategoryBadge'
import BottomNav from '../components/BottomNav'
import { SERVICE_TYPES } from '../data/demoData'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`
}

function getServiceLabel(type) {
  return SERVICE_TYPES.find(s => s.id === type)?.label || type
}

const ADMIN_TABS = [
  { id: 'flagged', label: '🚩 Flagged' },
  { id: 'providers', label: '✅ Providers' },
  { id: 'reports', label: '📋 Reports' },
  { id: 'stats', label: '📊 Stats' }
]

export default function AdminScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('flagged')

  const cu = state.currentUser
  if (cu?.role !== 'admin') {
    navigate('/home')
    return null
  }

  const flaggedPosts = helpers.getFlaggedPosts()
  const pendingReports = helpers.getPendingReports()
  const unverifiedProviders = state.providers.filter(p => !p.isVerified)
  const allProviders = state.providers
  const totalPosts = state.posts.filter(p => p.status === 'active').length
  const bannedUsers = state.users.filter(u => u.isBanned).length

  return (
    <div className="app-container">
      <div className="screen">
        {/* Header */}
        <div className="header" style={{ background: 'var(--navy)' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back
          </button>
          <div style={{ color: 'white', fontWeight: 800 }}>🛡️ Admin Dashboard</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Moderator</div>
        </div>

        {/* Tab Bar */}
        <div className="tab-bar">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'flagged' && flaggedPosts.length > 0 && (
                <span style={{
                  background: 'var(--error)',
                  color: 'white',
                  borderRadius: 10,
                  padding: '1px 5px',
                  fontSize: 10,
                  fontWeight: 900,
                  marginLeft: 4
                }}>
                  {flaggedPosts.length}
                </span>
              )}
              {tab.id === 'reports' && pendingReports.length > 0 && (
                <span style={{
                  background: 'var(--warning)',
                  color: 'white',
                  borderRadius: 10,
                  padding: '1px 5px',
                  fontSize: 10,
                  fontWeight: 900,
                  marginLeft: 4
                }}>
                  {pendingReports.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Flagged Posts */}
        {activeTab === 'flagged' && (
          <div>
            {flaggedPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div className="empty-title">No flagged posts</div>
                <div className="empty-sub">Community content is clean. All clear!</div>
              </div>
            ) : (
              flaggedPosts.map(post => {
                const author = helpers.getUser(post.userId)
                return (
                  <div key={post.id} className="flagged-card">
                    <div className="flagged-header">
                      <CategoryBadge category={post.category} />
                      <span style={{
                        background: 'var(--error-light)',
                        color: 'var(--error)',
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700
                      }}>
                        🚩 {post.reportCount} reports
                      </span>
                    </div>
                    <div className="flagged-content">{post.content}</div>
                    <div className="flagged-meta">
                      By {author?.name || 'Unknown'} · {post.locality} · {timeAgo(post.createdAt)}
                    </div>
                    <div className="admin-actions">
                      <button
                        className="admin-action-btn approve"
                        onClick={() => actions.adminApprovePost(post.id)}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="admin-action-btn remove"
                        onClick={() => actions.adminRemovePost(post.id)}
                      >
                        🗑️ Remove
                      </button>
                      <button
                        className="admin-action-btn"
                        onClick={() => actions.adminPinPost(post.id)}
                        style={{
                          background: post.isPinned ? 'var(--primary-light)' : 'var(--bg)',
                          borderColor: post.isPinned ? 'var(--primary)' : 'var(--border)',
                          color: post.isPinned ? 'var(--primary)' : 'var(--text-secondary)'
                        }}
                      >
                        📌 {post.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        className="admin-action-btn warn"
                        onClick={() => actions.adminWarnUser(post.userId)}
                      >
                        ⚠️ Warn User
                      </button>
                      <button
                        className="admin-action-btn ban"
                        onClick={() => {
                          if (window.confirm(`Ban ${author?.name}? This will prevent them from posting.`)) {
                            actions.adminBanUser(post.userId)
                            actions.adminRemovePost(post.id)
                          }
                        }}
                      >
                        🚫 Ban User
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Providers */}
        {activeTab === 'providers' && (
          <div>
            <div style={{ padding: '10px 14px 4px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {unverifiedProviders.length} pending verification · {allProviders.filter(p => p.isVerified).length} verified
              </div>
            </div>
            {unverifiedProviders.length === 0 && (
              <div style={{ padding: '12px 14px' }}>
                <div style={{ background: 'var(--success-light)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                  ✅ All providers with 3+ recommendations are auto-verified. No manual action needed.
                </div>
              </div>
            )}
            {allProviders.map(provider => (
              <div key={provider.id} style={{ background: 'var(--card)', margin: '0 14px 10px', borderRadius: 'var(--radius)', padding: '14px 16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{provider.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {getServiceLabel(provider.serviceType)} · {provider.locality}
                    </div>
                  </div>
                  {provider.isVerified ? (
                    <span style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      ✅ Verified
                    </span>
                  ) : (
                    <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      ⏳ {provider.recommendationCount}/3 recs
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!provider.isVerified && (
                    <button
                      className="admin-action-btn approve"
                      onClick={() => actions.adminVerifyProvider(provider.id)}
                    >
                      ✅ Manually Verify
                    </button>
                  )}
                  <button
                    className="admin-action-btn remove"
                    onClick={() => {
                      if (window.confirm(`Remove ${provider.name} from directory?`)) {
                        // Could add remove provider action
                      }
                    }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div>
            {pendingReports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">No pending reports</div>
                <div className="empty-sub">All reports have been reviewed.</div>
              </div>
            ) : (
              pendingReports.map(report => {
                const reporter = helpers.getUser(report.reporterId)
                const targetPost = report.targetType === 'post' ? helpers.getPost(report.targetId) : null
                return (
                  <div key={report.id} style={{ background: 'var(--card)', margin: '0 14px 10px', borderRadius: 'var(--radius)', padding: '14px 16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow)', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>
                        {report.targetType} report
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(report.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Reported by: <strong>{reporter?.name || 'User'}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Reason: <strong>{report.reason?.replace('_', ' ')}</strong>
                    </div>
                    {targetPost && (
                      <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                        "{targetPost.content?.substring(0, 100)}..."
                      </div>
                    )}
                    {report.reporterNote && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
                        Note: "{report.reporterNote}"
                      </div>
                    )}
                    <div className="admin-actions">
                      {targetPost && (
                        <>
                          <button className="admin-action-btn approve" onClick={() => { actions.adminApprovePost(targetPost.id); actions.adminResolveReport(report.id) }}>
                            ✅ Keep Post
                          </button>
                          <button className="admin-action-btn remove" onClick={() => { actions.adminRemovePost(targetPost.id); actions.adminResolveReport(report.id) }}>
                            🗑️ Remove Post
                          </button>
                        </>
                      )}
                      <button className="admin-action-btn warn" onClick={() => actions.adminResolveReport(report.id)}>
                        📋 Dismiss
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Stats */}
        {activeTab === 'stats' && (
          <div>
            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-value">{state.posts.filter(p => p.status === 'active').length}</div>
                <div className="stat-label">Active posts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--navy)' }}>{state.users.filter(u => u.role === 'resident').length}</div>
                <div className="stat-label">Residents</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>{state.providers.filter(p => p.isVerified).length}</div>
                <div className="stat-label">Verified helpers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--error)' }}>{flaggedPosts.length}</div>
                <div className="stat-label">Flagged posts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingReports.length}</div>
                <div className="stat-label">Pending reports</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{bannedUsers}</div>
                <div className="stat-label">Banned users</div>
              </div>
            </div>

            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                Posts by Category
              </div>
              {['water', 'power', 'traffic', 'transport', 'police', 'weather', 'safety', 'civic'].map(cat => {
                const count = state.posts.filter(p => p.category === cat && p.status === 'active').length
                if (count === 0) return null
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <CategoryBadge category={cat} size="xs" />
                    <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${(count / totalPosts) * 100}%`, background: 'var(--primary)', height: '100%', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 16 }}>{count}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '0 14px 24px' }}>
              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', marginBottom: 6 }}>📊 60-Day Validation Targets</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  • Daily active posters: <strong>15+</strong><br/>
                  • Posts per day (organic): <strong>5+</strong><br/>
                  • Avg replies per post: <strong>2+</strong><br/>
                  • Report rate: <strong>&lt; 5%</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
