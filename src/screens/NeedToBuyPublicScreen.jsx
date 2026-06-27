/**
 * NeedToBuyPublicScreen
 * ---------------------
 * Public (no login required) landing page for:
 *   /need-to-buy
 *   /:localitySlug/need-to-buy
 *
 * Guest flow:
 *   Browse categories → type what you need → OTP verify → request submitted
 *
 * Deep-link examples:
 *   https://app.localsetu.in/need-to-buy
 *   https://app.localsetu.in/need-to-buy?category=electrical&source=website
 *   https://app.localsetu.in/kharghar/need-to-buy
 */

import React, { useState, useRef, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { cx, ui } from '../lib/ui'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getProfile, upsertProfile } from '../lib/db'
import { findLocalityBySlug } from '../data/locationData'

const RESERVED_SLUGS = new Set([
  'login', 'home', 'help', 'create', 'profile', 'admin', 'post', 'provider',
  'societies', 'society', 'businesses', 'business', 'register-business',
  'register-society', 'maintenance', 'right-now', 'need-to-buy',
])

const NEEDED_BY_OPTIONS = [
  { id: '1h', label: 'Within 1 hour', hours: 1 },
  { id: '3h', label: 'Within 3 hours', hours: 3 },
  { id: 'today', label: 'Today', hours: 8 },
  { id: 'tomorrow', label: 'Tomorrow', hours: 24 },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',         icon: '🛒', label: 'All' },
  { id: 'electrical',  icon: '⚡', label: 'Electrical' },
  { id: 'hardware',    icon: '🔧', label: 'Hardware / Plumbing' },
  { id: 'stationery',  icon: '📄', label: 'Stationery / Print' },
  { id: 'mobile',      icon: '📱', label: 'Mobile Accessories' },
  { id: 'grocery',     icon: '🛍️', label: 'Grocery / General' },
  { id: 'medicine',    icon: '💊', label: 'Medicine / Pharmacy' },
  { id: 'other',       icon: '📦', label: 'Other' },
]

const DELIVERY_OPTIONS = [
  { id: 'delivery', label: 'Delivery preferred' },
  { id: 'pickup',   label: 'I can pickup' },
  { id: 'either',   label: 'Either works' },
]

const DEMO_REQUESTS = [
  {
    id: 'req_demo_1',
    item: 'Modular 16A sockets + plug',
    qty: '3 pieces',
    category: 'electrical',
    locality: 'Kharghar Sector 20',
    neededBy: '1 hour',
    delivery: 'delivery',
    budget: 250,
    quotes: 2,
    ago: '25 min ago',
  },
  {
    id: 'req_demo_2',
    item: 'A4 paper (500 sheets) + 5 blue pens',
    qty: '1 ream + 5 pens',
    category: 'stationery',
    locality: 'Kharghar Sector 12',
    neededBy: '3 hours',
    delivery: 'either',
    budget: 350,
    quotes: 1,
    ago: '1 hr ago',
  },
  {
    id: 'req_demo_3',
    item: 'Half-inch brass elbow joint',
    qty: '2 pieces',
    category: 'hardware',
    locality: 'Kamothe Sector 4',
    neededBy: '5 hours',
    delivery: 'pickup',
    budget: null,
    quotes: 0,
    ago: '2 hr ago',
  },
]

// ─── Smart paste parser ───────────────────────────────────────────────────────
// No AI needed — shopping lists always use predictable delimiters.

// Patterns that indicate a chip is a list title / app attribution, not an item
const LIST_HEADER_RE = /shopping list|grocery list|items? needed|buy list|made with|powered by|via |shared (from|via)|recipe|— upma|— dal|— sabzi/i
const SHORT_ATTRIBUTION_RE = /^(made with|powered by|via |shared (from|via)|\w+setu|\w+app)/i

function isNoise(s) {
  if (!s || s.length < 2) return true
  if (s.length > 80) return true               // suspiciously long — probably header blob
  if (LIST_HEADER_RE.test(s)) return true
  if (SHORT_ATTRIBUTION_RE.test(s)) return true
  return false
}

