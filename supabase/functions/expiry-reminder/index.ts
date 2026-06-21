// LocalSetu — Supabase Edge Function: expiry-reminder
// Runs on a schedule (pg_cron every hour).
// Finds Right Now posts expiring in the next 2 hours,
// sends a push notification to each post author asking "Still happening?".
//
// Schedule setup (run once in SQL Editor):
//   select cron.schedule(
//     'expiry-reminder-hourly',
//     '0 * * * *',
//     $$
//       select net.http_post(
//         url := 'https://<PROJECT_REF>.supabase.co/functions/v1/expiry-reminder',
//         headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb,
//         body := '{}'::jsonb
//       );
//     $$
//   );
//
// Required env vars (same as send-push):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  return Uint8Array.from([...binary].map(c => c.charCodeAt(0)))
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateVapidJWT(
  audience: string,
  subject: string,
  publicKeyB64: string,
  privateKeyB64: string
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject }

  const encode = (obj: object) =>
    uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(obj)))

  const signingInput = `${encode(header)}.${encode(payload)}`

  const pubKeyBytes = base64urlToUint8Array(publicKeyB64)
  const privKeyBytes = base64urlToUint8Array(privateKeyB64)

  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: uint8ArrayToBase64url(pubKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64url(pubKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64url(privKeyBytes),
    ext: true
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  )

  const sigBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  return `${signingInput}.${uint8ArrayToBase64url(new Uint8Array(sigBytes))}`
}

async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapid: { publicKey: string; privateKey: string; subject: string }
): Promise<{ ok: boolean; status: number }> {
  const url = new URL(sub.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const jwt = await generateVapidJWT(audience, vapid.subject, vapid.publicKey, vapid.privateKey)

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '3600',
      'Authorization': `vapid t=${jwt},k=${vapid.publicKey}`,
      'Content-Encoding': 'aesgcm'
    },
    body: JSON.stringify(payload)
  })
  return { ok: res.ok, status: res.status }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceKey     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivKey   = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidSubject   = Deno.env.get('VAPID_SUBJECT') || 'mailto:hello@localsetu.in'

    const supabase = createClient(supabaseUrl, serviceKey)

    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    // Find Right Now posts expiring in next 0–2 hours that are still active
    // and haven't had a reminder sent yet (we track via `reminder_sent_at`)
    const { data: expiringPosts, error: postsErr } = await supabase
      .from('posts')
      .select('id, user_id, content, expires_at, locality')
      .eq('type', 'right_now')
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .lte('expires_at', twoHoursFromNow.toISOString())
      .is('reminder_sent_at', null)  // only unsent reminders

    if (postsErr) throw postsErr

    if (!expiringPosts || expiringPosts.length === 0) {
      return new Response(JSON.stringify({ checked: 0, notified: 0 }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const vapid = { publicKey: vapidPublicKey, privateKey: vapidPrivKey, subject: vapidSubject }
    let notified = 0
    const staleEndpoints: string[] = []

    for (const post of expiringPosts) {
      // Get push subscriptions for this user
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', post.user_id)

      if (!subs || subs.length === 0) continue

      const hoursLeft = Math.round((new Date(post.expires_at).getTime() - now.getTime()) / 3600000)
      const preview = post.content.length > 60 ? post.content.slice(0, 60) + '...' : post.content

      const pushPayload = {
        title: 'Is this still happening?',
        body: `Your update "${preview}" expires in ~${hoursLeft}h. Tap to confirm.`,
        url: `/post/${post.id}`,
        tag: `expiry-${post.id}`
      }

      for (const sub of subs) {
        try {
          const { ok, status } = await sendWebPush(sub, pushPayload, vapid)
          if (ok) {
            notified++
          } else if (status === 404 || status === 410) {
            staleEndpoints.push(sub.endpoint)
          }
        } catch (e) {
          console.error('push error', e)
        }
      }

      // Mark reminder as sent so we don't spam
      await supabase
        .from('posts')
        .update({ reminder_sent_at: now.toISOString() })
        .eq('id', post.id)
    }

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints)
    }

    return new Response(
      JSON.stringify({ checked: expiringPosts.length, notified }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
