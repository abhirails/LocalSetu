// LocalSetu — Supabase real-time hook
// Single source of truth for live feed subscriptions (posts, confirmations, replies, society_posts).

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { normalizePost, normalizeReply, normalizeSocietyPost } from '../lib/db'

export function useRealtime(dispatch, currentUser) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('localsetu-feed')

      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'posts',
      }, (payload) => {
        if (!payload.new) return
        const post = normalizePost(payload.new)
        if (!post) return
        dispatch({ type: 'REALTIME_NEW_POST', post })
      })

      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'posts',
      }, (payload) => {
        if (!payload.new) return
        const post = normalizePost(payload.new)
        if (!post) return
        dispatch({ type: 'REALTIME_UPDATE_POST', post })
      })

      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'post_confirmations',
      }, (payload) => {
        if (!payload.new) return
        dispatch({ type: 'REALTIME_CONFIRMATION', postId: payload.new.post_id, userId: payload.new.user_id })
      })

      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'replies',
      }, (payload) => {
        if (!payload.new) return
        const reply = normalizeReply(payload.new)
        if (!reply) return
        dispatch({ type: 'REALTIME_NEW_REPLY', reply })
      })

      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'society_posts',
      }, (payload) => {
        if (!payload.new) return
        const post = normalizeSocietyPost(payload.new)
        if (!post) return
        dispatch({ type: 'REALTIME_NEW_SOCIETY_POST', post })
      })

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[LocalSetu] Real-time connected')
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('[LocalSetu] Real-time connection error')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [currentUser?.id, dispatch])
}
