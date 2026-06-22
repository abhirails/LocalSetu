import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import * as db from '../lib/db'
import { DEMO_USERS, DEMO_POSTS, DEMO_PROVIDERS, DEMO_REPLIES, DEMO_REPORTS, DEMO_SOCIETIES, DEMO_SOCIETY_POSTS, DEMO_SOCIETY_MEMBERS, DEMO_BUSINESSES } from '../data/demoData'

const AppContext = createContext(null)

// ────────────────────────────────────────────────────────────
// DEMO MODE HELPERS (when Supabase not configured)
// ────────────────────────────────────────────────────────────

function loadLocalState() {
  try {
    const s = localStorage.getItem('localsetu_state')
    if (s) return JSON.parse(s)
  } catch {}
  return null
}

function initDemoState() {
  const saved = loadLocalState()
  if (saved) return { ...saved, loading: false, toast: null }
  return {
    currentUser: null,
    users: DEMO_USERS,
    posts: DEMO_POSTS,
    providers: DEMO_PROVIDERS,
    replies: DEMO_REPLIES,
    reports: DEMO_REPORTS,
    savedPostIds: [],
    societies: DEMO_SOCIETIES,
    societyPosts: DEMO_SOCIETY_POSTS,
    societyMembers: DEMO_SOCIETY_MEMBERS,
    businesses: DEMO_BUSINESSES,
    liveLocality: null,
    liveCoords: null,
    locationStatus: 'idle',
    radiusFilter: null,
    activeLocality: null,
    savedLocalities: [],
    loading: false,
    toast: null
  }
}

