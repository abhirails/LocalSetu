// LocalSetu — useNotifications hook
import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

async function saveSubscription(userId, subscription) {
  if (!isSupabaseConfigured) return
  const sub = subscription.toJSON()
  await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,endpoint' })
}

async function deleteSubscription(userId, endpoint) {
  if (!isSupabaseConfigured) return
  await supabase.from('push_subscriptions').delete().match({ user_id: userId, endpoint })
}

export function useNotifications(userId) {
  const [status, setStatus] = useState('idle')
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    if (Notification.permission === 'denied') { setStatus('denied'); return }
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        if (sub) { setSubscription(sub); setStatus('granted') } else { setStatus('idle') }
      })
    }).catch(() => setStatus('idle'))
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return false
    }
    setStatus('subscribing')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return false }
      if (!VAPID_PUBLIC_KEY) {
        console.error('LocalSetu: VITE_VAPID_PUBLIC_KEY is not set')
        setStatus('error'); return false
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      setSubscription(sub); setStatus('granted')
      if (userId) await saveSubscription(userId, sub)
      return true
    } catch (e) {
      console.error('LocalSetu: push subscription failed', e)
      setStatus('error'); return false
    }
  }, [userId])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    try {
      await subscription.unsubscribe()
      if (userId) await deleteSubscription(userId, subscription.endpoint)
      setSubscription(null); setStatus('idle')
    } catch (e) {
      console.error('LocalSetu: unsubscribe failed', e)
    }
  }, [subscription, userId])

  return { status, subscription, requestPermission, unsubscribe }
}
