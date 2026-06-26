import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import CategoryBadge from '../components/CategoryBadge'
import { SHOP_CATEGORIES } from '../data/demoData'
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
  { id: 'still_happening', label: 'Still happening' },
  { id: 'i_can_help', label: 'I can help' },
  { id: 'i_know_someone', label: 'I know someone' }
]

async function sharePost(postId) {
  const url = `${window.location.origin}/post/${postId}`
  if (navigator.share) {
    try { await navigator.share({ title: 'LocalSetu', text: 'Check this out on LocalSetu', url }); return } catch {}
  }
  try { await navigator.clipboard.writeText(url); return 'copied' } catch { return 'error' }
}

export default function PostDetailScreen() {
  const { id } = useParams()
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [replyText, setReplyText] = useState('')
  const [showSafety, setShowSafety] = useState(false)
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [qShopName, setQShopName] = useState('')
  const [qShopCat, setQShopCat] = useState('')
  const [qPrice, setQPrice] = useState('')
  const [qDeliveryTime, setQDeliveryTime] = useState('')
  const [qDeliveryCharge, setQDeliveryCharge] = useState('0')
  const [qPickup, setQPickup] = useState(false)
  const [qDelivery, setQDelivery] = useState(true)
  const [qPayment, setQPayment] = useState('both')
  const [qMessage, setQMessage] = useState('')

  const post = helpers.getPost(id)
  const replies = helpers.getReplies(id)
  const author = post ? helpers.getUser(post.userId) : null
  const isLoggedIn = !!state.currentUser
  const isSaved = helpers.isPostSaved(id)
  const alreadyConfirmed = post?.confirmedBy?.includes(state.currentUser?.id)

  const quotes = post ? helpers.getQuotes(post.id) : []
  const selectedQuote = post ? helpers.getSelectedQuote(post.id) : null
  const isMyPost = state.currentUser?.id === post?.userId
  const isAdmin = state.currentUser?.role === 'admin'
  const isShopOwner = state.currentUser?.role === 'shop_owner'
  const canSubmitQuote = isLoggedIn && isShopOwner && post?.category === 'need_to_buy' && !post?.isBought && !quotes.find(q => q.shopOwnerId === state.currentUser?.id)

  const submitQuote = () => {
    if (!qShopName.trim() || !qPrice) return
    actions.submitQuote(post.id, {
      shopName:          qShopName.trim(),
      shopCategory:      qShopCat || null,
      price:             parseInt(qPrice),
      deliveryTime:      qDeliveryTime ? parseInt(qDeliveryTime) : null,
      deliveryCharge:    parseInt(qDeliveryCharge) || 0,
      pickupAvailable:   qPickup,
      deliveryAvailable: qDelivery,
      paymentMode:       qPayment,
      message:           qMessage.trim(),
      isAvailable:       'yes',
    })
    setShowQuoteForm(false)
    setQShopName(''); setQShopCat(''); setQPrice(''); setQDeliveryTime('')
    setQDeliveryCharge('0'); setQPickup(false); setQDelivery(true); setQPayment('both'); setQMessage('')
  }

  const goBack = () => { if (window.history.length > 1) navigate(-1); else navigate('/home') }

  const handleShare = async () => {
    const result = await sharePost(id)
    if (result === 'copied') { setShareFeedback('Link copied!'); setTimeout(() => setShareFeedback(''), 2000) }
  }

  const handleLoginRedirect = () => { sessionStorage.setItem('localsetu_redirect', `/post/${id}`); navigate('/login') }

  if (!post) {
    return (
      <div className="app-container">
        <div className="screen">
          <div className="header">
            <button onClick={goBack} style={{ color: 'var(--primary)', fontWeight: 700 }}>Back</button>
            <span /><span />
          </div>
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Post not found</div>
            <div className="empty-sub">This post may have been removed or expired.</div>
            {!isLoggedIn && (
              <button className="btn btn-primary" style={{ width: 'auto', marginTop: 12 }} onClick={handleLoginRedirect}>
                Login to LocalSetu
              </button>
            )}
          </div>
        </div>
        {isLoggedIn && <BottomNav />}
      </div>
    )
  }

  const submitReply = (quickType) => {
    if (!isLoggedIn) { handleLoginRedirect(); return }
    let content = replyText.trim()
    let replyType = 'custom'
    if (quickType === 'still_happening') {
      content = 'Still happening!'; replyType = 'still_happening'
      actions.confirmStillHappening(post.id)
    } else if (quickType === 'i_can_help') {
      content = 'I can help!'; replyType = 'i_can_help'
      !safetyAcknowledged ? setShowSafety(true) : actions.markICanHelp(post.id)
      setShowSafety(true)
    } else if (quickType === 'i_know_someone') {
      content = 'I know someone who can help!'; replyType = 'i_know_someone'
    }
    if (!content) return
    actions.addReply({ postId: post.id, userId: state.currentUser.id, content, replyType })
    setReplyText('')
  }

  return (
    <div className="app-container">
      <div className="screen" style={{ paddingBottom: isLoggedIn ? 'calc(var(--bottom-nav-height) + 80px)' : '24px' }}>
        <div className="header">
          <button onClick={goBack} style={{ color: 'var(--primary)', fontWeight: 700 }}>Back</button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            {post.type === 'right_now' ? 'Right Now' : 'Need It Now'}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {shareFeedback ? (
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>{shareFeedback}</span>
            ) : (
              <button className="action-icon-btn" onClick={handleShare} title="Share post" style={{ border: 'none', fontSize: 16 }}>
                Share
              </button>
            )}
            {isLoggedIn && (
              <button className="action-icon-btn" onClick={() => actions.savePost(post.id)} style={{ border: 'none' }} title={isSaved ? 'Unsave' : 'Save'}>
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {!isLoggedIn && (
          <div style={{ background: 'linear-gradient(90deg, var(--primary-light), #FFF8F5)', borderBottom: '1px solid var(--border-light)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>LocalSetu</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Real help and updates from people near you</div>
            </div>
            <button onClick={handleLoginRedirect} style={{ background: 'var(--primary)', color: 'white', borderRadius: 16, padding: '6px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              Join free
            </button>
          </div>
        )}

        <div style={{ padding: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div className="post-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>{getInitials(author?.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{author?.name || 'Local Resident'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 6, marginTop: 2 }}>
                  <span>{post.locality}</span><span>·</span><span>{timeAgo(post.createdAt)}</span>
                  {author?.isVerified && <span style={{ color: 'var(--primary)' }}>Verified</span>}
                </div>
              </div>
              <CategoryBadge category={post.category} />
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 14 }}>{post.content}</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeUntil(post.expiresAt)}</span>
              {post.type === 'right_now' && (
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{post.stillHappeningCount} confirmations</span>
              )}
              {post.type === 'need_it_now' && post.neededBy && (
                <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>
                  Needed by {new Date(post.neededBy).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </span>
              )}
              {post.distanceRange && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {post.distanceRange === 'walking' ? 'Walking distance' : `Within ${post.distanceRange}`}
                </span>
              )}
              {post.isFulfilled && <span className="tag-fulfilled">Fulfilled</span>}
            </div>

            {isLoggedIn ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {post.type === 'right_now' && (
                  <button className={`action-btn ${alreadyConfirmed ? 'active' : ''}`} onClick={() => !alreadyConfirmed && actions.confirmStillHappening(post.id)}>
                    {alreadyConfirmed ? 'Confirmed' : 'Still happening'}
                  </button>
                )}
                {post.type === 'need_it_now' && !post.isFulfilled && (
                  <button className="action-btn help-btn" onClick={() => submitReply('i_can_help')}>
                    I can help ({post.helperCount || 0})
                  </button>
                )}
                {isMyPost && post.type === 'need_it_now' && !post.isFulfilled && (
                  <button className="action-btn" onClick={() => actions.markFulfilled(post.id)}>Mark fulfilled</button>
                )}
                {!isMyPost && (
                  <button className="action-btn" style={{ marginLeft: 'auto', border: 'none', color: 'var(--text-muted)', fontSize: 13 }}
                    onClick={() => { if (window.confirm('Report this post?')) actions.reportPost(post.id, 'other') }}>
                    Report
                  </button>
                )}
              </div>
            ) : (
              <button onClick={handleLoginRedirect} style={{ width: '100%', background: 'var(--primary-light)', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: 13, color: 'var(--primary)', fontWeight: 700, textAlign: 'center' }}>
                Login to confirm, help, or reply
              </button>
            )}
          </div>
        </div>

        {(post.type === 'need_it_now' || showSafety) && post.category !== 'need_to_buy' && (
          <div style={{ padding: '0 16px 4px' }}>
            <div className="safety-box">
              <div className="safety-title">Safety First</div>
              <ul className="safety-list">
                <li>Meet in public places for all exchanges.</li>
                <li>Do not share your exact home address in replies.</li>
                <li>Do not send money before receiving items.</li>
                <li>Use caution when meeting strangers.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Need to Buy: Quotes Section ── */}
        {post.category === 'need_to_buy' && (
          <div style={{ padding: '0 16px 8px' }}>

            {/* Need to Buy detail strip */}
            <div style={{ background: '#fff8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
              <div style={{ fontWeight: 800, color: '#c2410c', marginBottom: 4 }}>🛒 Need to Buy</div>
              {post.needToBuyItem && <div style={{ color: 'var(--text-primary)' }}>Item: <strong>{post.needToBuyItem}</strong>{post.needToBuyQty ? ` · Qty: ${post.needToBuyQty}` : ''}</div>}
              <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                {post.deliveryPref === 'delivery' ? 'Delivery preferred' : post.deliveryPref === 'pickup' ? 'Pickup only' : 'Delivery or pickup'}
                {post.budget ? ` · Budget ≤ ₹${post.budget}` : ''}
              </div>
            </div>

            {/* Safety warning */}
            <div className="safety-box" style={{ marginBottom: 12 }}>
              <div className="safety-title">⚠️ Safety Reminder</div>
              <ul className="safety-list">
                <li>Verify items and shop identity before paying.</li>
                <li>Prefer UPI/cash only after confirming shop location.</li>
                <li>Do not share OTP, bank details, or exact home address.</li>
                <li>Pick up from the shop or meet in public where possible.</li>
              </ul>
            </div>

            {/* Quotes header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {quotes.length} Quote{quotes.length !== 1 ? 's' : ''}
              </div>
              {isLoggedIn && canSubmitQuote && !showQuoteForm && (
                <button
                  onClick={() => setShowQuoteForm(true)}
                  style={{ fontSize: 12, fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
                >
                  + Submit Quote
                </button>
              )}
            </div>

            {/* Submit Quote Form */}
            {showQuoteForm && isLoggedIn && (
              <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1.5px solid var(--primary)', padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: 'var(--primary)' }}>📦 Your Quote</div>
                <div className="form-group">
                  <label className="form-label">Your shop / business name *</label>
                  <input className="form-input" placeholder="e.g. Raju Electricals" value={qShopName} onChange={e => setQShopName(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Category</label>
                    <select className="form-select" value={qShopCat} onChange={e => setQShopCat(e.target.value)}>
                      <option value="">Select…</option>
                      {SHOP_CATEGORIES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Price (₹) *</label>
                    <input className="form-input" type="number" placeholder="180" value={qPrice} onChange={e => setQPrice(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Delivery in (mins)</label>
                    <input className="form-input" type="number" placeholder="30" value={qDeliveryTime} onChange={e => setQDeliveryTime(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Delivery charge (₹)</label>
                    <input className="form-input" type="number" placeholder="0 = free" value={qDeliveryCharge} onChange={e => setQDeliveryCharge(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={qDelivery} onChange={e => setQDelivery(e.target.checked)} /> Delivery available
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={qPickup} onChange={e => setQPickup(e.target.checked)} /> Pickup available
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment accepted</label>
                  <select className="form-select" value={qPayment} onChange={e => setQPayment(e.target.value)}>
                    <option value="both">UPI & Cash</option>
                    <option value="upi">UPI only</option>
                    <option value="cash">Cash only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message (optional)</label>
                  <input className="form-input" placeholder="Any note for the buyer?" value={qMessage} onChange={e => setQMessage(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitQuote} disabled={!qShopName.trim() || !qPrice}>
                    Submit Quote
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 0 }} onClick={() => setShowQuoteForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Quote cards */}
            {quotes.length === 0 && !showQuoteForm && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                {isLoggedIn ? 'No quotes yet. Know a shop nearby? Submit one!' : 'No quotes yet.'}
              </div>
            )}
            {quotes.map(q => {
              const isSelected = post.selectedQuoteId === q.id
              const shopCatMeta = SHOP_CATEGORIES.find(s => s.id === q.shopCategory)
              return (
                <div key={q.id} style={{
                  background: isSelected ? '#fefce8' : 'var(--card)',
                  border: isSelected ? '2px solid #f59e0b' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  marginBottom: 10,
                  boxShadow: 'var(--shadow)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{q.shopName}</div>
                      {shopCatMeta && <span style={{ fontSize: 11, color: '#0369a1', background: '#f0f9ff', borderRadius: 4, padding: '1px 6px' }}>{shopCatMeta.icon} {shopCatMeta.label}</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>₹{q.price}</div>
                      {isSelected && <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', background: '#fef3c7', borderRadius: 4, padding: '1px 6px' }}>Selected</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, flexWrap: 'wrap' }}>
                    {q.deliveryAvailable && q.deliveryTime && (
                      <span>🚚 Delivery in {q.deliveryTime} min{q.deliveryCharge > 0 ? ` (₹${q.deliveryCharge})` : ' (free)'}</span>
                    )}
                    {q.pickupAvailable && <span>🏪 Pickup available</span>}
                    <span>{q.paymentMode === 'upi' ? '📱 UPI' : q.paymentMode === 'cash' ? '💵 Cash' : '📱💵 UPI & Cash'}</span>
                  </div>
                  {q.message && <div style={{ fontSize: 13, color: 'var(--text-primary)', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', marginBottom: 8 }}>"{q.message}"</div>}

                  {/* Actions */}
                  {isLoggedIn && isMyPost && !post.isBought && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      {!isSelected && (
                        <button
                          onClick={() => actions.selectQuote(post.id, q.id)}
                          style={{ flex: 1, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✅ Select this Quote
                        </button>
                      )}
                      {isSelected && !post.isBought && (
                        <>
                          <a href={"tel:" + (q.phone || '')} style={{ flex: 1, textAlign: 'center', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                            📞 Call Shop
                          </a>
                          <a href={"https://wa.me/91" + (q.phone || '')} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                            💬 WhatsApp
                          </a>
                          <button
                            onClick={() => actions.markAsBought(post.id)}
                            style={{ flex: 0, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            ✓ Bought
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {(isAdmin) && (
                    <button
                      onClick={() => actions.adminRemoveQuote(q.id)}
                      style={{ fontSize: 11, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 4 }}
                    >
                      🗑️ Remove quote (admin)
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
            Replies ({replies.length})
          </div>
          {replies.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              {isLoggedIn ? 'No replies yet. Be the first to respond!' : 'Login to be the first to respond.'}
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
                      {reply.replyType === 'still_happening' ? 'Still Happening' :
                       reply.replyType === 'i_can_help' ? 'I Can Help' :
                       reply.replyType === 'i_know_someone' ? 'Knows Someone' : ''}
                    </div>
                  )}
                  <div className="reply-text">{reply.content}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isLoggedIn && (
        <>
          <div className="reply-quick-btns" style={{ position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 56px)', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--max-width)', background: 'var(--bg)', borderTop: '1px solid var(--border-light)', zIndex: 150 }}>
            {QUICK_REPLIES.map(qr => (
              <button key={qr.id} className="quick-reply-btn" onClick={() => submitReply(qr.id)}>{qr.label}</button>
            ))}
          </div>
          <div className="reply-input-area" style={{ position: 'fixed', bottom: 'var(--bottom-nav-height)', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 'var(--max-width)', zIndex: 150 }}>
            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="post-avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>{getInitials(state.currentUser?.name)}</div>
              <input className="form-input" style={{ flex: 1, padding: '8px 12px', fontSize: 14, borderRadius: 20 }} placeholder="Write a reply..."
                value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 200))}
                onKeyDown={e => e.key === 'Enter' && replyText.trim() && submitReply()} />
              <button style={{ background: replyText.trim() ? 'var(--primary)' : 'var(--border)', color: replyText.trim() ? 'white' : 'var(--text-muted)', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                onClick={() => submitReply()} disabled={!replyText.trim()}>
                Send
              </button>
            </div>
          </div>
          <BottomNav />
        </>
      )}
      {/* ── Safety Warning Modal ──────────────────────────── */}
      {showSafety && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={() => setShowSafety(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--card-bg, #fff)', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 32px', width: '100%', maxWidth: 480
          }}>
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}>🛡️ Stay Safe</div>
            <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>
              Before you respond to this request
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                ['📍', 'Meet in a public place', 'Lobby, society gate, or a common area — not inside a home'],
                ['🚫', 'Never share OTP or bank details', 'No helper or borrower ever needs your OTP or account number'],
                ['✅', 'Verify the person first', 'Check their LocalSetu profile and recommendations before handing anything over'],
                ['🏠', "Don't share your flat number", "Share your building name or area only — not your flat number"],
              ].map(([icon, title, sub]) => (
                <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--bg-alt, #f8f9fa)', borderRadius: 10, padding: '10px 12px' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setSafetyAcknowledged(true); setShowSafety(false); actions.markICanHelp(post.id) }}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: 'var(--primary)', color: '#fff', fontWeight: 700,
                fontSize: 15, cursor: 'pointer'
              }}
            >
              I understand — I can help ✓
            </button>
            <button onClick={() => setShowSafety(false)}
              style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
