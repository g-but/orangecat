"use client"

import { useEffect, useState, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type Activity = {
  address: string
  explorer_base: string
  received_sats: number
  spent_sats: number
  balance_sats: number
  unconfirmed_sats: number
  last_updated: string
  txs: Array<{
    txid: string
    time: number | null
    amount_sats: number
    direction: 'in' | 'out'
    confirmations: number
    explorer_url: string
  }>
}

export default function TreasuryActivity({ slug, endpoint }: { slug?: string; endpoint?: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Activity | null>(null)
  const timer = useRef<NodeJS.Timeout | null>(null)

  const load = async () => {
    setError(null)
    try {
      const url = endpoint || (slug ? `/api/organizations/${slug}/treasury/activity` : '')
      if (!url) throw new Error('No endpoint provided')
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load activity')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    load()
    function onFocus() {
      if (!cancelled) load()
    }
    window.addEventListener('focus', onFocus)
    timer.current = setInterval(load, 15000)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      if (timer.current) clearInterval(timer.current)
    }
  }, [slug, endpoint])

  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)
  const timeAgo = (ts: number | null) => {
    if (!ts) return '—'
    const d = Math.max(0, Date.now() / 1000 - ts)
    if (d < 60) return `${Math.floor(d)}s ago`
    if (d < 3600) return `${Math.floor(d / 60)}m ago`
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`
    return `${Math.floor(d / 86400)}d ago`
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Wallet Activity</h3>
        <div className="flex items-center gap-2">
          {data?.address && (
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(data.address)}>Copy Address</Button>
          )}
          {data?.address && (
            <Button variant="outline" href={`${data.explorer_base}/address/${data.address}`}>View on Explorer</Button>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500">Received</div>
              <div className="text-base font-semibold text-gray-900">{fmt(data.received_sats)} sats</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500">Spent</div>
              <div className="text-base font-semibold text-gray-900">{fmt(data.spent_sats)} sats</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500">Balance</div>
              <div className="text-base font-semibold text-gray-900">{fmt(data.balance_sats)} sats</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500">Unconfirmed</div>
              <div className="text-base font-semibold text-gray-900">{fmt(data.unconfirmed_sats)} sats</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="font-mono break-all">{data.address}</div>
            <div>Updated {new Date(data.last_updated).toLocaleTimeString()}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Tx</th>
                  <th className="py-2 pr-4">Direction</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Conf</th>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Link</th>
                </tr>
              </thead>
              <tbody>
                {data.txs.length === 0 ? (
                  <tr><td colSpan={6} className="py-3 text-gray-600">No transactions yet.</td></tr>
                ) : (
                  data.txs.map((t) => (
                    <tr key={t.txid} className="border-t border-gray-100">
                      <td className="py-2 pr-4 font-mono text-xs break-all">{t.txid.slice(0, 10)}…</td>
                      <td className={`py-2 pr-4 ${t.direction === 'in' ? 'text-green-700' : 'text-red-700'}`}>{t.direction === 'in' ? 'In' : 'Out'}</td>
                      <td className="py-2 pr-4">{fmt(t.amount_sats)} sats</td>
                      <td className="py-2 pr-4">{t.confirmations}</td>
                      <td className="py-2 pr-4">{t.time ? timeAgo(t.time) : '—'}</td>
                      <td className="py-2 pr-4"><a className="text-tiffany-700 hover:underline" href={t.explorer_url} target="_blank" rel="noreferrer">Open</a></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