function parsePastedList(rawText) {
  // 1. Strip everything up to (and including) first list-header keyword
  let text = rawText
    .replace(/^.*?(shopping list|grocery list|items? needed|items? required|buy list|recipe)[:\s—–\-]*/i, '')
    .replace(/^[\p{Emoji}\s•·\-]*/u, '')
    .trim()

  // If stripping changed nothing meaningful, use the full raw text
  if (!text || text.length < 3) text = rawText.trim()

  // 2. Try splitting strategies in priority order
  const strategies = [
    () => text.split(/[•·|]/).map(s => s.trim()),          // bullets / pipes
    () => text.split(/[\n\r]+/).map(s => s.trim()),         // newlines
    () => text.split(/\d+[.)]\s+/).map(s => s.trim()),      // numbered list
    () => text.split(/[;,]/).map(s => s.trim()),            // commas / semicolons
  ]

  for (const strategy of strategies) {
    const raw = strategy()
    if (raw.length < 2) continue

    const items = raw
      .map(s => s.replace(/^[-–•·*\d.)\s]+/, '').trim())   // strip leading bullets
      .filter(s => !isNoise(s))
      .filter(s => s.length > 0 && s.length < 80)
      .slice(0, 20)

    if (items.length >= 2) return items
  }
  return [] // single item — let normal input handle it
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function neededByFromOption(optionId) {
  const opt = NEEDED_BY_OPTIONS.find(o => o.id === optionId)
  const hours = opt?.hours ?? 3
  return new Date(Date.now() + hours * 3600000).toISOString()
}

function formatNeededByLabel(isoOrText) {
  if (!isoOrText) return 'Soon'
  const d = new Date(isoOrText)
  if (Number.isNaN(d.getTime())) return isoOrText
  const diff = d.getTime() - Date.now()
  if (diff <= 0) return 'ASAP'
  const hrs = Math.ceil(diff / 3600000)
  if (hrs < 24) return `${hrs}h`
  return d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
}

function buildPostContent({ item, qty, notes, source }) {
  const parts = [item.trim()]
  if (qty?.trim()) parts.push(qty.trim())
  if (notes?.trim()) parts.push(notes.trim())
  if (source) parts.push(`[via ${source}]`)
  return parts.join(' · ').slice(0, 280)
}

