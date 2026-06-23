import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getProfile, upsertProfile } from '../lib/db'
import { DEMO_USERS } from '../data/demoData'

const LOCALITIES = [
  'Kharghar Sector 1-5', 'Kharghar Sector 6-12',
  'Kharghar Sector 13-20', 'Kharghar Sector 21-36',
  'Kamothe', 'Nerul', 'Ulwe', 'Panvel',
  'Bandra West', 'Bandra East', 'Powai'
]

export default function LoginScreen() {
  const { actions, isSupabaseConfigured: sbReady } = useApp()
  const navigate = useNavigate()

  const [mode, setMode]         = useState('welcome')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [phone, setPhone]       = useState('')
  const [otp, setOtp]           = useState('')
  const [name, setName]         = useState('')
  const [locality, setLocality] = useState('Kharghar Sector 13-20')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const clearError = () => setError('')

  const handleSendOtp = async () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit mobile number.'); return }
    setLoading(true); clearError()
    try {
      const { error: e } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: { shouldCreateUser: true }
      })
      if (e) throw e
      setMode('otp')
    } catch (e) {
      setError(e.message || 'Could not send OTP. Check your number and try again.')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setError('Enter the OTP you received.'); return }
    setLoading(true); clearError()
    try {
      const { data, error: e } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`, token: otp, type: 'sms'
      })
      if (e) throw e
      const userId = data.user.id
      let profile = null
      try { profile = await getProfile(userId) } catch {}
      if (!profile || !profile.name || profile.name === 'Local Resident') {
        setMode('signup')
      } else {
        navigate(getRedirectPath())
      }
    } catch (e) {
      setError(e.message || 'Invalid OTP. Please try again.')
    } finally { setLoading(false) }
  }

  const handleCompleteSignup = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setLoading(true); clearError()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await upsertProfile({ id: user.id, name: name.trim(), phone: `+91${phone}`, locality, role: 'resident' })
      navigate(getRedirectPath())
    } catch (e) {
      setError(e.message || 'Could not save your profile. Try again.')
    } finally { setLoading(false) }
  }

  const handleEmailLogin = async () => {
    if (!email || !password) { setError('Enter email and password.'); return }
    setLoading(true); clearError()
    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password })
      if (e) {
        const { error: se } = await supabase.auth.signUp({ email, password, options: { data: { name: name || email.split('@')[0] } } })
        if (se) throw se
      }
      navigate('/home')
    } catch (e) {
      setError(e.message || 'Login failed. Check credentials.')
    } finally { setLoading(false) }
  }

  const getRedirectPath = () => {
    const saved = sessionStorage.getItem('localsetu_redirect')
    if (saved) { sessionStorage.removeItem('localsetu_redirect'); return saved }
    return '/home'
  }

  const handleDemoLogin = (user) => { actions.login(user); navigate(getRedirectPath()) }

  return (
    <div className="app-container">
      <div className="login-screen">
        <div className="login-hero">
          <div className="login-logo">Local<span>Setu</span></div>
          <div className="login-tagline">Real help and updates from people near you. Kharghar se shuru karo.</div>
          {isSupabaseConfigured && (
            <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Secured by Supabase</div>
          )}
        </div>

        <div className="login-form-area">
          {mode === 'welcome' && (
            <>
              <div>
                <div className="login-title">Welcome</div>
                <div className="login-sub">Join your local community in minutes.</div>
              </div>
              {isSupabaseConfigured ? (
                <>
                  <button className="btn btn-primary" onClick={() => { clearError(); setMode('phone') }}>Login / Sign up with Phone</button>
                  <div className="divider">or</div>
                  <button className="btn btn-secondary" onClick={() => { clearError(); setMode('email') }}>Login with Email (for testing)</button>
                  <div className="divider">or</div>
                  <button style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }} onClick={() => { clearError(); setMode('demo') }}>
                    Try demo without login
                  </button>
                </>
              ) : (
                <>
                  <div style={{ background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: '#78350F', marginBottom: 4 }}>
                    Demo Mode — Supabase not configured yet.
                  </div>
                  <button className="btn btn-primary" onClick={() => { clearError(); setMode('demo') }}>Enter as Demo User</button>
                  <div className="divider">or</div>
                  <button className="btn btn-secondary" onClick={() => { clearError(); setMode('phone') }}>Login with Phone (preview)</button>
                </>
              )}
            </>
          )}

          {mode === 'phone' && (
            <>
              <button onClick={() => setMode('welcome')} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14, textAlign: 'left' }}>Back</button>
              <div className="login-title">Enter your mobile number</div>
              <div className="login-sub">We will send a one-time password via SMS.</div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 15, background: 'var(--bg)', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                    +91
                  </div>
                  <input className="form-input" type="tel" placeholder="10-digit number" value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError() }}
                    maxLength={10} autoFocus />
                </div>
              </div>
              {error && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: -8 }}>{error}</div>}
              <button className="btn btn-primary" onClick={isSupabaseConfigured ? handleSendOtp : () => setMode('otp')}
                disabled={loading || phone.length < 10} style={{ opacity: phone.length < 10 ? 0.5 : 1 }}>
                {loading ? 'Sending OTP...' : 'Get OTP'}
              </button>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Your number is used only for verification. Never shared publicly.
              </div>
            </>
          )}

          {mode === 'otp' && (
            <>
              <button onClick={() => setMode('phone')} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>Back</button>
              <div className="login-title">Enter OTP</div>
              <div className="login-sub">Sent to +91 {phone}.</div>
              <div className="form-group">
                <label className="form-label">{isSupabaseConfigured ? 'OTP from SMS' : 'OTP (any 4 digits for demo)'}</label>
                <input className="form-input" type="tel" placeholder="Enter OTP" value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError() }}
                  maxLength={6} autoFocus style={{ fontSize: 22, letterSpacing: 8, textAlign: 'center' }} />
              </div>
              {error && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: -8 }}>{error}</div>}
              <button className="btn btn-primary"
                onClick={isSupabaseConfigured ? handleVerifyOtp : () => setMode('signup')}
                disabled={loading || otp.length < 4} style={{ opacity: otp.length < 4 ? 0.5 : 1 }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </>
          )}

          {mode === 'signup' && (
            <>
              <div className="login-title">Almost there!</div>
              <div className="login-sub">Tell us a little about yourself.</div>
              <div className="form-group">
                <label className="form-label">Your name</label>
                <input className="form-input" type="text" placeholder="First name is enough" value={name}
                  onChange={e => { setName(e.target.value); clearError() }} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Your locality</label>
                <select className="form-select" value={locality} onChange={e => setLocality(e.target.value)}>
                  {LOCALITIES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  We only show your locality name, never your exact address.
                </div>
              </div>
              {error && <div style={{ color: 'var(--error)', fontSize: 13 }}>{error}</div>}
              <button className="btn btn-primary"
                onClick={isSupabaseConfigured ? handleCompleteSignup : () => {
                  const u = { id: 'user_' + Date.now(), name: name.trim() || 'Local Resident', phone, locality, role: 'resident', isVerified: false, trustScore: 50, joinedAt: new Date().toISOString(), savedPosts: [], blockedUsers: [], postsCount: 0, helpCount: 0 }
                  actions.login(u); navigate('/home')
                }}
                disabled={loading || !name.trim()} style={{ opacity: !name.trim() ? 0.5 : 1 }}>
                {loading ? 'Saving...' : 'Join LocalSetu'}
              </button>
            </>
          )}

          {mode === 'email' && (
            <>
              <button onClick={() => setMode('welcome')} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>Back</button>
              <div className="login-title">Email Login</div>
              <div style={{ background: 'var(--info-light)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--info)', marginBottom: 4 }}>
                For development and testing only.
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={email}
                  onChange={e => { setEmail(e.target.value); clearError() }} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Password" value={password}
                  onChange={e => { setPassword(e.target.value); clearError() }} />
              </div>
              {error && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: -8 }}>{error}</div>}
              <button className="btn btn-primary" onClick={handleEmailLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login / Create Account'}
              </button>
            </>
          )}

          {mode === 'demo' && (
            <>
              <button onClick={() => setMode('welcome')} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>Back</button>
              <div className="login-title">Demo Mode</div>
              <div className="login-sub">Pick a user to explore LocalSetu with pre-loaded data.</div>
              <div className="demo-login-options">
                {DEMO_USERS.filter(u => u.role !== 'admin').slice(0, 3).map(user => (
                  <button key={user.id} className="demo-user-btn" onClick={() => handleDemoLogin(user)}>
                    <div className="demo-user-avatar">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div className="demo-user-info">
                      <div className="demo-user-name">{user.name}</div>
                      <div className="demo-user-role">{user.locality} - {user.isVerified ? 'Verified' : 'Resident'}</div>
                    </div>
                  </button>
                ))}
                <button className="demo-user-btn" onClick={() => handleDemoLogin(DEMO_USERS.find(u => u.role === 'admin'))}
                  style={{ borderColor: 'var(--primary)', background: 'var(--primary-light)' }}>
                  <div className="demo-user-avatar" style={{ background: 'var(--primary)', color: 'white' }}>MJ</div>
                  <div className="demo-user-info">
                    <div className="demo-user-name">Meera Joshi</div>
                    <div className="demo-user-role">Admin / Moderator - Kharghar</div>
                  </div>
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: 8, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            LocalSetu never shows your exact location or phone number publicly.
          </div>
        </div>
      </div>
    </div>
  )
}
