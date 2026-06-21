import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import BottomNav from '../components/BottomNav'
import { SERVICE_TYPES } from '../data/demoData'

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

function getServiceMeta(serviceType) {
  return SERVICE_TYPES.find(s => s.id === serviceType) || { label: serviceType, icon: '👷' }
}

export default function ProviderDetailScreen() {
  const { id } = useParams()
  const { state, actions, helpers } = useApp()
  const navigate = useNavigate()
  const [showSafety, setShowSafety] = useState(false)
  const [showRecommendModal, setShowRecommendModal] = useState(false)
  const [recNote, setRecNote] = useState('')

  const provider = helpers.getProvider(id)

  if (!provider) {
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
            <div className="empty-title">Provider not found</div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const serviceMeta = getServiceMeta(provider.serviceType)
  const alreadyRecommended = provider.recommenderIds?.includes(state.currentUser?.id)
  const recommenders = (provider.recommenderIds || [])
    .map(uid => helpers.getUser(uid))
    .filter(Boolean)

  const handleContact = () => setShowSafety(true)

  const handleRecommend = () => {
    actions.recommendProvider(provider.id, recNote)
    setShowRecommendModal(false)
    setRecNote('')
  }

  return (
    <div className="app-container">
      <div className="screen">
        {/* Header */}
        <div className="header">
          <button onClick={() => navigate(-1)} style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Helper Profile</span>
          <span />
        </div>

        {/* Profile Hero */}
        <div style={{
          background: 'linear-gradient(160deg, var(--navy) 0%, #2D3A6B 100%)',
          padding: '28px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          color: 'white'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 900,
            border: '3px solid rgba(255,255,255,0.3)'
          }}>
            {getInitials(provider.name)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{provider.name}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
              {serviceMeta.icon} {serviceMeta.label}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
              📍 {provider.locality}
            </div>
          </div>
          {provider.isVerified && (
            <span style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700
            }}>
              ✅ Verified by Locals
            </span>
          )}
          <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{provider.recommendationCount}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Recommendations</div>
            </div>
            {!provider.isVerified && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{Math.max(0, 3 - provider.recommendationCount)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>More for verified</div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Actions */}
        <div style={{ padding: '16px', display: 'flex', gap: 10 }}>
          <button className="btn-call" onClick={handleContact} style={{ flex: 1, padding: 14 }}>
            📞 Call
          </button>
          <button className="btn-whatsapp" onClick={handleContact} style={{ flex: 1, padding: 14 }}>
            💬 WhatsApp
          </button>
        </div>

        {/* Recommendations */}
        {provider.notes?.length > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
              What neighbors say ({provider.notes.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {provider.notes.map((note, i) => (
                <div key={i} style={{
                  background: 'var(--card)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--success-light)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      {recommenders[i] ? getInitials(recommenders[i].name) : '?'}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      {recommenders[i]?.name || 'Local Resident'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      · {recommenders[i]?.locality || 'Nearby'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{note}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommend Button */}
        <div style={{ padding: '0 16px 16px' }}>
          {!alreadyRecommended ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowRecommendModal(true)}
            >
              ⭐ Add Your Recommendation
            </button>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 12,
              background: 'var(--success-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: 'var(--success)',
              fontWeight: 700
            }}>
              ✅ You've recommended {provider.name}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            LocalSetu does not conduct background checks on service providers. Always verify credentials personally before hiring.
          </div>
        </div>
      </div>

      {/* Safety Warning Modal */}
      {showSafety && (
        <div className="overlay" onClick={() => setShowSafety(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">⚠️ Before you contact</div>
            <div className="safety-box" style={{ marginTop: 0 }}>
              <ul className="safety-list">
                <li>Verify this person's credentials and identity before hiring.</li>
                <li>LocalSetu does not screen or guarantee any service provider.</li>
                <li>Do not share your exact address before meeting in person first.</li>
                <li>Do not pay large advances before work is completed.</li>
                <li>Community recommendations reflect personal experiences, not background checks.</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setShowSafety(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowSafety(false)
                  if (provider.phone) window.open(`tel:${provider.phone}`, '_self')
                }}
              >
                📞 Call now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommend Modal */}
      {showRecommendModal && (
        <div className="overlay" onClick={() => setShowRecommendModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">⭐ Recommend {provider.name}</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Only recommend if you've personally hired or worked with them.
            </p>
            <div className="form-group">
              <label className="form-label">Your note (optional but helpful)</label>
              <textarea
                className="form-textarea"
                placeholder={`What was your experience with ${provider.name}?`}
                value={recNote}
                onChange={e => setRecNote(e.target.value.slice(0, 280))}
                rows={3}
                style={{ minHeight: 80 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setShowRecommendModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleRecommend}>
                ⭐ Recommend
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
