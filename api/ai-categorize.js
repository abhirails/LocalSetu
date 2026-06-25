// Vercel Serverless Function — POST /api/ai-categorize
// Calls Anthropic Claude Haiku to suggest post type + category.
// Env vars required:
//   ANTHROPIC_API_KEY — from console.anthropic.com → API Keys

const https = require('https')

const SYSTEM_PROMPT = `You categorize posts for LocalSetu, a hyperlocal Indian community app in Kharghar/Navi Mumbai.

Post types and their categories:
- "right_now": things HAPPENING right now (observations, alerts, incidents)
  Categories: traffic, transport, police, water, power, weather, safety, civic, medical
- "need_it_now": things the user NEEDS or is REQUESTING
  Categories: borrow, rideshare, urgent, ticket, errand, need_to_buy

Mapping rules:
- Traffic jam, accident, road block → right_now / traffic
- Auto strike, train delay, bus issue → right_now / transport
- Police checking, nakabandi → right_now / police
- Water cut, low pressure, pani nahi → right_now / water
- Power cut, light gaya, MSEDCL → right_now / power
- Rain, storm, heat warning → right_now / weather
- Safety alert, suspicious activity → right_now / safety
- Garbage, streetlight, road pothole, NMMC, CIDCO civic issue → right_now / civic
- Medical emergency, blood needed, ambulance → right_now / medical
- Borrow an item, lend something, chahiye → need_it_now / borrow
- Cab share, airport ride, rideshare → need_it_now / rideshare
- Urgent help needed → need_it_now / urgent
- Spare ticket, extra ticket → need_it_now / ticket
- Local errand, delivery help → need_it_now / errand
- Want to buy something, item quote → need_it_now / need_to_buy

Respond ONLY with valid JSON. No explanation. Example: {"type":"right_now","category":"traffic","confidence":0.95}`

function callAnthropic(apiKey, messages, systemPrompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: systemPrompt,
      messages,
    })

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve({ ok: res.statusCode < 300, status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ ok: false, status: res.statusCode, body: null }) }
      })
    })

    req.on('error', reject)
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')) })
    req.write(payload)
    req.end()
  })
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'AI not configured' })

  const { content, postType } = req.body || {}
  if (!content || typeof content !== 'string' || content.trim().length < 15) {
    return res.status(400).json({ error: 'Content too short (min 15 chars)' })
  }

  const userMsg = postType
    ? `Post type is already "${postType}". Suggest the best category only (still return the type field). Post: "${content.slice(0, 400)}"`
    : `Categorize this post: "${content.slice(0, 400)}"`

  try {
    const result = await callAnthropic(apiKey, [{ role: 'user', content: userMsg }], SYSTEM_PROMPT)

    if (!result.ok || !result.body) {
      return res.status(502).json({ error: 'AI API error' })
    }

    const text = result.body?.content?.[0]?.text?.trim()
    if (!text) return res.status(502).json({ error: 'Empty AI response' })

    // Parse JSON from response (handle markdown code blocks too)
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(jsonStr)

    // Validate fields
    const validTypes = ['right_now', 'need_it_now']
    const validRnCats = ['traffic', 'transport', 'police', 'water', 'power', 'weather', 'safety', 'civic', 'medical']
    const validNinCats = ['borrow', 'rideshare', 'urgent', 'ticket', 'errand', 'need_to_buy']

    if (!validTypes.includes(parsed.type)) return res.status(422).json({ error: 'Invalid type from AI' })
    const validCats = parsed.type === 'right_now' ? validRnCats : validNinCats
    if (!validCats.includes(parsed.category)) return res.status(422).json({ error: 'Invalid category from AI' })

    return res.status(200).json({
      type: parsed.type,
      category: parsed.category,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.8)),
    })
  } catch (err) {
    console.error('ai-categorize error:', err.message)
    return res.status(500).json({ error: 'Internal error' })
  }
}
