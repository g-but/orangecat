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
  const { user, profile, updateProfile, setProfile } = useAuthStore()
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

      const { error: dbError } = await updateProfile({ avatar_url: newAvatarUrl })

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
      const { error } = await updateProfile(profileUpdateData)

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
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-8">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-4 py-8 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Edit Profile
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt={formData.display_name || formData.username}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Camera className="w-5 h-5 text-gray-600" />
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
              <div className="space-y-2">
                <Input
                  label="Username"
                  icon={User}
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  placeholder="Enter your username"
                  disabled={isLoading}
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
                  value={formData.display_name}
                  onChange={handleInputChange('display_name')}
                  placeholder="Enter your display name"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  This is the name that will be shown to other users. It can be your real name or any name you prefer.
                </p>
              </div>

              {/* Bio Textarea */}
              <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio <FileText className="inline w-4 h-4 ml-1" />
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange('bio')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500 focus:border-transparent transition duration-150 ease-in-out"
                  rows={4}
                  placeholder="Tell us a bit about yourself or your project..."
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  Share a brief description about yourself or your project. This helps other users understand who you are.
                </p>
              </div>

              {/* Bitcoin Address Input */}
              <div className="space-y-2">
                <Input
                  label="Bitcoin Address"
                  icon={Bitcoin}
                  value={formData.bitcoin_address}
                  onChange={handleInputChange('bitcoin_address')}
                  placeholder="Enter your Bitcoin address"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500">
                  Your Bitcoin address for receiving payments. This will be visible to other users.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full py-3" 
                  variant="primary" 
                  isLoading={isLoading} 
                  disabled={isLoading}
                >
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