// Vercel Serverless Function — POST /api/razorpay-verify
// Verifies the payment signature and marks payment captured in Supabase.
// Env vars required:
//   RAZORPAY_KEY_SECRET        — to verify HMAC signature
//   SUPABASE_SERVICE_ROLE_KEY  — to write to Supabase (bypasses RLS)
//   VITE_SUPABASE_URL          — Supabase project URL (same as frontend)

const crypto = require('crypto')
const https  = require('https')

// Minimal Supabase REST helper using service_role key
function supabaseRpc(url, serviceKey, table, method, body, filters = '') {
  return new Promise((resolve, reject) => {
    const path    = `/rest/v1/${table}${filters}`
    const payload = JSON.stringify(body)
    const options = {
      hostname: new URL(url).hostname,
      path,
      method,
      headers: {
        'apikey':          serviceKey,
        'Authorization':   `Bearer ${serviceKey}`,
        'Content-Type':    'application/json',
        'Prefer':          'return=minimal',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    if (payload && method !== 'GET') req.write(payload)
    req.end()
  })
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Payment metadata
      user_id,
      type,           // 'boost' | 'society_pro' | 'business_listing'
      amount_paise,
      metadata = {},  // e.g. { post_id, hours } for boost
    } = req.body

    const keySecret    = process.env.RAZORPAY_KEY_SECRET
    const supabaseUrl  = process.env.VITE_SUPABASE_URL
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!keySecret) return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not set' })
    if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase env vars not set' })

    // 1. Verify signature — prevents fake payment confirmations
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      console.warn('Signature mismatch for order', razorpay_order_id)
      return res.status(400).json({ error: 'Payment verification failed — signature mismatch' })
    }

    // 2. Upsert payment record into Supabase
    await supabaseRpc(supabaseUrl, serviceKey, 'payments', 'POST', {
      user_id,
      type,
      amount_paise,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status:   'captured',
      metadata,
    })

    // 3. Apply the benefit based on payment type
    if (type === 'boost' && metadata.post_id && metadata.hours) {
      const boostedUntil = new Date(Date.now() + metadata.hours * 3600000).toISOString()
      await supabaseRpc(
        supabaseUrl, serviceKey, `posts?id=eq.${metadata.post_id}`,
        'PATCH', { is_boosted: true, boosted_until: boostedUntil }
      )
    }

    if (type === 'society_pro' && metadata.society_id) {
      const proExpiresAt = new Date(Date.now() + 365 * 24 * 3600000).toISOString()
      await supabaseRpc(
        supabaseUrl, serviceKey, `societies?id=eq.${metadata.society_id}`,
        'PATCH', { is_pro: true, pro_expires_at: proExpiresAt }
      )
    }

    if (type === 'business_listing' && metadata.business_id) {
      const planExpiresAt = new Date(Date.now() + (metadata.plan_months || 1) * 30 * 24 * 3600000).toISOString()
      await supabaseRpc(
        supabaseUrl, serviceKey, `businesses?id=eq.${metadata.business_id}`,
        'PATCH', { is_verified: true, plan_expires_at: planExpiresAt, plan: metadata.plan || 'basic' }
      )
    }

    return res.status(200).json({ success: true, payment_id: razorpay_payment_id })
  } catch (err) {
    console.error('razorpay-verify error:', err)
    return res.status(500).json({ error: err.message })
  }
}
