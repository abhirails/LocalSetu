// ============================================================
// LocalSetu — SocietyAdminScreen (Phase 3)
// Society admin panel: post notices/events, manage members.
// Tabs: Active posts | Resolved posts | Members (pending/approved)
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import PaymentModal from '../components/PaymentModal'

const TAB_ACTIVE   = 'active'
const TAB_RESOLVED = 'resolved'
const TAB_MEMBERS  = 'members'

const VISIBILITY_META = {
  public:    { label: 'Public feed',    color: '#16a34a', bg: '#22c55e20', icon: '🌐' },
  society:   { label: 'Members only',   color: '#2563eb', bg: '#3b82f620', icon: '🔒' },
  committee: { label: 'Committee only', color: '#7c3aed', bg: '#8b5cf620', icon: '🛡️' },
  admin:     { label: 'Admin only',     color: '#dc2626', bg: '#ef444420', icon: '👑' },
}

export default function SocietyAdminScreen() {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [tab, setTab]                   = useState(TAB_ACTIVE)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postType, setPostType]         = useState('notice')
  const [actionLoading, setActionLoading] = useState(null)
  const [memberTab, setMemberTab]       = useState('pending') // 'pending' | 'approved'
  const [showProModal, setShowProModal] = useState(false)

  const society = helpers.getMySociety()
  const isAdmin = helpers.isSocietyAdmin()

  // Load members when component mounts
  useEffect(() => {
    if (society?.id) actions.loadSocietyMembers(society.id)
  }, [society?.id])

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

  const allPosts = (state.societyPosts || []).filter(p => p.societyId === society.id)
  const activePosts   = allPosts.filter(p => p.status === 'active')
  const resolvedPosts = allPosts.filter(p => p.status === 'resolved')

  const pendingMembers  = helpers.getPendingMemberships(society.id)
  const approvedMembers = helpers.getApprovedMemberships(society.id)

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

  const handleApprove = async (memberId) => {
    setActionLoading(memberId + '_approve')
    try {
      await actions.approveSocietyMember(memberId)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (memberId) => {
    setActionLoading(memberId + '_reject')
    try {
      await actions.rejectSocietyMember(memberId)
    } finally {
      setActionLoading(null)
    }
  }

  const openPostForm = (type) => {
    setPostType(type)
    setShowPostForm(true)
  }

  // Which posts to show in the active/resolved tabs
  const displayedPosts = tab === TAB_ACTIVE ? activePosts : resolvedPosts

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
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0', flexWrap: 'wrap' }}>
        {[
          { label: 'Active',   count: activePosts.length,   color: '#16a34a', bg: '#22c55e20' },
          { label: 'Resolved', count: resolvedPosts.length, color: '#6366f1', bg: '#6366f120' },
          { label: 'Members',  count: approvedMembers.length, color: 'var(--primary)', bg: 'rgba(var(--primary-rgb,255,107,53),0.1)' },
          { label: 'Pending',  count: pendingMembers.length, color: '#d97706', bg: '#fef9c320', alert: pendingMembers.length > 0 },
        ].map(s => (
          <div
            key={s.label}
            onClick={s.label === 'Pending' || s.label === 'Members' ? () => setTab(TAB_MEMBERS) : undefined}
            style={{
              flex: '1 1 calc(25% - 8px)', minWidth: 64,
              background: s.alert && s.count > 0 ? '#fef9c3' : s.bg,
              border: s.alert && s.count > 0 ? '1.5px solid #fde047' : 'none',
              borderRadius: 12, padding: '10px 8px', textAlign: 'center',
              cursor: (s.label === 'Pending' || s.label === 'Members') ? 'pointer' : 'default'
            }}
          >
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.alert && s.count > 0 ? '#d97706' : s.color }}>
              {s.count}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-light)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Phase 4: Society Admin Pro upgrade banner */}
      {!society.isPro && (
        <div style={{
          margin: '14px 16px 0',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          borderRadius: 14, padding: '14px 16px', color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                ✨ Upgrade to Society Admin Pro
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.9, lineHeight: 1.5 }}>
                Maintenance records · Event RSVPs · Bulk announcements · Priority support
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900 }}>₹999</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>/year</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setShowProModal(true)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                background: '#fff', color: '#4f46e5',
                border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer'
              }}
            >
              Upgrade Now
            </button>
            <button
              onClick={() => {
                alert('Society Admin Pro features:\n\n✅ Maintenance bill tracker\n✅ Event RSVP (with headcount)\n✅ Bulk WhatsApp announcements\n✅ Visitor log\n✅ Complaint tracker\n✅ Priority email support')
              }}
              style={{
                padding: '8px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.4)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer'
              }}
            >
              Learn more
            </button>
          </div>
        </div>
      )}

      {/* Post buttons — only shown on posts tabs */}
      {tab !== TAB_MEMBERS && (
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
      )}

      {/* Maintenance & Complaints quick link (Pro feature) */}
      <div style={{ padding: '10px 16px 0' }}>
        <button
          onClick={() => navigate('/maintenance')}
          style={{
            width: '100%', padding: '11px 16px', borderRadius: 10,
            background: society.isPro ? 'rgba(30,58,95,0.07)' : 'rgba(124,58,237,0.06)',
            border: society.isPro ? '1px solid rgba(30,58,95,0.2)' : '1px dashed rgba(124,58,237,0.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🔧</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: society.isPro ? '#1e3a5f' : '#7c3aed' }}>
              Maintenance & Complaints
              {!society.isPro && <span style={{ marginLeft: 6, fontSize: 10, background: '#ede9fe', color: '#7c3aed', padding: '1px 6px', borderRadius: 4 }}>Pro</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Track repairs, vendors, costs · manage resident complaints
            </div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>→</span>
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
            { key: TAB_RESOLVED, label: `Resolved (${resolvedPosts.length})` },
            {
              key: TAB_MEMBERS,
              label: pendingMembers.length > 0
                ? `Members 🔴${pendingMembers.length}`
                : `Members (${approvedMembers.length})`
            }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 4px',
                border: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: tab === t.key ? 700 : 400,
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
      {tab !== TAB_MEMBERS && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayedPosts.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 32, color: 'var(--text-light)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              <p style={{ margin: 0, fontSize: 14 }}>No {tab} posts</p>
            </div>
          ) : (
            displayedPosts.map(post => (
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
      )}

      {/* Members tab */}
      {tab === TAB_MEMBERS && (
        <div style={{ padding: '12px 16px' }}>
          {/* Sub-tabs: Pending / Approved */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 12,
            border: '1px solid var(--border)', borderRadius: 8,
            overflow: 'hidden', background: 'var(--card-bg)'
          }}>
            {[
              { key: 'pending',  label: `Pending (${pendingMembers.length})` },
              { key: 'approved', label: `Approved (${approvedMembers.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setMemberTab(t.key)}
                style={{
                  flex: 1, padding: '8px 4px',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: memberTab === t.key ? 700 : 400,
                  background: memberTab === t.key ? 'var(--primary)' : 'transparent',
                  color: memberTab === t.key ? '#fff' : 'var(--text-light)',
                  transition: 'all 0.15s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Pending requests */}
          {memberTab === 'pending' && (
            pendingMembers.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 32, color: 'var(--text-light)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <p style={{ margin: 0, fontSize: 14 }}>No pending requests</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>All join requests have been reviewed</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingMembers.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isPending={true}
                    approveLoading={actionLoading === member.id + '_approve'}
                    rejectLoading={actionLoading === member.id + '_reject'}
                    onApprove={() => handleApprove(member.id)}
                    onReject={() => handleReject(member.id)}
                  />
                ))}
              </div>
            )
          )}

          {/* Approved members */}
          {memberTab === 'approved' && (
            approvedMembers.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 32, color: 'var(--text-light)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏠</div>
                <p style={{ margin: 0, fontSize: 14 }}>No approved members yet</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Approve pending requests to build your member list
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {approvedMembers.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isPending={false}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}

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

// ── Admin Post Card ──────────────────────────────────────────

function AdminPostCard({ post, onResolve, onRemove, resolveLoading, removeLoading }) {
  const isEvent  = post.type === 'event'
  const isActive = post.status === 'active'
  const visMeta  = VISIBILITY_META[post.visibility || 'public']

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: '2px 8px', borderRadius: 20,
          background: isEvent ? 'rgba(99,102,241,0.12)' : 'rgba(234,179,8,0.12)',
          color: isEvent ? '#4338ca' : '#a16207'
        }}>
          {isEvent ? '🎉 Event' : '📋 Notice'}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: '2px 8px', borderRadius: 20,
          background: visMeta.bg, color: visMeta.color
        }}>
          {visMeta.icon} {visMeta.label}
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

      <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
        {post.title}
      </h3>

      <p style={{
        margin: '0 0 12px', fontSize: 13, color: 'var(--text)',
        lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {post.content}
      </p>

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

// ── Member Card ──────────────────────────────────────────────

function MemberCard({ member, isPending, approveLoading, rejectLoading, onApprove, onReject }) {
  const name     = member.profile?.name || 'Resident'
  const locality = member.profile?.locality || ''
  const verified = member.profile?.isVerified

  const roleMeta = {
    resident:  { label: 'Resident',  color: '#2563eb', bg: '#3b82f620' },
    committee: { label: 'Committee', color: '#7c3aed', bg: '#8b5cf620' },
    admin:     { label: 'Admin',     color: '#dc2626', bg: '#ef444420' },
  }[member.role] || { label: member.role, color: 'var(--text-muted)', bg: 'var(--bg)' }

  const age = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div style={{
      border: isPending ? '1.5px solid #fde047' : '1px solid var(--border)',
      borderRadius: 12, padding: '12px 14px',
      background: isPending ? '#fefce8' : 'var(--card-bg)'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, flexShrink: 0
        }}>
          {name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{name}</span>
            {verified && (
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Verified</span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
              background: roleMeta.bg, color: roleMeta.color
            }}>
              {roleMeta.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
            {locality && `📍 ${locality}`}
            {member.requestedAt && (
              <span style={{ marginLeft: locality ? 8 : 0 }}>
                Requested {age(member.requestedAt)}
              </span>
            )}
            {!isPending && member.reviewedAt && (
              <span style={{ marginLeft: locality || member.requestedAt ? 8 : 0 }}>
                Joined {age(member.reviewedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Status badge for approved */}
        {!isPending && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: '#22c55e20', color: '#16a34a', flexShrink: 0
          }}>
            ✓ Approved
          </span>
        )}
      </div>

      {/* Approve / Reject buttons */}
      {isPending && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={onApprove}
            disabled={approveLoading}
            style={{
              flex: 1, padding: '9px 4px',
              background: approveLoading ? 'var(--border)' : '#22c55e',
              color: '#fff', border: 'none',
              borderRadius: 8, cursor: approveLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700
            }}
          >
            {approveLoading ? '…' : '✓ Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={rejectLoading}
            style={{
              flex: 1, padding: '9px 4px',
              background: '#ef444420', color: '#dc2626',
              border: '1px solid #ef444440',
              borderRadius: 8, cursor: rejectLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600
            }}
          >
            {rejectLoading ? '…' : '✕ Reject'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Admin Post Form (with visibility picker) ─────────────────

function AdminPostForm({ type, societyId, onClose, onSaved }) {
  const { actions } = useApp()
  const [title, setTitle]                 = useState('')
  const [content, setContent]             = useState('')
  const [eventDate, setEventDate]         = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [visibility, setVisibility]       = useState('public')
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

          {/* Visibility selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
              Who can see this?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { value: 'public',    icon: '🌐', label: 'Public feed',    sub: 'All nearby residents see this in the main feed' },
                { value: 'society',   icon: '🔒', label: 'Members only',   sub: 'Only approved society members' },
                { value: 'committee', icon: '🛡️', label: 'Committee only', sub: 'Committee members and admin only' },
              ].map(opt => {
                const meta = VISIBILITY_META[opt.value]
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', padding: '10px 12px',
                      background: visibility === opt.value ? meta.bg : 'var(--card-bg)',
                      border: `1.5px solid ${visibility === opt.value ? meta.color : 'var(--border)'}`,
                      borderRadius: 10, transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={visibility === opt.value}
                      onChange={() => setVisibility(opt.value)}
                      style={{ width: 16, height: 16, accentColor: meta.color }}
                    />
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: visibility === opt.value ? meta.color : 'var(--text)' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{opt.sub}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

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
      {/* Phase 5: Society Admin Pro payment modal */}
      {showProModal && (
        <PaymentModal
          title="✨ Society Admin Pro"
          description="Annual plan — renews after 1 year."
          type="society_pro"
          metadata={{ society_id: society?.id }}
          currentUser={state.currentUser || {}}
          options={[{
            id:          'pro_annual',
            label:       '1 Year — Admin Pro',
            price:       999,
            months:      12,
            description: 'Maintenance log · Event RSVPs · Bulk announcements',
          }]}
          onSuccess={() => {
            // Optimistic: show Pro state immediately (Supabase will confirm on next load)
            actions.setToast && actions.setToast('Society Admin Pro activated! ✨')
          }}
          onClose={() => setShowProModal(false)}
        />
      )}
    </div>
  )
}