// ────────────────────────────────────────────────────────────
// REDUCER (shared by both demo and Supabase modes)
// ────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    // ── Auth ──
    case 'SET_USER':
      return { ...state, currentUser: action.user, loading: false }
    case 'LOGOUT':
      return { ...state, currentUser: null, savedPostIds: [] }
    case 'SET_LOADING':
      return { ...state, loading: action.value }

    // ── Posts ──
    case 'SET_POSTS':
      return { ...state, posts: action.posts }
    case 'ADD_POST':
      return { ...state, posts: [action.post, ...state.posts] }
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(p => p.id === action.post.id ? { ...p, ...action.post } : p)
      }

    // ── Providers ──
    case 'SET_PROVIDERS':
      return { ...state, providers: action.providers }
    case 'ADD_PROVIDER':
      return { ...state, providers: [action.provider, ...state.providers] }
    case 'UPDATE_PROVIDER':
      return {
        ...state,
        providers: state.providers.map(p => p.id === action.provider.id ? { ...p, ...action.provider } : p)
      }

    // ── Replies ──
    case 'SET_REPLIES': {
      const existing = state.replies.filter(r => r.postId !== action.postId)
      return { ...state, replies: [...existing, ...action.replies] }
    }
    case 'ADD_REPLY':
      return { ...state, replies: [action.reply, ...state.replies] }

    // ── Reports (demo mode) ──
    case 'ADD_REPORT':
      return { ...state, reports: [action.report, ...state.reports] }
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r => r.id === action.id ? { ...r, status: action.status } : r)
      }

    // ── Saved Posts ──
    case 'SET_SAVED':
      return { ...state, savedPostIds: action.ids }
    case 'TOGGLE_SAVED': {
      const isSaved = state.savedPostIds.includes(action.postId)
      return {
        ...state,
        savedPostIds: isSaved
          ? state.savedPostIds.filter(id => id !== action.postId)
          : [...state.savedPostIds, action.postId]
      }
    }

    // ── Still Happening (optimistic) ──
    case 'CONFIRM_STILL_HAPPENING':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.postId && !p.confirmedBy?.includes(action.userId)
            ? {
                ...p,
                stillHappeningCount: (p.stillHappeningCount || 0) + 1,
                confirmedBy: [...(p.confirmedBy || []), action.userId],
                lastConfirmedAt: new Date().toISOString()
              }
            : p
        )
      }

    // ── I Can Help (optimistic) ──
    case 'MARK_HELPER':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.postId
            ? { ...p, helperCount: (p.helperCount || 0) + 1 }
            : p
        )
      }

    // ── Mark Fulfilled ──
    case 'MARK_FULFILLED':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.postId ? { ...p, isFulfilled: true, status: 'fulfilled' } : p
        )
      }

    // ── Block User (demo) ──
    case 'BLOCK_USER': {
      const cu = state.currentUser
      if (!cu) return state
      const updated = { ...cu, blockedUsers: [...(cu.blockedUsers || []), action.userId] }
      return {
        ...state,
        currentUser: updated,
        users: (state.users || []).map(u => u.id === cu.id ? updated : u)
      }
    }

    // ── Report Post (demo optimistic) ──
    case 'REPORT_POST_OPTIMISTIC': {
      return {
        ...state,
        posts: state.posts.map(p => {
          if (p.id !== action.postId) return p
          const newCount = (p.reportCount || 0) + 1
          return { ...p, reportCount: newCount, status: newCount >= 3 ? 'flagged' : p.status }
        })
      }
    }

    // ── Admin ──
    case 'ADMIN_REMOVE_POST':
      return { ...state, posts: state.posts.map(p => p.id === action.postId ? { ...p, status: 'removed' } : p) }
    case 'ADMIN_RESTORE_POST':
      return { ...state, posts: state.posts.map(p => p.id === action.postId ? { ...p, status: 'active', reportCount: 0 } : p) }
    case 'ADMIN_PIN_POST':
      return { ...state, posts: state.posts.map(p => p.id === action.postId ? { ...p, isPinned: !p.isPinned } : p) }
    case 'ADMIN_VERIFY_PROVIDER':
      return { ...state, providers: state.providers.map(p => p.id === action.providerId ? { ...p, isVerified: true } : p) }
    case 'ADMIN_BAN_USER':
      return { ...state, users: (state.users || []).map(u => u.id === action.userId ? { ...u, isBanned: true } : u) }
    case 'ADMIN_WARN_USER':
      return { ...state, users: (state.users || []).map(u => u.id === action.userId ? { ...u, isWarned: true } : u) }

    // ── Live Location ──
    // ── Societies ──
    case 'SET_SOCIETIES':
      return { ...state, societies: action.societies }
    case 'SET_SOCIETY_POSTS':
      return {
        ...state,
        societyPosts: [
          ...state.societyPosts.filter(p => p.societyId !== action.societyId),
          ...action.posts
        ]
      }
    case 'ADD_SOCIETY_POST':
      return { ...state, societyPosts: [action.post, ...state.societyPosts] }
    case 'UPDATE_SOCIETY_POST':
      return {
        ...state,
        societyPosts: state.societyPosts.map(p =>
          p.id === action.post.id ? { ...p, ...action.post } : p
        )
      }

    // ── Society Members (Phase 3) ──
    case 'SET_SOCIETY_MEMBERS':
      return { ...state, societyMembers: action.members }
    case 'ADD_SOCIETY_MEMBER':
      return { ...state, societyMembers: [action.member, ...state.societyMembers] }
    case 'UPDATE_SOCIETY_MEMBER':
      return {
        ...state,
        societyMembers: state.societyMembers.map(m =>
          m.id === action.member.id ? { ...m, ...action.member } : m
        )
      }

    case 'SET_LIVE_LOCALITY':
      return { ...state, liveLocality: action.locality, liveCoords: action.coords || state.liveCoords, locationStatus: action.status || 'granted' }
    case 'SET_LOCATION_STATUS':
      return { ...state, locationStatus: action.status }
    case 'SET_RADIUS_FILTER':
      return { ...state, radiusFilter: action.radius }

    // ── Multi-Locality ──
    case 'SET_ACTIVE_LOCALITY':
      return { ...state, activeLocality: action.locality }
    case 'SET_SAVED_LOCALITIES':
      return {
        ...state,
        savedLocalities: action.localities,
        currentUser: state.currentUser
          ? { ...state.currentUser, savedLocalities: action.localities }
          : state.currentUser
      }
    case 'ADD_SAVED_LOCALITY': {
      const current = state.savedLocalities || []
      if (current.includes(action.locality) || current.length >= 2) return state
      const updated = [...current, action.locality]
      return {
        ...state,
        savedLocalities: updated,
        currentUser: state.currentUser
          ? { ...state.currentUser, savedLocalities: updated }
          : state.currentUser
      }
    }
    case 'REMOVE_SAVED_LOCALITY': {
      const updated = (state.savedLocalities || []).filter(l => l !== action.locality)
      return {
        ...state,
        savedLocalities: updated,
        activeLocality: state.activeLocality === action.locality ? null : state.activeLocality,
        currentUser: state.currentUser
          ? { ...state.currentUser, savedLocalities: updated }
          : state.currentUser
      }
    }

    // ── Phase 4: Businesses + Boosts ──
    case 'SET_BUSINESSES':
      return { ...state, businesses: action.businesses }
    case 'ADD_BUSINESS':
      return { ...state, businesses: [action.business, ...state.businesses] }
    case 'BOOST_POST':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.postId
            ? { ...p, isBoosted: true, boostedUntil: action.boostedUntil }
            : p
        )
      }

    // ── Toast ──
    case 'SET_TOAST':
      return { ...state, toast: action.message }
    case 'CLEAR_TOAST':
      return { ...state, toast: null }

    default:
      return state
  }
}

