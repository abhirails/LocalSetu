/**
 * aiAssist.js — Smart Post Assistant
 *
 * Phase 1: Mock/rule-based engine (zero cost, works offline)
 * Phase 3: Set VITE_AI_PROVIDER=real to call /api/ai-categorize instead
 *
 * Feature flag: VITE_AI_ENABLED=true (default: off)
 */

export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true'
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'mock'

// ─────────────────────────────────────────────
// KEYWORD RULES
// ─────────────────────────────────────────────

// need_it_now keywords (check first — more specific)
const NEED_KEYWORDS = [
  'chahiye', 'need', 'want', 'borrow', 'lend', 'looking for', 'anyone have',
  'koi hai', 'mil sakta', 'de sakte', 'share karo', 'help me', 'mujhe',
  'ride', 'lift', 'going to', 'airport drop', 'ticket', 'buy', 'purchase',
  'khareedna', 'quote', 'ke liye chahiye', 'lena hai', 'use karna hai',
]

// right_now keywords
const RIGHTNOW_KEYWORDS = [
  'nahi aa raha', 'ho raha', 'happening', 'traffic', 'jam', 'strike', 'bandh',
  'accident', 'khatam', 'cut', 'gaya', 'no water', 'no power', 'no light',
  'checking', 'nakabandi', 'found', 'mila', 'alert', 'warning', 'issue',
  'problem', 'hai abhi', 'right now', 'abhi', 'since morning', 'since hours',
]

const CATEGORY_RULES = [
  { cat: 'water',      words: ['pani', 'paani', 'water', 'pressure', 'supply', 'tap', 'cidco water', 'jal board', 'no water', 'nahi aa raha pani'] },
  { cat: 'power',      words: ['light', 'electricity', 'current', 'power', 'msedcl', 'bijli', 'generator', 'inverter', 'load shedding', 'light gaya'] },
  { cat: 'traffic',    words: ['traffic', 'jam', 'signal', 'accident', 'congestion', 'slow', 'block', 'diversion', 'road block'] },
  { cat: 'transport',  words: ['auto', 'bus', 'train', 'metro', 'local', 'rickshaw', 'transport', 'station', 'strike', 'cancelled', 'delay'] },
  { cat: 'police',     words: ['police', 'checking', 'nakabandi', 'cop', 'fine', 'dl', 'rc', 'document check'] },
  { cat: 'lost_found', words: ['lost', 'found', 'mila', 'milgaya', 'keys', 'wallet', 'purse', 'bag', 'khoya', 'mil gaya'] },
  { cat: 'civic',      words: ['garbage', 'trash', 'pothole', 'streetlight', 'nmmc', 'civic', 'drain', 'sewer', 'footpath', 'park', 'cleaning', 'dustbin'] },
  { cat: 'weather',    words: ['rain', 'flood', 'waterlogging', 'storm', 'wind', 'weather', 'cyclone', 'heat wave', 'fog'] },
  { cat: 'safety',     words: ['theft', 'suspicious', 'chain snatching', 'robbery', 'danger', 'safety alert', 'chor'] },
  { cat: 'medical',    words: ['ambulance', 'hospital', 'blood', 'doctor', 'medical', 'emergency', 'injection', 'medicine needed', 'heart'] },
  // need_it_now categories
  { cat: 'borrow',     words: ['drill', 'borrow', 'lend', 'machine', 'ladder', 'bat', 'cricket', 'cycle', 'bicycle', 'charger', 'cable', 'use karna', 'thoda use'] },
  { cat: 'rideshare',  words: ['ride', 'cab share', 'going to airport', 'airport', 'lift', 'drop', 'ola share', 'uber share', 'cab split'] },
  { cat: 'ticket',     words: ['ticket', 'pass', 'extra ticket', 'spare ticket', 'concert', 'match ticket', 'event pass'] },
  { cat: 'need_to_buy',words: ['socket', 'plug', 'wire', 'tape', 'insulation', 'bulb', 'switch', 'hardware', 'nut', 'bolt', 'screw', 'pipe', 'fitting', 'buy', 'purchase', 'chahiye', 'khareedna', 'printout', 'xerox', 'medicine buy'] },
  { cat: 'home_help',  words: ['plumber', 'electrician', 'carpenter', 'maid', 'cook', 'driver', 'repair', 'fix', 'install', 'kaam karne wala'] },
  { cat: 'urgent',     words: ['urgent help', 'please help', 'sos', 'koi help karo', 'emergency help'] },
  { cat: 'errand',     words: ['errand', 'delivery', 'courier', 'post office', 'pickup', 'drop parcel'] },
]

