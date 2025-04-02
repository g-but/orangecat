'use client'

import React from 'react'
import CreatePageForm from '@/components/CreatePageForm'

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Create Your Donation Page
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Set up your personalized Bitcoin donation page in minutes
          </p>
        </div>
        <CreatePageForm />
      </div>
    </div>
  )
} 