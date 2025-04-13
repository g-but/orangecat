'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PageConfig {
  walletAddress: string
  title: string
  description: string
  logoUrl?: string
  transparencyScore: number
  initialTrustScore: number
  kpis: {
    name: string
    target: number
    current: number
  }[]
  theme?: {
    primaryColor?: string
    secondaryColor?: string
  }
}

export default function CreatePageForm() {
  const router = useRouter()
  const [config, setConfig] = useState<PageConfig>({
    walletAddress: '',
    title: '',
    description: '',
    logoUrl: '',
    transparencyScore: 80,
    initialTrustScore: 50,
    kpis: [
      { name: '', target: 0, current: 0 }
    ],
    theme: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#64748b',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/success')
  }

  const addKPI = () => {
    setConfig({
      ...config,
      kpis: [...config.kpis, { name: '', target: 0, current: 0 }]
    })
  }

  const updateKPI = (index: number, field: 'name' | 'target' | 'current', value: string | number) => {
    const newKPIs = [...config.kpis]
    newKPIs[index] = { ...newKPIs[index], [field]: value }
    setConfig({ ...config, kpis: newKPIs })
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-playfair-display font-bold text-gray-900 mb-6">
        Create Your OrangeCat Page
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
            Bitcoin Wallet Address
          </label>
          <input
            type="text"
            id="walletAddress"
            value={config.walletAddress}
            onChange={(e) => setConfig({ ...config, walletAddress: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
            required
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Project Description
          </label>
          <textarea
            id="description"
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
            required
          />
        </div>

        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
            Project Logo URL (optional)
          </label>
          <input
            type="url"
            id="logoUrl"
            value={config.logoUrl}
            onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="transparencyScore" className="block text-sm font-medium text-gray-700">
              Initial Transparency Score (%)
            </label>
            <input
              type="number"
              id="transparencyScore"
              min="0"
              max="100"
              value={config.transparencyScore}
              onChange={(e) => setConfig({ ...config, transparencyScore: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
              required
            />
          </div>
          <div>
            <label htmlFor="initialTrustScore" className="block text-sm font-medium text-gray-700">
              Initial Trust Score (%)
            </label>
            <input
              type="number"
              id="initialTrustScore"
              min="0"
              max="100"
              value={config.initialTrustScore}
              onChange={(e) => setConfig({ ...config, initialTrustScore: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Key Performance Indicators (KPIs)</h3>
            <button
              type="button"
              onClick={addKPI}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add KPI
            </button>
          </div>
          {config.kpis.map((kpi, index) => (
            <div key={index} className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="KPI Name"
                  value={kpi.name}
                  onChange={(e) => updateKPI(index, 'name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Target"
                  value={kpi.target}
                  onChange={(e) => updateKPI(index, 'target', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Current"
                  value={kpi.current}
                  onChange={(e) => updateKPI(index, 'current', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
              Primary Color
            </label>
            <input
              type="color"
              id="primaryColor"
              value={config.theme?.primaryColor}
              onChange={(e) => setConfig({
                ...config,
                theme: { ...config.theme, primaryColor: e.target.value }
              })}
              className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
              Secondary Color
            </label>
            <input
              type="color"
              id="secondaryColor"
              value={config.theme?.secondaryColor}
              onChange={(e) => setConfig({
                ...config,
                theme: { ...config.theme, secondaryColor: e.target.value }
              })}
              className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
          >
            Create Page
          </button>
        </div>
      </form>
    </div>
  )
} 