const KNOWN_LOCALITIES = [
  'kharghar', 'sector 20', 'sector 12', 'sector 7', 'sector 35', 'sector 10', 'sector 15',
  'nerul', 'seawoods', 'belapur', 'cbd belapur', 'panvel', 'kamothe', 'ulwe', 'taloja',
  'vashi', 'turbhe', 'sanpada', 'kopar khairane', 'ghansoli', 'airoli',
  'bandra', 'andheri', 'powai', 'thane', 'mulund', 'kurla', 'dadar',
  'palm beach', 'utsav chowk', 'central park', 'linking road', 'd-mart',
]

// ─────────────────────────────────────────────
// SAFETY FLAG DETECTION
// ─────────────────────────────────────────────

const PHONE_REGEX = /(\+91[\s-]?)?[6-9]\d{9}/
const ADDRESS_WORDS = ['flat no', 'wing a', 'wing b', 'wing c', 'door no', 'house no', 'plot no']
const MEDICAL_EMERGENCY = ['ambulance', 'heart attack', 'stroke', 'unconscious', 'not breathing', 'bleeding badly']

function detectSafetyFlags(text) {
  const lower = text.toLowerCase()
  const flags = []
  if (PHONE_REGEX.test(text)) {
    flags.push({
      flag: 'phone_number_detected',
      message: 'Your post contains a phone number. Share it only in private replies to stay safe.',
    })
  }
  if (ADDRESS_WORDS.some(w => lower.includes(w))) {
    flags.push({
      flag: 'address_detected',
      message: 'Avoid sharing your exact flat or door number in public posts.',
    })
  }
  if (MEDICAL_EMERGENCY.some(w => lower.includes(w))) {
    flags.push({
      flag: 'medical_urgency_detected',
      message: '⚠️ For life-threatening emergencies, call 108 (ambulance) immediately. LocalSetu is a community tool, not emergency services.',
    })
  }
  return flags
}

// ─────────────────────────────────────────────
// DETECTION HELPERS
// ─────────────────────────────────────────────

function detectType(text) {
  const lower = text.toLowerCase()
  if (NEED_KEYWORDS.some(w => lower.includes(w))) return 'need_it_now'
  if (RIGHTNOW_KEYWORDS.some(w => lower.includes(w))) return 'right_now'
  return null
}

function detectCategory(text, type) {
  const lower = text.toLowerCase()
  // Filter category rules to the relevant type's categories
  const rnCats  = ['water','power','traffic','transport','police','lost_found','civic','weather','safety','medical']
  const ninCats = ['borrow','rideshare','ticket','need_to_buy','home_help','urgent','errand']
  const allowed = type === 'right_now' ? rnCats : type === 'need_it_now' ? ninCats : [...rnCats, ...ninCats]
  for (const rule of CATEGORY_RULES) {
    if (!allowed.includes(rule.cat)) continue
    if (rule.words.some(w => lower.includes(w))) return rule.cat
  }
  return null
}

function detectLocality(text) {
  const lower = text.toLowerCase()
  for (const loc of KNOWN_LOCALITIES) {
    if (lower.includes(loc)) {
      // Return title-cased version from original text if possible
      const idx = lower.indexOf(loc)
      return text.slice(idx, idx + loc.length)
    }
  }
  return null
}

