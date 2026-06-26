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
    <>
      <div className="mb-6 relative z-10">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-[var(--navy)] mb-1">Verify your number</h2>
        <p className="text-[var(--text-secondary)] text-[14px]">Get helper recommendations &amp; local updates from neighbors.</p>
      </div>
      <div className="space-y-4 relative z-10">
        <div className="space-y-2">
          <label className="text-label-sm font-label-sm text-[var(--text-muted)] uppercase tracking-wider block">Mobile Number</label>
          <div className="flex items-center bg-[var(--bg-alt)] border border-[var(--card-border)] rounded-lg overflow-hidden focus-within:border-[var(--primary)] transition-colors duration-200">
            <div className="px-4 py-3 border-r border-[var(--card-border)] flex items-center gap-1.5 bg-gray-50 shrink-0">
              <span className="font-bold text-[var(--text-secondary)] text-sm">IN</span>
              <span className="text-[var(--text-primary)] font-bold text-sm">+91</span>
            </div>
            <input 
              id="login-phone"
              className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-[var(--text-primary)] font-semibold placeholder:text-[var(--text-muted)]/50 outline-none" 
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

        {error && (
          <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error-light)] px-3.5 py-2.5 text-[13px] text-[var(--error)] font-medium">
            ⚠️ {error}
          </div>
        )}

        <button 
          className={cx(
            "w-full py-4 text-white font-headline-lg-mobile text-headline-lg-mobile rounded-lg shadow-md btn-hover-effect transition-all duration-200",
            canContinueWithPhone && !loading
              ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)] active:scale-95 cursor-pointer"
              : "bg-[var(--primary)] opacity-50 grayscale cursor-not-allowed"
          )}
          onClick={isSupabaseConfigured ? handleSendOtp : handleLocalOtp}
          disabled={loading || !canContinueWithPhone}
          type="submit"
        >
          {loading ? 'Sending OTP…' : 'Get Verification Code'}
        </button>

        {import.meta.env.DEV && (
          <>
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-[var(--card-border)]"></div>
              <span className="absolute bg-white px-4 text-[var(--text-muted)] text-[12px]">or</span>
            </div>
            <div className="flex flex-col items-center">
              <button 
                className="flex items-center gap-1.5 text-[var(--primary)] font-semibold hover:underline decoration-2 underline-offset-4 bg-transparent cursor-pointer"
                onClick={() => {
                  const user = DEMO_USERS.find(demoUser => demoUser.role === 'resident') || DEMO_USERS[0]
                  actions.previewLogin(user)
                  navigate('/home')
                }}
              >
                <span className="material-symbols-outlined text-[18px] text-[var(--marigold)]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Preview App (Demo)
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )

  const renderOtpStep = () => (
    <>
      <div className="mb-6 relative z-10">
        <button
          className="mb-3 text-sm font-bold text-[var(--primary)] flex items-center gap-1 hover:underline bg-transparent"
          onClick={() => {
            clearError()
            setMode('phone')
          }}
        >
          <span>←</span> Change number
        </button>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-[var(--navy)] mb-1">Enter Code</h2>
        <p className="text-[var(--text-secondary)] text-[14px]">We sent a verification code to <strong>+91 {phone}</strong></p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 font-medium z-10 relative">
          💡 Enter any 6 digits to verify. No real SMS is sent.
        </div>
      )}

      <div className="space-y-4 relative z-10 flex flex-col items-center">
        <div className="space-y-2 w-full text-center">
          <label className="text-label-sm font-label-sm text-[var(--text-muted)] uppercase tracking-wider block text-left">Verification Code</label>
          <input 
            id="login-otp"
            className="w-full max-w-[180px] text-center text-2xl font-extrabold tracking-[0.3em] rounded-lg border border-[var(--card-border)] bg-[var(--bg-alt)] px-4 py-3 focus:border-[var(--primary)] focus:bg-white outline-none transition-all duration-200" 
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
          <div className="w-full rounded-lg border border-[var(--error)]/20 bg-[var(--error-light)] px-3.5 py-2.5 text-[13px] text-[var(--error)] font-medium">
            ⚠️ {error}
          </div>
        )}

        <button 
          className={cx(
            "w-full py-4 text-white font-headline-lg-mobile text-headline-lg-mobile rounded-lg shadow-md btn-hover-effect transition-all duration-200",
            otp.length >= 4 && !loading
              ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)] active:scale-95 cursor-pointer"
              : "bg-[var(--primary)] opacity-50 grayscale cursor-not-allowed"
          )}
          onClick={isSupabaseConfigured ? handleVerifyOtp : () => setMode('signup')}
          disabled={loading || otp.length < 4}
        >
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </button>
      </div>
    </>
  )

  const renderSignupStep = () => (
    <>
      <div className="mb-6 relative z-10">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-[var(--navy)] mb-1">Create Profile</h2>
        <p className="text-[var(--text-secondary)] text-[14px]">Let neighbors know what to call you.</p>
      </div>
      <div className="space-y-4 relative z-10">
        <div className="space-y-2">
          <label className="text-label-sm font-label-sm text-[var(--text-muted)] uppercase tracking-wider block">Your Name</label>
          <input 
            id="login-name"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-alt)] px-4 py-3 focus:border-[var(--primary)] focus:bg-white outline-none font-semibold text-lg text-[var(--text-primary)] transition-all duration-200" 
            placeholder="First name is enough" 
            type="text"
            autoComplete="name"
            value={name}
            onChange={event => { setName(event.target.value); clearError() }}
            autoFocus
          />
        </div>

        <div className="flex items-start gap-2 bg-[var(--primary)]/5 p-3 rounded-lg border border-[var(--primary)]/10 text-xs text-[var(--text-secondary)] leading-relaxed">
          <span>📍</span>
          <span>We'll detect your locality automatically after joining. You can modify it anytime in your profile.</span>
        </div>

        {error && (
          <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error-light)] px-3.5 py-2.5 text-[13px] text-[var(--error)] font-medium">
            ⚠️ {error}
          </div>
        )}

        <button 
          className={cx(
            "w-full py-4 text-white font-headline-lg-mobile text-headline-lg-mobile rounded-lg shadow-md btn-hover-effect transition-all duration-200",
            canCompleteProfile && !loading
              ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)] active:scale-95 cursor-pointer"
              : "bg-[var(--primary)] opacity-50 grayscale cursor-not-allowed"
          )}
          onClick={isSupabaseConfigured ? handleCompleteSignup : handleLocalSignup}
          disabled={loading || !canCompleteProfile}
        >
          {loading ? 'Joining…' : 'Join LocalSetu'}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen w-full justify-center bg-[var(--bg)] jaali-pattern py-8 px-4 sm:items-center sm:py-16">
      <main className="w-full max-w-[600px] min-h-screen sm:min-h-0 bg-white/95 backdrop-blur-sm flex flex-col px-6 py-10 sm:p-10 rounded-2xl shadow-xl border border-[var(--card-border)]/55 relative overflow-hidden">
        {/* Soft background glows */}
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-[96px] pointer-events-none" />
        <div className="absolute -left-24 bottom-1/4 w-80 h-80 rounded-full bg-[var(--marigold)]/5 blur-[80px] pointer-events-none" />

        {/* Header / Logo Section */}
        <header className="flex flex-col items-center pt-4 mb-8">
          {/* Logo Mark & Name */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--saffron)]/10 opacity-50"></div>
              <span className="material-symbols-outlined text-white relative z-10 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>home_pin</span>
            </div>
            <span className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold tracking-tight text-[var(--navy)]">
              Local<span className="text-[var(--primary)]">Setu</span>
            </span>
          </div>

          {/* Tagline Headline */}
          <div className="text-center sm:text-left w-full space-y-4">
            <h1 className="font-headline-xl text-headline-xl text-[var(--navy)] leading-tight text-center sm:text-left">
              You've connected to the world.<br />
              <span className="text-[var(--primary)]">Now, connect with your local community.</span>
            </h1>
            <p className="text-[var(--text-secondary)] font-body-md leading-relaxed text-center sm:text-left">
              Connect with verified neighbors for real help, live safety updates, and recommendations in your area.
            </p>
          </div>
        </header>

        {/* Status Pills */}
        <section className="flex flex-wrap gap-2.5 mb-8 justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20">
            <span className="material-symbols-outlined text-[16px] text-[var(--primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>sensors</span>
            <span className="text-label-sm font-label-sm text-[var(--primary)]">Live updates</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--saffron)]/10 border border-[var(--saffron)]/30">
            <span className="material-symbols-outlined text-[16px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-label-sm font-label-sm text-[var(--navy)]">Verified help</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--marigold)]/10 border border-[var(--marigold)]/30">
            <span className="material-symbols-outlined text-[16px] text-[var(--marigold)]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span className="text-label-sm font-label-sm text-[var(--navy)]">Need it now</span>
          </div>
        </section>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center mb-8 opacity-25">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent"></div>
          <span className="material-symbols-outlined text-[var(--primary)] px-4">flare</span>
          <div className="h-px w-full bg-gradient-to-r from-[var(--primary)] via-[var(--primary)] to-transparent"></div>
        </div>

        {/* Login Card */}
        <section className="bg-white border border-[var(--card-border)] rounded-xl p-6 shadow-sm relative overflow-hidden w-full max-w-[320px] mx-auto mb-8">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--marigold)]/5 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
          
          {mode === 'phone' && renderPhoneStep()}
          {mode === 'otp' && renderOtpStep()}
          {mode === 'signup' && renderSignupStep()}
        </section>

        {/* Visual Anchor / Image */}
        <div className="mt-2 mb-8 rounded-xl overflow-hidden aspect-video relative shadow-inner w-full max-w-[320px] mx-auto">
          <img 
            alt="Vibrant Indian neighborhood street" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8aHI3L4UjSpjrMS3rI3t_lbTdLMwa_7EHY67zJJAV-biD_GhVwYapstpqbgLSR7BefnTTKtOez0hk4FymXPmZzMsbgKXHgkIDC-U6ISspxuqlLgykXBg36orMRPbz-HvLnMMPDSO9Cmwg_gdEVaJ1oAdunaJMBPfm0RrcVXybl1sCJSVWtlIDUUiUCN3zAICh-GAHBeOZS2V72ypnNlgSMnzWhaRuMFseW-Hxwrsgk7RDlijIV9NCxFC2kjhq6Te-Oke9cF8wJ1JP"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/90 via-transparent to-transparent"></div>
        </div>

        {/* Footer Notice */}
        <footer className="mt-auto pt-6 text-center flex flex-col items-center border-t border-[var(--border-light)]">
          <div className="max-w-[90%] flex items-start gap-2.5 bg-[var(--primary)]/5 p-4 rounded-xl border border-[var(--primary)]/10">
            <span className="material-symbols-outlined text-[var(--marigold)] text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <p className="text-[12px] text-left text-[var(--text-secondary)] leading-normal">
              Your mobile number is only used for secure login. It is never displayed publicly or shared with anyone in your area.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
