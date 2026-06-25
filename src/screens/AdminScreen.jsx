import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CategoryBadge from '../components/CategoryBadge'
import BottomNav from '../components/BottomNav'
import { SERVICE_TYPES, CIVIC_SUBCATEGORIES } from '../data/demoData'

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
  { id: 'flagged',   label: '🚩 Flagged' },
  { id: 'providers', label: '✅ Providers' },
  { id: 'reports',   label: '📋 Reports' },
  { id: 'civic',     label: '🏗️ Civic' },
  { id: 'quotes',    label: '🛒 Quotes' },
  { id: 'stats',     label: '📊 Stats' },
]

export default function AdminScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('flagged')
  const [civicFilter, setCivicFilter] = useState('all')

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


        {/* Civic Issues tab */}
        {activeTab === 'civic' && (() => {
          const civicPosts = state.posts.filter(p => p.category === 'civic' && p.status === 'active')
          const filtered = civicFilter === 'all' ? civicPosts : civicPosts.filter(p => p.civicStatus === civicFilter)

          const exportDigest = () => {
            const lines = []
            lines.push('LocalSetu Civic Pulse — Weekly Digest')
            lines.push('Generated: ' + new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
            lines.push('─────────────────────────────────────────')
            const grouped = {}
            civicPosts.forEach(p => {
              const sub = p.civicSubcategory || 'other'
              if (!grouped[sub]) grouped[sub] = []
              grouped[sub].push(p)
            })
            Object.keys(grouped).sort().forEach(sub => {
              const meta = CIVIC_SUBCATEGORIES.find(s => s.id === sub)
              const label = meta ? `${meta.icon} ${meta.label}` : sub
              lines.push(`\n${label} (${grouped[sub].length} reports)`)
              grouped[sub].forEach(p => {
                lines.push(`  • ${p.locality} — ${p.stillHappeningCount || 0} confirmations — ${p.civicStatus}`)
              })
            })
            lines.push('\n─────────────────────────────────────────')
            lines.push(`Total reports: ${civicPosts.length}`)
            lines.push(`Confirmed by locals: ${civicPosts.filter(p => p.civicStatus === 'confirmed_by_locals').length}`)
            lines.push(`Resolved: ${civicPosts.filter(p => p.civicStatus === 'resolved').length}`)

            const text = lines.join('\n')
            const blob = new Blob([text], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'kharghar-civic-pulse.txt'; a.click()
            URL.revokeObjectURL(url)
          }

          return (
            <div>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {civicPosts.length} Civic Issue{civicPosts.length !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={exportDigest}
                  style={{ fontSize: 12, fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
                >
                  📥 Export Civic Digest
                </button>
              </div>

              {/* Status filter tabs */}
              <div style={{ display: 'flex', gap: 6, padding: '0 14px 12px', overflowX: 'auto' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'reported', label: '📋 Reported' },
                  { id: 'confirmed_by_locals', label: '👥 Confirmed' },
                  { id: 'resolved', label: '✅ Resolved' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCivicFilter(f.id)}
                    style={{
                      fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '5px 12px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                      background: civicFilter === f.id ? 'var(--primary)' : 'var(--border)',
                      color: civicFilter === f.id ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Civic post cards */}
              {filtered.length === 0 && (
                <div className="empty-state" style={{ padding: '40px 16px' }}>
                  <div className="empty-icon">🏗️</div>
                  <p>No civic issues in this filter</p>
                </div>
              )}
              {filtered.map(post => {
                const author = state.users.find(u => u.id === post.userId)
                const sub = CIVIC_SUBCATEGORIES.find(s => s.id === post.civicSubcategory)
                return (
                  <div key={post.id} className="admin-post-card" style={{ borderLeft: post.civicStatus === 'resolved' ? '3px solid #22c55e' : post.civicStatus === 'confirmed_by_locals' ? '3px solid #f59e0b' : '3px solid #94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        {sub && <span style={{ fontSize: 11, fontWeight: 700, background: '#f0f9ff', color: '#0369a1', borderRadius: 6, padding: '2px 7px', marginRight: 6 }}>{sub.icon} {sub.label}</span>}
                        <span style={{ fontSize: 11, fontWeight: 700,
                          background: post.civicStatus === 'resolved' ? '#dcfce7' : post.civicStatus === 'confirmed_by_locals' ? '#fef3c7' : '#f1f5f9',
                          color: post.civicStatus === 'resolved' ? '#15803d' : post.civicStatus === 'confirmed_by_locals' ? '#92400e' : '#64748b',
                          borderRadius: 6, padding: '2px 7px'
                        }}>
                          {post.civicStatus === 'reported' ? '📋 Reported' : post.civicStatus === 'confirmed_by_locals' ? '👥 Confirmed' : '✅ Resolved'}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.locality}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.5 }}>{post.content}</p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)', alignItems: 'center' }}>
                      <span>By {author?.name || 'Unknown'}</span>
                      <span>·</span>
                      <span>👥 {post.stillHappeningCount || 0} confirmations</span>
                      {post.civicStatus !== 'resolved' && (
                        <button
                          onClick={() => actions.resolveCivicIssue(post.id)}
                          style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                        >
                          ✅ Mark resolved
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Quotes */}
        {activeTab === 'quotes' && (() => {
          const allQuotes = helpers.getAllQuotes()
          const buyPosts = state.posts.filter(p => p.category === 'need_to_buy' && p.status !== 'removed')
          return (
            <div>
              <div style={{ padding: '10px 14px 4px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {allQuotes.length} active quote{allQuotes.length !== 1 ? 's' : ''} across {buyPosts.length} buy request{buyPosts.length !== 1 ? 's' : ''}
                </div>
              </div>
              {buyPosts.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <div className="empty-title">No Need to Buy posts yet</div>
                  <div className="empty-sub">Users haven't posted any buy requests.</div>
                </div>
              )}
              {buyPosts.map(post => {
                const postQuotes = helpers.getQuotes(post.id)
                const author = helpers.getUser(post.userId)
                return (
                  <div key={post.id} style={{ margin: '0 14px 14px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ background: '#fff8f0', padding: '10px 14px', borderBottom: '1px solid #fde8d5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#c2410c' }}>🛒 {post.needToBuyItem || 'Buy Request'}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ fontSize: 11, background: postQuotes.length > 0 ? '#dcfce7' : '#f1f5f9', color: postQuotes.length > 0 ? '#15803d' : '#64748b', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                            {postQuotes.length} quote{postQuotes.length !== 1 ? 's' : ''}
                          </span>
                          {post.isBought && <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>✓ Bought</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        By {author?.name || 'Unknown'} · {post.locality} · Budget {post.budget ? `≤ ₹${post.budget}` : 'not set'}
                      </div>
                    </div>
                    {postQuotes.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>No quotes submitted yet.</div>
                    ) : (
                      postQuotes.map(q => (
                        <div key={q.id} style={{ padding: '10px 14px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{q.shopName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              ₹{q.price}
                              {q.deliveryTime ? ` · Delivery ${q.deliveryTime}min` : ''}
                              {q.deliveryCharge > 0 ? ` (₹${q.deliveryCharge})` : q.deliveryAvailable ? ' (free delivery)' : ''}
                              {q.pickupAvailable ? ' · Pickup ✓' : ''}
                            </div>
                            {q.message && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{q.message}"</div>}
                            {post.selectedQuoteId === q.id && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', background: '#fef3c7', borderRadius: 4, padding: '1px 6px' }}>✅ Selected by buyer</span>
                            )}
                          </div>
                          <button
                            onClick={() => { if (window.confirm('Remove this quote?')) actions.adminRemoveQuote(q.id) }}
                            style={{ fontSize: 11, color: 'var(--error)', background: 'var(--error-light)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}

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
              {['water', 'power', 'traffic', 'transport', 'police', 'weather', 'safety', 'civic', 'medical'].map(cat => {
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
                  • Report rate: <strong>&lt; 5%</strong><br/>
                  • Medical posts: <strong>{state.posts.filter(p => p.category === 'medical').length} active</strong>
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