function detectUrgency(text, category) {
  const lower = text.toLowerCase()
  if (['medical', 'safety', 'urgent'].includes(category)) return 'high'
  if (lower.includes('urgent') || lower.includes('abhi') || lower.includes('immediately') || lower.includes('right now')) return 'high'
  if (lower.includes('today') || lower.includes('aaj') || lower.includes('evening') || lower.includes('morning')) return 'medium'
  return 'low'
}

// ─────────────────────────────────────────────
// TEXT IMPROVEMENT (mock rule-based)
// ─────────────────────────────────────────────

// Common Hinglish phrase → English replacements
const PHRASE_MAP = [
  [/nahi aa raha/gi,      'not available'],
  [/nahi aa rahi/gi,      'not available'],
  [/ho raha hai/gi,       'is happening'],
  [/ho rahi hai/gi,       'is happening'],
  [/ho raha/gi,           'happening'],
  [/khatam ho gaya/gi,    'has run out'],
  [/khatam/gi,            'finished'],
  [/gaya hai/gi,          'has gone out'],
  [/nahi hai/gi,          'is not available'],
  [/nahi/gi,              'not'],
  [/bahut slow/gi,        'very slow'],
  [/bahut/gi,             'very'],
  [/ke liye chahiye/gi,   'needed for'],
  [/chahiye/gi,           'needed'],
  [/mein\b/gi,            'in'],
  [/\bse\b/gi,            'from'],
  [/\bpe\b/gi,            'near'],
  [/\bka\b/gi,            'of'],
  [/\bki\b/gi,            'of'],
  [/\bko\b/gi,            ''],
  [/koi update nahi/gi,   'no update yet'],
  [/bata do/gi,           'please let me know'],
  [/mil sakta hai/gi,     'available'],
  [/koi hai/gi,           'anyone available'],
]

const CATEGORY_TEMPLATES = {
  water:      (loc, text) => `Water supply issue${loc ? ` near ${loc}` : ''}. ${text} Is anyone else in this area affected?`,
  power:      (loc, text) => `Power cut${loc ? ` near ${loc}` : ''}. ${text} Anyone else facing the same? Please confirm.`,
  traffic:    (loc, text) => `${loc ? `Traffic update near ${loc}. ` : ''}${text} Plan your route accordingly.`,
  transport:  (loc, text) => `${loc ? `Transport alert near ${loc}. ` : ''}${text} Check for alternatives before heading out.`,
  police:     (loc, text) => `${loc ? `Police checking near ${loc}. ` : ''}${text} Keep your documents ready.`,
  lost_found: (loc, text) => `${text}${loc ? ` (${loc})` : ''} Reply only if you can identify it — will coordinate handover.`,
  civic:      (loc, text) => `Civic issue${loc ? ` near ${loc}` : ''}. ${text} If others are affected, please confirm.`,
  weather:    (loc, text) => `Weather alert${loc ? ` for ${loc}` : ''}. ${text} Take necessary precautions.`,
  safety:     (loc, text) => `Safety alert${loc ? ` near ${loc}` : ''}. ${text} Stay alert and report to authorities if serious.`,
  medical:    (_loc, text) => `${text} For life-threatening emergencies call 108 immediately.`,
  borrow:     (loc, text) => `${text}${loc ? ` (${loc})` : ''} Will return promptly. Please reply if you can help.`,
  rideshare:  (loc, text) => `${text}${loc ? ` Starting from ${loc}.` : ''} Happy to split fare. Reply to coordinate.`,
  ticket:     (_loc, text) => `${text} Face value only. Reply if interested — first come, first served.`,
  need_to_buy:(loc, text) => `${text}${loc ? ` Near ${loc}.` : ''} Please quote your best price and delivery time.`,
  home_help:  (loc, text) => `${text}${loc ? ` in ${loc}` : ''}. If you know a reliable person, please recommend them.`,
  urgent:     (loc, text) => `URGENT: ${text}${loc ? ` near ${loc}` : ''}. Please respond if you can help right away.`,
  errand:     (loc, text) => `${text}${loc ? ` (${loc})` : ''} Will pay for your time. Please reply.`,
}

