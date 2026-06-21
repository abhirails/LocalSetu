import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CategoryBadge from '../components/CategoryBadge'
import BottomNav from '../components/BottomNav'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'Expires soon'
  if (hrs < 24) return `Expires in ${hrs}h`
  return `Expires in ${Math.floor(hrs / 24)}d`
}

const QUICK_REPLIES = [
  { id: 'still_happening', label: '🔄 Still happening' },
  { id: 'i_can_help', label: '🙋 I can help' },
  { id: 'i_know_someone', label: '👋 I know someone' }
]

export default function PostDetailScreen() {
  const { id } = useParams()
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [replyText, setReplyText] = useState('')
  const [showSafety, setShowSafety] = useState(false)

  const post = helpers.getPost(id)
  const replies = helpers.getReplies(id)
  const author = post ? helpers.getUser(post.userId) : null
  const isSaved = helpers.isPostSaved(id)
  const alreadyConfirmed = post?.confirmedBy?.includes(state.currentUser?.id)
  const isMyPost = state.currentUser?.id === post?.userId

  if (!post) {
    return (
      <div className="app-container">
        <div className="screen">
          <div className="header">
            <button onClick={() => navigate(-1)} style={{ color: 'var(--primary)', fontWeight: 700 }}>← Back</button>
            <span />
            <span />
          </div>
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Post not found</div>
            <div className="empty-sub">This post may have been removed or expired.</div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const submitReply = (quickType) => {
    let content = replyText.trim()
    let replyType = 'custom'

    if (quickType === 'still_happening') {
      content = 'Still happening!'
      replyType = 'still_happening'
      actions.confirmStillHappening(post.id)
    } else if (quickType === 'i_can_help') {
      content = 'I can help! 🙋'
      replyType = 'i_can_help'
      actions.markICanHelp(post.id)
      setShowSafety(true)
    } else if (quickType === 'i_know_someone') {
      content = 'I know someone who can help!'
      replyType = 'i_know_someone'
    }

    if (!content) return

    actions.addReply({
      postId: post.id,
      userId: state.currentUser.id,
      content,
      replyType
    })
    setReplyText('')
  }

  return (
    <div className="app-container">
      <div className="screen" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 80px)' }}>
        {/* Header */}
        <div className="header">
          <button onClick={() => navigate(-1)} style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            {post.type === 'right_now' ? '⚡ Right Now' : '🙋 Need It Now'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="action-icon-btn"
              onClick={() => actions.savePost(post.id)}
              style={{ border: 'none' }}
              title={isSaved ? 'Unsave' : 'Save'}
            >
              {isSaved ? '🔖' : '📌'}
            </button>
          </div>
        </div>

        {/* Post Detail */}
        <div style={{ padding: 16 }}>
          <div className="card">
            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div className="post-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                {getInitials(author?.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{author?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 6, marginTop: 2 }}>
                  <span>📍 {post.locality}</span>
                  <span>·</span>
                  <span>{timeAgo(post.createdAt)}</span>
                  {author?.isVerified && <span style={{ color: 'var(--primary)' }}>✅ Verified</span>}
                </div>
              </div>
              <CategoryBadge category={post.category} />
            </div>

            {/* Content */}
            <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 14 }}>{post.content}</p>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                ⏱ {timeUntil(post.expiresAt)}
              </span>
              {post.type === 'right_now' && (
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                  🔄 {post.stillHappeningCount} confirmations
                </span>
              )}
              {post.type === 'need_it_now' && post.neededBy && (
                <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>
                  🕐 Needed by {new Date(post.neededBy).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </span>
              )}
              {post.distanceRange && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  📏 {post.distanceRange === 'walking' ? 'Walking distance' : `Within ${post.distanceRange}`}
                </span>
              )}
              {post.isFulfilled && <span className="tag-fulfilled">✅ Fulfilled</span>}
            </div>

            {/* Post actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {post.type === 'right_now' && (
                <button
                  className={`action-btn ${alreadyConfirmed ? 'active' : ''}`}
                  onClick={() => !alreadyConfirmed && actions.confirmStillHappening(post.id)}
                >
                  🔄 {alreadyConfirmed ? 'Confirmed' : 'Still happening'}
                </button>
              )}
              {post.type === 'need_it_now' && !post.isFulfilled && (
                <button className="action-btn help-btn" onClick={() => submitReply('i_can_help')}>
                  🙋 I can help ({post.helperCount || 0})
                </button>
              )}
              {isMyPost && post.type === 'need_it_now' && !post.isFulfilled && (
                <button className="action-btn" onClick={() => actions.markFulfilled(post.id)}>
                  ✅ Mark fulfilled
                </button>
              )}
              {!isMyPost && (
                <button
                  className="action-btn"
                  style={{ marginLeft: 'auto', border: 'none', color: 'var(--text-muted)', fontSize: 13 }}
                  onClick={() => {
                    if (window.confirm('Report this post?')) actions.reportPost(post.id, 'other')
                  }}
                >
                  🚩 Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Safety warning for Need It Now */}
        {(post.type === 'need_it_now' || showSafety) && (
          <div style={{ padding: '0 16px 4px' }}>
            <div className="safety-box">
              <div className="safety-title">⚠️ Safety First</div>
              <ul className="safety-list">
                <li>Meet in public places for all exchanges.</li>
                <li>Do not share your exact home address in replies.</li>
                <li>Do not send money before receiving items.</li>
                <li>Use caution when meeting strangers.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Replies */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
            Replies ({replies.length})
          </div>

          {replies.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No replies yet. Be the first to respond!
            </div>
          )}

          {replies.map(reply => {
            const replyAuthor = helpers.getUser(reply.userId)
            return (
              <div key={reply.id} className="reply-card">
                <div className="reply-avatar">{getInitials(replyAuthor?.name)}</div>
                <div className="reply-content">
                  <div className="reply-meta">
                    <span className="reply-name">{replyAuthor?.name || 'Resident'}</span>
                    <span className="reply-time">{timeAgo(reply.createdAt)}</span>
                  </div>
                  {reply.replyType !== 'custom' && (
                    <div className="reply-type-badge">
                      {reply.replyType === 'still_happening' ? '🔄 Still Happening' :
                       reply.replyType === 'i_can_help' ? '🙋 I Can Help' :
                       reply.replyType === 'i_know_someone' ? '👋 Knows Someone' : ''}
                    </div>
                  )}
                  <div className="reply-text">{reply.content}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Reply Buttons */}
      <div className="reply-quick-btns" style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 56px)', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--max-width)', background: 'var(--bg)', borderTop: '1px solid var(--border-light)', zIndex: 150 }}>
        {QUICK_REPLIES.map(qr => (
          <button
            key={qr.id}
            className="quick-reply-btn"
            onClick={() => submitReply(qr.id)}
          >
            {qr.label}
          </button>
        ))}
      </div>

      {/* Reply Input */}
      <div className="reply-input-area" style={{ position: 'fixed', bottom: 'var(--bottom-nav-height)', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--max-width)', zIndex: 150 }}>
        <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="post-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
            {getInitials(state.currentUser?.name)}
          </div>
          <input
            className="form-input"
            style={{ flex: 1, padding: '8px 12px', fontSize: 14, borderRadius: 20 }}
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value.slice(0, 200))}
            onKeyDown={e => e.key === 'Enter' && replyText.trim() && submitReply()}
          />
          <button
            style={{
              background: replyText.trim() ? 'var(--primary)' : 'var(--border)',
              color: replyText.trim() ? 'white' : 'var(--text-muted)',
              borderRadius: 20,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0
            }}
            onClick={() => submitReply()}
            disabled={!replyText.trim()}
          >
            Send
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
