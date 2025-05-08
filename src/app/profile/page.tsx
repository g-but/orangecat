'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import supabase from '@/services/supabase/client'
import { User, Bitcoin, Zap, FileText, Camera } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

interface ProfileFormData {
  username: string
  display_name: string
  bio: string
  bitcoin_address: string
  avatar_url?: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, updateProfile: storeUpdateProfile, setProfile: storeSetProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    display_name: '',
    bio: '',
    bitcoin_address: '',
    avatar_url: null,
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        bitcoin_address: profile.bitcoin_address || '',
        avatar_url: profile.avatar_url || null,
      })
    }
  }, [profile])

  const handleInputChange = (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) {
      toast.error('No file selected or user not found.')
      return
    }

    setIsLoading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Could not get public URL for avatar.')
      }
      const newAvatarUrl = urlData.publicUrl

      const { error: dbError } = await storeUpdateProfile({ avatar_url: newAvatarUrl })

      if (dbError) {
        toast.error(`Failed to save avatar: ${dbError}`)
      } else {
        setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }))
        toast.success('Avatar updated successfully!')
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('User not found. Please log in again.');
      return;
    }
    setIsLoading(true)

    const profileUpdateData: Partial<ProfileFormData> = {
      username: formData.username,
      display_name: formData.display_name,
      bio: formData.bio,
      bitcoin_address: formData.bitcoin_address,
    }

    try {
      const { error } = await storeUpdateProfile(profileUpdateData)

      if (error) {
        throw new Error(error)
      }

      toast.success('Profile updated successfully')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Profile
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt={formData.display_name || formData.username}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-gray-50"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-500">
                    Upload a new profile photo.
                  </p>
                </div>
              </div>

              {/* Username Input */}
              <Input
                label="Username"
                icon={User}
                value={formData.username}
                onChange={handleInputChange('username')}
                placeholder="Enter your username"
                disabled={isLoading}
              />

              {/* Display Name Input */}
              <Input
                label="Display Name"
                icon={User}
                value={formData.display_name}
                onChange={handleInputChange('display_name')}
                placeholder="Enter your display name"
                disabled={isLoading}
              />

              {/* Bio Textarea */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio <FileText className="inline w-4 h-4 ml-1" />
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange('bio')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500 focus:border-transparent transition duration-150 ease-in-out"
                  rows={4}
                  placeholder="Tell us a bit about yourself or your project..."
                  disabled={isLoading}
                />
              </div>

              {/* Bitcoin Address Input */}
              <Input
                label="Bitcoin Address"
                icon={Bitcoin}
                value={formData.bitcoin_address}
                onChange={handleInputChange('bitcoin_address')}
                placeholder="Enter your Bitcoin address"
                disabled={isLoading}
              />

              {/* Submit Button */}
              <div className="pt-2">
                <Button type="submit" className="w-full" variant="primary" isLoading={isLoading} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 