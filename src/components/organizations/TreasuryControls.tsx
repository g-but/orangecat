"use client"

import Button from '@/components/ui/Button'
import { useState } from 'react'

export default function TreasuryControls({ slug }: { slug: string }) {
  const [creating, setCreating] = useState(false)
  const [lastAddress, setLastAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateAddress = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/organizations/${slug}/treasury/addresses/next`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate address')
      setLastAddress(data.address)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate address')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={generateAddress} isLoading={creating} variant="outline">
          Generate New Address
        </Button>
        {lastAddress && (
          <code className="p-2 bg-gray-50 border border-gray-200 rounded text-xs break-all">{lastAddress}</code>
        )}
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}

