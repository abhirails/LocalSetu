// ============================================================
// LocalSetu — Database Operations (Supabase)
// All functions return plain JS objects matching the shape
// the rest of the app already expects.
// ============================================================

import { supabase } from './supabase'

// ────────────────────────────────────────────────────────────
// PROFILES
// ────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return normalizeProfile(data)
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return normalizeProfile(data)
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return normalizeProfile(data)
}

export async function blockUser(currentUserId, targetUserId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('blocked_users')
    .eq('id', currentUserId)
    .single()

  const blocked = profile?.blocked_users || []
  if (blocked.includes(targetUserId)) return

  await supabase
    .from('profiles')
    .update({ blocked_users: [...blocked, targetUserId] })
    .eq('id', currentUserId)
}

// ────────────────────────────────────────────────────────────
// POSTS
// ────────────────────────────────────────────────────────────

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!posts_user_id_fkey (id, name, locality, is_verified, role),
      post_confirmations (user_id)
    `)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizePost)
}

export async function createPost(post) {
  const payload = {
    user_id:               post.userId,
    type:                  post.type,
    locality:              post.locality,
    category:              post.category,
    content:               post.content,
    status:                'active',
    expires_at:            post.expiresAt,
    is_pinned:             false,
    report_count:          0,
    still_happening_count: 0,
    helper_count:          0,
    is_fulfilled:          false,
    needed_by:             post.neededBy || null,
    distance_range:        post.distanceRange || null,
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select(`
      *,
      profiles!posts_user_id_fkey (id, name, locality, is_verified, role),
      post_confirmations (user_id)
    `)
    .single()

  if (error) throw error
  return normalizePost(data)
}

export async function updatePost(id, updates) {
  // Map camelCase → snake_case for DB
  const payload = {}
  if (updates.status      !== undefined) payload.status       = updates.status
  if (updates.isPinned    !== undefined) payload.is_pinned    = updates.isPinned
  if (updates.isFulfilled !== undefined) payload.is_fulfilled = updates.isFulfilled
  if (updates.reportCount !== undefined) payload.report_count = updates.reportCount

  const { data, error } = await supabase
    .from('posts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ────────────────────────────────────────────────────────────
// CONFIRMATIONS — Still Happening
// ────────────────────────────────────────────────────────────

export async function confirmStillHappening(postId, userId) {
  const { data, error } = await supabase
    .rpc('increment_still_happening', {
      p_post_id: postId,
      p_user_id: userId
    })
  if (error) throw error
  return data // true = new confirmation, false = already confirmed
}

// ────────────────────────────────────────────────────────────
// PROVIDERS
// ────────────────────────────────────────────────────────────

export async function getProviders() {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .order('recommendation_count', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeProvider)
}

export async function createProvider(provider, currentUserId) {
  const payload = {
    name:                 provider.name,
    service_type:         provider.serviceType,
    locality:             provider.locality,
    phone:                provider.phone || null,
    whatsapp:             provider.phone || null,
    recommendation_count: 1,
    notes:                provider.notes || [],
    is_verified:          false,
    recommender_ids:      [currentUserId],
    created_by:           currentUserId,
    last_recommended_at:  new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('providers')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return normalizeProvider(data)
}

export async function recommendProvider(providerId, userId, note) {
  // Fetch current state
  const { data: existing, error: fetchErr } = await supabase
    .from('providers')
    .select('recommender_ids, notes, recommendation_count')
    .eq('id', providerId)
    .single()

  if (fetchErr) throw fetchErr

  // Already recommended
  if (existing.recommender_ids?.includes(userId)) return null

  const newCount = (existing.recommendation_count || 0) + 1
  const newNotes = note
    ? [note, ...(existing.notes || [])]
    : existing.notes || []

  const { data, error } = await supabase
    .from('providers')
    .update({
      recommender_ids:      [...(existing.recommender_ids || []), userId],
      notes:                newNotes,
      recommendation_count: newCount,
      is_verified:          newCount >= 3,
      last_recommended_at:  new Date().toISOString()
    })
    .eq('id', providerId)
    .select()
    .single()

  if (error) throw error
  return normalizeProvider(data)
}

// ────────────────────────────────────────────────────────────
// REPLIES
// ────────────────────────────────────────────────────────────

export async function getReplies(postId) {
  const { data, error } = await supabase
    .from('replies')
    .select(`
      *,
      profiles!replies_user_id_fkey (id, name, locality)
    `)
    .eq('post_id', postId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizeReply)
}

export async function createReply(reply) {
  const payload = {
    post_id:    reply.postId,
    user_id:    reply.userId,
    content:    reply.content,
    reply_type: reply.replyType || 'custom',
  }

  const { data, error } = await supabase
    .from('replies')
    .insert(payload)
    .select(`
      *,
      profiles!replies_user_id_fkey (id, name, locality)
    `)
    .single()

  if (error) throw error
  return normalizeReply(data)
}

// ────────────────────────────────────────────────────────────
// SAVED POSTS
// ────────────────────────────────────────────────────────────

export async function getSavedPostIds(userId) {
  const { data, error } = await supabase
    .from('saved_posts')
    .select('post_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map(r => r.post_id)
}

export async function savePost(userId, postId) {
  const { error } = await supabase
    .from('saved_posts')
    .insert({ user_id: userId, post_id: postId })
  return !error
}

export async function unsavePost(userId, postId) {
  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)
  return !error
}

// ────────────────────────────────────────────────────────────
// REPORTS
// ────────────────────────────────────────────────────────────

export async function createReport(report) {
  const payload = {
    reporter_id:   report.reporterId,
    target_type:   report.targetType,
    target_id:     report.targetId,
    reason:        report.reason,
    reporter_note: report.note || null,
    status:        'pending'
  }

  const { data, error } = await supabase
    .from('reports')
    .insert(payload)
    .select()
    .single()

  if (error) throw error

  // Increment post report count + auto-flag at 3 reports
  if (report.targetType === 'post') {
    await supabase.rpc('increment_post_report', { p_post_id: report.targetId })
  }

  return data
}

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateReport(id, updates) {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ────────────────────────────────────────────────────────────
// NORMALISERS  (DB snake_case → app camelCase)
// ────────────────────────────────────────────────────────────

function normalizeProfile(p) {
  if (!p) return null
  return {
    id:           p.id,
    name:         p.name,
    phone:        p.phone,
    email:        p.email,
    locality:     p.locality,
    role:         p.role,
    isVerified:   p.is_verified,
    trustScore:   p.trust_score,
    postsCount:   p.posts_count,
    helpCount:    p.help_count,
    isWarned:     p.is_warned,
    isBanned:     p.is_banned,
    blockedUsers:      p.blocked_users || [],
    savedPosts:        [],           // loaded separately
    savedLocalities:   p.saved_localities || [],
    activeLocality:    p.active_locality || null,
    joinedAt:          p.created_at
  }
}

export async function updateSavedLocalities(userId, savedLocalities) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ saved_localities: savedLocalities, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return normalizeProfile(data)
}

export function normalizePost(p) {
  if (!p) return null
  return {
    id:                   p.id,
    type:                 p.type,
    userId:               p.user_id,
    locality:             p.locality,
    category:             p.category,
    content:              p.content,
    status:               p.status,
    expiresAt:            p.expires_at,
    isPinned:             p.is_pinned,
    reportCount:          p.report_count,
    createdAt:            p.created_at,
    // Right Now
    stillHappeningCount:  p.still_happening_count,
    lastConfirmedAt:      p.last_confirmed_at,
    confirmedBy:          (p.post_confirmations || []).map(c => c.user_id),
    // Need It Now
    neededBy:             p.needed_by,
    distanceRange:        p.distance_range,
    helperCount:          p.helper_count,
    isFulfilled:          p.is_fulfilled,
    // Phase 4 — Boost
    isBoosted:            p.is_boosted ?? false,
    boostedUntil:         p.boosted_until ?? null,
    // Phase 6.5 — Civic
    civicSubcategory:     p.civic_subcategory ?? null,
    civicStatus:          p.civic_status ?? 'reported',
    medicalSubcategory:   p.medical_subcategory ?? null,
    // Joined author
    author:               p.profiles ? normalizeProfile(p.profiles) : null
  }
}

function normalizeProvider(p) {
  if (!p) return null
  return {
    id:                  p.id,
    name:                p.name,
    serviceType:         p.service_type,
    locality:            p.locality,
    phone:               p.phone,
    whatsapp:            p.whatsapp,
    recommendationCount: p.recommendation_count,
    notes:               p.notes || [],
    isVerified:          p.is_verified,
    recommenderIds:      p.recommender_ids || [],
    createdAt:           p.created_at,
    lastRecommendedAt:   p.last_recommended_at
  }
}

export function normalizeReply(r) {
  if (!r) return null
  return {
    id:         r.id,
    postId:     r.post_id,
    userId:     r.user_id,
    content:    r.content,
    replyType:  r.reply_type,
    createdAt:  r.created_at,
    author:     r.profiles ? normalizeProfile(r.profiles) : null
  }
}

// ────────────────────────────────────────────────────────────
// SOCIETIES
// ────────────────────────────────────────────────────────────

export function normalizeSociety(s) {
  if (!s) return null
  return {
    id:           s.id,
    name:         s.name,
    locality:     s.locality,
    sector:       s.sector,
    landmark:     s.landmark,
    description:  s.description,
    rules:        s.rules,
    contactPhone: s.contact_phone ?? s.public_contact,
    totalFlats:   s.total_flats,
    adminId:      s.admin_id ?? s.admin_user_id,
    isVerified:   s.is_verified,
    isPro:        s.is_pro ?? s.isPro ?? false,
    proExpiresAt: s.pro_expires_at ?? s.proExpiresAt ?? null,
    createdAt:    s.created_at
  }
}

export function normalizeSocietyPost(p) {
  if (!p) return null
  return {
    id:            p.id,
    societyId:     p.society_id,
    postedBy:      p.posted_by ?? p.author_id ?? p.user_id,
    type:          p.type,
    title:         p.title,
    content:       p.content ?? p.body,
    eventDate:     p.event_date ?? p.event_at,
    eventLocation: p.event_location,
    status:        p.status ?? 'active',
    pinToFeed:     p.pin_to_feed ?? p.is_pinned ?? false,
    visibility:    p.visibility || 'public',
    createdAt:     p.created_at,
    society:       p.societies ? normalizeSociety(p.societies) : null
  }
}

export async function getSocieties() {
  const { data, error } = await supabase
    .from('societies')
    .select('*')
    .order('name')
  if (error) throw error
  return (data || []).map(normalizeSociety)
}

export async function getFeedSocietyPosts() {
  const { data, error } = await supabase
    .from('society_posts')
    .select('*, societies(name, sector)')
    .or('pin_to_feed.eq.true,is_pinned.eq.true')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || [])
    .map(normalizeSocietyPost)
    .filter(p => p.status !== 'removed' && p.pinToFeed)
}

export async function getSocietyPosts(societyId) {
  const { data, error } = await supabase
    .from('society_posts')
    .select('*')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || [])
    .map(normalizeSocietyPost)
    .filter(p => p.status !== 'removed')
}

export async function createSocietyPost(societyId, userId, postData) {
  const visibility = postData.visibility || 'public'
  const pinFeed = visibility === 'public' ? (postData.pinToFeed ?? true) : false
  const row = {
    society_id:     societyId,
    author_id:      userId,
    posted_by:      userId,
    type:           postData.type,
    title:          postData.title,
    body:           postData.content,
    content:        postData.content,
    event_date:     postData.eventDate || null,
    event_at:       postData.eventDate || null,
    event_location: postData.eventLocation || null,
    status:         'active',
    is_pinned:      pinFeed,
    pin_to_feed:    pinFeed,
    visibility,
  }
  const { data, error } = await supabase
    .from('society_posts')
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return normalizeSocietyPost(data)
}

export async function updateSocietyPost(id, updates) {
  const dbUpdates = {}
  if (updates.status !== undefined)     dbUpdates.status = updates.status
  if (updates.pinToFeed !== undefined) {
    dbUpdates.pin_to_feed = updates.pinToFeed
    dbUpdates.is_pinned = updates.pinToFeed
  }
  if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility
  const { data, error } = await supabase
    .from('society_posts')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeSocietyPost(data)
}

// ────────────────────────────────────────────────────────────
// SOCIETY MEMBERS (Phase 3)
// ────────────────────────────────────────────────────────────

export function normalizeMember(m) {
  if (!m) return null
  return {
    id:          m.id,
    societyId:   m.society_id,
    userId:      m.user_id,
    role:        m.role,
    status:      m.status,
    flatNo:      m.flat_no ?? m.flat_number,
    requestedAt: m.requested_at ?? m.created_at,
    reviewedAt:  m.reviewed_at ?? m.approved_at,
    reviewedBy:  m.reviewed_by ?? m.approved_by,
    profile:     m.profiles ? normalizeProfile(m.profiles) : null
  }
}

export async function getSocietyMembers(societyId) {
  const { data, error } = await supabase
    .from('society_members')
    .select('*, profiles(id, name, locality, is_verified, trust_score)')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeMember)
}

export async function getUserMemberships(userId) {
  const { data, error } = await supabase
    .from('society_members')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map(normalizeMember)
}

export async function requestJoinSociety(userId, societyId) {
  const { data, error } = await supabase
    .from('society_members')
    .insert({
      user_id: userId,
      society_id: societyId,
      status: 'pending',
      role: 'member',
      requested_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return normalizeMember(data)
}

export async function approveSocietyMember(memberId, reviewedById) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('society_members')
    .update({
      status: 'approved',
      reviewed_at: now,
      reviewed_by: reviewedById,
      approved_at: now,
      approved_by: reviewedById,
    })
    .eq('id', memberId)
    .select()
    .single()
  if (error) throw error
  return normalizeMember(data)
}

export async function rejectSocietyMember(memberId, reviewedById) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('society_members')
    .update({
      status: 'rejected',
      reviewed_at: now,
      reviewed_by: reviewedById,
      approved_at: now,
      approved_by: reviewedById,
    })
    .eq('id', memberId)
    .select()
    .single()
  if (error) throw error
  return normalizeMember(data)
}

// ============================================================
// Phase 4 — Business Listings + Post Boosts
// ============================================================

export function normalizeBusiness(b) {
  return {
    id:             b.id,
    name:           b.name,
    category:       b.category,
    plan:           b.plan || 'basic',
    tagline:        b.tagline || '',
    description:    b.description || '',
    phone:          b.phone || null,
    whatsapp:       b.whatsapp || null,
    locality:       b.locality,
    address:        b.address || '',
    isVerified:     b.is_verified ?? b.isVerified ?? false,
    rating:         parseFloat(b.rating) || 0,
    reviewCount:    b.review_count ?? b.reviewCount ?? 0,
    ownerId:        b.owner_id ?? b.ownerId ?? null,
    planExpiresAt:  b.plan_expires_at ?? b.planExpiresAt ?? null,
    openHours:      b.open_hours ?? b.openHours ?? null,
    tags:           b.tags || [],
    createdAt:      b.created_at ?? b.createdAt ?? null,
  }
}

export async function getBusinesses({ category } = {}) {
  let q = supabase
    .from('businesses')
    .select('*')
    .order('plan', { ascending: false })   // premium first
    .order('rating', { ascending: false })
  if (category && category !== 'all') q = q.eq('category', category)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(normalizeBusiness)
}

export async function getBusinessById(id) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return normalizeBusiness(data)
}

export async function createBusiness(bizData) {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      name:        bizData.name,
      category:    bizData.category,
      plan:        bizData.plan || 'basic',
      tagline:     bizData.tagline,
      description: bizData.description,
      phone:       bizData.phone,
      whatsapp:    bizData.whatsapp,
      locality:    bizData.locality,
      address:     bizData.address,
      owner_id:    bizData.ownerId,
    })
    .select()
    .single()
  if (error) throw error
  return normalizeBusiness(data)
}

export async function boostPost(postId, userId, hours = 48) {
  const boostedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
  // Insert boost record
  await supabase.from('post_boosts').insert({
    post_id:       postId,
    user_id:       userId,
    amount_paise:  hours === 24 ? 1900 : hours === 48 ? 2900 : 3900,
    boosted_until: boostedUntil,
  })
  // Update post
  const { data, error } = await supabase
    .from('posts')
    .update({ is_boosted: true, boosted_until: boostedUntil })
    .eq('id', postId)
    .select()
    .single()
  if (error) throw error
  return normalizePost(data)
}

// ============================================================
// Phase 6 — RSVPs, Maintenance, Complaints
// ============================================================

// ── RSVPs ──────────────────────────────────────────────────

export function normalizeRsvp(r) {
  return {
    id:             r.id,
    societyPostId:  r.society_post_id ?? r.societyPostId,
    userId:         r.user_id ?? r.userId,
    status:         r.status,
    createdAt:      r.created_at ?? r.createdAt,
  }
}

export async function getRsvpsForPost(postId) {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('society_post_id', postId)
  if (error) throw error
  return (data || []).map(normalizeRsvp)
}

export async function upsertRsvp(userId, societyPostId, status) {
  const { data, error } = await supabase
    .from('rsvps')
    .upsert({ user_id: userId, society_post_id: societyPostId, status, updated_at: new Date().toISOString() },
             { onConflict: 'society_post_id,user_id' })
    .select()
    .single()
  if (error) throw error
  return normalizeRsvp(data)
}

export async function deleteRsvp(userId, societyPostId) {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('user_id', userId)
    .eq('society_post_id', societyPostId)
  if (error) throw error
}

// ── Maintenance Records ─────────────────────────────────────

export function normalizeMaintenance(m) {
  return {
    id:            m.id,
    societyId:     m.society_id ?? m.societyId,
    title:         m.title,
    category:      m.category,
    description:   m.description || '',
    status:        m.status,
    vendorName:    m.vendor_name ?? m.vendorName ?? null,
    costEstimate:  m.cost_estimate ?? m.costEstimate ?? null,
    actualCost:    m.actual_cost ?? m.actualCost ?? null,
    reportedBy:    m.reported_by ?? m.reportedBy ?? null,
    assignedTo:    m.assigned_to ?? m.assignedTo ?? null,
    createdAt:     m.created_at ?? m.createdAt,
    resolvedAt:    m.resolved_at ?? m.resolvedAt ?? null,
  }
}

export async function getMaintenanceRecords(societyId) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeMaintenance)
}

export async function createMaintenanceRecord(record) {
  const { data, error } = await supabase
    .from('maintenance_records')
    .insert({
      society_id:     record.societyId,
      title:          record.title,
      category:       record.category,
      description:    record.description,
      vendor_name:    record.vendorName,
      cost_estimate:  record.costEstimate,
      reported_by:    record.reportedBy,
    })
    .select()
    .single()
  if (error) throw error
  return normalizeMaintenance(data)
}

export async function updateMaintenanceRecord(id, updates) {
  const mapped = {}
  if (updates.status)      mapped.status       = updates.status
  if (updates.vendorName)  mapped.vendor_name  = updates.vendorName
  if (updates.assignedTo)  mapped.assigned_to  = updates.assignedTo
  if (updates.actualCost)  mapped.actual_cost  = updates.actualCost
  if (updates.status === 'resolved') mapped.resolved_at = new Date().toISOString()
  const { data, error } = await supabase
    .from('maintenance_records')
    .update(mapped)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeMaintenance(data)
}

// ── Complaints ──────────────────────────────────────────────

export function normalizeComplaint(c) {
  return {
    id:          c.id,
    societyId:   c.society_id ?? c.societyId,
    userId:      c.user_id ?? c.userId,
    title:       c.title,
    category:    c.category,
    description: c.description || '',
    status:      c.status,
    adminNote:   c.admin_note ?? c.adminNote ?? null,
    createdAt:   c.created_at ?? c.createdAt,
    resolvedAt:  c.resolved_at ?? c.resolvedAt ?? null,
  }
}

export async function getComplaints(societyId) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizeComplaint)
}

export async function createComplaint(complaint) {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      society_id:  complaint.societyId,
      user_id:     complaint.userId,
      title:       complaint.title,
      category:    complaint.category,
      description: complaint.description,
    })
    .select()
    .single()
  if (error) throw error
  return normalizeComplaint(data)
}

export async function updateComplaint(id, updates) {
  const mapped = {}
  if (updates.status)    mapped.status      = updates.status
  if (updates.adminNote) mapped.admin_note  = updates.adminNote
  if (updates.status === 'resolved') mapped.resolved_at = new Date().toISOString()
  const { data, error } = await supabase
    .from('complaints')
    .update(mapped)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeComplaint(data)
}

// ─── Phase 6.5: Civic status update ─────────────────────────────────────────

export async function updateCivicStatus(postId, civicStatus) {
  const { data, error } = await supabase
    .from('posts')
    .update({ civic_status: civicStatus })
    .eq('id', postId)
    .select()
    .single()
  if (error) throw error
  return normalizePost(data)
}


// ============================================================
// Phase 6.6 — Quotes (Need to Buy)
// ============================================================

export function normalizeQuote(q) {
  return {
    id:                q.id,
    postId:            q.post_id,
    submittedBy:       q.submitted_by,
    shopName:          q.shop_name,
    shopCategory:      q.shop_category ?? null,
    price:             q.price,
    deliveryTime:      q.delivery_time ?? null,
    deliveryCharge:    q.delivery_charge ?? 0,
    pickupAvailable:   q.pickup_available ?? false,
    deliveryAvailable: q.delivery_available ?? true,
    paymentMode:       q.payment_mode ?? 'both',
    message:           q.message ?? '',
    isAvailable:       q.is_available ?? 'yes',
    isRemoved:         q.is_removed ?? false,
    createdAt:         q.created_at,
  }
}

export async function getQuotesForPost(postId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('post_id', postId)
    .eq('is_removed', false)
    .order('price', { ascending: true })
  if (error) throw error
  return (data || []).map(normalizeQuote)
}

export async function submitQuote(postId, userId, quoteData) {
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      post_id:           postId,
      submitted_by:      userId,
      shop_name:         quoteData.shopName,
      shop_category:     quoteData.shopCategory || null,
      price:             quoteData.price,
      delivery_time:     quoteData.deliveryTime || null,
      delivery_charge:   quoteData.deliveryCharge || 0,
      pickup_available:  quoteData.pickupAvailable || false,
      delivery_available: quoteData.deliveryAvailable !== false,
      payment_mode:      quoteData.paymentMode || 'both',
      message:           quoteData.message || '',
      is_available:      quoteData.isAvailable || 'yes',
    })
    .select()
    .single()
  if (error) throw error
  return normalizeQuote(data)
}

export async function selectQuote(postId, quoteId) {
  const { error } = await supabase
    .from('posts')
    .update({ selected_quote_id: quoteId })
    .eq('id', postId)
  if (error) throw error
}

export async function markPostBought(postId) {
  const { error } = await supabase
    .from('posts')
    .update({ is_bought: true, is_fulfilled: true, status: 'fulfilled' })
    .eq('id', postId)
  if (error) throw error
}

export async function adminRemoveQuote(quoteId) {
  const { error } = await supabase
    .from('quotes')
    .update({ is_removed: true })
    .eq('id', quoteId)
  if (error) throw error
}
