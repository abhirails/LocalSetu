// LocalSetu — Razorpay frontend integration
// Dynamically loads the Razorpay checkout script and exposes a clean API.

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptLoaded = false

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (scriptLoaded || window.Razorpay) {
      scriptLoaded = true
      return resolve(true)
    }
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload  = () => { scriptLoaded = true; resolve(true) }
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.head.appendChild(script)
  })
}

/**
 * Full Razorpay payment flow:
 * 1. Calls /api/razorpay-create-order to get an order_id from Razorpay
 * 2. Opens the Razorpay modal (native checkout)
 * 3. On success, calls /api/razorpay-verify which checks signature + applies benefit
 *
 * @param {object} opts
 * @param {number}   opts.amount_paise     — Amount in paise (₹29 = 2900)
 * @param {string}   opts.description      — Shown in the checkout modal
 * @param {string}   opts.type             — 'boost' | 'society_pro' | 'business_listing'
 * @param {string}   opts.user_id          — Supabase user UUID
 * @param {string}   opts.user_name        — Pre-fills name in checkout
 * @param {string}   opts.user_email       — Pre-fills email
 * @param {string}   opts.user_phone       — Pre-fills phone (with country code)
 * @param {object}   opts.metadata         — Extra data forwarded to verify API
 * @param {function} opts.onSuccess        — Called with payment_id on success
 * @param {function} opts.onFailure        — Called with error message on failure
 */
export async function openRazorpayCheckout(opts) {
  const {
    amount_paise,
    description,
    type,
    user_id,
    user_name  = '',
    user_email = '',
    user_phone = '',
    metadata   = {},
    onSuccess,
    onFailure,
  } = opts

  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID

  // ── TEST MODE: no key configured ──────────────────────────
  if (!keyId || keyId === 'rzp_test_YOUR_KEY_ID') {
    console.warn('LocalSetu: VITE_RAZORPAY_KEY_ID not set — running in payment demo mode.')
    await new Promise(r => setTimeout(r, 1000)) // simulate network delay
    onSuccess && onSuccess({ payment_id: `demo_pay_${Date.now()}`, demo: true })
    return
  }

  try {
    await loadRazorpayScript()

    // 1. Create order server-side
    const orderRes = await fetch('/api/razorpay-create-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ amount_paise, currency: 'INR', notes: { type, user_id } }),
    })
    const orderData = await orderRes.json()
    if (!orderRes.ok || !orderData.order_id) {
      throw new Error(orderData.error || 'Failed to create payment order')
    }

    // 2. Open Razorpay modal
    await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key:         keyId,
        order_id:    orderData.order_id,
        amount:      orderData.amount,
        currency:    orderData.currency || 'INR',
        name:        'LocalSetu',
        description,
        image:       '/pwa-192.png',
        prefill: {
          name:    user_name,
          email:   user_email,
          contact: user_phone,
        },
        theme: { color: '#FF6B35' },
        handler: async (response) => {
          try {
            // 3. Verify signature + apply benefit
            const verifyRes = await fetch('/api/razorpay-verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                user_id,
                type,
                amount_paise,
                metadata,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
            onSuccess && onSuccess({ payment_id: response.razorpay_payment_id })
            resolve()
          } catch (err) {
            onFailure && onFailure(err.message)
            resolve()
          }
        },
        modal: {
          ondismiss: () => {
            // User closed modal without paying — not an error
            resolve()
          },
        },
      })
      rzp.on('payment.failed', (resp) => {
        onFailure && onFailure(resp.error?.description || 'Payment failed')
        resolve()
      })
      rzp.open()
    })
  } catch (err) {
    console.error('openRazorpayCheckout error:', err)
    onFailure && onFailure(err.message)
  }
}

/**
 * Convenience: returns true if Razorpay is configured (key present in env).
 * Used to decide whether to show real pay button vs demo note.
 */
export function isRazorpayConfigured() {
  const k = import.meta.env.VITE_RAZORPAY_KEY_ID
  return !!(k && k !== 'rzp_test_YOUR_KEY_ID')
}
