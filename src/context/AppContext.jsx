import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import * as db from '../lib/db'
import { DEMO_USERS, DEMO_POSTS, DEMO_PROVIDERS, DEMO_REPLIES, DEMO_REPORTS } from '../data/demoData'

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
      ? { currentUser: null, posts: [], providers: [], replies: [], reports: [], savedPostIds: [], loading: true, toast: null }
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
        const [profile, posts, providers, savedIds, reports] = await Promise.all([
          db.getProfile(userId),
          db.getPosts(),
          db.getProviders(),
          db.getSavedPostIds(userId),
          db.getReports().catch(() => [])
        ])
        dispatch({ type: 'SET_USER', user: { ...profile, savedPosts: savedIds } })
        dispatch({ type: 'SET_POSTS', posts })
        dispatch({ type: 'SET_PROVIDERS', providers })
        dispatch({ type: 'SET_SAVED', ids: savedIds })
        dispatch({ type: 'SET_REPORTS', reports })
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
            dispatch({ type: 'ADD_POST', post: db.normalizePost ? payload.new : payload.new })
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
  // ACTIONS
  // ────────────────────────────────────────────────────────

  const actions = {

    // ── AUTH ──

    login: async (user) => {
      // Demo mode only
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
      toast('✅ Posted to your locality!')

      if (isSupabaseConfigured) {
        try {
          const real = await db.createPost({ ...postData, userId: state.currentUser.id })
          // Replace optimistic with real
          dispatch({ type: 'UPDATE_POST', post: { ...optimistic, ...real, id: real.id } })
          dispatch({ type: 'ADMIN_REMOVE_POST', postId: optimistic.id }) // remove temp
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
      toast('✅ Helper added to directory!')

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
      toast('✅ Confirmation added!')

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
      toast('🙋 Great! Reply in the thread.')

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
      toast('✅ Marked as fulfilled!')

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
          // Revert optimistic
          dispatch({ type: 'TOGGLE_SAVED', postId })
        }
      } else {
        // Demo: also update currentUser.savedPosts for compatibility
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
      toast('🚩 Report submitted. Thank you!')

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

      // Optimistic
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
      toast('⭐ Recommendation added!')

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
      toast('✅ Provider verified.')
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
    }
  }

  // ────────────────────────────────────────────────────────
  // HELPERS (derived queries)
  // ────────────────────────────────────────────────────────

  const helpers = {
    getPost: (id) => state.posts.find(p => p.id === id),
    getProvider: (id) => state.providers.find(p => p.id === id),
    getUser: (id) => {
      // Try joined author data first (Supabase mode)
      const fromPosts = state.posts.find(p => p.userId === id)?.author
      if (fromPosts) return fromPosts
      // Fall back to users array (demo mode)
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
