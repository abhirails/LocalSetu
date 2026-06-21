import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { CATEGORY_META, SERVICE_TYPES, LOCALITIES } from '../data/demoData'

const RIGHT_NOW_CATEGORIES = [
  { id: 'traffic', label: 'Traffic', icon: '🚗' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'police', label: 'Police Checking', icon: '🚔' },
  { id: 'water', label: 'Water Issue', icon: '💧' },
  { id: 'power', label: 'Power Cut', icon: '⚡' },
  { id: 'weather', label: 'Weather', icon: '🌧️' },
  { id: 'safety', label: 'Safety Alert', icon: '🚨' },
  { id: 'civic', label: 'Civic Issue', icon: '🏗️' }
]

const NEED_CATEGORIES = [
  { id: 'borrow', label: 'Borrow / Lend Item', icon: '🤝' },
  { id: 'rideshare', label: 'Ride Share', icon: '🚕' },
  { id: 'urgent', label: 'Urgent Help', icon: '🆘' },
  { id: 'ticket', label: 'Spare Ticket', icon: '🎟️' },
  { id: 'errand', label: 'Local Errand', icon: '📦' }
]

const DISTANCE_OPTIONS = [
  { id: 'walking', label: '🚶 Walking distance' },
  { id: '1km', label: '📏 Within 1 km' },
  { id: '2km', label: '📏 Within 2 km' },
  { id: '5km', label: '📏 Within 5 km' }
]