// ────────────────────────────────────────────────────────────
// PROVIDER
// ────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    isSupabaseConfigured
      ? { currentUser: null, posts: [], providers: [], replies: [], reports: [], savedPostIds: [], societies: [], societyPosts: [], societyMembers: [], businesses: [], liveLocality: null, liveCoords: null, locationStatus: 'idle', radiusFilter: null, activeLocality: null, savedLocalities: [], loading: true, toast: null }
      : initDemoState()
  )

  // ── Persist demo state to localStorage ──
  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const { toast, loading, ...persistable } = state
        localStorage.setItem('localsetu_state', JSON.stringify(persistable))
      } catch {}
    }
  }, [state])

  // ── Toast auto-clear ──
  useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2500)
      return () => clearTimeout(t)
    }
  }, [state.toast])

  const toast = useCallback((message) => {
    dispatch({ type: 'SET_TOAST', message })
  }, [])

  // ── SUPABASE MODE: Auth listener + initial data load ──
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const loadData = async (userId) => {
      try {
        const [profile, posts, providers, savedIds, reports, societies, feedSocietyPosts, memberships] = await Promise.all([
          db.getProfile(userId),
          db.getPosts(),
          db.getProviders(),
          db.getSavedPostIds(userId),
          db.getReports().catch(() => []),
          db.getSocieties().catch(() => []),
          db.getFeedSocietyPosts().catch(() => []),
          db.getUserMemberships(userId).catch(() => [])
        ])
        dispatch({ type: 'SET_USER', user: { ...profile, savedPosts: savedIds } })
        dispatch({ type: 'SET_POSTS', posts })
        dispatch({ type: 'SET_PROVIDERS', providers })
        dispatch({ type: 'SET_SAVED', ids: savedIds })
        dispatch({ type: 'SET_REPORTS', reports })
        dispatch({ type: 'SET_SOCIETIES', societies })
        feedSocietyPosts.forEach(p => dispatch({ type: 'ADD_SOCIETY_POST', post: p }))
        dispatch({ type: 'SET_SOCIETY_MEMBERS', members: memberships })
        // Restore saved localities from profile
        if (profile.savedLocalities?.length) {
          dispatch({ type: 'SET_SAVED_LOCALITIES', localities: profile.savedLocalities })
        }
      } catch (err) {
        console.error('LocalSetu: failed to load data', err)
        dispatch({ type: 'SET_LOADING', value: false })
      }
    }

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadData(session.user.id)
      } else {
        dispatch({ type: 'SET_LOADING', value: false })
      }
    })

    // Listen for sign-in / sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' })
          dispatch({ type: 'SET_LOADING', value: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── SUPABASE MODE: Real-time subscriptions ──
  useEffect(() => {
    if (!isSupabaseConfigured || !state.currentUser) return

    const channel = supabase
      .channel('localsetu-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          // Avoid duplicating optimistic inserts from the current user
          const exists = state.posts.some(p => p.id === payload.new.id)
          if (!exists) {
            dispatch({ type: "ADD_POST", post: payload.new })
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          dispatch({ type: 'UPDATE_POST', post: { id: payload.new.id, ...payload.new } })
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'replies' },
        (payload) => {
          const exists = state.replies.some(r => r.id === payload.new.id)
          if (!exists) {
            dispatch({ type: 'ADD_REPLY', reply: { ...payload.new, postId: payload.new.post_id, userId: payload.new.user_id, replyType: payload.new.reply_type, createdAt: payload.new.created_at } })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [state.currentUser?.id])

  // ────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────
  // ACTIONS
  // ────────────────────────────────────────────────────────

  const actions = {

    // ── AUTH ──

    login: async (user) => {
      dispatch({ type: 'SET_USER', user: { ...user, savedPosts: user.savedPosts || [] } })
    },

    logout: async () => {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut()
      }
      dispatch({ type: 'LOGOUT' })
    },

    // ── POSTS ──

    addPost: async (postData) => {
      const optimistic = {
        ...postData,
        id: 'opt_' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'active',
        reportCount: 0,
        stillHappeningCount: 0,
        confirmedBy: [],
        helperCount: 0,
        isFulfilled: false
      }
      dispatch({ type: 'ADD_POST', post: optimistic })
      toast('Posted to your locality!')

      if (isSupabaseConfigured) {
        try {
          const real = await db.createPost({ ...postData, userId: state.currentUser.id })
          dispatch({ type: 'UPDATE_POST', post: { ...optimistic, ...real, id: real.id } })
          dispatch({ type: 'ADMIN_REMOVE_POST', postId: optimistic.id })
          dispatch({ type: 'ADD_POST', post: real })
        } catch (err) {
          console.error('LocalSetu: failed to create post', err)
        }
      }
    },

    addProvider: async (providerData) => {
      const optimistic = {
        ...providerData,
        id: 'opt_prov_' + Date.now(),
        createdAt: new Date().toISOString(),
        recommendationCount: 1,
        recommenderIds: [state.currentUser?.id],
        isVerified: false,
        lastRecommendedAt: new Date().toISOString()
      }
      dispatch({ type: 'ADD_PROVIDER', provider: optimistic })
      toast('Helper added to directory!')

      if (isSupabaseConfigured) {
        try {
          const real = await db.createProvider(providerData, state.currentUser.id)
          dispatch({ type: 'UPDATE_PROVIDER', provider: real })
        } catch (err) {
          console.error('LocalSetu: failed to create provider', err)
        }
      }
    },

    addReply: async (replyData) => {
      const optimistic = {
        ...replyData,
        id: 'opt_reply_' + Date.now(),
        createdAt: new Date().toISOString()
      }
      dispatch({ type: 'ADD_REPLY', reply: optimistic })

      if (isSupabaseConfigured) {
        try {
          const real = await db.createReply({ ...replyData, userId: state.currentUser.id })
          dispatch({ type: 'ADD_REPLY', reply: real })
        } catch (err) {
          console.error('LocalSetu: failed to create reply', err)
        }
      }
    },

    confirmStillHappening: async (postId) => {
      const userId = state.currentUser?.id
      if (!userId) return
      dispatch({ type: 'CONFIRM_STILL_HAPPENING', postId, userId })
      toast('Confirmation added!')

      if (isSupabaseConfigured) {
        try {
          await db.confirmStillHappening(postId, userId)
        } catch (err) {
          console.error('LocalSetu: confirmStillHappening failed', err)
        }
      }
    },

    markICanHelp: async (postId) => {
      dispatch({ type: 'MARK_HELPER', postId })
      toast('Great! Reply in the thread.')

      if (isSupabaseConfigured) {
        try {
          await supabase.rpc('increment_helper_count', { p_post_id: postId })
        } catch (err) {
          console.error('LocalSetu: markICanHelp failed', err)
        }
      }
    },

    markFulfilled: async (postId) => {
      dispatch({ type: 'MARK_FULFILLED', postId })
      toast('Marked as fulfilled!')

      if (isSupabaseConfigured) {
        try {
          await db.updatePost(postId, { isFulfilled: true, status: 'fulfilled' })
        } catch (err) {
          console.error('LocalSetu: markFulfilled failed', err)
        }
      }
    },

    savePost: async (postId) => {
      const userId = state.currentUser?.id
      if (!userId) return
      const isSaved = state.savedPostIds.includes(postId)
      dispatch({ type: 'TOGGLE_SAVED', postId })

      if (isSupabaseConfigured) {
        try {
          if (isSaved) {
            await db.unsavePost(userId, postId)
          } else {
            await db.savePost(userId, postId)
          }
        } catch (err) {
          dispatch({ type: 'TOGGLE_SAVED', postId })
        }
      } else {
        const cu = state.currentUser
        if (cu) {
          const updatedSaved = isSaved
            ? (cu.savedPosts || []).filter(id => id !== postId)
            : [...(cu.savedPosts || []), postId]
          dispatch({ type: 'SET_USER', user: { ...cu, savedPosts: updatedSaved } })
        }
      }
    },

    reportPost: async (postId, reason, note) => {
      dispatch({ type: 'REPORT_POST_OPTIMISTIC', postId })
      toast('Report submitted. Thank you!')

      if (isSupabaseConfigured) {
        try {
          await db.createReport({
            reporterId: state.currentUser.id,
            targetType: 'post',
            targetId: postId,
            reason,
            note
          })
        } catch (err) {
          console.error('LocalSetu: reportPost failed', err)
        }
      } else {
        dispatch({
          type: 'ADD_REPORT',
          report: {
            id: 'report_' + Date.now(),
            reporterId: state.currentUser?.id,
            targetType: 'post',
            targetId: postId,
            reason,
            note,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        })
      }
    },

    blockUser: async (userId) => {
      dispatch({ type: 'BLOCK_USER', userId })
      toast('User blocked.')

      if (isSupabaseConfigured) {
        try {
          await db.blockUser(state.currentUser.id, userId)
        } catch (err) {
          console.error('LocalSetu: blockUser failed', err)
        }
      }
    },

    recommendProvider: async (providerId, note) => {
      const userId = state.currentUser?.id
      if (!userId) return

      dispatch({
        type: 'UPDATE_PROVIDER',
        provider: {
          id: providerId,
          recommenderIds: [...(state.providers.find(p => p.id === providerId)?.recommenderIds || []), userId],
          recommendationCount: (state.providers.find(p => p.id === providerId)?.recommendationCount || 0) + 1,
          notes: note
            ? [note, ...(state.providers.find(p => p.id === providerId)?.notes || [])]
            : state.providers.find(p => p.id === providerId)?.notes || [],
          isVerified: ((state.providers.find(p => p.id === providerId)?.recommendationCount || 0) + 1) >= 3,
          lastRecommendedAt: new Date().toISOString()
        }
      })
      toast('Recommendation added!')

      if (isSupabaseConfigured) {
        try {
          const real = await db.recommendProvider(providerId, userId, note)
          if (real) dispatch({ type: 'UPDATE_PROVIDER', provider: real })
        } catch (err) {
          console.error('LocalSetu: recommendProvider failed', err)
        }
      }
    },

    loadReplies: async (postId) => {
      if (isSupabaseConfigured) {
        try {
          const replies = await db.getReplies(postId)
          dispatch({ type: 'SET_REPLIES', postId, replies })
        } catch (err) {
          console.error('LocalSetu: loadReplies failed', err)
        }
      }
    },

    // ── ADMIN ──

    adminRemovePost: async (postId) => {
      dispatch({ type: 'ADMIN_REMOVE_POST', postId })
      toast('Post removed.')
      if (isSupabaseConfigured) {
        await db.updatePost(postId, { status: 'removed' }).catch(console.error)
      }
    },

    adminApprovePost: async (postId) => {
      dispatch({ type: 'ADMIN_RESTORE_POST', postId })
      toast('Post restored.')
      if (isSupabaseConfigured) {
        await db.updatePost(postId, { status: 'active', reportCount: 0 }).catch(console.error)
      }
    },

    adminPinPost: (postId) => {
      dispatch({ type: 'ADMIN_PIN_POST', postId })
    },

    adminVerifyProvider: async (providerId) => {
      dispatch({ type: 'ADMIN_VERIFY_PROVIDER', providerId })
      toast('Provider verified.')
      if (isSupabaseConfigured) {
        await supabase.from('providers').update({ is_verified: true }).eq('id', providerId).catch(console.error)
      }
    },

    adminWarnUser: (userId) => {
      dispatch({ type: 'ADMIN_WARN_USER', userId })
      toast('Warning sent to user.')
    },

    adminBanUser: (userId) => {
      dispatch({ type: 'ADMIN_BAN_USER', userId })
      toast('User banned.')
    },

    adminResolveReport: async (reportId) => {
      dispatch({ type: 'UPDATE_REPORT', id: reportId, status: 'reviewed' })
      if (isSupabaseConfigured) {
        await db.updateReport(reportId, { status: 'reviewed' }).catch(console.error)
      }
    },

    // ── SOCIETIES ──

    loadSocieties: async () => {
      if (isSupabaseConfigured) {
        try {
          const [societies, feedPosts] = await Promise.all([
            db.getSocieties(),
            db.getFeedSocietyPosts()
          ])
          dispatch({ type: 'SET_SOCIETIES', societies })
          feedPosts.forEach(p => dispatch({ type: 'ADD_SOCIETY_POST', post: p }))
        } catch (err) {
          console.error('LocalSetu: loadSocieties failed', err)
        }
      }
    },

    loadSocietyPosts: async (societyId) => {
      if (isSupabaseConfigured) {
        try {
          const posts = await db.getSocietyPosts(societyId)
          dispatch({ type: 'SET_SOCIETY_POSTS', societyId, posts })
        } catch (err) {
          console.error('LocalSetu: loadSocietyPosts failed', err)
        }
      }
    },

    addSocietyPost: async (societyId, postData) => {
      const optimistic = {
        ...postData,
        id: 'opt_sp_' + Date.now(),
        societyId,
        postedBy: state.currentUser?.id,
        status: 'active',
        createdAt: new Date().toISOString()
      }
      dispatch({ type: 'ADD_SOCIETY_POST', post: optimistic })
      toast('Posted to society!')

      if (isSupabaseConfigured) {
        try {
          const real = await db.createSocietyPost(societyId, state.currentUser.id, postData)
          dispatch({ type: 'UPDATE_SOCIETY_POST', post: { ...optimistic, ...real } })
        } catch (err) {
          console.error('LocalSetu: addSocietyPost failed', err)
        }
      }
    },

    resolveSocietyPost: async (postId) => {
      dispatch({ type: 'UPDATE_SOCIETY_POST', post: { id: postId, status: 'resolved' } })
      toast('Marked as resolved.')
      if (isSupabaseConfigured) {
        await db.updateSocietyPost(postId, { status: 'resolved' }).catch(console.error)
      }
    },

    removeSocietyPost: async (postId) => {
      dispatch({ type: 'UPDATE_SOCIETY_POST', post: { id: postId, status: 'removed' } })
      if (isSupabaseConfigured) {
        await db.updateSocietyPost(postId, { status: 'removed' }).catch(console.error)
      }
    },

    // ── SOCIETY MEMBERS (Phase 3) ──

    requestJoinSociety: async (societyId) => {
      const userId = state.currentUser?.id
      if (!userId) return
      // Optimistic
      const optimistic = {
        id: 'opt_mem_' + Date.now(),
        societyId,
        userId,
        role: 'resident',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        profile: null
      }
      dispatch({ type: 'ADD_SOCIETY_MEMBER', member: optimistic })
      toast('Join request sent! Waiting for approval.')

      if (isSupabaseConfigured) {
        try {
          const real = await db.requestJoinSociety(userId, societyId)
          dispatch({ type: 'UPDATE_SOCIETY_MEMBER', member: { ...optimistic, ...real } })
        } catch (err) {
          console.error('LocalSetu: requestJoinSociety failed', err)
          // revert optimistic
          dispatch({ type: 'SET_SOCIETY_MEMBERS', members: state.societyMembers })
        }
      }
    },

    loadSocietyMembers: async (societyId) => {
      if (isSupabaseConfigured) {
        try {
          const members = await db.getSocietyMembers(societyId)
          // Merge: replace members for this society, keep others
          const others = state.societyMembers.filter(m => m.societyId !== societyId)
          dispatch({ type: 'SET_SOCIETY_MEMBERS', members: [...others, ...members] })
        } catch (err) {
          console.error('LocalSetu: loadSocietyMembers failed', err)
        }
      }
    },

    approveSocietyMember: async (memberId) => {
      dispatch({ type: 'UPDATE_SOCIETY_MEMBER', member: { id: memberId, status: 'approved', reviewedAt: new Date().toISOString() } })
      toast('Member approved!')
      if (isSupabaseConfigured) {
        await db.approveSocietyMember(memberId, state.currentUser.id).catch(console.error)
      }
    },

    rejectSocietyMember: async (memberId) => {
      dispatch({ type: 'UPDATE_SOCIETY_MEMBER', member: { id: memberId, status: 'rejected', reviewedAt: new Date().toISOString() } })
      toast('Request rejected.')
      if (isSupabaseConfigured) {
        await db.rejectSocietyMember(memberId, state.currentUser.id).catch(console.error)
      }
    },

    // ── Phase 4: Business Listings ──
    loadBusinesses: async ({ category } = {}) => {
      if (isSupabaseConfigured) {
        try {
          const businesses = await db.getBusinesses({ category })
          dispatch({ type: 'SET_BUSINESSES', businesses })
        } catch (err) {
          console.error('LocalSetu: loadBusinesses failed', err)
        }
      }
      // In demo mode businesses are already in state from initialisation
    },

    // ── Phase 4: Post Boost ──
    boostPost: async (postId, hours = 48) => {
      const boostedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      // Optimistic
      dispatch({ type: 'BOOST_POST', postId, boostedUntil })
      toast(`Post boosted for ${hours}h! ⚡`)
      if (isSupabaseConfigured && state.currentUser) {
        await db.boostPost(postId, state.currentUser.id, hours).catch(console.error)
      }
    },

    setLiveLocality: (locality, coords, status = 'granted') => {
      dispatch({ type: 'SET_LIVE_LOCALITY', locality, coords, status })
    },

    setLocationStatus: (status) => {
      dispatch({ type: 'SET_LOCATION_STATUS', status })
    },

    setRadiusFilter: (radius) => {
      dispatch({ type: 'SET_RADIUS_FILTER', radius })
    },

    // ── Multi-Locality ──
    setActiveLocality: (locality) => {
      dispatch({ type: 'SET_ACTIVE_LOCALITY', locality })
    },

    addSavedLocality: async (locality) => {
      const current = state.savedLocalities || []
      if (current.includes(locality) || current.length >= 2) return
      dispatch({ type: 'ADD_SAVED_LOCALITY', locality })
      if (isSupabaseConfigured && state.currentUser) {
        const updated = [...current, locality]
        await db.updateSavedLocalities(state.currentUser.id, updated).catch(console.error)
      }
    },


    emoveSavedLocality: async (locality) => {
      dispatch({ type: 'REMOVE_SAVED_LOCALITY', locality })
      if (isSupabaseConfigured && state.currentUser) {
        const updated = (state.savedLocalities || []).filter(l => l !== locality)
        await db.updateSavedLocalities(state.currentUser.id, updated).catch(console.error)
      }
    },
  }

  // ────────────────────────────────────────────────────────
  // HELPERS (derived queries, read-only)
  // ----------------------------------------------------

  const helpers = {
    getPost: (id) => state.posts.find(p => p.id === id),
    getProvider: (id) => state.providers.find(p => p.id === id),
    getUser: (id) => {
      const fromPosts = state.posts.find(p => p.userId === id)?.author
      if (fromPosts) return fromPosts
      return (state.users || []).find(u => u.id === id) || null
    },
    getReplies: (postId) =>
      state.replies
        .filter(r => r.postId === postId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),

    isPostSaved: (postId) => state.savedPostIds.includes(postId),
    isBlocked: (userId) => state.currentUser?.blockedUsers?.includes(userId) || false,

    getActivePosts: (type) =>
      state.posts
        .filter(p => {
          if (type && p.type !== type) return false
          if (p.status === 'removed') return false
          if (helpers.isBlocked(p.userId)) return false
          return true
        })
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          return new Date(b.createdAt) - new Date(a.createdAt)
        }),

    getPendingReports: () =>
      state.reports.filter(r => r.status === 'pending'),

    getFlaggedPosts: () =>
      state.posts.filter(p => p.status === 'flagged' || (p.reportCount || 0) >= 3),

    getSociety: (id) => state.societies.find(s => s.id === id),

    getSocietyPosts: (societyId) =>
      state.societyPosts
        .filter(p => p.societyId === societyId && p.status !== 'removed')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

    getFeedSocietyPosts: () =>
      state.societyPosts
        .filter(p => p.pinToFeed && p.status === 'active')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

    isSocietyAdmin: () => state.currentUser?.role === 'society_admin',

    getMySociety: () => state.societies.find(s => s.id === state.currentUser?.societyId),

    // Phase 3 — membership helpers
    getMembership: (societyId) =>
      (state.societyMembers || []).find(
        m => m.societyId === societyId && m.userId === state.currentUser?.id
      ) || null,

    getMembershipStatus: (societyId) => {
      const m = (state.societyMembers || []).find(
        x => x.societyId === societyId && x.userId === state.currentUser?.id
      )
      return m ? m.status : null
    },

    getMemberRole: (societyId) => {
      const m = (state.societyMembers || []).find(
        x => x.societyId === societyId && x.userId === state.currentUser?.id && x.status === 'approved'
      )
      return m ? m.role : null
    },

    canViewSocietyPost: (post) => {
      if (!post) return false
      const vis = post.visibility || 'public'
      if (vis === 'public') return true
      const m = (state.societyMembers || []).find(
        x => x.societyId === post.societyId && x.userId === state.currentUser?.id && x.status === 'approved'
      )
      if (!m) return false
      if (vis === 'society') return true
      if (vis === 'committee') return m.role === 'committee' || m.role === 'admin'
      if (vis === 'admin') return m.role === 'admin'
      return false
    },

    getSocietyMembersList: (societyId) =>
      (state.societyMembers || []).filter(m => m.societyId === societyId),

    getPendingMemberships: (societyId) =>
      (state.societyMembers || []).filter(m => m.societyId === societyId && m.status === 'pending'),

    getApprovedMemberships: (societyId) =>
      (state.societyMembers || []).filter(m => m.societyId === societyId && m.status === 'approved'),
  }

  return (
    <AppContext.Provider value={{ state, actions, helpers, isSupabaseConfigured }}>
      {children}
      {state.toast && <div className="toast">{state.toast}</div>}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
