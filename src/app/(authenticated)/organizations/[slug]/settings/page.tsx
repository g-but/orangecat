"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export default function OrganizationSettingsPage({ params }: { params: { slug: string } }) {
  const { user, hydrated, isLoading } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({
    description: '',
    website_url: '',
    treasury_address: '',
    xpub: '',
    network: 'mainnet',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth')
      return
    }
    if (hydrated && user) {
      ;(async () => {
        try {
          const res = await fetch(`/api/organizations/${params.slug}/settings`)
          const data = await res.json()
          if (res.ok) {
            setForm((f) => ({
              ...f,
              description: data.organization?.description || '',
              website_url: data.organization?.website_url || '',
              treasury_address: data.organization?.treasury_address || '',
              xpub: data.wallet?.xpub || '',
              network: data.wallet?.network || 'mainnet',
            }))
          }
        } catch {}
      })()
    }
  }, [user, hydrated, isLoading, router, params.slug])

  const updateField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const isValidBtc = (addr: string) => {
    if (!addr) return true
    return /^((bc1|tb1)[0-9ac-hj-np-z]{25,})$/i.test(addr)
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (!isValidBtc(form.treasury_address)) {
        throw new Error('Invalid Bitcoin address')
      }
      const res = await fetch(`/api/organizations/${params.slug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setMessage('Settings saved')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!hydrated || isLoading) {
    return <div className="p-6">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>

        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea name="description" value={form.description} onChange={updateField} rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <Input name="website_url" value={form.website_url} onChange={updateField} placeholder="https://example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treasury Address (on-chain)</label>
            <Input name="treasury_address" value={form.treasury_address} onChange={updateField} placeholder="bc1…" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">HD Wallet (xpub)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Advanced</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
            <select name="network" value={form.network} onChange={updateField} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account xpub (BIP84 P2WPKH)</label>
            <Input name="xpub" value={form.xpub} onChange={updateField} placeholder="xpub… (read-only key)" />
            <p className="text-xs text-gray-600 mt-1">We derive fresh receive addresses. Do not share private keys.</p>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={save} isLoading={saving}>Save Settings</Button>
          {message && <span className="text-sm text-gray-700">{message}</span>}
        </div>
      </div>
    </div>
  )
}
