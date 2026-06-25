import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import { cx, ui } from '../lib/ui'
import {
  BUSINESS_TYPE_OPTIONS,
  BUSINESS_CATEGORY_TREE,
  MEDICAL_CATEGORIES,
  PAYMENT_MODE_OPTIONS,
} from '../data/businessConstants'

// ─── Helpers ───────────────────────────────────────────────────────────────

function isMedical(categoryId) {
  return MEDICAL_CATEGORIES.includes(categoryId)
}

function toggleItem(arr, item) {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

// ─── Step components ────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '8px 0 16px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 22 : 8,
            height: 8,
            borderRadius: 4,
            background: i < current ? 'var(--success)' : i === current ? 'var(--primary)' : 'var(--border-light)',
            transition: 'all 0.2s',
          }}
        />
      ))}
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
      {children}{required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
    </div>
  )
}

function Input({ label, required, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1.5px solid var(--border-light)',
          borderRadius: 10,
          fontSize: 14,
          background: 'var(--input-bg, #fff)',
          color: 'var(--text-primary)',
          boxSizing: 'border-box',
          outline: 'none',
          ...(props.style || {}),
        }}
      />
    </div>
  )
}

function TextArea({ label, required, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <textarea
        {...props}
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1.5px solid var(--border-light)',
          borderRadius: 10,
          fontSize: 14,
          background: 'var(--input-bg, #fff)',
          color: 'var(--text-primary)',
          boxSizing: 'border-box',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          ...(props.style || {}),
        }}
      />
    </div>
  )
}

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        border: active ? '2px solid var(--primary)' : '1.5px solid var(--border-light)',
        background: active ? 'var(--primary-light)' : 'var(--card)',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        marginBottom: 6,
        marginRight: 6,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function SwitchRow({ label, sub, value, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 0',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          background: value ? 'var(--primary)' : 'var(--border-light)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  )
}

// ─── Step 1: Business type ──────────────────────────────────────────────────

function Step1({ form, setForm }) {
  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>What are you registering?</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
        Choose the type that best matches your business or service.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BUSINESS_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setForm(f => ({ ...f, entity_type: opt.id }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 12,
              border: form.entity_type === opt.id
                ? '2px solid var(--primary)'
                : '1.5px solid var(--border-light)',
              background: form.entity_type === opt.id ? 'var(--primary-light)' : 'var(--card)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 22 }}>{opt.icon}</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: form.entity_type === opt.id ? 800 : 600,
                color: form.entity_type === opt.id ? 'var(--primary)' : 'var(--text-primary)',
              }}
            >
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Category ───────────────────────────────────────────────────────

function Step2({ form, setForm }) {
  const selectedCat = BUSINESS_CATEGORY_TREE.find(c => c.id === form.category)

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Select Category</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Pick the main category and a sub-category.
      </div>

      {/* Main category */}
      <FieldLabel required>Main Category</FieldLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {BUSINESS_CATEGORY_TREE.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setForm(f => ({ ...f, category: cat.id, subcategory: '' }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 10,
              border: form.category === cat.id
                ? '2px solid var(--primary)'
                : '1.5px solid var(--border-light)',
              background: form.category === cat.id ? 'var(--primary-light)' : 'var(--card)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 13,
              fontWeight: form.category === cat.id ? 700 : 500,
              color: form.category === cat.id ? 'var(--primary)' : 'var(--text-primary)',
            }}
          >
            <span>{cat.icon}</span>
            <span style={{ lineHeight: 1.3 }}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Sub-category */}
      {selectedCat && (
        <>
          <FieldLabel required>Sub-Category</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
            {selectedCat.subcategories.map(sub => (
              <ToggleChip
                key={sub}
                label={sub}
                active={form.subcategory === sub}
                onClick={() => setForm(f => ({ ...f, subcategory: sub }))}
              />
            ))}
          </div>
        </>
      )}

      {/* Medical warning */}
      {form.category && isMedical(form.category) && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 10,
            fontSize: 13,
            color: '#78350f',
            lineHeight: 1.5,
          }}
        >
          <strong>⚠️ Medical listings require admin verification</strong> before appearing as verified. You can still register now — your listing will show as "Pending Review."
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Details + Contact ──────────────────────────────────────────────

function Step3({ form, setForm }) {
  const isIndividual = form.entity_type === 'individual_provider'

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Business Details</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
        Enter your basic info and contact details.
      </div>

      <Input
        label={isIndividual ? 'Your Name / Service Name' : 'Business / Shop Name'}
        required
        placeholder={isIndividual ? 'e.g. Rajesh Electricals' : 'e.g. Annapurna Supermarket'}
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      />

      <Input
        label="Owner / Contact Person Name"
        required
        placeholder="Full name"
        value={form.contact_person}
        onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
      />

      <Input
        label="Short Tagline"
        placeholder="e.g. Fresh groceries delivered in 30 mins"
        value={form.tagline}
        onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
      />

      <TextArea
        label="Description"
        placeholder="Tell locals what you offer, your experience, speciality..."
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
      />

      <div style={{ height: 1, background: 'var(--border-light)', margin: '6px 0 18px' }} />

      <Input
        label="Primary Phone"
        required
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="10-digit mobile number"
        value={form.phone}
        onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
      />

      <Input
        label="WhatsApp Number"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="Leave blank if same as primary phone"
        value={form.whatsapp}
        onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value.replace(/\D/g, '') }))}
      />

      <Input
        label="Alternate Phone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="Optional"
        value={form.alternate_phone}
        onChange={e => setForm(f => ({ ...f, alternate_phone: e.target.value.replace(/\D/g, '') }))}
      />

      <Input
        label="Email"
        type="email"
        placeholder="Optional"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
      />
    </div>
  )
}

