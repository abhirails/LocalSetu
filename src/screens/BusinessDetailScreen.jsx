import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const PLAN_META = {
  premium:  { label: 'Premium', color: '#d97706', bg: '#fef3c7', icon: '⭐' },
  standard: { label: 'Standard', color: '#7c3aed', bg: '#ede9fe', icon: '✓' },
  basic:    { label: 'Basic', color: '#4b5563', bg: '#f3f4f6', icon: '' },
}

function StarRating({ rating, count }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#f59e0b', fontSize: 18 }}>
        {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      </span>
      <span style={{ fontWeight: 700, fontSize: 16 }}>{rating.toFixed(1)}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({count} reviews)</span>
    </div>
  )
}

export default function BusinessDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useApp()

  const biz = (state.businesses || []).find(b => b.id === id)

  if (!biz) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32 }}>🏪</div>
          <div style={{ fontWeight: 700, marginTop: 12 }}>Business not found</div>
          <button
            onClick={() => navigate('/businesses')}
            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Back to Listings
          </button>
        </div>
      </div>
    )
  }

  const plan = PLAN_META[biz.plan] || PLAN_META.basic

  return (
    <div className="app-container">
      {/* Header hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--navy) 100%)',
        padding: '16px 16px 24px', color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 16 }}
          >
            ←
          </button>
          <span style={{ fontSize: 11, opacity: 0.7 }}>Verified Business · Ad</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{biz.name}</div>
            {biz.isVerified && (
              <span style={{ fontSize: 12, background: '#dcfce7', color: '#15803d', borderRadius: 8, padding: '2px 10px', fontWeight: 700 }}>
                ✓ LocalSetu Verified
              </span>
            )}
          </div>
          {biz.plan !== 'basic' && (
            <span style={{
              fontSize: 11, fontWeight: 700, background: plan.bg, color: plan.color,
              borderRadius: 8, padding: '3px 10px'
            }}>
              {plan.icon} {plan.label}
            </span>
          )}
        </div>

        {biz.tagline && (
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 10, fontStyle: 'italic' }}>
            "{biz.tagline}"
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>

        {/* Rating */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid var(--border)' }}>
          <StarRating rating={biz.rating} count={biz.reviewCount} />
        </div>

        {/* Info grid */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Details</div>
          {[
            { icon: '📍', label: 'Locality', value: biz.locality },
            { icon: '🏠', label: 'Address', value: biz.address },
            { icon: '🕐', label: 'Hours', value: biz.openHours },
          ].filter(r => r.value).map(row => (
            <div key={row.label} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16, minWidth: 22 }}>{row.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{row.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        {biz.description && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>About</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {biz.description}
            </div>
          </div>
        )}

        {/* Tags */}
        {biz.tags && biz.tags.length > 0 && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Specialities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {biz.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 12, background: 'var(--bg)', color: 'var(--text-secondary)',
                  borderRadius: 8, padding: '4px 10px', border: '1px solid var(--border)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Safety notice */}
        <div style={{ background: '#fefce8', borderRadius: 12, padding: '12px 14px', marginBottom: 16, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
            ⚠️ <strong>Safety reminder:</strong> Verify this business before making payments. Meet in person for large transactions. Do not share OTP or bank details.
          </div>
        </div>

        {/* Contact actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {biz.phone && (
            <a
              href={`tel:${biz.phone}`}
              style={{
                display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 12,
                background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              📞 Call {biz.phone}
            </a>
          )}
          {biz.whatsapp && (
            <a
              href={`https://wa.me/91${biz.whatsapp}?text=Hi, I found you on LocalSetu. I'd like to know more about your services.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 12,
                background: '#25d366', color: '#fff', fontSize: 15, fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              💬 WhatsApp
            </a>
          )}
          <button
            onClick={() => navigate('/businesses')}
            style={{
              padding: '11px 0', borderRadius: 12, background: 'transparent',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
              fontSize: 14, cursor: 'pointer'
            }}
          >
            ← Back to listings
          </button>
        </div>
      </div>
    </div>
  )
}
