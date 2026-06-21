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
    blockedUsers: p.blocked_users || [],
    savedPosts:   [],           // loaded separately
    joinedAt:     p.created_at
  }
}

function normalizePost(p) {
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

function normalizeReply(r) {
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