function cleanText(text) {
  let out = text.trim()
  for (const [pattern, replacement] of PHRASE_MAP) {
    out = out.replace(pattern, replacement)
  }
  // Fix spacing and capitalization
  out = out.replace(/\s+/g, ' ').trim()
  if (out.length > 0) out = out[0].toUpperCase() + out.slice(1)
  // Ensure ends with punctuation
  if (out.length > 0 && !/[.!?]$/.test(out)) out += '.'
  return out
}

function improveText(rawText, category, locality) {
  const cleaned = cleanText(rawText)
  const template = CATEGORY_TEMPLATES[category]
  if (!template) return cleaned
  const result = template(locality, cleaned)
  // Deduplicate accidental double sentences
  return result.replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim()
}

// Extract structured info for need_to_buy
function extractNeed(text, category) {
  if (category !== 'need_to_buy') return null
  const lower = text.toLowerCase()
  const electricalItems = ['socket', 'plug', 'wire', 'tape', 'insulation', 'bulb', 'switch', 'fuse']
  const stationeryItems = ['printout', 'xerox', 'pen', 'paper', 'notebook']
  const medicalItems    = ['medicine', 'tablet', 'syrup', 'injection', 'paracetamol']
  let shopType = 'local shop'
  if (electricalItems.some(w => lower.includes(w))) shopType = 'electrical shop'
  else if (stationeryItems.some(w => lower.includes(w))) shopType = 'stationery shop'
  else if (medicalItems.some(w => lower.includes(w))) shopType = 'medical/pharmacy'
  const urgencyMatch = lower.match(/today|aaj|now|abhi|urgent|evening|morning|tonight/)
  return {
    shopType,
    urgency: urgencyMatch ? urgencyMatch[0] : 'flexible',
  }
}

// ─────────────────────────────────────────────
// REAL API CALL (Phase 3 — when provider=real)
// ─────────────────────────────────────────────

async function callRealApi(text, currentType, currentCategory) {
  try {
    const res = await fetch('/api/ai-categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, postType: currentType }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      suggestedType:     data.type     || currentType,
      suggestedCategory: data.category || currentCategory,
      improvedText:      text, // real API currently only categorizes; text improvement is Phase 3+
      urgency:           'medium',
      safetyFlags:       detectSafetyFlags(text),
      detectedLocality:  detectLocality(text),
      extractedNeed:     null,
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

/**
 * assistPost — main AI assist function
 *
 * @param {{ text: string, currentType?: string, currentCategory?: string, locality?: string }} input
 * @returns {Promise<{
 *   improvedText: string,
 *   suggestedType: string|null,
 *   suggestedCategory: string|null,
 *   urgency: 'low'|'medium'|'high',
 *   safetyFlags: Array<{ flag: string, message: string }>,
 *   detectedLocality: string|null,
 *   extractedNeed: object|null,
 * } | null>}
 */
export async function assistPost({ text, currentType = null, currentCategory = null, locality = null }) {
  if (!text || text.trim().length < 10) return null

  if (AI_PROVIDER === 'real') {
    return callRealApi(text, currentType, currentCategory)
  }

  // ── Mock engine ──
  await new Promise(r => setTimeout(r, 600)) // simulate latency

  const suggestedType     = currentType     || detectType(text)
  const suggestedCategory = currentCategory || detectCategory(text, suggestedType)
  const detectedLocality  = locality        || detectLocality(text)
  const safetyFlags       = detectSafetyFlags(text)
  const urgency           = detectUrgency(text, suggestedCategory)
  const improvedText      = suggestedCategory ? improveText(text, suggestedCategory, detectedLocality) : cleanText(text)
  const extractedNeed     = extractNeed(text, suggestedCategory)

  return {
    improvedText,
    suggestedType,
    suggestedCategory,
    urgency,
    safetyFlags,
    detectedLocality,
    extractedNeed,
  }
}
