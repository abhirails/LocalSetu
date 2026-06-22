// Vercel Serverless Function — POST /api/razorpay-create-order
// Creates a Razorpay order server-side so key_secret never reaches the browser.
// Env vars required (set in Vercel dashboard):
//   RAZORPAY_KEY_ID     — your Razorpay key id (rzp_live_... or rzp_test_...)
//   RAZORPAY_KEY_SECRET — your Razorpay key secret (never expose to frontend)

const https = require('https')

function razorpayRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const keyId     = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      return reject(new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel env.'))
    }
    const auth    = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const payload = JSON.stringify(body)
    const options = {
      hostname: 'api.razorpay.com',
      path,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

module.exports = async function handler(req, res) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount_paise, currency = 'INR', receipt, notes = {} } = req.body

    if (!amount_paise || amount_paise < 100) {
      return res.status(400).json({ error: 'amount_paise must be >= 100 (₹1 minimum)' })
    }

    const { status, body } = await razorpayRequest('POST', '/v1/orders', {
      amount:   amount_paise,
      currency,
      receipt:  receipt || `rcpt_${Date.now()}`,
      notes,
    })

    if (status !== 200) {
      console.error('Razorpay create-order error:', body)
      return res.status(status).json({ error: body.error?.description || 'Razorpay error' })
    }

    return res.status(200).json({ order_id: body.id, amount: body.amount, currency: body.currency })
  } catch (err) {
    console.error('razorpay-create-order error:', err)
    return res.status(500).json({ error: err.message })
  }
}
