// LocalSetu — PWA Install Prompt
// Shows a bottom banner inviting users to add the app to their home screen.
// Handles the beforeinstallprompt event (Chrome/Edge/Android).
// On iOS, shows a manual instruction banner.

import React, { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner]         = useState(false)
  const [isIOS, setIsIOS]                   = useState(false)
  const [dismissed, setDismissed]           = useState(false)

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if user previously dismissed
    try { if (localStorage.getItem('pwa_install_dismissed')) return } catch {}

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    if (ios) {
      // On iOS, Safari doesn't fire beforeinstallprompt — show manual hint after 30s
      const t = setTimeout(() => setShowBanner(true), 30000)
      return () => clearTimeout(t)
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    try { localStorage.setItem('pwa_install_dismissed', '1') } catch {}
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowBanner(false)
    if (outcome === 'accepted') {
      try { localStorage.setItem('pwa_install_dismissed', '1') } catch {}
    }
  }

  if (!showBanner || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 72, left: 16, right: 16, zIndex: 1000,
      background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      padding: '14px 16px', border: '1.5px solid var(--primary)',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <img src="/pwa-192.png" alt="LocalSetu" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
            Add LocalSetu to Home Screen
          </div>
          {isIOS ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Tap <strong>Share</strong> (↑) → <strong>Add to Home Screen</strong> for the app experience.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Works offline · Faster · No app store needed
            </div>
          )}
        </div>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>

      {!isIOS && deferredPrompt && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={install}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Install App
          </button>
          <button
            onClick={dismiss}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', fontSize: 14, cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            Not now
          </button>
        </div>
      )}
    </div>
  )
}
