import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_USERS } from '../data/demoData'
import { useApp } from '../context/AppContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getProfile, upsertProfile } from '../lib/db'
import { cx, ui } from '../lib/ui'

export default function LoginScreen() {
  const { actions } = useApp()
  const navigate = useNavigate()

  const [mode, setMode] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const canContinueWithPhone = phone.length === 10
  const canCompleteProfile = Boolean(name.trim())

  const clearError = () => setError('')

  const getRedirectPath = () => {
    const saved = sessionStorage.getItem('localsetu_redirect')
    if (saved) {
      sessionStorage.removeItem('localsetu_redirect')
      return saved
    }
    return '/home'
  }

  const handleSendOtp = async () => {
    if (!canContinueWithPhone) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)
    clearError()
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: { shouldCreateUser: true },
      })
      if (signInError) throw signInError
      setMode('otp')
    } catch (sendError) {
      setError(sendError.message || 'Could not send OTP. Check your number and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError('Enter the OTP you received.')
      return
    }

    setLoading(true)
    clearError()
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      })
      if (verifyError) throw verifyError

      let profile = null
      try {
        profile = await getProfile(data.user.id)
      } catch {}

      if (!profile || !profile.name || profile.name === 'Local Resident') {
        setMode('signup')
        return
      }

      navigate(getRedirectPath())
    } catch (verifyError) {
      setError(verifyError.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSignup = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setLoading(true)
    clearError()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session expired. Please login again.')
      await upsertProfile({ id: user.id, name: name.trim(), phone: `+91${phone}`, role: 'resident' })
      navigate(getRedirectPath())
    } catch (saveError) {
      setError(saveError.message || 'Could not save your profile. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLocalOtp = () => {
    if (!canContinueWithPhone) { setError('Enter a valid 10-digit mobile number.'); return }
    clearError()
    setMode('otp')
  }

  const handleLocalSignup = () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    actions.login({
      id: `user_${Date.now()}`,
      name: name.trim(),
      phone: `+91${phone}`,
      locality: '',
      role: 'resident',
      isVerified: false,
      trustScore: 50,
      joinedAt: new Date().toISOString(),
      savedPosts: [],
      blockedUsers: [],
      postsCount: 0,
      helpCount: 0,
    })
    navigate('/home')
  }

  const renderPhoneStep = () => (
    <>
      <div>
        <div className={ui.loginTitle}>Login or sign up</div>
        <div className={cx(ui.loginSub, 'mt-1')}>
          We'll detect your locality automatically after you join.
        </div>
      </div>

      <div className={ui.formGroup}>
        <label className={ui.formLabel}>Mobile Number</label>
        <div className="flex gap-2">
          <div className="flex shrink-0 items-center rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-[15px] font-bold text-[var(--text-secondary)]">
            +91
          </div>
          <input
            className={ui.formInput}
            type="tel"
            placeholder="10-digit number"
            value={phone}
            onChange={event => {
              setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
              clearError()
            }}
            maxLength={10}
            autoFocus
          />
        </div>
      </div>

      {error && <div className="-mt-2 text-[13px] text-[var(--error)]">{error}</div>}

      <button
        className={cx(ui.btn, ui.btnPrimary, !canContinueWithPhone && 'cursor-not-allowed opacity-50')}
        onClick={isSupabaseConfigured ? handleSendOtp : handleLocalOtp}
        disabled={loading || !canContinueWithPhone}
      >
        {loading ? 'Sending OTP...' : 'Find my locality'}
      </button>

      {import.meta.env.DEV && (
        <>
          <div className={ui.divider}>or</div>
          <button
            className={cx(ui.btn, ui.btnSecondary, 'border-dashed text-[13px] text-[var(--text-secondary)]')}
            onClick={() => {
              const user = DEMO_USERS.find(demoUser => demoUser.role === 'resident') || DEMO_USERS[0]
              actions.previewLogin(user)
              navigate('/home')
            }}
          >
            Preview app (dev only)
          </button>
        </>
      )}

      <div className="text-center text-xs leading-snug text-[var(--text-muted)]">
        Your number is used only for verification. Never shared publicly.
      </div>
    </>
  )

  const renderOtpStep = () => (
    <>
      {!isSupabaseConfigured && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs leading-relaxed text-yellow-900">
          <strong>Demo mode:</strong> Enter any 6 digits. No real SMS is sent.
        </div>
      )}

      <button
        className="w-fit text-sm font-bold text-[var(--primary)]"
        onClick={() => {
          clearError()
          setMode('phone')
        }}
      >
        Back
      </button>

      <div>
        <div className={ui.loginTitle}>Enter OTP</div>
        <div className={cx(ui.loginSub, 'mt-1')}>Sent to +91 {phone}.</div>
      </div>

      <div className={ui.formGroup}>
        <label className={ui.formLabel}>OTP from SMS</label>
        <input
          className={cx(ui.formInput, 'text-center text-[22px] tracking-[8px]')}
          type="tel"
          placeholder="Enter OTP"
          value={otp}
          onChange={event => {
            setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
            clearError()
          }}
          maxLength={6}
          autoFocus
        />
      </div>

      {error && <div className="-mt-2 text-[13px] text-[var(--error)]">{error}</div>}

      <button
        className={cx(ui.btn, ui.btnPrimary, otp.length < 4 && 'cursor-not-allowed opacity-50')}
        onClick={isSupabaseConfigured ? handleVerifyOtp : () => setMode('signup')}
        disabled={loading || otp.length < 4}
      >
        {loading ? 'Verifying...' : 'Verify and continue'}
      </button>
    </>
  )

  const renderSignupStep = () => (
    <>
      <div>
        <div className={ui.loginTitle}>One last thing</div>
        <div className={cx(ui.loginSub, 'mt-1')}>What should we call you?</div>
      </div>

      <div className={ui.formGroup}>
        <label className={ui.formLabel}>Your name</label>
        <input
          className={ui.formInput}
          type="text"
          placeholder="First name is enough"
          value={name}
          onChange={event => { setName(event.target.value); clearError() }}
          autoFocus
        />
      </div>

      <div className="rounded-lg bg-[var(--bg)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-muted)]">
        📍 We'll detect your locality automatically after you join. You can always change it.
      </div>

      {error && <div className="text-[13px] text-[var(--error)]">{error}</div>}

      <button
        className={cx(ui.btn, ui.btnPrimary, !canCompleteProfile && 'cursor-not-allowed opacity-50')}
        onClick={isSupabaseConfigured ? handleCompleteSignup : handleLocalSignup}
        disabled={loading || !canCompleteProfile}
      >
        {loading ? 'Saving...' : 'Join LocalSetu'}
      </button>
    </>
  )

  return (
    <div className={ui.appShell}>
      <main className={cx(ui.appContainer, 'overflow-hidden')}>
        <div className="flex min-h-dvh flex-col bg-[var(--card)]">
          <div className={ui.loginHero}>
            <div className={ui.loginLogo}>
              Local<span className={ui.loginLogoAccent}>Setu</span>
            </div>
            <div className={ui.loginTagline} style={{ marginBottom: 12 }}>
              We connect to the world,<br />but forget to connect to our locality.
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
              Find local help, updates, services, and responses from people near your actual area.
            </div>
            {isSupabaseConfigured && (
              <div className="mt-3 text-[11px] text-white/40">Secured by Supabase</div>
            )}
          </div>

          <div className={ui.loginFormArea}>
            {mode === 'phone' && renderPhoneStep()}
            {mode === 'otp' && renderOtpStep()}
            {mode === 'signup' && renderSignupStep()}

            <div className="mt-2 rounded-[var(--radius-sm)] bg-[var(--bg)] p-3 text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
              LocalSetu never shows your exact location or phone number publicly.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
