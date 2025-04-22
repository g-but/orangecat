'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createBrowserClient } from '@supabase/ssr'
import { UserRole } from '@/types/auth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function RoleManagement() {
  const { user, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!isAdmin) {
    return null
  }

  const updateUserRole = async (userId: string, role: UserRole) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { role }
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h2>Role Management</h2>
      {error && <p className="text-red-500">{error}</p>}
      {/* Add your role management UI here */}
    </Card>
  )
} 