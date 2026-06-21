import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { useApp } from "../context/AppContext"

const TAB_ACTIVE   = 'active'
const TAB_RESOLVED = 'resolved'

export default function SocietyAdminScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [tab, setTab]             = useState(TAB_ACTIVE)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postType, setPostType]   = useState('notice')
  const [actionLoading, setActionLoading] = useState(null)

  const society = helpers.getMySociety()
  const isAdmin = helpers.isSocietyAdmin()

  // Redirect if not a society admin
  if (!isAdmin || !society) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
          Society Admin access required
        </p>
        <p style={{ fontSize: 13, margin: '4px 0 16px' }}>
          This panel is only for building secretaries.
        </p>
        <button onClick={() => navigate('/')} style={{
          padding: '10px 24px',
          background: 'var(--primary)', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14
        }}>Go Home</button>
      </div>
    )
  }

  const allPosts = (state.societyPosts || []).filter(
    p => p.societyId === society.id
  )
  const activePosts   = allPosts.filter(p => p.status === 'active')
  const resolvedPosts = allPosts.filter(p => p.status === 'resolved')
  const displayed = tab === TAB_ACTIVE ? activePosts : resolvedPosts

  const handleResolve = async (post) => {
    setActionLoading(post.id + '_resolve')
    try {
      await actions.resolveSocietyPost(post.id)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (post) => {
    if (!window.confirm('Remove this post? Residents will no longer see it.')) return
    setActionLoading(post.id + '_remove')
    try {
      await actions.removeSocietyPost(post.id)
    } finally {
      setActionLoading(null)
    }
  }

  const openPostForm = (type) => {
    setPostType(type)
    setShowPostForm(true)
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
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Admin Panel
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>
              {society.name} • {society.sector}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 10, padding: '14px 16px 0'
      }}>
        {[
          { label: 'Active', count: activePosts.length, color: '#22c55e', bg: '#22c55e20' },
          { label: 'Resolved', count: resolvedPosts.length, color: '#6366f1', bg: '#6366f120' },
          { label: 'Total Flats', count: society.totalFlats || '—', color: 'var(--primary)', bg: 'rgba(var(--primary-rgb,255,107,53),0.1)' }
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: s.bg,
            borderRadius: 12, padding: '10px 8px', textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color }}>
              {s.count}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-light)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Post buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 0' }}>
        <button
          onClick={() => openPostForm('notice')}
          style={{
            flex: 1, padding: '11px 8px',
            background: 'rgba(234,179,8,0.1)',
            color: '#a16207', border: '1px solid rgba(234,179,8,0.4)',
            borderRadius: 10, cursor: 'pointer',
            fontSize: 13.5, fontWeight: 700
          }}
        >
          📋 Post Notice
        </button>
        <button
          onClick={() => openPostForm('event')}
          style={{
            flex: 1, padding: '11px 8px',
            background: 'rgba(99,102,241,0.1)',
            color: '#4338ca', border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 10, cursor: 'pointer',
            fontSize: 13.5, fontWeight: 700
          }}
        >
          🎉 Post Event
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          display: 'flex', gap: 0,
          border: '1px solid var(--border)', borderRadius: 10,
          overflow: 'hidden', background: 'var(--card-bg)'
        }}>
          {[
            { key: TAB_ACTIVE,   label: `Active (${activePosts.length})` },
            { key: TAB_RESOLVED, label: `Resolved (${resolvedPosts.length})` }
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

      {/* Posts list */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 32, color: 'var(--text-light)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            <p style={{ margin: 0, fontSize: 14 }}>
              No {tab} posts
            </p>
          </div>
        ) : (
          displayed.map(post => (
            <AdminPostCard
              key={post.id}
              post={post}
              onResolve={() => handleResolve(post)}
              onRemove={() => handleRemove(post)}
              resolveLoading={actionLoading === post.id + '_resolve'}
              removeLoading={actionLoading === post.id + '_remove'}
            />
          ))
        )}
      </div>

      {/* Post form modal */}
      {showPostForm && (
        <AdminPostForm
          type={postType}
          societyId={society.id}
          onClose={() => setShowPostForm(false)}
          onSaved={() => setShowPostForm(false)}
        />
      )}
    </div>
  )
}

function AdminPostCard({ post, onResolve, onRemove, resolveLoading, removeLoading }) {
  const isEvent = post.type === 'event'
  const isActive = post.status === 'active'

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
      {/* Type + pin badge + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: '2px 8px', borderRadius: 20,
          background: isEvent ? 'rgba(99,102,241,0.12)' : 'rgba(234,179,8,0.12)',
          color: isEvent ? '#4338ca' : '#a16207'
        }}>
          {isEvent ? '🎉 Event' : '📋 Notice'}
        </span>
        {post.pinToFeed && isActive && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '2px 8px', borderRadius: 20,
            background: 'rgba(var(--primary-rgb,255,107,53),0.1)',
            color: 'var(--primary)'
          }}>
            📌 In feed
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

      {/* Content */}
      <p style={{
        margin: '0 0 12px', fontSize: 13, color: 'var(--text)',
        lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {post.content}
      </p>

      {/* Actions */}
      {isActive && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onResolve}
            disabled={resolveLoading}
            style={{
              flex: 1, padding: '8px 4px',
              background: '#22c55e20', color: '#16a34a',
              border: '1px solid #22c55e40',
              borderRadius: 8, cursor: resolveLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600
            }}
          >
            {resolveLoading ? '…' : '✓ Resolve'}
          </button>
          <button
            onClick={onRemove}
            disabled={removeLoading}
            style={{
              flex: 1, padding: '8px 4px',
              background: '#ef444420', color: '#dc2626',
              border: '1px solid #ef444440',
              borderRadius: 8, cursor: removeLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600
            }}
          >
            {removeLoading ? '…' : '✕ Remove'}
          </button>
        </div>
      )}
      {!isActive && (
        <span style={{
          display: 'inline-block', fontSize: 12, padding: '3px 10px',
          background: '#6366f120', color: '#4338ca',
          borderRadius: 20, fontWeight: 600
        }}>
          Resolved
        </span>
      )}
    </div>
  )
}

function AdminPostForm({ type, societyId, onClose, onSaved }) {
  const { state, actions } = useApp()
  const [title, setTitle]                 = useState('')
  const [content, setContent]             = useState('')
  const [eventDate, setEventDate]         = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [pinToFeed, setPinToFeed]         = useState(true)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')

  const isEvent = type === 'event'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (!content.trim()) { setError('Details are required.'); return }

    setSaving(true)
    try {
      await actions.addSocietyPost(societyId, {
        type,
        title: title.trim(),
        content: content.trim(),
        eventDate: isEvent && eventDate ? new Date(eventDate).toISOString() : null,
        eventLocation: isEvent ? eventLocation.trim() || null : null,
        pinToFeed
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
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-light)', textAlign: 'right' }}>
              {title.length}/120
            </p>
          </div>

          {isEvent && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
                  Date & Time
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
                  Location
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
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-light)', textAlign: 'right' }}>
              {content.length}/500
            </p>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', padding: '10px 12px',
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 10
          }}>
            <input
              type="checkbox"
              checked={pinToFeed}
              onChange={e => setPinToFeed(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                Show in KhargharConnect feed
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-light)' }}>
                Residents nearby will see this in their Home feed
              </p>
            </div>
          </label>

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