// ─── Step 4: Address + Hours + Commerce ────────────────────────────────────

function Step4({ form, setForm }) {
  const isIndividual = form.entity_type === 'individual_provider'

  function togglePayment(mode) {
    setForm(f => ({ ...f, payment_modes: toggleItem(f.payment_modes, mode) }))
  }

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Location & Services</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
        Where do you operate? What do you offer?
      </div>

      <Input
        label="Locality"
        required
        placeholder="e.g. Koramangala, Bandra West"
        value={form.locality}
        onChange={e => setForm(f => ({ ...f, locality: e.target.value }))}
      />

      {!isIndividual && (
        <Input
          label="Shop / Office Address"
          required={!isIndividual}
          placeholder="Building, street name"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
        />
      )}

      {isIndividual && (
        <Input
          label="Service Area"
          placeholder="e.g. Koramangala, Indiranagar, Baner"
          value={form.service_area}
          onChange={e => setForm(f => ({ ...f, service_area: e.target.value }))}
        />
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Input
            label="Landmark"
            placeholder="Near..."
            value={form.landmark}
            onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Input
            label="Pincode"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit"
            value={form.pincode}
            onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
          />
        </div>
      </div>

      <Input
        label="Working Hours"
        placeholder="e.g. Mon–Sat, 9 AM – 9 PM"
        value={form.working_hours}
        onChange={e => setForm(f => ({ ...f, working_hours: e.target.value }))}
      />

      <div style={{ marginBottom: 18 }}>
        <SwitchRow
          label="Emergency / 24×7 Available"
          value={form.emergency_available}
          onChange={v => setForm(f => ({ ...f, emergency_available: v }))}
        />
        <SwitchRow
          label="Provides Home Visit"
          value={form.provides_home_visit}
          onChange={v => setForm(f => ({ ...f, provides_home_visit: v }))}
        />
        <SwitchRow
          label="Provides Delivery"
          value={form.provides_delivery}
          onChange={v => setForm(f => ({ ...f, provides_delivery: v }))}
        />
        <SwitchRow
          label="Pickup Available"
          value={form.pickup_available}
          onChange={v => setForm(f => ({ ...f, pickup_available: v }))}
        />
        <SwitchRow
          label="Can respond to quote requests"
          sub="Buyers can ask you for price quotes"
          value={form.accepts_quotes}
          onChange={v => setForm(f => ({ ...f, accepts_quotes: v }))}
        />
      </div>

      <FieldLabel>Payment Modes Accepted</FieldLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 14 }}>
        {PAYMENT_MODE_OPTIONS.map(pm => (
          <ToggleChip
            key={pm.id}
            label={pm.label}
            active={form.payment_modes.includes(pm.id)}
            onClick={() => togglePayment(pm.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Step 5: Verification docs ─────────────────────────────────────────────

function Step5({ form, setForm }) {
  const needsLicense = isMedical(form.category) || form.category === 'pharmacy'

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Verification (Optional)</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
        Adding your registration number helps build trust with locals. These are verified by our team.
      </div>

      {needsLicense && (
        <div
          style={{
            padding: '12px 14px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 10,
            fontSize: 13,
            color: '#78350f',
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          <strong>⚠️ Required for medical categories:</strong> Please provide your license or registration number. Your listing will appear as "Pending Review" until our team verifies it.
        </div>
      )}

      <Input
        label="GST Number"
        placeholder="Optional"
        value={form.gst_number}
        onChange={e => setForm(f => ({ ...f, gst_number: e.target.value.toUpperCase() }))}
      />

      <Input
        label={needsLicense ? 'License / Registration Number' : 'Shop Act License / Other License'}
        required={needsLicense}
        placeholder={
          form.category === 'pharmacy' ? 'Pharmacy License No.'
          : form.category === 'clinic' ? 'Medical Registration No.'
          : 'License / Registration No.'
        }
        value={form.license_number}
        onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))}
      />

      <Input
        label="Website / Instagram / Google Maps link"
        placeholder="https://..."
        value={form.website}
        onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
      />

      <div
        style={{
          padding: '12px 14px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 10,
          fontSize: 13,
          color: '#166534',
          lineHeight: 1.6,
          marginTop: 8,
        }}
      >
        <strong>🔒 Privacy:</strong> Your phone number is shown only on your business listing, not your personal profile. Your exact home address is never shown.
      </div>
    </div>
  )
}

// ─── Main screen ────────────────────────────────────────────────────────────

const STEP_TITLES = [
  'Business Type',
  'Category',
  'Details & Contact',
  'Location & Services',
  'Verification',
]

const EMPTY_FORM = {
  // Step 1
  entity_type: '',
  // Step 2
  category: '',
  subcategory: '',
  // Step 3
  name: '',
  contact_person: '',
  tagline: '',
  description: '',
  phone: '',
  whatsapp: '',
  alternate_phone: '',
  email: '',
  // Step 4
  locality: '',
  address: '',
  service_area: '',
  landmark: '',
  pincode: '',
  working_hours: '',
  emergency_available: false,
  provides_home_visit: false,
  provides_delivery: false,
  pickup_available: true,
  accepts_quotes: true,
  payment_modes: [],
  // Step 5
  gst_number: '',
  license_number: '',
  website: '',
}

function validateStep(step, form) {
  if (step === 0) return !!form.entity_type
  if (step === 1) return !!(form.category && form.subcategory)
  if (step === 2) {
    if (!form.name || !form.contact_person || !form.phone) return false
    if (form.phone.length !== 10) return false
    return true
  }
  if (step === 3) {
    if (!form.locality) return false
    if (form.entity_type !== 'individual_provider' && !form.address) return false
    if (form.pincode && form.pincode.length !== 6) return false
    return true
  }
  return true
}

export default function RegisterBusinessScreen() {
  const navigate = useNavigate()
  const { state, actions } = useApp()
  const cu = state.currentUser

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!cu) {
    navigate('/login')
    return null
  }

  const canProceed = validateStep(step, form)

  async function handleSubmit() {
    if (!validateStep(step, form)) return
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        // Identity
        entity_type: form.entity_type,
        category: form.category,
        subcategory: form.subcategory,
        // Core details
        name: form.name.trim(),
        contact_person: form.contact_person.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        // Contact
        phone: form.phone,
        whatsapp: form.whatsapp || form.phone,
        alternate_phone: form.alternate_phone || null,
        email: form.email || null,
        // Location
        locality: form.locality.trim(),
        address: form.address.trim() || null,
        service_area: form.service_area.trim() || null,
        city: 'Navi Mumbai',
        landmark: form.landmark.trim() || null,
        pincode: form.pincode || null,
        // Service flags
        working_hours: form.working_hours.trim() || null,
        emergency_available: form.emergency_available,
        provides_home_visit: form.provides_home_visit,
        provides_delivery: form.provides_delivery,
        pickup_available: form.pickup_available,
        accepts_quotes: form.accepts_quotes,
        payment_modes: form.payment_modes,
        // Verification
        gst_number: form.gst_number.trim() || null,
        license_number: form.license_number.trim() || null,
        // Defaults
        plan: 'basic',
        is_verified: false,
        verification_status: 'pending',
        rating: 0,
        review_count: 0,
        owner_id: cu.id,
        submitted_at: new Date().toISOString(),
      }

      if (supabase) {
        const { error: dbErr } = await supabase.from('businesses').insert([payload])
        if (dbErr) throw new Error(dbErr.message)
      }

      // Optimistically update local state so the listing appears immediately
      if (actions.addBusiness) {
        actions.addBusiness({ ...payload, id: `biz_${Date.now()}`, createdAt: new Date().toISOString() })
      }

      setSuccess(true)
    } catch (err) {
      console.error('Register business error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className={ui.appContainer}>
        <div className={ui.screen} style={{ justifyContent: 'center', alignItems: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>
            Business Submitted!
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28, maxWidth: 320 }}>
            <strong>{form.name}</strong> has been submitted for review.
            {isMedical(form.category)
              ? ' Medical listings need admin verification before appearing as Verified.'
              : ' Your listing will appear shortly after a quick basic review.'}
            <br /><br />
            You can continue using LocalSetu as a resident.
          </div>
          <button
            className={cx(ui.btn, ui.btnPrimary)}
            style={{ width: 'auto', marginBottom: 12 }}
            onClick={() => navigate('/businesses')}
          >
            View Business Listings
          </button>
          <button
            className={ui.btn}
            style={{ width: 'auto', background: 'var(--card)', border: '1.5px solid var(--border-light)' }}
            onClick={() => navigate('/home')}
          >
            Back to Home
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <div className={ui.appContainer}>
      <div className={ui.screen}>
        {/* Header */}
        <div className={ui.header}>
          <button
            className={ui.iconBtn}
            onClick={() => (step === 0 ? navigate(-1) : setStep(s => s - 1))}
            style={{ fontSize: 20 }}
          >
            ←
          </button>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Register Business / Service</div>
          <div style={{ width: 36 }} />
        </div>

        {/* Step indicator + title */}
        <div style={{ padding: '0 16px' }}>
          <StepIndicator current={step} total={STEP_TITLES.length} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 18, textAlign: 'center' }}>
            Step {step + 1} of {STEP_TITLES.length} — {STEP_TITLES[step]}
          </div>

          {step === 0 && <Step1 form={form} setForm={setForm} />}
          {step === 1 && <Step2 form={form} setForm={setForm} />}
          {step === 2 && <Step3 form={form} setForm={setForm} />}
          {step === 3 && <Step4 form={form} setForm={setForm} />}
          {step === 4 && <Step5 form={form} setForm={setForm} />}

          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626', marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', marginTop: 'auto', background: 'var(--bg)' }}>
          {/* Validation hint */}
          {!canProceed && step === 2 && form.phone && form.phone.length !== 10 && (
            <div style={{ fontSize: 12, color: 'var(--error)', marginBottom: 8, textAlign: 'center' }}>
              Phone must be 10 digits
            </div>
          )}
          {!canProceed && step === 3 && form.pincode && form.pincode.length !== 6 && (
            <div style={{ fontSize: 12, color: 'var(--error)', marginBottom: 8, textAlign: 'center' }}>
              Pincode must be 6 digits
            </div>
          )}

          {step < STEP_TITLES.length - 1 ? (
            <button
              className={cx(ui.btn, ui.btnPrimary)}
              disabled={!canProceed}
              onClick={() => setStep(s => s + 1)}
              style={{ opacity: canProceed ? 1 : 0.5 }}
            >
              Continue →
            </button>
          ) : (
            <button
              className={cx(ui.btn, ui.btnPrimary)}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting...' : '✓ Submit for Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
