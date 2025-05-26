'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { ProfileFormData } from '@/types/database'
import supabaseBrowserClient from '@/services/supabase/client'
import { User, Bitcoin, Zap, FileText, Camera, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import { toast } from 'sonner'
import { ProfileService } from '@/services/profileService'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading: authStoreLoading, hydrated, authError, fetchProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    display_name: '',
    bio: '',
    bitcoin_address: '',
    avatar_url: undefined,
  })

  // Track initial profile data to detect changes
  const [initialFormData, setInitialFormData] = useState<ProfileFormData>({
    username: '',
    display_name: '',
    bio: '',
    bitcoin_address: '',
    avatar_url: undefined,
  })

  useEffect(() => {
    if (profile) {
      const profileData = {
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        bitcoin_address: profile.bitcoin_address || '',
        avatar_url: profile.avatar_url || undefined,
      }
      
      // Only update form data if we don't have unsaved changes
      // This prevents overwriting user input when profile refreshes after avatar upload
      if (!hasUnsavedChanges) {
        setFormData(profileData)
        setInitialFormData(profileData)
      } else {
        // If we have unsaved changes, only update the avatar_url if it changed
        // This happens after avatar upload
        if (profileData.avatar_url !== initialFormData.avatar_url) {
          setFormData(prev => ({
            ...prev,
            avatar_url: profileData.avatar_url
          }))
          setInitialFormData(prev => ({
            ...prev,
            avatar_url: profileData.avatar_url
          }))
        }
      }
    }
  }, [profile, hasUnsavedChanges, initialFormData.avatar_url])

  // Check if form has unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData)
    setHasUnsavedChanges(hasChanges)
  }, [formData, initialFormData])

  const handleInputChange = (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return
      }
      const file = e.target.files[0]

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size too large. Maximum size is 10MB.')
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF files are allowed.')
        return
      }

      setIsUploadingAvatar(true)

      // Use our secure API route that ensures bucket existence & returns the public URL
      const body = new FormData()
      body.append('file', file)
      body.append('userId', user!.id)

      const res = await fetch('/api/avatar', {
        method: 'POST',
        body,
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Upload failed')
      }

      // Update the form state immediately with the new avatar URL
      setFormData((prev) => ({
        ...prev,
        avatar_url: json.publicUrl,
      }))

      // Save the avatar URL to the database immediately
      const updateResult = await ProfileService.updateProfile(user!.id, {
        avatar_url: json.publicUrl
      })

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to save avatar to profile')
      }

      // Refresh the profile in the store to sync the UI
      // The useEffect above will handle preserving unsaved form changes
      const refreshResult = await fetchProfile()
      if (refreshResult.error) {
        console.warn('Avatar saved but profile refresh failed:', refreshResult.error)
      }

      toast.success('Avatar uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Error uploading avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('User not found. Please log in again.')
      console.error('ProfilePage: Submit attempted with no user.')
      return
    }
    if (authError) {
      toast.error('Cannot update profile: ' + authError)
      console.error('ProfilePage: Submit attempted with global auth error:', authError)
      return
    }
    
    setIsLoading(true)
    console.log('ProfilePage: Attempting profile update for user', user.id, 'with data:', formData)
    
    try {
      // Add timestamp for debugging
      const debugTimestamp = new Date().toISOString()
      console.log(`Test update ${debugTimestamp}`)
      
      const result = await ProfileService.updateProfile(user.id, formData)
      
      console.log('ProfilePage: ProfileService.updateProfile result:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }
      
      console.log('ProfilePage: Profile update successful, data returned:', result.data)
      
      // Show warning if there were schema issues
      if (result.warning) {
        toast.warning(result.warning)
      }
      
      // Update initial form data to reflect saved state
      setInitialFormData(formData)
      setHasUnsavedChanges(false)
      
      // Refresh the profile in the store to sync the UI and verify the save
      console.log('ProfilePage: Refreshing profile to verify save...')
      const refreshResult = await fetchProfile()
      
      if (refreshResult.error) {
        console.warn('Profile update succeeded but refresh failed:', refreshResult.error)
        toast.warning('Profile updated but there was an issue refreshing the data. Please refresh the page.')
      } else {
        console.log('ProfilePage: Profile refresh successful after update')
        if (!result.warning) {
          toast.success('Profile updated successfully!')
        }
      }
      
      console.log('ProfilePage: Profile updated successfully for user', user.id)
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('ProfilePage: Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while hydrating
  if (!hydrated || authStoreLoading) {
    return (
      <div className="w-full py-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="w-full py-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-8 sm:p-10">
          {authError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center">
              {authError}
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Edit Profile
          </h1>
          
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                <p className="text-sm text-yellow-800">You have unsaved changes</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Upload */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                {formData.avatar_url ? (
                  <Image
                    src={formData.avatar_url}
                    alt={formData.display_name || formData.username || 'Profile avatar'}
                    width={96}
                    height={96}
                    className="rounded-full object-cover border-4 border-white shadow-md"
                    priority
                  />
                ) : (
                  <DefaultAvatar size={96} className="border-4 border-white shadow-md" />
                )}
                
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                >
                  {isUploadingAvatar ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                  ) : (
                    <Camera className="w-5 h-5 text-gray-600" />
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isLoading || isUploadingAvatar || !user || !!authError}
                  />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-500">
                  Upload a new profile photo. Images will be automatically resized and optimized.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports JPEG, PNG, WebP, and GIF. Maximum size: 10MB.
                </p>
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <Input
                label="Username"
                icon={User}
                name="username"
                value={formData.username}
                onChange={handleInputChange('username')}
                placeholder="Enter your username"
                disabled={isLoading || !user || !!authError}
                autoComplete="username"
              />
              <p className="text-sm text-gray-500">
                This is your unique identifier on the platform. It will be used in your profile URL and for mentions.
              </p>
            </div>

            {/* Display Name Input */}
            <div className="space-y-2">
              <Input
                label="Display Name"
                icon={User}
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange('display_name')}
                placeholder="Enter your display name"
                disabled={isLoading || !user || !!authError}
                autoComplete="name"
              />
              <p className="text-sm text-gray-500">
                This is the name that will be shown to other users. It can be your real name or any name you prefer.
              </p>
            </div>

            {/* Bio Textarea */}
            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange('bio')}
                  placeholder="Tell us about yourself..."
                  disabled={isLoading || !user || !!authError}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <p className="text-sm text-gray-500">
                Write a short bio to tell others about yourself. This will be displayed on your public profile.
              </p>
            </div>

            {/* Bitcoin Address Input */}
            <div className="space-y-2">
              <Input
                label="Bitcoin Address"
                icon={Bitcoin}
                name="bitcoin_address"
                value={formData.bitcoin_address}
                onChange={handleInputChange('bitcoin_address')}
                placeholder="Enter your Bitcoin address (optional)"
                disabled={isLoading || !user || !!authError}
                autoComplete="off"
              />
              <p className="text-sm text-gray-500">
                Your Bitcoin address for receiving tips and payments. This is optional and will be displayed on your public profile.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full py-3" 
                variant="primary" 
                isLoading={isLoading} 
                disabled={isLoading || isUploadingAvatar || !user || !!authError}
              >
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 