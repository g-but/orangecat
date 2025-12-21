"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import type { Conversation } from './types'
import supabase from '@/lib/supabase/browser'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { API_ROUTES, CHANNELS, TIMING, debugLog } from './lib/constants'

export function useConversations(searchQuery: string, selectedConversationId?: string | null) {
  const { user, hydrated, isLoading: authLoading, isAuthenticated } = useAuth()
  const isAuthReady = hydrated && !authLoading

  debugLog('[useConversations] state', {
    user: !!user,
    hydrated,
    authLoading,
    isAuthenticated,
    isAuthReady,
    userId: user?.id
  })

  const [items, setItems] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const hasInitialFetch = useRef(false)

  const refresh = useCallback(async () => {
    debugLog('[useConversations] refresh', { isAuthReady, hasUser: !!user })
    if (!isAuthReady || !user) {
      debugLog('[useConversations] skip refresh (auth not ready or no user)')
      return
    }

    try {
      setError(null)
      setRefreshing(true)
      debugLog('[useConversations] fetching conversations')
      let res = await fetch(`${API_ROUTES.CONVERSATIONS}?limit=30`, { credentials: 'same-origin' })
      debugLog('[useConversations] response status', { status: res.status, text: res.statusText })

      // If unauthorized, try to sync the session from localStorage
      if (res.status === 401) {
        debugLog('[useConversations] 401; syncing session')
        try {
          // Import supabase client dynamically to avoid circular imports
          const { default: supabase } = await import('@/lib/supabase/browser')
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            const syncRes = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
              }),
            })

            if (syncRes.ok) {
              debugLog('[useConversations] session synced; retrying')
              // Retry the original request
              res = await fetch(`${API_ROUTES.CONVERSATIONS}?limit=30`, { credentials: 'same-origin' })
              debugLog('[useConversations] retry status', { status: res.status, text: res.statusText })
            }
          }
        } catch (syncError) {
          console.error('[useConversations] Failed to sync session:', syncError)
        }
      }

      if (!res.ok) {
        const t = await res.text().catch(() => '')
        debugLog('[useConversations] error response', t)
        // Don't show error toast for 401 - that's expected during auth transitions
        if (res.status !== 401) {
          setError('Failed to load conversations')
          if (t) toast.error('Failed to load conversations', { description: t })
        }
        // Clear conversations when API fails (user not authenticated)
        setItems([] as Conversation[])
        return
      }
      const data = await res.json().catch(() => ({ conversations: [] }))
      debugLog('[useConversations] data', { count: Array.isArray(data.conversations) ? data.conversations.length : 0 })
      // Deduplicate conversations by ID
      const conversations = (Array.isArray(data.conversations) ? data.conversations : []) as Conversation[]
      const uniqueConversations = Array.from(
        new Map(conversations.map((c: Conversation) => [c.id, c])).values()
      )
      debugLog('[useConversations] set conversations', uniqueConversations.length)
      setItems(uniqueConversations)
      setLastFetch(Date.now())
    } catch (e) {
      console.error('[useConversations] Network error:', e)
      setError('Network error')
      // Clear conversations on network error
      setItems([] as Conversation[])
      toast.error('Network error loading conversations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isAuthReady, user])

  // Initial load - always fetch for development
  useEffect(() => {
    if (!hasInitialFetch.current) {
      hasInitialFetch.current = true
      refresh()
    }
  }, [refresh])

  // Ensure selected conversation appears in the list (summary endpoint)
  useEffect(() => {
    const ensureSelected = async () => {
      if (!selectedConversationId) return
      if (items.some(c => c.id === selectedConversationId)) return
      try {
        const res = await fetch(`/api/messages/${selectedConversationId}/summary`, { credentials: 'same-origin' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (data?.conversation) {
          setItems(prev => [{ ...(data.conversation as Conversation) }, ...prev])
        }
      } catch {
        // ignore
      }
    }
    ensureSelected()
  }, [selectedConversationId, items])

  // Realtime: debounce refresh calls to avoid bursts
  useEffect(() => {
    if (!isAuthReady || !user) {
      debugLog('[useConversations] skip realtime (auth not ready)')
      return
    }

    let timeout: any = null
    const reqRefresh = () => {
      const now = Date.now()
      const elapsed = now - lastFetch
      if (elapsed < TIMING.REFRESH_DEBOUNCE_MS || refreshing) {
        clearTimeout(timeout)
        timeout = setTimeout(() => refresh(), Math.max(0, TIMING.REFRESH_DEBOUNCE_MS - elapsed))
      } else {
        refresh()
      }
    }
    const channel = supabase
      .channel(CHANNELS.CONVERSATIONS_LIST)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, reqRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, reqRefresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_participants' }, reqRefresh)
      .subscribe()
    return () => { clearTimeout(timeout); supabase.removeChannel(channel) }
  }, [refresh, lastFetch, refreshing, isAuthReady, user])

  // Client filtering
  const filtered = useMemo(() => {
    const q = (searchQuery || '').toLowerCase()
    if (!q) return items
    return items.filter(c => {
      if (c.title && c.title.toLowerCase().includes(q)) return true
      return (c.participants || []).some(p => (p.name || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q))
    })
  }, [items, searchQuery])

  const removeLocal = useCallback((ids: string[]) => {
    if (!Array.isArray(ids) || ids.length === 0) return
    setItems(prev => prev.filter(c => !ids.includes(c.id)))
  }, [])

  return { conversations: filtered, loading, error, refresh, removeLocal }
}
