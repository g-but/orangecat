"use client";

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Conversation } from './types'
import supabase from '@/lib/supabase/browser'
import { toast } from 'sonner'

export function useConversations(searchQuery: string, selectedConversationId?: string | null) {
  const [items, setItems] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      setRefreshing(true)
      const res = await fetch('/api/messages?limit=30', { credentials: 'same-origin' })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        setError('Failed to load conversations')
        if (t) toast.error('Failed to load conversations', { description: t })
        return
      }
      const data = await res.json().catch(() => ({ conversations: [] }))
      setItems(Array.isArray(data.conversations) ? data.conversations : [])
      setLastFetch(Date.now())
    } catch (e) {
      setError('Network error')
      toast.error('Network error loading conversations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => { refresh() }, [refresh])

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
    let timeout: any = null
    const reqRefresh = () => {
      const now = Date.now()
      const elapsed = now - lastFetch
      if (elapsed < 400 || refreshing) {
        clearTimeout(timeout)
        timeout = setTimeout(() => refresh(), Math.max(0, 400 - elapsed))
      } else {
        refresh()
      }
    }
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, reqRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, reqRefresh)
      .subscribe()
    return () => { clearTimeout(timeout); supabase.removeChannel(channel) }
  }, [refresh, lastFetch, refreshing])

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
