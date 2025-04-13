'use client'

import { useState, useCallback } from 'react'
import { Profile } from '@/types/profile'
import { isValidBitcoinAddress, isValidLightningAddress, isValidWebsite } from '@/lib/validation/address'

interface FormData {
  full_name: string
  bio?: string
  website?: string
  bitcoin_address?: string
  lightning_address?: string
}

interface FormErrors {
  full_name?: string
  website?: string
  bitcoin_address?: string
  lightning_address?: string
}

interface UseProfileFormReturn {
  formData: FormData
  errors: FormErrors
  loading: boolean
  error: string | null
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  validateForm: () => boolean
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetForm: () => void
}

export function useProfileForm(initialData: Partial<FormData> = {}): UseProfileFormReturn {
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    bio: '',
    website: '',
    bitcoin_address: '',
    lightning_address: '',
    ...initialData
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    
    // Validate full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    // Validate website if provided
    if (formData.website && !isValidWebsite(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }

    // Validate Bitcoin address if provided
    if (formData.bitcoin_address && !isValidBitcoinAddress(formData.bitcoin_address)) {
      newErrors.bitcoin_address = 'Invalid Bitcoin address'
    }

    // Validate Lightning address if provided
    if (formData.lightning_address && !isValidLightningAddress(formData.lightning_address)) {
      newErrors.lightning_address = 'Invalid Lightning address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData({
      full_name: '',
      bio: '',
      website: '',
      bitcoin_address: '',
      lightning_address: ''
    })
    setErrors({})
    setError(null)
  }, [])

  return {
    formData,
    errors,
    loading,
    error,
    handleChange,
    validateForm,
    setLoading,
    setError,
    resetForm
  }
} 