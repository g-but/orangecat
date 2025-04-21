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

  if (!isAdmin()) {
    return null
  }

  const updateRole = async (userId: string, newRole: UserRole) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Role Management</h2>
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {/* Add role management UI here */}
      </div>
    </Card>
  )
} 