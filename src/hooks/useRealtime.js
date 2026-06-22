// LocalSetu — Supabase real-time hook
// Subscribes to live changes on posts, post_confirmations, and replies.
// Dispatches to AppContext reducer so the feed updates without a page refresh.
//
// Usage: call useRealtime() inside a component that's always mounted (e.g. App.jsx)
// after the user has logged in. Cleans up subscriptions on unmount.

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useRealtime(dispatch, currentUser) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('localsetu-feed')

      // New post created by anyone
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'posts',
      }, (payload) => {
        if (!payload.new) return
        dispatch({ type: 'REALTIME_NEW_POST', raw: payload.new })
      })

      // Post updated (status change, boost, still_happening count)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'posts',
      }, (payload) => {
        if (!payload.new) return
        dispatch({ type: 'REALTIME_UPDATE_POST', raw: payload.new })
      })

      // "Still happening" confirmation added
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'post_confirmations',
      }, (payload) => {
        if (!payload.new) return
        dispatch({ type: 'REALTIME_CONFIRMATION', postId: payload.new.post_id, userId: payload.new.user_id })
      })

      // New reply
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'replies',
      }, (payload) => {
        if (!payload.new) return
        dispatch({ type: 'REALTIME_NEW_REPLY', raw: payload.new })
      })

      // Society post updates (notices, events)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'society_posts',
      }, (payload) => {
        if (!payload.new) return
        dispatch({ type: 'REALTIME_NEW_SOCIETY_POST', raw: payload.new })
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
  }, [currentUser?.id]) // re-subscribe if user changes
}