/** @deprecated demo-only fallback */
function formatLocality(slug) {
  return findLocalityBySlug(slug)?.label || slug
    ?.split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── OTP Modal ───────────────────────────────────────────────────────────────

function OtpModal({ onVerified, onClose, formData, locality }) {
  const { actions } = useApp()
  const [phone, setPhone]       = useState('')
  const [otp, setOtp]           = useState('')
  const [name, setName]         = useState('')
  const [step, setStep]         = useState('phone') // phone | otp | name | done
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const otpRef = useRef(null)

  const handleSendOtp = async () => {
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return }
    setLoading(true); setError('')
    try {
      if (isSupabaseConfigured) {
        const { error: e } = await supabase.auth.signInWithOtp({
          phone: `+91${phone}`,
          options: { shouldCreateUser: true },
        })
        if (e) throw e
      }
      setStep('otp')
      setTimeout(() => otpRef.current?.focus(), 100)
    } catch (e) {
      setError(e.message || 'Could not send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setError('Enter the OTP you received.'); return }
    setLoading(true); setError('')
    try {
      if (isSupabaseConfigured) {
        const { data, error: e } = await supabase.auth.verifyOtp({
          phone: `+91${phone}`,
          token: otp,
          type: 'sms',
        })
        if (e) throw e
        let profile = null
        try { profile = await getProfile(data.user.id) } catch {}
        if (!profile?.name || profile.name === 'Local Resident') {
          setStep('name')
          return
        }
        actions.login(profile)
        onVerified({ phone, name: profile.name })
        return
      }
      // Demo mode without Supabase
      onVerified({ phone, name: name || 'Local Resident' })
    } catch (e) {
      setError(e.message || 'Incorrect OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setLoading(true); setError('')
    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          const profile = await upsertProfile({
            id: data.user.id,
            name: name.trim(),
            phone: `+91${phone}`,
            locality: locality || 'Kharghar, Navi Mumbai',
            role: 'resident',
          })
          actions.login(profile)
        }
      }
      onVerified({ phone, name: name.trim() })
    } catch (e) {
      setError(e.message || 'Could not save. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Demo mode: skip OTP
  const handleDemoSkip = () => {
    onVerified({ phone: '9999999999', name: 'Demo User' })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 32px', width: '100%', maxWidth: 'var(--max-width)',
        boxShadow: '0 -8px 40px rgba(25,20,10,0.12)',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />

        {step === 'phone' && <>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Verify your number</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            We'll send an OTP to confirm your request. No spam — only shop responses.
          </p>
          <div style={{ marginBottom: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--card)', overflow: 'hidden',
            }}>
              <span style={{ padding: '0 0 0 14px', fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>+91</span>
              <input
                className={ui.formInput}
                style={{ border: 'none', borderLeft: '1.5px solid var(--border)', borderRadius: 0, flex: 1 }}
                type="tel" inputMode="numeric" maxLength={10}
                placeholder="Mobile number"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              />
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{error}</p>}
          <button
            className={cx(ui.btn, ui.btnPrimary)}
            disabled={phone.length !== 10 || loading}
            onClick={handleSendOtp}
          >
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
          {!isSupabaseConfigured && (
            <button
              style={{ marginTop: 10, width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
              onClick={handleDemoSkip}
            >
              Skip (demo mode)
            </button>
          )}
        </>}

        {step === 'otp' && <>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Enter OTP</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            Sent to +91 {phone}. <span
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            >Change</span>
          </p>
          <input
            ref={otpRef}
            className={ui.formInput}
            style={{ marginBottom: 12, letterSpacing: 6, fontSize: 22, textAlign: 'center' }}
            type="tel" inputMode="numeric" maxLength={6}
            placeholder="— — — — — —"
            value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{error}</p>}
          <button
            className={cx(ui.btn, ui.btnPrimary)}
            disabled={otp.length < 4 || loading}
            onClick={handleVerifyOtp}
          >
            {loading ? 'Verifying…' : 'Verify & Submit Request'}
          </button>
        </>}

        {step === 'name' && <>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>One last thing</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            What should shops call you?
          </p>
          <input
            className={ui.formInput}
            style={{ marginBottom: 12 }}
            placeholder="Your name"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSaveName()}
            autoFocus
          />
          {error && <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{error}</p>}
          <button
            className={cx(ui.btn, ui.btnPrimary)}
            disabled={!name.trim() || loading}
            onClick={handleSaveName}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </>}
      </div>
    </div>
  )
}

// ─── Request Card (demo listings) ─────────────────────────────────────────────

function RequestCard({ req, onOpen }) {
  const cat = CATEGORIES.find(c => c.id === req.category) || CATEGORIES[CATEGORIES.length - 1]

  return (
    <button
      type="button"
      className={ui.card}
      style={{ marginBottom: 0, width: '100%', textAlign: 'left', cursor: onOpen ? 'pointer' : 'default' }}
      onClick={() => onOpen?.(req.id)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <span style={{
          fontSize: 20, lineHeight: 1,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--primary-light)', borderRadius: 10, flexShrink: 0,
        }}>{cat.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{req.item}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {req.qty} · {req.locality} · {req.ago}
          </div>
        </div>
        {req.quotes > 0 && (
          <span style={{
            background: 'var(--success-light)', color: 'var(--success)',
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            flexShrink: 0,
          }}>
            {req.quotes} quote{req.quotes !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px', color: 'var(--text-secondary)' }}>
          ⏱ Need in {req.neededBy}
        </span>
        <span style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px', color: 'var(--text-secondary)' }}>
          {req.delivery === 'delivery' ? '🛵 Delivery' : req.delivery === 'pickup' ? '🚶 Pickup' : '📦 Either'}
        </span>
        {req.budget && (
          <span style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px', color: 'var(--text-secondary)' }}>
            ₹{req.budget} budget
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NeedToBuyPublicScreen() {
  const { localitySlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { state, actions } = useApp()

  if (localitySlug && RESERVED_SLUGS.has(localitySlug)) {
    return <Navigate to="/need-to-buy" replace />
  }

  const localityMeta = findLocalityBySlug(localitySlug)
  const localityLabel = localityMeta?.label || (localitySlug ? formatLocality(localitySlug) : null)
  const localityName = localityMeta?.locality || localityLabel
  const initialCategory = searchParams.get('category') || 'all'
  const source = searchParams.get('source') || 'direct'

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [showForm, setShowForm] = useState(Boolean(searchParams.get('item')))
  const [showOtp, setShowOtp] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [createdPostId, setCreatedPostId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [item, setItem] = useState(searchParams.get('item') || '')
  const [itemChips, setItemChips] = useState([])    // populated when user pastes a list
  const [chipQtys, setChipQtys] = useState({})      // { [chipIndex]: qtyString }
  const [qtyPopup, setQtyPopup] = useState(null)           // { idx, chip, draft } | null
  const [qty, setQty] = useState('')
  const [neededByOption, setNeededByOption] = useState('3h')
  const [delivery, setDelivery] = useState('delivery')
  const [budget, setBudget] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  const isLoggedIn = !!state.currentUser

  const liveRequests = useMemo(() => {
    const quoteCount = (postId) =>
      (state.quotes || []).filter(q => q.postId === postId && q.status !== 'withdrawn').length

    return (state.posts || [])
      .filter(p =>
        p.category === 'need_to_buy' &&
        p.status === 'active' &&
        (!localityName || (p.locality || '').toLowerCase().includes(localityName.toLowerCase()))
      )
      .slice(0, 20)
      .map(p => ({
        id: p.id,
        item: p.needToBuyItem || p.content,
        qty: p.needToBuyQty || '',
        category: 'other',
        locality: p.locality,
        neededBy: formatNeededByLabel(p.neededBy),
        delivery: p.deliveryPref || 'either',
        budget: p.budget,
        quotes: quoteCount(p.id),
        ago: timeAgo(p.createdAt),
      }))
  }, [state.posts, state.quotes, localityName])

  const listingSource = liveRequests.length ? liveRequests : DEMO_REQUESTS
  const filteredRequests = activeCategory === 'all'
    ? listingSource
    : listingSource.filter(r => r.category === activeCategory)

  const handleSubmitForm = () => {
    const effectiveItem = itemChips.length > 0
      ? itemChips.join(' • ')
      : item.trim()
    if (!effectiveItem) { setFormError('Please describe what you need.'); return }
    setFormError('')
    if (isLoggedIn) {
      doSubmit()
    } else {
      setShowOtp(true)
    }
  }

  const doSubmit = async () => {
    setSubmitting(true)
    setFormError('')

    let userId = state.currentUser?.id
    let userLocality = state.currentUser?.locality

    if (!userId && isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
          const profile = await getProfile(user.id).catch(() => null)
          if (profile) {
            actions.login(profile)
            userLocality = profile.locality
          }
        }
      } catch {}
    }

    if (!userId) {
      setFormError('Please verify your mobile number first.')
      setSubmitting(false)
      return
    }

    try {
      const effectiveItem = itemChips.length > 0
        ? itemChips.map((chip, i) => chipQtys[i] ? `${chip} (${chipQtys[i]})` : chip).join(' • ')
        : item.trim()
      const created = await actions.addPost({
        type: 'need_it_now',
        userId,
        category: 'need_to_buy',
        locality: localityLabel || userLocality || 'Kharghar, Navi Mumbai',
        content: buildPostContent({
          item: effectiveItem, qty, notes,
          source: source !== 'direct' ? source : null,
        }),
        needToBuyItem: effectiveItem,
        itemCount: itemChips.length > 1 ? itemChips.length : null,
        needToBuyQty: qty.trim() || null,
        deliveryPref: delivery,
        budget: budget ? Number(budget) : null,
        neededBy: neededByFromOption(neededByOption),
        distanceRange: '2km',
        helperCount: 0,
        isFulfilled: false,
        selectedQuoteId: null,
        isBought: false,
        expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
      })
      setCreatedPostId(created?.id || null)
      setShowOtp(false)
      setSubmitted(true)
    } catch {
      setFormError('Could not submit your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Confirmation screen ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className={ui.appContainer} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Request Sent!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
          Nearby shops in {localityLabel || 'your area'} will see your request and reply with price and delivery time.
        </p>
        <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#92400E', marginBottom: 24, maxWidth: 320, textAlign: 'left' }}>
          ⚠️ Verify shop identity before paying. Do not share OTP or bank details. Prefer payment after receiving item.
        </div>
        {isLoggedIn ? (
          <>
            {createdPostId && (
              <button
                className={cx(ui.btn, ui.btnPrimary)}
                onClick={() => navigate(`/post/${createdPostId}`)}
              >
                View your request
              </button>
            )}
            <button
              className={cx(ui.btn, createdPostId ? ui.btnSecondary : ui.btnPrimary)}
              style={{ marginTop: createdPostId ? 10 : 0 }}
              onClick={() => navigate('/home')}
            >
              Go to LocalSetu
            </button>
          </>
        ) : (
          <button className={cx(ui.btn, ui.btnPrimary)} onClick={() => navigate('/login')}>
            Login to track shop quotes
          </button>
        )}
        <button
          style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', color: 'var(--primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          onClick={() => {
            setSubmitted(false)
            setShowForm(false)
            setCreatedPostId(null)
            setItem('')
            setItemChips([])
            setChipQtys({})
            setQty('')
            setBudget('')
            setNotes('')
          }}
        >
          Post another request
        </button>
      </div>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────
  return (
    <div className={ui.appContainer} style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <header className={ui.header}>
        <div>
          <span className={ui.headerLogo}>LocalSetu</span>
          {localityLabel && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 1 }}>
              📍 {localityLabel}
            </span>
          )}
        </div>
        {isLoggedIn ? (
          <button
            className={ui.iconBtn}
            onClick={() => navigate('/home')}
            title="Go to app"
          >🏠</button>
        ) : (
          <Link
            to="/login"
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}
          >
            Login
          </Link>
        )}
      </header>

      <div className={ui.screen} style={{ paddingBottom: 100 }}>
        {/* Hero */}
        {!showForm && (
          <div style={{
            padding: '20px 16px 16px',
            background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--card) 100%)',
            borderBottom: '1px solid var(--border-light)',
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px', lineHeight: 1.2 }}>
              Need to Buy from Nearby Shops?
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.55 }}>
              Tell nearby stores what you need. Get price and delivery-time options.
              {localityLabel ? ` Available in ${localityLabel}.` : ''}
            </p>
            <button
              className={cx(ui.btn, ui.btnPrimary)}
              onClick={() => setShowForm(true)}
              style={{ fontSize: 15 }}
            >
              🛒 Post Your Need
            </button>
          </div>
        )}

        {/* Post form */}
        {showForm && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)', padding: 0 }}
                onClick={() => setShowForm(false)}
              >←</button>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>What do you need?</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Item / Requirement *
                  {itemChips.length > 1 && (
                    <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'var(--success-light)', padding: '2px 7px', borderRadius: 20 }}>
                      {itemChips.length} items
                    </span>
                  )}
                </label>

                {/* Chip mode: shown after multi-item paste */}
                {itemChips.length > 0 ? (
                  <div style={{
                    border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--card)', padding: '10px 12px',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    {itemChips.map((chip, i) => (
                      <div key={i}
                        onClick={() => setQtyPopup({ idx: i, chip, draft: chipQtys[i] || '' })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                          background: chipQtys[i] ? 'var(--primary-light)' : 'var(--bg)',
                          border: `1.5px solid ${chipQtys[i] ? 'var(--primary)' : 'var(--border-light)'}`,
                          marginBottom: 2,
                        }}
                      >
                        <span style={{
                          flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: chipQtys[i] ? 'var(--primary)' : 'var(--text-primary)',
                        }}>{chip}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                          color: chipQtys[i] ? 'var(--primary)' : 'var(--text-muted)',
                        }}>
                          {chipQtys[i] ? `× ${chipQtys[i]}` : '+ qty'}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            const next = itemChips.filter((_, j) => j !== i)
                            const nextQtys = Object.fromEntries(
                              Object.entries(chipQtys)
                                .filter(([k]) => Number(k) !== i)
                                .map(([k, v]) => [Number(k) > i ? Number(k) - 1 : k, v])
                            )
                            setChipQtys(nextQtys)
                            if (next.length === 0) { setItemChips([]); setItem('') }
                            else setItemChips(next)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                        >×</button>
                      </div>
                    ))}

                    <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 4, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tap an item to set quantity</span>
                      <button
                        type="button"
                        onClick={() => { setItemChips([]); setChipQtys({}); setItem('') }}
                        style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >Clear list</button>
                    </div>
                  </div>
                ) : (
                  <input
                    className={ui.formInput}
                    placeholder="Type item, or paste a shopping list…"
                    value={item}
                    onChange={e => { setItem(e.target.value); setFormError('') }}
                    onPaste={e => {
                      const pasted = e.clipboardData.getData('text')
                      const chips = parsePastedList(pasted)
                      if (chips.length >= 2) {
                        e.preventDefault()
                        setItemChips(chips)
                        setItem('')
                        setFormError('')
                      }
                      // else: let normal paste happen
                    }}
                    autoFocus
                  />
                )}

                {/* Paste hint */}
                {itemChips.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    💡 Paste a shopping list — items will be detected automatically
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: itemChips.length > 0 ? '1fr' : '1fr 1fr', gap: 10 }}>
                {/* Single quantity — only shown when NOT in chip mode */}
                {itemChips.length === 0 && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Quantity</label>
                    <input
                      className={ui.formInput}
                      placeholder="e.g. 2 pieces"
                      value={qty}
                      onChange={e => setQty(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Budget (₹)</label>
                  <input
                    className={ui.formInput}
                    placeholder="Optional"
                    type="number"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Needed by
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {NEEDED_BY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNeededByOption(opt.id)}
                      style={{
                        padding: '8px 12px', fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${neededByOption === opt.id ? 'var(--primary)' : 'var(--border)'}`,
                        background: neededByOption === opt.id ? 'var(--primary-light)' : 'var(--card)',
                        color: neededByOption === opt.id ? 'var(--primary)' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Delivery preference</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {DELIVERY_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setDelivery(opt.id)}
                      style={{
                        flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600,
                        border: `1.5px solid ${delivery === opt.id ? 'var(--primary)' : 'var(--border)'}`,
                        background: delivery === opt.id ? 'var(--primary-light)' : 'var(--card)',
                        color: delivery === opt.id ? 'var(--primary)' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer', lineHeight: 1.3,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
                <textarea
                  className={ui.formInput}
                  style={{ resize: 'none', height: 70 }}
                  placeholder="Brand preference, colour, model, any specific requirement…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Safety notice */}
              <div style={{
                background: 'var(--warning-light)', border: '1px solid var(--warning)',
                borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#92400E', lineHeight: 1.5,
              }}>
                ⚠️ Verify shop identity before paying. Do not share OTP, bank details, or exact home address. Meet at shop when possible.
              </div>

              {formError && (
                <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{formError}</p>
              )}

              <button
                className={cx(ui.btn, ui.btnPrimary, submitting && 'cursor-not-allowed opacity-70')}
                onClick={handleSubmitForm}
                disabled={submitting}
                style={{ fontSize: 15 }}
              >
                {submitting ? 'Submitting…' : isLoggedIn ? 'Submit Request' : 'Continue with Mobile Number'}
              </button>
            </div>
          </div>
        )}

        {/* Category filter (only when not in form) */}
        {!showForm && (
          <>
            <div className={ui.tabBar} style={{ padding: '8px 12px', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cx(
                    ui.tabBtn,
                    activeCategory === cat.id && ui.tabBtnActive
                  )}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Recent requests */}
            <div style={{ padding: '12px 14px 4px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                Recent nearby requests
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 14 }}>
                    No recent requests in this category.<br />Be the first to post!
                  </div>
                ) : (
                  filteredRequests.map(req => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      onOpen={id => id && !id.startsWith('req_demo') && navigate(`/post/${id}`)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* How it works */}
            <div style={{ margin: '20px 14px 0', padding: '16px', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>How it works</div>
              {[
                ['🛒', 'Post what you need — item, quantity, time, budget'],
                ['🏪', 'Nearby shops respond with price and delivery/pickup time'],
                ['✅', 'Choose the best quote and contact the shop'],
                ['📦', 'Confirm once received'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.3 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Are you a shop? */}
            <div style={{ margin: '16px 14px 0', padding: '14px 16px', background: 'var(--primary-light)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Are you a local shop?</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                Register to receive nearby purchase requests and send quotes directly to customers.
              </div>
              <Link
                to="/login"
                onClick={() => sessionStorage.setItem('localsetu_redirect', '/register-business')}
                style={{
                  display: 'inline-block', fontSize: 13, fontWeight: 700,
                  color: 'var(--primary)', textDecoration: 'none',
                  border: '1.5px solid var(--primary)', borderRadius: 20, padding: '5px 14px',
                }}
              >
                Register your shop →
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Sticky CTA (only on browse, not form) */}
      {!showForm && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 'var(--max-width)',
          padding: '12px 16px 20px',
          background: 'white', borderTop: '1px solid var(--border-light)',
          boxShadow: '0 -4px 20px rgba(25,20,10,0.06)',
          zIndex: 100,
        }}>
          <button
            className={cx(ui.btn, ui.btnPrimary)}
            onClick={() => setShowForm(true)}
            style={{ fontSize: 15 }}
          >
            🛒 Post Your Need
          </button>
        </div>
      )}

      {/* OTP Modal */}
      {showOtp && (
        <OtpModal
          onVerified={() => doSubmit()}
          onClose={() => setShowOtp(false)}
          formData={{ item, qty, neededByOption, delivery, budget, notes }}
          locality={localityLabel || state.currentUser?.locality}
        />
      )}

      {/* Quantity Popup */}
      {qtyPopup && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setQtyPopup(null)}
        >
          <div
            style={{
              background: 'var(--card)', borderRadius: 16, padding: '20px',
              width: '100%', maxWidth: 340,
              boxShadow: '0 8px 40px rgba(25,20,10,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Item</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>{qtyPopup.chip}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Quantity</div>
            <input
              autoFocus
              className={ui.formInput}
              placeholder="e.g. 2, 500g, 1 packet, small piece"
              value={qtyPopup.draft}
              onChange={e => setQtyPopup(prev => ({ ...prev, draft: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') { setChipQtys(prev => ({ ...prev, [qtyPopup.idx]: qtyPopup.draft.trim() })); setQtyPopup(null) }
                if (e.key === 'Escape') setQtyPopup(null)
              }}
              style={{ marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setQtyPopup(null)}
                style={{
                  flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                type="button"
                className={cx(ui.btn, ui.btnPrimary)}
                style={{ flex: 2, padding: '10px' }}
                onClick={() => { setChipQtys(prev => ({ ...prev, [qtyPopup.idx]: qtyPopup.draft.trim() })); setQtyPopup(null) }}
              >Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
