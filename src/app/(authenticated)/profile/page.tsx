'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { ProfileFormData } from '@/types/database'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import Loading from '@/components/Loading'
import { toast } from 'sonner'
import { ProfileService } from '@/services/profileService'
import { 
  User, 
  Globe,
  Save,
  ArrowLeft,
  Camera,
  Zap,
  Bitcoin,
  ExternalLink
} from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, hydrated, isLoading, fetchProfile } = useAuth()
  const router = useRouter()
  
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: '',
    display_name: '',
    bio: '',
    website: '',
    bitcoin_address: '',
    lightning_address: '',
    avatar_url: ''
  })

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setProfileData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        bitcoin_address: profile.bitcoin_address || '',
        lightning_address: profile.lightning_address || '',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  // Show loading state while hydrating - AFTER all hooks
  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  // Redirect if not authenticated - AFTER all hooks
  if (!user) {
    router.push('/auth')
    return <Loading fullScreen />
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
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

      setProfileData((prev) => ({
        ...prev,
        avatar_url: json.publicUrl,
      }))

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
    setIsSubmittingProfile(true)

    try {
      const result = await ProfileService.updateProfile(user!.id, profileData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }

      if (result.warning) {
        toast.warning(result.warning)
      }

      await fetchProfile()
      
      if (!result.warning) {
        toast.success('Profile updated successfully!')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile.')
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mr-3 p-2 min-h-[44px] min-w-[44px] touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600 mt-1 text-sm">Update your public profile information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-teal-500 px-4 sm:px-6 py-4">
            <div className="flex items-center text-white">
              <User className="w-6 h-6 mr-3 flex-shrink-0" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Your Profile</h2>
                <p className="text-orange-100 text-sm mt-1">This information will be displayed publicly</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-100">
                <div className="relative">
                  {profileData.avatar_url ? (
                    <Image
                      src={profileData.avatar_url}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <DefaultAvatar size={120} className="border-4 border-white shadow-lg" />
                  )}
                  
                  {/* Upload overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer touch-manipulation">
                    <Camera className="w-8 h-8 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>
                  
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Profile Picture</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    Click on your avatar to upload a new picture. JPG, PNG, or GIF up to 10MB.
                  </p>
                  <label className="inline-block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAvatar}
                      className="min-h-[44px] px-4 sm:px-6 touch-manipulation"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    label="Username"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    placeholder="your_username"
                    icon={User}
                    className="min-h-[48px] text-base"
                  />
                  <Input
                    label="Display Name"
                    name="display_name"
                    value={profileData.display_name}
                    onChange={handleInputChange}
                    placeholder="Your Full Name"
                    icon={User}
                    className="min-h-[48px] text-base"
                  />
                </div>

                <Textarea
                  label="Bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell people about yourself, your interests, or what you're working on..."
                  rows={4}
                  className="min-h-[120px] text-base resize-none"
                />

                <Input
                  label="Website"
                  name="website"
                  value={profileData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                  icon={Globe}
                  className="min-h-[48px] text-base"
                />
              </div>

              {/* Bitcoin & Lightning */}
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Bitcoin & Lightning
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <Input
                      label="Bitcoin Address"
                      name="bitcoin_address"
                      value={profileData.bitcoin_address}
                      onChange={handleInputChange}
                      placeholder="bc1q..."
                      className="font-mono text-sm sm:text-base min-h-[48px] break-all"
                      icon={Bitcoin}
                    />
                    {!profileData.bitcoin_address && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <Bitcoin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-orange-900 text-sm mb-1">Need a Bitcoin wallet?</h4>
                            <p className="text-orange-800 text-xs mb-2">
                              Get help setting up your first Bitcoin wallet.
                            </p>
                            <Link 
                              href="/bitcoin-wallet-guide" 
                              target="_blank"
                              className="inline-flex items-center px-2 py-1 border border-orange-600 text-orange-600 rounded text-xs font-medium hover:bg-orange-50 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Setup Guide
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Input
                    label="Lightning Address"
                    name="lightning_address"
                    value={profileData.lightning_address}
                    onChange={handleInputChange}
                    placeholder="you@getalby.com"
                    icon={Zap}
                    className="min-h-[48px] text-base"
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                    <strong>Tip:</strong> Adding your Bitcoin and Lightning addresses allows people to send you tips and donations directly.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end pt-4 sm:pt-6 border-t border-gray-100 gap-3 sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3 text-base font-medium touch-manipulation"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingProfile || isUploadingAvatar}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold min-h-[48px] touch-manipulation"
                >
                  {isSubmittingProfile ? (
                    <>
                      <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2 flex-shrink-0" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                      <span>Save Profile</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}