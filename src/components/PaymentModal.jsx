import React, { useState } from 'react'
import { openRazorpayCheckout, isRazorpayConfigured } from '../lib/razorpay'

/**
 * Reusable payment modal for all 3 monetization flows:
 *  - Post boost (₹19 / ₹29 / ₹39)
 *  - Society Admin Pro (₹999/year)
 *  - Business listing inquiry (redirect to WhatsApp for now)
 *
 * Props:
 *  title          — modal heading
 *  description    — short subtitle
 *  options        — array of { id, label, price, hours?, description? }
 *  defaultOption  — id of pre-selected option
 *  type           — 'boost' | 'society_pro' | 'business_listing'
 *  metadata       — extra data sent to /api/razorpay-verify (e.g. { post_id, society_id })
 *  currentUser    — { id, name, email, phone }
 *  onSuccess      — called with { payment_id } after verified payment
 *  onClose        — called when modal is dismissed
 */
export default function PaymentModal({
  title,
  description,
  options = [],
  defaultOption,
  type,
  metadata = {},
  currentUser = {},
  onSuccess,
  onClose,
}) {
  const [selected, setSelected]   = useState(defaultOption || options[0]?.id)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState(null)
  const isConfigured              = isRazorpayConfigured()

  const selectedOption = options.find(o => o.id === selected) || options[0]

  const handlePay = async () => {
    if (!selectedOption) return
    setLoading(true)
    setError(null)
    await openRazorpayCheckout({
      amount_paise: selectedOption.price * 100,
      description:  `${title} — ${selectedOption.label}`,
      type,
      user_id:      currentUser.id,
      user_name:    currentUser.name,
      user_email:   currentUser.email,
      user_phone:   currentUser.phone ? `91${currentUser.phone}` : '',
      metadata: {
        ...metadata,
        ...(selectedOption.hours ? { hours: selectedOption.hours } : {}),
        plan:         selectedOption.plan,
        plan_months:  selectedOption.months,
      },
      onSuccess: (resp) => {
        setSuccess(true)
        setLoading(false)
        onSuccess && onSuccess(resp)
        setTimeout(onClose, 2000)
      },
      onFailure: (msg) => {
        setError(msg)
        setLoading(false)
      },
    })
    // If user dismissed modal without paying, loading stays — reset it
    setLoading(false)
  }

  return (
    <div className="overlay" onClick={!loading ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary)', marginBottom: 6 }}>
              Payment Successful!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {type === 'boost' && 'Your post is now boosted. ⚡'}
              {type === 'society_pro' && 'Society Admin Pro is now active. ✨'}
              {type === 'business_listing' && 'Your listing is live! 🏪'}
            </div>
          </div>
        ) : (
          <>
            <div className="modal-title">{title}</div>
            {description && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, marginTop: -8 }}>
                {description}
              </div>
            )}

            {/* Option picker */}
            {options.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    style={{
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: selected === opt.id ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                      background: selected === opt.id ? 'var(--primary-light, #fff7f5)' : 'var(--card-bg)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{opt.label}</div>
                      {opt.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.description}</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--primary)', flexShrink: 0, marginLeft: 12 }}>
                      ₹{opt.price}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Single option — just show price prominently */}
            {options.length === 1 && (
              <div style={{ textAlign: 'center', margin: '0 0 20px', padding: '16px', background: 'var(--bg)', borderRadius: 12 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>₹{selectedOption?.price}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{selectedOption?.label}</div>
              </div>
            )}

            {/* Payment mode notice */}
            {!isConfigured && (
              <div style={{ background: '#fefce8', borderRadius: 8, padding: '9px 12px', marginBottom: 14, border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
                💳 <strong>Demo mode</strong> — Razorpay not configured. Payment will be simulated. Add <code>VITE_RAZORPAY_KEY_ID</code> to go live.
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', borderRadius: 8, padding: '9px 12px', marginBottom: 14, border: '1px solid #fecaca', fontSize: 12, color: '#dc2626' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={loading || !selectedOption}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: loading ? 'var(--border)' : 'var(--primary)',
                color: '#fff', fontWeight: 800, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Processing...
                </>
              ) : (
                isConfigured
                  ? `Pay ₹${selectedOption?.price} with Razorpay`
                  : `Simulate Payment — ₹${selectedOption?.price}`
              )}
            </button>

            {isConfigured && (
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                🔒 Secured by Razorpay · UPI · Cards · Net Banking
              </div>
            )}

            <button
              onClick={onClose}
              disabled={loading}
              style={{ width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
