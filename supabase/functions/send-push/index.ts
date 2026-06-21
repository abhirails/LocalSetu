// LocalSetu — Supabase Edge Function: send-push
// Sends a Web Push notification to one or all subscribers for a user.
//
// Expected request body:
// {
//   user_id: string,          // target user's UUID
//   title: string,
//   body: string,
//   url?: string,             // deep link (e.g. /post/abc)
//   tag?: string              // notification dedup tag
// }
//
// Required environment variables (set in Supabase Dashboard → Edge Functions → Secrets):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT        e.g. "mailto:hello@localsetu.in"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Minimal VAPID / Web Push implementation ──
// Deno does not have the Node web-push library, so we implement the
// necessary crypto inline using the WebCrypto API.

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

  // Import private key
  const privKeyBytes = base64urlToUint8Array(privateKeyB64)
  // Convert raw 32-byte private key to JWK for import
  const pubKeyBytes = base64urlToUint8Array(publicKeyB64)
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: uint8ArrayToBase64url(pubKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64url(pubKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64url(privKeyBytes),
    ext: true
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const sigBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const sig = uint8ArrayToBase64url(new Uint8Array(sigBytes))
  return `${signingInput}.${sig}`
}

async function sendWebPush(sub: {
  endpoint: string
  p256dh: string
  auth: string
}, payload: object, vapid: {
  publicKey: string
  privateKey: string
  subject: string
}): Promise<Response> {
  const url = new URL(sub.endpoint)
  const audience = `${url.protocol}//${url.host}`

  const jwt = await generateVapidJWT(audience, vapid.subject, vapid.publicKey, vapid.privateKey)

  const body = JSON.stringify(payload)

  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
      'Authorization': `vapid t=${jwt},k=${vapid.publicKey}`,
      'Content-Encoding': 'aesgcm'
    },
    body
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { user_id, title, body, url, tag } = await req.json()

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'user_id, title, body required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
    const serviceKey     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivKey   = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidSubject   = Deno.env.get('VAPID_SUBJECT') || 'mailto:hello@localsetu.in'

    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch all push subscriptions for this user
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (subErr) throw subErr
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const pushPayload = { title, body, url: url || '/', tag: tag || 'localsetu' }
    const vapid = { publicKey: vapidPublicKey, privateKey: vapidPrivKey, subject: vapidSubject }

    let sent = 0
    let failed = 0
    const staleEndpoints: string[] = []

    for (const sub of subs) {
      try {
        const res = await sendWebPush(sub, pushPayload, vapid)
        if (res.status === 201 || res.status === 200) {
          sent++
        } else if (res.status === 404 || res.status === 410) {
          // Subscription expired / unsubscribed — clean up
          staleEndpoints.push(sub.endpoint)
          failed++
        } else {
          failed++
          console.error('push failed', sub.endpoint, res.status, await res.text())
        }
      } catch (e) {
        failed++
        console.error('push error', e)
      }
    }

    // Remove stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', staleEndpoints)
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
