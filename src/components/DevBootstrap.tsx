'use client'

import { useEffect } from 'react'

export default function DevBootstrap() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return
    }
    const key = 'messaging_migrations_applied_20251208'
    try {
      if (!localStorage.getItem(key)) {
        fetch('/api/admin/apply-messaging-migrations', { method: 'POST' })
          .then(() => localStorage.setItem(key, '1'))
          .catch(() => {/* ignore errors; will retry next navigation */})
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  return null
}

