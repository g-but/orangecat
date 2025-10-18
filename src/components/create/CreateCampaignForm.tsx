'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import supabase from '@/services/supabase/client'
import { toast } from 'sonner'
import { CampaignStorageService } from '@/services/campaigns/campaignStorageService'
import { isValidBitcoinAddress, isValidLightningAddress, validateUrl } from '@/utils/validation'

export interface CampaignFormData {
  title: string
  description: string
  bitcoin_address: string
  lightning_address: string
  website_url: string
  goal_amount: string
  categories: string[]
  banner_url: string
  gallery_images: string[]
}

interface CreateCampaignFormProps {
  currentStep: number
  setCurrentStep: (step: number) => void
  onPreviewToggle: () => void
  showPreview: boolean
}

export default function CreateCampaignForm({ 
  currentStep, 
  setCurrentStep, 
  onPreviewToggle, 
  showPreview 
}: CreateCampaignFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    bitcoin_address: '',
    lightning_address: '',
    website_url: '',
    goal_amount: '',
    categories: [],
    banner_url: '',
    gallery_images: []
  })

  // Auto-save draft
  useEffect(() => {
    if (!user || !formData.title.trim()) {return}
    
    const saveTimer = setTimeout(() => {
      const draftData = { formData, currentStep }
      localStorage.setItem(`campaign-draft-${user.id}`, JSON.stringify(draftData))
    }, 2000)

    return () => clearTimeout(saveTimer)
  }, [formData, currentStep, user])

  // Load draft on mount
  useEffect(() => {
    if (!user) {return}
    
    const savedDraft = localStorage.getItem(`campaign-draft-${user.id}`)
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft)
        setFormData(draftData.formData)
        setCurrentStep(draftData.currentStep)
        toast.info('Draft loaded')
      } catch (error) {
        // Silently handle parsing errors
      }
    }
  }, [user, setCurrentStep])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryToggle = (categoryValue: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryValue)
        ? prev.categories.filter(cat => cat !== categoryValue)
        : [...prev.categories, categoryValue]
    }))
  }

  const handleFileUpload = async (file: File, type: 'banner' | 'gallery') => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(prev => ({ ...prev, [type]: 0 }))

      // Generate temporary campaign ID for uploads
      const tempCampaignId = `temp-${user.id}-${Date.now()}`

      let result
      if (type === 'banner') {
        result = await CampaignStorageService.uploadBanner(
          tempCampaignId,
          file,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [type]: progress.percentage }))
          }
        )
      } else {
        const imageIndex = formData.gallery_images.length
        result = await CampaignStorageService.uploadGalleryImage(
          tempCampaignId,
          file,
          imageIndex,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [type]: progress.percentage }))
          }
        )
      }

      if (!result.success) {
        toast.error(result.error || 'Upload failed')
        return
      }

      // Update form data
      if (type === 'banner') {
        setFormData(prev => ({ ...prev, banner_url: result.url! }))
        toast.success('Banner uploaded successfully!')
      } else {
        setFormData(prev => ({ 
          ...prev, 
          gallery_images: [...prev.gallery_images, result.url!] 
        }))
        toast.success('Image added to gallery!')
      }

      // Clear progress
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [type]: 0 }))
      }, 1000)

    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'banner' | 'gallery') => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      handleFileUpload(imageFile, type)
    } else {
      toast.error('Please drop an image file')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        throw new Error('You must be logged in to create a campaign')
      }

      if (!formData.title.trim()) {
        throw new Error('Please provide a title for your campaign')
      }

      if (!formData.bitcoin_address.trim() && !formData.lightning_address.trim()) {
        throw new Error('Please provide at least one payment address (Bitcoin or Lightning)')
      }

      // Validate payment addresses if provided
      const btc = formData.bitcoin_address.trim()
      const ln = formData.lightning_address.trim()

      if (btc) {
        const { valid, error } = isValidBitcoinAddress(btc)
        if (!valid) {throw new Error(error || 'Invalid Bitcoin address')}
      }

      if (ln) {
        const { valid, error } = isValidLightningAddress(ln)
        if (!valid) {throw new Error(error || 'Invalid Lightning address')}
      }

      // Normalize and validate website URL (optional)
      let websiteUrl: string | null = null
      if (formData.website_url && formData.website_url.trim()) {
        const { isValid, normalized, error } = validateUrl(formData.website_url)
        if (!isValid) {throw new Error(error || 'Invalid website URL')}
        websiteUrl = normalized
      }

      // Create the funding page in the database
      const fundingPageData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        bitcoin_address: formData.bitcoin_address.trim() || null,
        lightning_address: formData.lightning_address.trim() || null,
        website_url: websiteUrl,
        goal_amount: formData.goal_amount ? (() => {
          const parsed = parseFloat(formData.goal_amount)
          if (Number.isNaN(parsed) || parsed < 0) {
            throw new Error('Goal amount must be a positive number')
          }
          return parsed
        })() : null,
        category: formData.categories.length > 0 ? formData.categories[0] : null,
        tags: formData.categories.length > 1 ? formData.categories.slice(1) : [],
        banner_url: formData.banner_url || null,
        gallery_images: formData.gallery_images,
        is_active: true,
        is_public: true,
        total_funding: 0,
        contributor_count: 0,
        currency: 'BTC'
      }

      const { data, error: insertError } = await supabase
        .from('funding_pages')
        .insert([fundingPageData])
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create campaign: ${insertError.message}`)
      }
      
      // Clear the draft from localStorage
      localStorage.removeItem(`campaign-draft-${user.id}`)
      
      toast.success('🎉 Campaign created successfully!')
      router.push(`/campaign/${data.slug || data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      toast.error('Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0
    const total = 8

    if (formData.title.trim()) {completed++}
    if (formData.description.trim()) {completed++}
    if (formData.categories.length > 0) {completed++}
    if (formData.bitcoin_address.trim() || formData.lightning_address.trim()) {completed++}
    if (formData.website_url.trim()) {completed++}
    if (formData.goal_amount.trim()) {completed++}
    if (formData.banner_url) {completed++}
    if (formData.gallery_images.length > 0) {completed++}

    return Math.round((completed / total) * 100)
  }

  return {
    formData,
    loading,
    error,
    uploadProgress,
    isUploading,
    handleChange,
    handleCategoryToggle,
    handleFileUpload,
    handleDrop,
    handleDragOver,
    nextStep,
    prevStep,
    handleSubmit,
    getCompletionPercentage,
    canProceedToStep2: formData.title.trim().length > 0,
    canProceedToStep3: formData.bitcoin_address.trim().length > 0 || formData.lightning_address.trim().length > 0,
    canProceedToStep4: true
  }
} 