'use client'

import { useState, useEffect } from 'react'
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
  Bitcoin
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600 mt-1">Update your public profile information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-teal-500 px-6 py-6">
            <div className="flex items-center text-white">
              <User className="w-8 h-8 mr-4" />
              <div>
                <h2 className="text-2xl font-bold">Your Profile</h2>
                <p className="text-orange-100 text-sm mt-1">This information will be displayed publicly</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6 pb-6 border-b border-gray-100">
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
                  
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-2 right-2 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                      disabled={isSubmittingProfile || isUploadingAvatar}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Profile Photo</h3>
                  <p className="text-gray-600 mt-1">
                    Upload a photo to help people recognize you
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG, or GIF. Maximum size: 10MB.
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Username"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    placeholder="your_username"
                    icon={User}
                  />
                  <Input
                    label="Display Name"
                    name="display_name"
                    value={profileData.display_name}
                    onChange={handleInputChange}
                    placeholder="Your Full Name"
                    icon={User}
                  />
                </div>

                <Textarea
                  label="Bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell people about yourself, your interests, or what you're working on..."
                  rows={4}
                />

                <Input
                  label="Website"
                  name="website"
                  value={profileData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                  icon={Globe}
                />
              </div>

              {/* Bitcoin & Lightning */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Bitcoin & Lightning
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Bitcoin Address"
                    name="bitcoin_address"
                    value={profileData.bitcoin_address}
                    onChange={handleInputChange}
                    placeholder="bc1q..."
                    className="font-mono text-sm"
                    icon={Bitcoin}
                  />
                  <Input
                    label="Lightning Address"
                    name="lightning_address"
                    value={profileData.lightning_address}
                    onChange={handleInputChange}
                    placeholder="you@getalby.com"
                    icon={Zap}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Adding your Bitcoin and Lightning addresses allows people to send you tips and donations directly.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={isSubmittingProfile || isUploadingAvatar}
                  className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white px-8 py-3 text-lg font-semibold"
                >
                  {isSubmittingProfile ? (
                    <>
                      <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Profile
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