export default function CreatePostScreen() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const defaultType = searchParams.get('type') || null
  const [postType, setPostType] = useState(defaultType) // null | 'right_now' | 'need_it_now' | 'verified_help'
  const [step, setStep] = useState(defaultType ? 2 : 1)

  // Right Now fields
  const [rnCategory, setRnCategory] = useState('')
  const [rnContent, setRnContent] = useState('')
  const [rnLocality, setRnLocality] = useState(state.currentUser?.locality || '')

  // Need It Now fields
  const [ninCategory, setNinCategory] = useState('')
  const [ninContent, setNinContent] = useState('')
  const [ninLocality, setNinLocality] = useState(state.currentUser?.locality || '')
  const [ninNeededBy, setNinNeededBy] = useState('')
  const [ninDistance, setNinDistance] = useState('2km')

  // Verified Help fields
  const [vhName, setVhName] = useState('')
  const [vhService, setVhService] = useState('')
  const [vhLocality, setVhLocality] = useState('')
  const [vhPhone, setVhPhone] = useState('')
  const [vhNote, setVhNote] = useState('')

  const MAX_CHARS = 280

  const handleTypeSelect = (type) => {
    setPostType(type)
    setStep(2)
  }

  const submitRightNow = () => {
    if (!rnCategory || !rnContent.trim() || rnContent.length > MAX_CHARS) return
    const meta = CATEGORY_META[rnCategory]
    const expiresAt = new Date(Date.now() + (meta?.expiry || 6) * 3600000).toISOString()
    actions.addPost({
      type: 'right_now',
      userId: state.currentUser.id,
      locality: rnLocality || state.currentUser?.locality,
      category: rnCategory,
      content: rnContent.trim(),
      expiresAt,
      stillHappeningCount: 0,
      confirmedBy: [],
      isPinned: false
    })
    navigate('/right-now')
  }

  const submitNeedItNow = () => {
    if (!ninCategory || !ninContent.trim() || ninContent.length > MAX_CHARS) return
    const meta = CATEGORY_META[ninCategory]
    const expiresAt = new Date(Date.now() + (meta?.expiry || 24) * 3600000).toISOString()
    actions.addPost({
      type: 'need_it_now',
      userId: state.currentUser.id,
      locality: ninLocality || state.currentUser?.locality,
      category: ninCategory,
      content: ninContent.trim(),
      expiresAt,
      neededBy: ninNeededBy ? new Date(ninNeededBy).toISOString() : new Date(Date.now() + 12 * 3600000).toISOString(),
      distanceRange: ninDistance,
      helperCount: 0,
      isFulfilled: false
    })
    navigate('/help')
  }

  const submitVerifiedHelp = () => {
    if (!vhName.trim() || !vhService) return
    actions.addProvider({
      name: vhName.trim(),
      serviceType: vhService,
      locality: vhLocality || state.currentUser?.locality,
      phone: vhPhone,
      whatsapp: vhPhone,
      notes: vhNote ? [vhNote.trim()] : [],
      isVerified: false
    })
    navigate('/help')
  }

  return (
    <div className="app-container">
      <div className="screen">
        {/* Header */}
        <div className="header">
          <button
            onClick={() => step === 1 ? navigate(-1) : setStep(1)}
            style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {step === 1 ? 'What to post?' : postType === 'right_now' ? '⚡ Right Now' : postType === 'need_it_now' ? '🙋 Need It Now' : '🤝 Recommend Helper'}
          </div>
          <div style={{ width: 60 }} />
        </div>

        {/* Step 1: Choose Type */}
        {step === 1 && (
          <div className="create-type-grid">
            <button className="create-type-card" onClick={() => handleTypeSelect('right_now')}>
              <div className="create-type-icon">⚡</div>
              <div className="create-type-text">
                <h3>Nearby Right Now</h3>
                <p>Traffic, water cut, police checking, power outage — share what's happening near you right now.</p>
              </div>
            </button>

            <button className="create-type-card" onClick={() => handleTypeSelect('need_it_now')}>
              <div className="create-type-icon">🙋</div>
              <div className="create-type-text">
                <h3>Need It Now</h3>
                <p>Borrow a drill, find a ride, spare ticket — quick urgent local requests from nearby people.</p>
              </div>
            </button>

            <button className="create-type-card" onClick={() => handleTypeSelect('verified_help')}>
              <div className="create-type-icon">🤝</div>
              <div className="create-type-text">
                <h3>Recommend a Helper</h3>
                <p>Recommend a cook, plumber, maid, tuition teacher you've personally used to your local community.</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Right Now Form */}
        {step === 2 && postType === 'right_now' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Share a real-time update with your neighbors. Post auto-expires in 6–12 hours.
            </p>

            {/* Category grid */}
            <div className="form-group">
              <label className="form-label">What's happening?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {RIGHT_NOW_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-item ${rnCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => setRnCategory(cat.id)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Locality / Area</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Kharghar Sector 20, Palm Beach Road"
                value={rnLocality}
                onChange={e => setRnLocality(e.target.value)}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                🔒 We never show your exact address
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">What's happening? (max 280 chars)</label>
              <textarea
                className="form-textarea"
                placeholder="Kya ho raha hai? (What's happening nearby?)"
                value={rnContent}
                onChange={e => setRnContent(e.target.value.slice(0, MAX_CHARS))}
                rows={4}
              />
              <div className={`char-count ${rnContent.length > 250 ? 'over' : ''}`}>
                {rnContent.length}/{MAX_CHARS}
              </div>
            </div>

            <div className="safety-box">
              <div className="safety-title">⚠️ Community Guidelines</div>
              <ul className="safety-list">
                <li>Only post things you personally witnessed or can verify.</li>
                <li>Do not post false emergency alerts — this will result in a ban.</li>
                <li>Do not share others' private information.</li>
              </ul>
            </div>

            <button
              className="btn btn-primary"
              onClick={submitRightNow}
              disabled={!rnCategory || !rnContent.trim()}
              style={{ opacity: !rnCategory || !rnContent.trim() ? 0.5 : 1, marginTop: 8 }}
            >
              ⚡ Post Right Now Update
            </button>
          </div>
        )}

        {/* Step 2: Need It Now Form */}
        {step === 2 && postType === 'need_it_now' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Post an urgent local request. Auto-expires in 24–48 hours.
            </p>

            <div className="form-group">
              <label className="form-label">What do you need?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {NEED_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-item ${ninCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => setNinCategory(cat.id)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your locality</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Kharghar Sector 7"
                value={ninLocality}
                onChange={e => setNinLocality(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Describe your need (max 280 chars)</label>
              <textarea
                className="form-textarea"
                placeholder="Be specific — what exactly do you need, when, and for how long?"
                value={ninContent}
                onChange={e => setNinContent(e.target.value.slice(0, MAX_CHARS))}
                rows={4}
              />
              <div className={`char-count ${ninContent.length > 250 ? 'over' : ''}`}>
                {ninContent.length}/{MAX_CHARS}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Needed by</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={ninNeededBy}
                  onChange={e => setNinNeededBy(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Distance range</label>
                <select
                  className="form-select"
                  value={ninDistance}
                  onChange={e => setNinDistance(e.target.value)}
                >
                  {DISTANCE_OPTIONS.map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="safety-box" style={{ marginTop: 8 }}>
              <div className="safety-title">⚠️ Safety reminder</div>
              <ul className="safety-list">
                <li>Meet in public places for all exchanges.</li>
                <li>Do not share your exact home address in public posts.</li>
                <li>Use caution when borrowing, lending, or meeting strangers.</li>
                <li>Do not share OTP, bank details, or passwords.</li>
              </ul>
            </div>

            <button
              className="btn btn-primary"
              onClick={submitNeedItNow}
              disabled={!ninCategory || !ninContent.trim()}
              style={{ opacity: !ninCategory || !ninContent.trim() ? 0.5 : 1, marginTop: 8 }}
            >
              🙋 Post Need It Now
            </button>
          </div>
        )}

        {/* Step 2: Verified Help Form */}
        {step === 2 && postType === 'verified_help' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Recommend a local helper you've personally used. After 3 recommendations, they get a "Verified by Locals" badge.
            </p>

            <div className="form-group">
              <label className="form-label">Service Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 4 }}>
                {SERVICE_TYPES.map(s => (
                  <button
                    key={s.id}
                    className={`category-item ${vhService === s.id ? 'selected' : ''}`}
                    onClick={() => setVhService(s.id)}
                  >
                    <span className="category-icon">{s.icon}</span>
                    <span className="category-label">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Helper's Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Ramesh Bhai, Sunita Tai"
                value={vhName}
                onChange={e => setVhName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Area / Locality they serve</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Kharghar Sector 10"
                value={vhLocality}
                onChange={e => setVhLocality(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone / WhatsApp (optional)</label>
              <input
                className="form-input"
                type="tel"
                placeholder="10-digit mobile number"
                value={vhPhone}
                onChange={e => setVhPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Only visible to verified residents
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your recommendation note</label>
              <textarea
                className="form-textarea"
                placeholder="What was your experience? Be honest and specific."
                value={vhNote}
                onChange={e => setVhNote(e.target.value.slice(0, MAX_CHARS))}
                rows={3}
                style={{ minHeight: 80 }}
              />
              <div className={`char-count ${vhNote.length > 250 ? 'over' : ''}`}>
                {vhNote.length}/{MAX_CHARS}
              </div>
            </div>

            <div className="safety-box">
              <div className="safety-title">📋 Recommendation Policy</div>
              <ul className="safety-list">
                <li>Only recommend people you have personally hired or worked with.</li>
                <li>False recommendations can be reported and will be removed.</li>
                <li>LocalSetu does not conduct background checks — your honest review matters.</li>
              </ul>
            </div>

            <button
              className="btn btn-primary"
              onClick={submitVerifiedHelp}
              disabled={!vhName.trim() || !vhService}
              style={{ opacity: !vhName.trim() || !vhService ? 0.5 : 1, marginTop: 8 }}
            >
              ⭐ Add to Verified Help Directory
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
