// ============================================================
// LocalSetu — SocietyDetailScreen (Phase 3)
// Shows society info, notices, events.
// Non-members see public posts only + "Request to Join" button.
// Approved members see all posts up to their visibility tier.
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TAB_NOTICE = 'notice'
const TAB_EVENT  = 'event'

const VISIBILITY_META = {
  public:    { label: 'Public feed',    color: '#16a34a', bg: '#22c55e20', icon: '🌐' },
  society:   { label: 'Members only',   color: '#2563eb', bg: '#3b82f620', icon: '🔒' },
  committee: { label: 'Committee only', color: '#7c3aed', bg: '#8b5cf620', icon: '🛡️' },
  admin:     { label: 'Admin only',     color: '#dc2626', bg: '#ef444420', icon: '👑' },
}

export default function SocietyDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, actions, helpers } = useApp()

  const [tab, setTab] = useState(TAB_NOTICE)
  const [showPostForm, setShowPostForm] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  const society = helpers.getSociety(id)
  const allPosts = helpers.getSocietyPosts(id)

  // Load members for this society when component mounts
  useEffect(() => {
    if (id) actions.loadSocietyMembers(id)
  }, [id])

  const membershipStatus = helpers.getMembershipStatus(id)   // null | 'pending' | 'approved' | 'rejected'
  const memberRole       = helpers.getMemberRole(id)         // null | 'resident' | 'committee' | 'admin'
  const isMember         = membershipStatus === 'approved'
  const isPending        = membershipStatus === 'pending'

  const isAdmin = helpers.isSocietyAdmin() && state.currentUser?.societyId === id

  // Filter posts by what this user can see
  const visiblePosts = allPosts.filter(p => helpers.canViewSocietyPost(p))
  const notices = visiblePosts.filter(p => p.type === 'notice')
  const events  = visiblePosts.filter(p => p.type === 'event')
  const displayed = tab === TAB_NOTICE ? notices : events

  // Count locked posts (visible in count but not in content)
  const lockedCount = allPosts.length - visiblePosts.length

  const pendingCount  = helpers.getPendingMemberships(id).length
  const approvedCount = helpers.getApprovedMemberships(id).length

  if (!society) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
        <p>Society not found</p>
        <button onClick={() => navigate(-1)} style={{
          marginTop: 12, padding: '8px 20px',
          background: 'var(--primary)', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14
        }}>Go back</button>
      </div>
    )
  }

  const handleCall = () => {
    if (society.contactPhone) {
      window.location.href = `tel:${society.contactPhone}`
    } else {
      alert('No contact number available. Ask your building secretary to update LocalSetu.')
    }
  }

  const handleJoinRequest = async () => {
    setJoinLoading(true)
    try {
      await actions.requestJoinSociety(id)
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: 'var(--text)', padding: 0, lineHeight: 1 }}
          >
            ←
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {society.name}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>
              {society.sector}{society.landmark ? ` • ${society.landmark}` : ''}
              {approvedCount > 0 ? ` • ${approvedCount} members` : ''}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/society-admin')}
              style={{
                position: 'relative',
                padding: '6px 12px', fontSize: 12, fontWeight: 600,
                background: 'var(--primary)', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer'
              }}
            >
              Admin Panel
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Membership status banner */}
      {isMember && !isAdmin && (
        <div style={{
          margin: '10px 16px 0', padding: '8px 12px',
          background: '#22c55e15', border: '1px solid #22c55e40',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 18 }}>
            {memberRole === 'committee' ? '🛡️' : memberRole === 'admin' ? '👑' : '✅'}
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
              {memberRole === 'committee' ? 'Committee Member' : memberRole === 'admin' ? 'Society Admin' : 'Verified Resident'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
              You have access to members-only posts
            </div>
          </div>
        </div>
      )}
      {isPending && (
        <div style={{
          margin: '10px 16px 0', padding: '8px 12px',
          background: '#fef9c3', border: '1px solid #fde047',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a16207' }}>Join request pending</div>
            <div style={{ fontSize: 11, color: '#a16207' }}>
              Waiting for society admin approval
            </div>
          </div>
        </div>
      )}

      {/* Society info card */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 14, padding: '14px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {society.isVerified && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: '#22c55e20', color: '#16a34a',
                padding: '2px 8px', borderRadius: 20,
                border: '1px solid #22c55e40'
              }}>✓ Verified Society</span>
            )}
            {society.totalFlats && (
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                🏠 {society.totalFlats} flats
              </span>
            )}
          </div>

          {society.description && (
            <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
              {society.description}
            </p>
          )}

          {society.rules && (
            <details style={{ marginBottom: 10 }}>
              <summary style={{ fontSize: 12.5, color: 'var(--text-light)', cursor: 'pointer' }}>
                Society rules
              </summary>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                {society.rules}
              </p>
            </details>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCall}
              style={{
                flex: 1, padding: '10px',
                background: 'rgba(var(--primary-rgb, 255,107,53), 0.1)',
                color: 'var(--primary)', border: '1px solid var(--primary)',
                borderRadius: 10, cursor: 'pointer',
                fontSize: 13.5, fontWeight: 600, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              📞 Contact Secretary
            </button>
            {/* Join request button */}
            {!isMember && !isPending && !isAdmin && state.currentUser && (
              <button
                onClick={handleJoinRequest}
                disabled={joinLoading}
                style={{
                  flex: 1, padding: '10px',
                  background: joinLoading ? 'var(--border)' : 'var(--primary)',
                  color: '#fff', border: 'none',
                  borderRadius: 10, cursor: joinLoading ? 'not-allowed' : 'pointer',
                  fontSize: 13.5, fontWeight: 600
                }}
              >
                {joinLoading ? 'Requesting…' : '🏠 Request to Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Locked content notice for non-members */}
      {!isMember && !isAdmin && lockedCount > 0 && (
        <div style={{
          margin: '10px 16px 0', padding: '12px 14px',
          background: '#f0f9ff', border: '1px solid #bae6fd',
          borderRadius: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>
                {lockedCount} members-only post{lockedCount !== 1 ? 's' : ''} not visible
              </div>
              <div style={{ fontSize: 11, color: '#0369a1' }}>
                {isPending ? 'Your request is pending approval.' : 'Request to join to see them.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety note */}
      <div style={{
        margin: '10px 16px 0',
        padding: '8px 12px',
        background: '#fef9c3', borderRadius: 10,
        fontSize: 12, color: '#854d0e', lineHeight: 1.4
      }}>
        ⚠️ Always verify society communications through official channels. Do not share OTP or bank details.
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          display: 'flex', gap: 0,
          border: '1px solid var(--border)', borderRadius: 10,
          overflow: 'hidden', background: 'var(--card-bg)'
        }}>
          {[
            { key: TAB_NOTICE, label: `Notices (${notices.length})` },
            { key: TAB_EVENT,  label: `Events (${events.length})` }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 4px',
                border: 'none', cursor: 'pointer',
                fontSize: 13.5, fontWeight: tab === t.key ? 700 : 400,
                background: tab === t.key ? 'var(--primary)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--text-light)',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post button for admin */}
      {isAdmin && (
        <div style={{ padding: '10px 16px 0' }}>
          <button
            onClick={() => setShowPostForm(true)}
            style={{
              width: '100%', padding: '10px',
              background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 10,
              cursor: 'pointer', fontSize: 14, fontWeight: 600
            }}
          >
            + Post {tab === TAB_NOTICE ? 'Notice' : 'Event'}
          </button>
        </div>
      )}

      {/* Posts list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 32, color: 'var(--text-light)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>
              {tab === TAB_NOTICE ? '📋' : '🎉'}
            </div>
            <p style={{ margin: 0, fontSize: 14 }}>
              No {isMember ? 'active' : 'public'} {tab === TAB_NOTICE ? 'notices' : 'events'}
            </p>
            {isAdmin && (
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                Tap the button above to post one
              </p>
            )}
          </div>
        ) : (
          displayed.map(post => (
            <SocietyPostCard key={post.id} post={post} showVisibility={isMember || isAdmin} />
          ))
        )}
      </div>

      {/* Post form modal */}
      {showPostForm && (
        <SocietyPostForm
          type={tab}
          societyId={id}
          showVisibility={isAdmin}
          onClose={() => setShowPostForm(false)}
          onSaved={() => setShowPostForm(false)}
        />
      )}
    </div>
  )
}

function SocietyPostCard({ post, showVisibility }) {
  const isEvent = post.type === 'event'
  const visMeta = VISIBILITY_META[post.visibility || 'public']

  const formattedDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const age = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 14, padding: '14px 16px'
    }}>
      {/* Type badge + visibility + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: '2px 8px', borderRadius: 20,
          background: isEvent ? 'rgba(99,102,241,0.12)' : 'rgba(234,179,8,0.12)',
          color: isEvent ? '#4338ca' : '#a16207'
        }}>
          {isEvent ? '🎉 Event' : '📋 Notice'}
        </span>
        {showVisibility && post.visibility && post.visibility !== 'public' && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '2px 8px', borderRadius: 20,
            background: visMeta.bg, color: visMeta.color
          }}>
            {visMeta.icon} {visMeta.label}
          </span>
        )}
        <span style={{ fontSize: 11.5, color: 'var(--text-light)', marginLeft: 'auto' }}>
          {age(post.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
        {post.title}
      </h3>

      {/* Event details */}
      {isEvent && post.eventDate && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 3,
          margin: '0 0 8px',
          padding: '8px 10px',
          background: 'rgba(99,102,241,0.06)',
          borderRadius: 8, borderLeft: '3px solid rgba(99,102,241,0.4)'
        }}>
          <span style={{ fontSize: 12.5, color: '#4338ca', fontWeight: 600 }}>
            📅 {formattedDate(post.eventDate)}
          </span>
          {post.eventLocation && (
            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
              📍 {post.eventLocation}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
        {post.content}
      </p>
    </div>
  )
}

function SocietyPostForm({ type, societyId, showVisibility, onClose, onSaved }) {
  const { actions } = useApp()
  const [title, setTitle]             = useState('')
  const [content, setContent]         = useState('')
  const [eventDate, setEventDate]     = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [visibility, setVisibility]   = useState('public')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const isEvent = type === 'event'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (!content.trim()) { setError('Content is required.'); return }

    setSaving(true)
    try {
      await actions.addSocietyPost(societyId, {
        type,
        title: title.trim(),
        content: content.trim(),
        eventDate: isEvent && eventDate ? new Date(eventDate).toISOString() : null,
        eventLocation: isEvent ? eventLocation.trim() || null : null,
        visibility,
        pinToFeed: visibility === 'public'
      })
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to post. Try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'var(--bg)', borderRadius: '18px 18px 0 0',
        padding: '20px 20px 40px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
            Post {isEvent ? 'Event' : 'Notice'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22,
            cursor: 'pointer', color: 'var(--text-light)', padding: 0
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
              Title *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isEvent ? 'e.g. Annual Society Meeting — 28 June' : 'e.g. Water supply disruption — 15 June'}
              maxLength={120}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: 10, background: 'var(--card-bg)',
                color: 'var(--text)', fontSize: 14, outline: 'none'
              }}
            />
          </div>

          {isEvent && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
                  Event Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', border: '1px solid var(--border)',
                    borderRadius: 10, background: 'var(--card-bg)',
                    color: 'var(--text)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
                  Event Location
                </label>
                <input
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  placeholder="e.g. Community Hall, Ground Floor"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '10px 12px', border: '1px solid var(--border)',
                    borderRadius: 10, background: 'var(--card-bg)',
                    color: 'var(--text)', fontSize: 14, outline: 'none'
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
              Details *
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={isEvent
                ? 'Describe the event — agenda, what to bring, who can attend…'
                : 'Details about this notice — what residents need to know or do…'
              }
              maxLength={500}
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: 10, background: 'var(--card-bg)',
                color: 'var(--text)', fontSize: 14, outline: 'none',
                resize: 'vertical', fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Visibility selector (admin only) */}
          {showVisibility && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                Who can see this?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { value: 'public',    icon: '🌐', label: 'Public feed', sub: 'Visible to all nearby residents on the main feed' },
                  { value: 'society',   icon: '🔒', label: 'Members only', sub: 'Only approved society members can see this' },
                  { value: 'committee', icon: '🛡️', label: 'Committee only', sub: 'Only committee members and admin' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', padding: '10px 12px',
                      background: visibility === opt.value ? VISIBILITY_META[opt.value].bg : 'var(--card-bg)',
                      border: `1.5px solid ${visibility === opt.value ? VISIBILITY_META[opt.value].color : 'var(--border)'}`,
                      borderRadius: 10, transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={visibility === opt.value}
                      onChange={() => setVisibility(opt.value)}
                      style={{ width: 16, height: 16, accentColor: VISIBILITY_META[opt.value].color }}
                    />
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: visibility === opt.value ? VISIBILITY_META[opt.value].color : 'var(--text)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Pin to feed toggle (public only) */}
          {!showVisibility && (
            <div style={{
              padding: '10px 12px', background: '#f0f9ff',
              border: '1px solid #bae6fd', borderRadius: 10,
              fontSize: 13, color: '#0369a1'
            }}>
              🌐 This post will appear in the public KhargharConnect feed
            </div>
          )}

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#ef4444', padding: '8px 12px',
              background: '#fef2f2', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', padding: '13px',
              background: saving ? 'var(--text-light)' : 'var(--primary)',
              color: '#fff', border: 'none', borderRadius: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 15, fontWeight: 700
            }}
          >
            {saving ? 'Posting…' : `Post ${isEvent ? 'Event' : 'Notice'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
