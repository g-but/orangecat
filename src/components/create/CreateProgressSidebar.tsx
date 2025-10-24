'use client'

import React from 'react'
import { Check, Circle, ArrowRight } from 'lucide-react'
import type { CampaignFormData } from './CreateCampaignForm'

interface CreateProgressSidebarProps {
  currentStep: number
  completionPercentage: number
  formData: CampaignFormData
}

export default function CreateProgressSidebar({ 
  currentStep, 
  completionPercentage, 
  formData 
}: CreateProgressSidebarProps) {
  const steps = [
    {
      number: 1,
      title: 'Project Details',
      description: 'Basic information about your project',
      fields: ['title', 'description', 'categories']
    },
    {
      number: 2,
      title: 'Payment Setup',
      description: 'Configure Bitcoin payment addresses',
      fields: ['bitcoin_address', 'lightning_address', 'goal_amount']
    },
    {
      number: 3,
      title: 'Final Details',
      description: 'Website and additional information',
      fields: ['website_url']
    },
    {
      number: 4,
      title: 'Media & Launch',
      description: 'Add images and publish your project',
      fields: ['banner_url', 'gallery_images']
    }
  ]

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) {return 'completed'}
    if (stepNumber === currentStep) {return 'current'}
    return 'upcoming'
  }

  const getStepCompletion = (stepNumber: number) => {
    if (stepNumber === 1) {
      let completed = 0
      const total = 3
      if (formData.title?.trim()) {completed++}
      if (formData.description?.trim()) {completed++}
      if (formData.categories?.length > 0) {completed++}
      return (completed / total) * 100
    }
    if (stepNumber === 2) {
      let completed = 0
      const total = 3
      if (formData.bitcoin_address?.trim() || formData.lightning_address?.trim()) {completed++}
      if (formData.goal_amount?.trim()) {completed++}
      completed++ // Payment setup is always considered partially complete if user reached step 2
      return (completed / total) * 100
    }
    if (stepNumber === 3) {
      return formData.website_url?.trim() ? 100 : 50 // Optional field
    }
    if (stepNumber === 4) {
      let completed = 0
      const total = 2
      if (formData.banner_url) {completed++}
      if (formData.gallery_images?.length > 0) {completed++}
      return completed > 0 ? (completed / total) * 100 : 50 // Optional fields
    }
    return 0
  }

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200 p-6 overflow-y-auto hidden lg:block">
      {/* Progress Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Campaign Creation</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">{completionPercentage}%</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const status = getStepStatus(step.number)
          const completion = getStepCompletion(step.number)
          const isLast = index === steps.length - 1

          return (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200" />
              )}
              
              {/* Step Content */}
              <div className="flex items-start gap-4">
                {/* Step Icon */}
                <div className={`
                  relative flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-200
                  ${status === 'completed' 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : status === 'current'
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                  }
                `}>
                  {status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                  
                  {/* Current step indicator */}
                  {status === 'current' && (
                    <div className="absolute -inset-1 rounded-full border-2 border-orange-200 animate-pulse" />
                  )}
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <h3 className={`
                    text-sm font-medium transition-colors duration-200
                    ${status === 'current' ? 'text-orange-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Step Progress Bar */}
                  {(status === 'current' || status === 'completed') && (
                    <div className="mt-2">
                      <div className="bg-gray-100 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-500 ${
                            status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${status === 'completed' ? 100 : completion}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-orange-50 rounded-lg">
        <h4 className="text-sm font-medium text-orange-800 mb-2">Need Help?</h4>
        <p className="text-xs text-orange-700 leading-relaxed">
          Your progress is automatically saved as you fill out the form. You can come back anytime to continue where you left off.
        </p>
      </div>
    </div>
  )
}