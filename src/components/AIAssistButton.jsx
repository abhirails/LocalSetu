import React, { useState } from 'react'
import { assistPost, AI_ENABLED } from '../lib/aiAssist'

const TYPE_LABELS = {
  right_now:   '⚡ Right Now',
  need_it_now: '🙋 Need It Now',
}

const CAT_LABELS = {
  water: '💧 Water', power: '⚡ Power', traffic: '🚗 Traffic',
  transport: '🚌 Transport', police: '🚔 Police', lost_found: '🔑 Lost & Found',
  civic: '🏗️ Civic', weather: '🌧️ Weather', safety: '🚨 Safety', medical: '🏥 Medical',
  borrow: '🤝 Borrow', rideshare: '🚕 Ride Share', ticket: '🎟️ Ticket',
  need_to_buy: '🛒 Need to Buy', home_help: '🔧 Home Help', urgent: '🆘 Urgent', errand: '📦 Errand',
}

/**
 * AIAssistButton
 *
 * Props:
 *   text          — current textarea content
 *   postType      — 'right_now' | 'need_it_now' | null
 *   category      — current selected category or ''
 *   locality      — current locality string or ''
 *   onApply(result) — called when user accepts suggestion
 *                     result: { improvedText, suggestedType, suggestedCategory, safetyFlags, ... }
 */
export default function AIAssistButton({ text, postType, category, locality, onApply }) {
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [dismissed, setDismiss] = useState(false)

  // Hidden when: feature flag off, text too short, already dismissed
  if (!AI_ENABLED || dismissed) return null
  if (!text || text.trim().length < 15) return null

  const hasImprovement = result && result.improvedText !== text.trim()
  const hasNewType     = result && result.suggestedType && result.suggestedType !== postType
  const hasNewCat      = result && result.suggestedCategory && result.suggestedCategory !== category

  const handleAssist = async () => {
    setLoading(true)
    setResult(null)
    const r = await assistPost({
      text:            text.trim(),
      currentType:     postType,
      currentCategory: category,
      locality:        locality,
    })
    setLoading(false)
    if (r) setResult(r)
  }

  const handleApply = () => {
    if (result) onApply(result)
    setResult(null)
    setDismiss(true)
  }

  const handleKeep = () => {
    // Still apply safety flags even if user keeps original text
    if (result) onApply({ ...result, improvedText: text.trim() })
    setResult(null)
    setDismiss(true)
  }

  return (
    <div style={{ marginTop: 6, marginBottom: 2 }}>

      {/* ── Assist trigger button ── */}
      {!result && (
        <button
          type="button"
          onClick={handleAssist}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            border: '1.5px solid #bae6fd',
            background: loading ? '#f0f9ff' : 'white',
            color: '#0369a1', fontSize: 12, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {loading
            ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Improving…</>
            : <>✨ Assist</>
          }
        </button>
      )}

      {/* ── Result panel ── */}
      {result && (
        <div style={{
          border: '1.5px solid #bae6fd',
          borderRadius: 12,
          background: '#f0f9ff',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>

          {/* Safety flags — always shown first if present */}
          {result.safetyFlags?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.safetyFlags.map(f => (
                <div key={f.flag} style={{
                  background: '#fff7ed', border: '1px solid #fed7aa',
                  borderRadius: 8, padding: '7px 10px',
                  fontSize: 12, color: '#92400e', lineHeight: 1.4,
                }}>
                  ⚠️ {f.message}
                </div>
              ))}
            </div>
          )}

          {/* Suggested type / category chips */}
          {(hasNewType || hasNewCat) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>Suggested:</span>
              {hasNewType && (
                <span style={{
                  fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8',
                  borderRadius: 20, padding: '2px 10px',
                }}>
                  {TYPE_LABELS[result.suggestedType] || result.suggestedType}
                </span>
              )}
              {hasNewCat && (
                <span style={{
                  fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d',
                  borderRadius: 20, padding: '2px 10px',
                }}>
                  {CAT_LABELS[result.suggestedCategory] || result.suggestedCategory}
                </span>
              )}
            </div>
          )}

          {/* Improved text preview */}
          {hasImprovement && (
            <div>
              <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>
                Suggested post:
              </div>
              <div style={{
                background: 'white', border: '1px solid #bae6fd',
                borderRadius: 8, padding: '8px 10px',
                fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
              }}>
                {result.improvedText}
              </div>
            </div>
          )}

          {/* No visible improvement (only flags or same category) */}
          {!hasImprovement && !hasNewType && !hasNewCat && result.safetyFlags?.length === 0 && (
            <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>
              ✅ Your post looks good as written!
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hasImprovement && (
              <button
                type="button"
                onClick={handleApply}
                style={{
                  padding: '6px 16px', borderRadius: 20,
                  background: '#0369a1', color: 'white',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Use suggestion
              </button>
            )}
            <button
              type="button"
              onClick={handleKeep}
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: 'white', color: '#6b7280',
                border: '1px solid #d1d5db', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {hasImprovement ? 'Keep original' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
