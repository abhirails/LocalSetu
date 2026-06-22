import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { matchesLiveLocality } from '../lib/geocode'
import CategoryBadge from './CategoryBadge'
import { BOOST_OPTIONS } from '../data/demoData'
import PaymentModal from './PaymentModal'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'Expires soon'
  if (hrs < 24) return `Expires in ${hrs}h`
  return `Expires in ${Math.floor(hrs / 24)}d`
}

function boostTimeLeft(boostedUntil) {
  if (!boostedUntil) return ''
  const diff = new Date(boostedUntil).getTime() - Date.now()
  if (diff <= 0) return ''
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'Boosted · <1h left'
  return `Boosted · ${hrs}h left`
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

export default function PostCard({ post, compact = false }) {
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [showReport, setShowReport] = useState(false)
  const [showBoost, setShowBoost] = useState(false)

  const author = helpers.getUser(post.userId)
  const isSaved = helpers.isPostSaved(post.id)
  const replyCount = helpers.getReplies(post.id).length
  const isMyPost = state.currentUser?.id === post.userId
  const alreadyConfirmed = post.confirmedBy?.includes(state.currentUser?.id)
  const isNearby = matchesLiveLocality(post.locality, state.liveLocality)
  const canBoost = isMyPost && (post.type === 'right_now' || post.type === 'need_it_now') && !post.isBoosted
  const boostLabel = boostTimeLeft(post.boostedUntil)

  if (post.status === 'removed') return null

  const handleStillHappening = (e) => {
    e.stopPropagation()
    if (alreadyConfirmed) return
    actions.confirmStillHappening(post.id)
  }

  const handleICanHelp = (e) => {
    e.stopPropagation()
    actions.markICanHelp(post.id)
    navigate(`/post/${post.id}`)
  }

  const handleSave = (e) => { e.stopPropagation(); actions.savePost(post.id) }
  const handleReport = (e) => { e.stopPropagation(); setShowReport(true) }
  const handleBoostClick = (e) => { e.stopPropagation(); setShowBoost(true) }

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
      try { await navigator.share({ title: 'LocalSetu', text: post.content.slice(0, 80), url }); return } catch {}
    }
    try { await navigator.clipboard.writeText(url) } catch {}
  }

  const submitReport = (reason) => { actions.reportPost(post.id, reason); setShowReport(false) }
  const goToDetail = () => navigate(`/post/${post.id}`)

  return (
    <>
      <div className="post-card" onClick={goToDetail} style={{ cursor: 'pointer', border: post.isBoosted ? '1.5px solid #f59e0b' : undefined }}>
        {/* Boost badge */}
        {post.isBoosted && boostLabel && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fef3c7', borderRadius: 6, padding: '2px 8px', marginBottom: 8, display: 'inline-block' }}>
            ⚡ {boostLabel}
          </div>
        )}

        <div className="post-card-header">
          <div className="post-avatar">{getInitials(author?.name)}</div>
          <div className="post-meta">
            <div className="post-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {author?.name || 'Local Resident'}
              {isNearby && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#15803D', background: '#DCFCE7', borderRadius: 4, padding: '1px 5px' }}>
                  Near you
                </span>
              )}
            </div>
            <div className="post-sub-meta">
              <span className="post-locality">{post.locality}</span>
              <span className="post-dot" />
              <span className="post-time">{timeAgo(post.createdAt)}</span>
              {post.isPinned && (
                <><span className="post-dot" /><span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>Pinned</span></>
              )}
            </div>
          </div>
          <CategoryBadge category={post.category} size="xs" />
        </div>

        <p className="post-content">{post.content}</p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span className="post-expiry">{timeUntil(post.expiresAt)}</span>
          {post.isFulfilled && <span className="tag-fulfilled">Fulfilled</span>}
          {post.neededBy && !post.isFulfilled && (
            <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>
              Needed by {new Date(post.neededBy).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {post.distanceRange && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {post.distanceRange === 'walking' ? 'Walking distance' : `Within ${post.distanceRange}`}
            </span>
          )}
        </div>

        <div className="post-actions" onClick={e => e.stopPropagation()}>
          {post.type === 'right_now' && (
            <button className={`action-btn ${alreadyConfirmed ? 'active' : ''}`} onClick={handleStillHappening}>
              Still happening
              {post.stillHappeningCount > 0 && <span className="action-btn-count">{post.stillHappeningCount}</span>}
            </button>
          )}
          {post.type === 'need_it_now' && !post.isFulfilled && (
            <button className="action-btn help-btn" onClick={handleICanHelp}>
              I can help
              {post.helperCount > 0 && <span className="action-btn-count">{post.helperCount}</span>}
            </button>
          )}
          <button className="action-btn" onClick={goToDetail}>
            {replyCount > 0 ? replyCount : 'Reply'}
          </button>
          <div className="action-spacer" />
          {canBoost && (
            <button
              className="action-icon-btn"
              onClick={handleBoostClick}
              title="Boost post"
              style={{ color: '#d97706', fontWeight: 700 }}
            >
              ⚡ Boost
            </button>
          )}
          <button className="action-icon-btn" onClick={handleShare} title="Share">Share</button>
          <button className={`action-icon-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave} title={isSaved ? 'Unsave' : 'Save'}>
            {isSaved ? 'Saved' : 'Save'}
          </button>
          {!isMyPost && (
            <button className="action-icon-btn" onClick={handleReport} title="Report">Report</button>
          )}
          {isMyPost && post.type === 'need_it_now' && !post.isFulfilled && (
            <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); actions.markFulfilled(post.id) }}>Done</button>
          )}
        </div>
      </div>

      {showBoost && (
        <PaymentModal
          title="⚡ Boost Post"
          description="Priority placement in the feed for more visibility."
          type="boost"
          metadata={{ post_id: post.id }}
          currentUser={state.currentUser || {}}
          options={BOOST_OPTIONS.map(o => ({
            id:          o.id,
            label:       o.label,
            price:       o.price,
            hours:       o.hours,
            description: `Top of feed for ${o.hours} hours`,
          }))}
          defaultOption={BOOST_OPTIONS[1]?.id}
          onSuccess={() => { actions.boostPost(post.id, BOOST_OPTIONS.find(o => o.id === 'boost_48')?.hours || 48) }}
          onClose={() => setShowBoost(false)}
        />
      )}

      {showReport && (
        <div className="overlay" onClick={() => setShowReport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Report this post</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'false_info', label: 'False or inaccurate information' },
                { id: 'spam', label: 'Spam or self-promotion' },
                { id: 'inappropriate', label: 'Inappropriate or offensive' },
                { id: 'wrong_category', label: 'Wrong category' },
                { id: 'other', label: 'Other reason' }
              ].map(r => (
                <button key={r.id} className="demo-user-btn" onClick={() => submitReport(r.id)} style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 14 }}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
