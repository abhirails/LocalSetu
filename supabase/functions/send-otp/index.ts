/**
 * LocalSetu — Supabase Auth Hook: Custom SMS OTP via 2Factor.in
 *
 * Supabase calls this Edge Function whenever it needs to send an OTP SMS.
 * We relay the OTP to 2Factor.in's transactional API.
 *
 * Setup:
 *  1. Deploy: supabase functions deploy send-otp --no-verify-jwt
 *  2. Set secret: supabase secrets set TWOFACTOR_API_KEY=your_key_here
 *  3. In Supabase Dashboard → Auth → Hooks → "Send SMS" → set URL to this function
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const TWOFACTOR_API_KEY = Deno.env.get('TWOFACTOR_API_KEY')

// 2Factor.in OTP template name (set to 'AUTOGEN' to use their auto-generated template,
// or replace with your DLT-registered template name e.g. 'LOCALSETU_OTP')
const TEMPLATE_NAME = Deno.env.get('TWOFACTOR_TEMPLATE') ?? 'AUTOGEN'

serve(async (req: Request) => {
  // Supabase Auth Hook sends a POST with JSON body
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: { phone: string; otp: string; user_id?: string }
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { phone, otp } = payload

  if (!phone || !otp) {
    return new Response(JSON.stringify({ error: 'Missing phone or otp' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!TWOFACTOR_API_KEY) {
    console.error('TWOFACTOR_API_KEY secret is not set')
    return new Response(JSON.stringify({ error: 'SMS provider not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Normalise phone: 2Factor.in expects 10-digit number without country code
  // Supabase passes it as +91XXXXXXXXXX
  const normalised = phone.replace(/^\+91/, '').replace(/\D/g, '')
  if (normalised.length !== 10) {
    return new Response(JSON.stringify({ error: `Invalid Indian phone number: ${phone}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2Factor.in Transactional OTP API
  // Docs: https://help.2factor.in/hc/en-us/articles/360009457233
  const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${normalised}/${otp}/${TEMPLATE_NAME}`

  let apiResponse: Response
  try {
    apiResponse = await fetch(url)
  } catch (err) {
    console.error('2Factor.in network error:', err)
    return new Response(JSON.stringify({ error: 'SMS provider unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const result = await apiResponse.json()

  // 2Factor returns { Status: 'Success', Details: 'session_id' } on success
  if (result?.Status !== 'Success') {
    console.error('2Factor.in error:', JSON.stringify(result))
    return new Response(
      JSON.stringify({ error: 'SMS delivery failed', details: result }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  console.log(`OTP sent to ${normalised} via 2Factor.in — session: ${result.Details}`)

  // Supabase Auth Hook expects a 200 with empty body (or { }) on success
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
