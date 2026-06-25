import { execSync } from 'node:child_process'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const fail = []

function check(name, condition, detail = '') {
  if (!condition) fail.push(`${name}${detail ? `: ${detail}` : ''}`)
  else console.log(`ok - ${name}`)
}

const pkg = JSON.parse(read('package.json'))
const schema = read('supabase/schema.sql')
const db = read('src/lib/db.js')
const appContext = read('src/context/AppContext.jsx')
const postDetail = read('src/screens/PostDetailScreen.jsx')
const realtime = read('src/hooks/useRealtime.js')
const personaSeed = read('supabase/migrations/seed_test_commerce_personas.sql')

check('package has test script', pkg.scripts?.test === 'node scripts/launch-checks.mjs')
check('package has build script', pkg.scripts?.build === 'vite build')

for (const table of [
  'profiles',
  'posts',
  'replies',
  'reports',
  'saved_posts',
  'providers',
  'societies',
  'society_posts',
  'society_members',
  'businesses',
  'quotes',
  'payments',
  'rsvps',
  'maintenance_records',
  'complaints',
  'push_subscriptions',
]) {
  check(`schema table ${table}`, schema.includes(`public.${table}`))
}

for (const column of [
  'selected_quote_id',
  'is_bought',
  'need_to_buy_item',
  'need_to_buy_qty',
  'delivery_pref',
  'budget_paise',
  'shop_owner_id',
  'quoted_price_paise',
  'delivery_fee_paise',
  'estimated_minutes',
]) {
  check(`schema column ${column}`, schema.includes(column))
}

check('profiles allow shop_owner role', schema.includes("'shop_owner'"))
check('quote uniqueness enforced', schema.includes('uniq_active_quote_per_shop_post'))
check('duplicate quick replies enforced', schema.includes('uniq_quick_reply_per_user_post'))
check('duplicate custom replies enforced', schema.includes('uniq_custom_reply_exact_per_user_post'))
check('payment insert/update is not public', !schema.includes('WITH CHECK (true);'))

check('frontend inserts canonical quote owner', db.includes('shop_owner_id:'))
check('frontend inserts canonical quote price', db.includes('quoted_price_paise:'))
check('frontend does not insert legacy submitted_by', !db.includes('submitted_by:'))
check('frontend loads visible quotes', db.includes('export async function getQuotes()'))
check('app stores loaded quotes', appContext.includes("case 'SET_QUOTES'"))
check('login load fetches quotes', appContext.includes('db.getQuotes().catch(() => [])'))
check('login load fetches businesses', appContext.includes('db.getBusinesses().catch(() => [])'))
check('quotes realtime subscribed', realtime.includes("table:  'quotes'"))
check('quote submit limited to shops', postDetail.includes('isShopOwner && post?.category'))
check('persona seed uses shop_owner', personaSeed.includes("'shop_owner'"))
check('persona seed creates quotes', personaSeed.includes('INSERT INTO public.quotes'))

let trackedEnv = ''
try {
  trackedEnv = execSync('git ls-files -- .env.local', { encoding: 'utf8' }).trim()
} catch {
  trackedEnv = 'git-error'
}
check('.env.local is not tracked', trackedEnv === '')

if (fail.length) {
  console.error('\nLaunch checks failed:')
  for (const item of fail) console.error(`- ${item}`)
  process.exit(1)
}

console.log('\nLaunch checks passed.')
