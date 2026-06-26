import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_USERS } from '../data/demoData'
import { useApp } from '../context/AppContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getProfile, upsertProfile } from '../lib/db'
import { cx } from '../lib/ui'

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
    <div className="relative z-10 space-y-6">
      <div className="space-y-1">
        <h3 className="font-headline-md text-[20px] text-[var(--navy)] font-semibold">Verify your number</h3>
        <p className="font-body-sm text-body-sm text-[var(--text-secondary)]">Get helper recommendations &amp; local updates from neighbors.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="font-label-sm text-label-sm text-[var(--text-muted)] uppercase tracking-wider pl-1">Mobile Number</label>
          <div className="flex gap-2">
            <div className="flex items-center justify-center bg-white border border-[var(--card-border)] rounded-xl px-4 font-body-md text-body-md text-[var(--navy)] min-w-[80px] font-semibold">
              IN +91
            </div>
            <div className="flex-1 relative group">
              <input 
                id="login-phone"
                className="w-full bg-white border border-[var(--card-border)] rounded-xl px-4 py-3 font-body-md text-body-md text-[var(--navy)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all outline-none placeholder:text-[var(--text-muted)]/50 font-semibold" 
                maxLength="10" 
                placeholder="10-digit number" 
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={event => {
                  setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
                  clearError()
                }}
                autoFocus
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error-light)] px-3.5 py-2.5 text-xs text-[var(--error)] font-medium">
            ⚠️ {error}
          </div>
        )}

        <button 
          className={cx(
            "w-full text-white font-label-md text-label-md py-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-[var(--primary)]/20 cursor-pointer block text-center font-bold",
            loading
              ? "bg-[var(--primary)] opacity-50 cursor-not-allowed"
              : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
          )}
          onClick={isSupabaseConfigured ? handleSendOtp : handleLocalOtp}
          disabled={loading}
          type="submit"
        >
          {loading ? 'Sending OTP…' : 'Get Verification Code'}
        </button>
      </div>

      {import.meta.env.DEV && (
        <>
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-[var(--card-border)]/40"></div>
            <span className="font-label-sm text-label-sm text-[var(--text-muted)]">or</span>
            <div className="h-[1px] flex-1 bg-[var(--card-border)]/40"></div>
          </div>
          <button 
            className="w-full flex items-center justify-center gap-2 text-[var(--primary-dark)] font-label-md text-label-md hover:bg-[var(--primary)]/5 py-2 rounded-lg transition-colors cursor-pointer"
            onClick={() => {
              const user = DEMO_USERS.find(demoUser => demoUser.role === 'resident') || DEMO_USERS[0]
              actions.previewLogin(user)
              navigate('/home')
            }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            Preview App (Demo)
          </button>
        </>
      )}
    </div>
  )

  const renderOtpStep = () => (
    <div className="relative z-10 space-y-6">
      <div className="space-y-1">
        <button
          className="mb-3 text-xs font-bold text-[var(--primary)] flex items-center gap-1 hover:underline bg-transparent"
          onClick={() => {
            clearError()
            setMode('phone')
          }}
        >
          <span>←</span> Change number
        </button>
        <h3 className="font-headline-md text-[20px] text-[var(--navy)] font-semibold">Enter Code</h3>
        <p className="font-body-sm text-body-sm text-[var(--text-secondary)]">We sent a verification code to <strong>+91 {phone}</strong></p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 font-medium">
          💡 Enter any 6 digits to verify. No real SMS is sent.
        </div>
      )}

      <div className="space-y-4 flex flex-col items-center">
        <div className="space-y-1.5 w-full text-center">
          <label className="font-label-sm text-label-sm text-[var(--text-muted)] uppercase tracking-wider pl-1 text-left block">Verification Code</label>
          <input 
            id="login-otp"
            className="w-full max-w-[180px] text-center text-2xl font-extrabold tracking-[0.3em] rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all duration-200" 
            maxLength="6" 
            placeholder="••••••" 
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={event => {
              setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
              clearError()
            }}
            autoFocus
          />
        </div>

        {error && (
          <div className="w-full rounded-xl border border-[var(--error)]/20 bg-[var(--error-light)] px-3.5 py-2.5 text-xs text-[var(--error)] font-medium">
            ⚠️ {error}
          </div>
        )}

        <button 
          className={cx(
            "w-full text-white font-label-md text-label-md py-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-[var(--primary)]/20 cursor-pointer block text-center font-bold",
            loading
              ? "bg-[var(--primary)] opacity-50 cursor-not-allowed"
              : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
          )}
          onClick={isSupabaseConfigured ? handleVerifyOtp : () => {
            if (otp.length < 4) {
              setError('Enter the OTP you received.')
              return
            }
            setMode('signup')
          }}
          disabled={loading}
        >
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </button>
      </div>
    </div>
  )

  const renderSignupStep = () => (
    <div className="relative z-10 space-y-6">
      <div className="space-y-1">
        <h3 className="font-headline-md text-[20px] text-[var(--navy)] font-semibold">Create Profile</h3>
        <p className="font-body-sm text-body-sm text-[var(--text-secondary)]">Let neighbors know what to call you.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="font-label-sm text-label-sm text-[var(--text-muted)] uppercase tracking-wider pl-1">Your Name</label>
          <input 
            id="login-name"
            className="w-full bg-white border border-[var(--card-border)] rounded-xl px-4 py-3 font-body-md text-body-md text-[var(--navy)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none transition-all duration-200 font-semibold" 
            placeholder="First name is enough" 
            type="text"
            autoComplete="name"
            value={name}
            onChange={event => { setName(event.target.value); clearError() }}
            autoFocus
          />
        </div>

        <div className="flex items-start gap-2 bg-[var(--primary)]/5 p-3 rounded-xl border border-[var(--primary)]/10 text-xs text-[var(--text-secondary)] leading-relaxed">
          <span>📍</span>
          <span>We'll detect your locality automatically after joining. You can modify it anytime in your profile.</span>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--error-light)] px-3.5 py-2.5 text-xs text-[var(--error)] font-medium">
            ⚠️ {error}
          </div>
        )}

        <button 
          className={cx(
            "w-full text-white font-label-md text-label-md py-4 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-[var(--primary)]/20 cursor-pointer block text-center font-bold",
            loading
              ? "bg-[var(--primary)] opacity-50 cursor-not-allowed"
              : "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
          )}
          onClick={isSupabaseConfigured ? handleCompleteSignup : () => {
            if (!name.trim()) {
              setError('Please enter your name.')
              return
            }
            handleLocalSignup()
          }}
          disabled={loading}
        >
          {loading ? 'Joining…' : 'Join LocalSetu'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <main className="w-full max-w-[480px] flex flex-col items-center">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center mb-3 shadow-lg">
            <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-[var(--navy)] flex items-center gap-1">
            Local<span className="text-[var(--primary)] font-bold">Setu</span>
          </h1>
        </div>

        {/* Main Content Card */}
        <div className="glass-card w-full rounded-[32px] p-6 md:p-10 custom-shadow flex flex-col space-y-8">
          {/* Hero Text */}
          <section className="space-y-4">
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-[var(--navy)] leading-tight">
              You've connected to the world. <br />
              <span className="text-[var(--primary)] font-bold">Now, connect with your local community.</span>
            </h2>
            <p className="font-body-md text-body-md text-[var(--text-secondary)]">
              Connect with verified neighbors for real help, live safety updates, and recommendations in your area.
            </p>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--primary-light)] rounded-full border border-[var(--card-border)]/30 text-[var(--primary)] font-label-md text-label-md font-bold">
                <span className="material-symbols-outlined text-sm">sensors</span>
                Live updates
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--saffron)]/10 rounded-full border border-[var(--saffron)]/30 text-[var(--marigold)] font-label-md text-label-md font-bold">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Verified help
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--primary-light)] rounded-full border border-[var(--primary-dark)]/30 text-[var(--primary-dark)] font-label-md text-label-md font-bold">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Need it now
              </span>
            </div>
          </section>

          {/* Authentication Form Card */}
          <section className="bg-[var(--bg-alt)] rounded-2xl p-6 border border-[var(--card-border)]/20 relative overflow-hidden w-full">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[var(--primary)]/5 rounded-full blur-2xl pointer-events-none"></div>
            
            {mode === 'phone' && renderPhoneStep()}
            {mode === 'otp' && renderOtpStep()}
            {mode === 'signup' && renderSignupStep()}
          </section>

          {/* Community Illustration (Device Mockup Frame) */}
          <div className="w-full rounded-[24px] border-[10px] border-[#a7b5a8] bg-[#f8fafc] shadow-lg relative aspect-[16/9] overflow-hidden group">
            {/* Notch/Speaker slot on the left bezel */}
            <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-black/25 rounded-full z-20"></div>
            
            <video 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              src="/people.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
          </div>

          {/* Trust Footer */}
          <div className="bg-[var(--primary-light)] rounded-xl p-4 flex gap-3 items-start border border-[var(--card-border)]/10">
            <span className="material-symbols-outlined text-[var(--marigold)] pt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <p className="font-body-sm text-body-sm text-[var(--text-secondary)] leading-relaxed">
              Your mobile number is only used for secure login. It is never displayed publicly or shared with anyone in your area.
            </p>
          </div>
        </div>

        {/* System Status/Help */}
        <footer className="mt-8 flex justify-center gap-8 font-label-sm text-label-sm text-[var(--text-muted)]">
          <a className="hover:text-[var(--primary)] transition-colors" href="#privacy">Privacy Policy</a>
          <a className="hover:text-[var(--primary)] transition-colors" href="#terms">Terms of Service</a>
          <a className="hover:text-[var(--primary)] transition-colors" href="#support">Contact Support</a>
        </footer>
      </main>
    </div>
  )
}
