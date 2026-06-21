import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { SERVICE_TYPES } from '../data/demoData'

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
}

function getServiceMeta(serviceType) {
  return SERVICE_TYPES.find(s => s.id === serviceType) || { label: serviceType, icon: '👷' }
}

export default function ProviderCard({ provider, showActions = true }) {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [showSafetyWarning, setShowSafetyWarning] = useState(false)
  const [showRecommendModal, setShowRecommendModal] = useState(false)
  const [recNote, setRecNote] = useState('')

  const serviceMeta = getServiceMeta(provider.serviceType)
  const alreadyRecommended = provider.recommenderIds?.includes(state.currentUser?.id)

  const handleContact = (type) => {
    setShowSafetyWarning(true)
  }

  const handleRecommend = () => {
    if (alreadyRecommended) return
    actions.recommendProvider(provider.id, recNote)
    setShowRecommendModal(false)
    setRecNote('')
  }

  return (
    <>
      <div
        className="provider-card"
        onClick={() => navigate(`/provider/${provider.id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div className="provider-header">
          <div className="provider-avatar">{getInitials(provider.name)}</div>
          <div className="provider-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="provider-name">{provider.name}</span>
              {provider.isVerified && (
                <span className="verified-badge">✅ Verified by Locals</span>
              )}
            </div>
            <div className="provider-service">{serviceMeta.icon} {serviceMeta.label}</div>
            <div className="provider-locality">📍 {provider.locality}</div>
          </div>
        </div>

        <div className="provider-rec-count">
          <span>⭐</span>
          <span>{provider.recommendationCount} local{provider.recommendationCount !== 1 ? 's' : ''} recommended</span>
          {!provider.isVerified && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              · {3 - provider.recommendationCount} more for verified badge
            </span>
          )}
        </div>

        {provider.notes?.length > 0 && (
          <div className="provider-notes">
            <div className="provider-note">{provider.notes[0]}</div>
          </div>
        )}

        {showActions && (
          <div className="provider-actions" onClick={e => e.stopPropagation()}>
            <button className="btn-call" onClick={handleContact}>
              📞 Call
            </button>
            <button className="btn-whatsapp" onClick={handleContact}>
              💬 WhatsApp
            </button>
            {!alreadyRecommended && (
              <button
                className="action-btn"
                onClick={(e) => { e.stopPropagation(); setShowRecommendModal(true) }}
                style={{ flex: 'none', padding: '10px 12px' }}
              >
                ⭐ Recommend
              </button>
            )}
          </div>
        )}
      </div>

      {/* Safety Warning */}
      {showSafetyWarning && (
        <div className="overlay" onClick={() => setShowSafetyWarning(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">⚠️ Before you contact</div>
            <div className="safety-box" style={{ marginTop: 0 }}>
              <ul className="safety-list">
                <li>Verify credentials before hiring or letting anyone into your home.</li>
                <li>LocalSetu does not conduct background checks on providers.</li>
                <li>Do not share your exact address before verifying identity.</li>
                <li>Do not pay large advances before work is completed.</li>
                <li>Trust your community's recommendations but verify personally.</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSafetyWarning(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowSafetyWarning(false)
                  window.open(`tel:${provider.phone}`, '_self')
                }}
              >
                📞 Call {provider.name.split(' ')[0]}
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
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Only recommend people you have personally hired or worked with.
            </p>
            <div className="form-group">
              <label className="form-label">Your note (optional)</label>
              <textarea
                className="form-textarea"
                placeholder={`What was your experience with ${provider.name}?`}
                value={recNote}
                onChange={e => setRecNote(e.target.value)}
                rows={3}
                style={{ minHeight: 80 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowRecommendModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleRecommend}>
                ⭐ Add Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
