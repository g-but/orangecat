'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PageConfig {
  walletAddress: string
  title: string
  description: string
  logoUrl?: string
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
    theme: {
      primaryColor: '#0ea5e9', // Default primary color
      secondaryColor: '#64748b', // Default secondary color
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, we would save this to Supabase
    // For now, we'll just redirect to the page
    router.push(`/donate/${config.walletAddress}`)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Page Title
          </label>
          <input
            type="text"
            id="title"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
            Logo URL (optional)
          </label>
          <input
            type="url"
            id="logoUrl"
            value={config.logoUrl}
            onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
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

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create Page
          </button>
        </div>
      </form>
    </div>
  )
} 