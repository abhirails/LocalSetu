import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { cx, ui } from '../lib/ui'

const WINGS_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const SECTOR_OPTIONS = [
  'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5',
  'Sector 6', 'Sector 7', 'Sector 8', 'Sector 10', 'Sector 12',
  'Sector 14', 'Sector 15', 'Sector 20', 'Sector 23', 'Sector 25',
  'Sector 35', 'Sector 36', 'Other'
]
const ADMIN_ROLE_OPTIONS = [
  { id: 'secretary', label: 'Secretary' },
  { id: 'chairman', label: 'Chairman / President' },
  { id: 'treasurer', label: 'Treasurer' },
  { id: 'committee', label: 'Committee Member' },
  { id: 'manager', label: 'Building Manager' },
]

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div style={{
            width: i < current ? 28 : 24,
            height: i < current ? 28 : 24,
            borderRadius: '50%',
            background: i + 1 === current ? 'var(--primary)' : i + 1 < current ? 'var(--success, #22c55e)' : 'var(--border)',
            color: i + 1 <= current ? '#fff' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            flexShrink: 0,
            transition: 'all 0.2s'
          }}>
            {i + 1 < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div style={{
              flex: 1, height: 2,
              background: i + 1 < current ? 'var(--success, #22c55e)' : 'var(--border)'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

const INITIAL = {
  // Step 1 — Society details
  name: '',
  sector: '',
  landmark: '',
  pincode: '',
  wings: [],
  totalFlats: '',
  description: '',
  rules: '',
  contactPhone: '',
  registrationNumber: '',
  // Step 2 — Admin details
  adminFlatNumber: '',
  adminRole: '',
  adminPhone: '',
}

export default function RegisterSocietyScreen() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const cu = state.currentUser
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const err = (field) => errors[field] && (
    <div style={{ color: 'var(--error, #ef4444)', fontSize: 12, marginTop: 3 }}>{errors[field]}</div>
  )

  function validateStep1() {
    const e = {}
    if (!form.name.trim()) e.name = 'Society name is required'
    if (!form.sector) e.sector = 'Sector is required'
    if (form.contactPhone && !/^\d{10}$/.test(form.contactPhone)) e.contactPhone = 'Enter a valid 10-digit number'
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode'
    if (form.totalFlats && isNaN(Number(form.totalFlats))) e.totalFlats = 'Must be a number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const e = {}
    if (!form.adminFlatNumber.trim()) e.adminFlatNumber = 'Your flat / unit number is required'
    if (!form.adminRole) e.adminRole = 'Your role in the society is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function toggleWing(w) {
    set('wings', form.wings.includes(w)
      ? form.wings.filter(x => x !== w)
      : [...form.wings, w]
    )
  }

  async function handleSubmit() {
    if (!validateStep2()) return
    setLoading(true)
    try {
      await actions.registerSociety({
        name: form.name.trim(),
        sector: form.sector,
        landmark: form.landmark.trim(),
        pincode: form.pincode.trim(),
        wings: form.wings,
        totalFlats: form.totalFlats ? Number(form.totalFlats) : null,
        description: form.description.trim(),
        rules: form.rules.trim(),
        contactPhone: form.contactPhone.trim(),
        registrationNumber: form.registrationNumber.trim(),
        adminFlatNumber: form.adminFlatNumber.trim(),
        adminRole: form.adminRole,
        locality: cu?.locality || '',
      })
      setDone(true)
    } catch (err) {
      console.error('registerSociety failed', err)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid var(--border)', background: 'var(--card-bg)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    marginTop: 4,
  }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginTop: 14 }
  const sectionStyle = { padding: '0 16px' }

  if (done) {
    return (
      <div className={ui.appContainer}>
        <div className={ui.screen} style={{ justifyContent: 'center', alignItems: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏘️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Application Submitted!
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24, maxWidth: 300 }}>
            Your society registration request has been received. Our team will review it within 2–3 working days and contact you on {form.adminPhone || form.contactPhone || 'your registered number'}.
          </div>
          <div style={{
            background: 'rgba(var(--primary-rgb,255,107,53),0.07)',
            border: '1px solid rgba(var(--primary-rgb,255,107,53),0.2)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 24,
            fontSize: 13, color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.6
          }}>
            <strong>What happens next:</strong><br />
            1. LocalSetu team verifies the society<br />
            2. You'll be made Society Admin on approval<br />
            3. Residents can then request to join your society page
          </div>
          <button
            className={cx(ui.btn, ui.btnPrimary)}
            onClick={() => navigate('/societies')}
          >
            Back to Societies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={ui.appContainer}>
      {/* Header */}
      <div style={{ background: 'var(--primary)', padding: '16px 16px 14px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 16 }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Register Your Society</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Step {step} of 2</div>
          </div>
        </div>
        <StepIndicator current={step} total={2} />
      </div>

      <div className={ui.screen} style={{ overflowY: 'auto', paddingBottom: 80 }}>

        {/* ─── STEP 1: Society Details ─────────────────── */}
        {step === 1 && (
          <div style={sectionStyle}>
            <div style={{ margin: '16px 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Society Details
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Tell us about your housing society. All details will be verified before going live.
            </div>

            <label style={labelStyle}>Society Name *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Sai Nagar CHS, Green Valley Apartments"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
            {err('name')}

            <label style={labelStyle}>Sector / Area *</label>
            <select style={inputStyle} value={form.sector} onChange={e => set('sector', e.target.value)}>
              <option value="">Select sector…</option>
              {SECTOR_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {err('sector')}

            <label style={labelStyle}>Landmark / Address</label>
            <input
              style={inputStyle}
              placeholder="e.g. Near Central Park, opposite Metro station"
              value={form.landmark}
              onChange={e => set('landmark', e.target.value)}
            />

            <label style={labelStyle}>Pincode</label>
            <input
              style={inputStyle}
              placeholder="410210"
              maxLength={6}
              value={form.pincode}
              onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))}
            />
            {err('pincode')}

            <label style={labelStyle}>Wings / Towers</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {WINGS_OPTIONS.map(w => (
                <button
                  key={w}
                  onClick={() => toggleWing(w)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: form.wings.includes(w) ? 'var(--primary)' : 'var(--card-bg)',
                    color: form.wings.includes(w) ? '#fff' : 'var(--text-secondary)',
                    border: form.wings.includes(w) ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  }}
                >
                  Wing {w}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Total Flats / Units</label>
            <input
              style={inputStyle}
              placeholder="e.g. 120"
              value={form.totalFlats}
              onChange={e => set('totalFlats', e.target.value)}
            />
            {err('totalFlats')}

            <label style={labelStyle}>Society Contact Number</label>
            <input
              style={inputStyle}
              placeholder="10-digit mobile"
              maxLength={10}
              value={form.contactPhone}
              onChange={e => set('contactPhone', e.target.value.replace(/\D/g, ''))}
            />
            {err('contactPhone')}

            <label style={labelStyle}>Society Registration Number (if any)</label>
            <input
              style={inputStyle}
              placeholder="Optional — from Registrar of Cooperative Societies"
              value={form.registrationNumber}
              onChange={e => set('registrationNumber', e.target.value)}
            />

            <label style={labelStyle}>About Your Society</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Brief description for residents browsing the societies list…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />

            <label style={labelStyle}>Society Rules / Bye-laws Summary</label>
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              placeholder="e.g. No pets above 2nd floor, Visitor entry before 10 PM only…"
              value={form.rules}
              onChange={e => set('rules', e.target.value)}
            />

            <button
              className={cx(ui.btn, ui.btnPrimary)}
              style={{ marginTop: 24, marginBottom: 16 }}
              onClick={() => validateStep1() && setStep(2)}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ─── STEP 2: Admin / Submitter Details ──────── */}
        {step === 2 && (
          <div style={sectionStyle}>
            <div style={{ margin: '16px 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Your Details as Society Admin
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              You'll be the primary admin for this society page once it's verified.
            </div>

            <label style={labelStyle}>Your Flat / Unit Number *</label>
            <input
              style={inputStyle}
              placeholder="e.g. A-204, Flat 12B"
              value={form.adminFlatNumber}
              onChange={e => set('adminFlatNumber', e.target.value)}
            />
            {err('adminFlatNumber')}

            <label style={labelStyle}>Your Role in the Society *</label>
            <select style={inputStyle} value={form.adminRole} onChange={e => set('adminRole', e.target.value)}>
              <option value="">Select role…</option>
              {ADMIN_ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {err('adminRole')}

            <label style={labelStyle}>Your Contact Number (for verification)</label>
            <input
              style={inputStyle}
              placeholder="10-digit number — not shown publicly"
              maxLength={10}
              value={form.adminPhone}
              onChange={e => set('adminPhone', e.target.value.replace(/\D/g, ''))}
            />

            {/* Safety notice */}
            <div style={{
              background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: 10, padding: '10px 14px', marginTop: 20,
              fontSize: 12.5, color: '#92400e', lineHeight: 1.6
            }}>
              ⚠️ <strong>Verification required:</strong> We'll call or message you to confirm you are an authorized representative of this society before approving the page. False registrations will be removed.
            </div>

            <button
              className={cx(ui.btn, ui.btnPrimary)}
              style={{ marginTop: 24, marginBottom: 8 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting…' : '🏘️ Submit for Review'}
            </button>
            <button
              className={ui.btn}
              style={{ marginBottom: 16 }}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
