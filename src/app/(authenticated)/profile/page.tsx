'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth'
import { ProfileFormData } from '@/types/database'
import supabaseBrowserClient from '@/services/supabase/client'
import { User, Bitcoin, Zap, FileText, Camera } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'
import { ProfileService } from '@/services/profileService'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading: authStoreLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    display_name: '',
    bio: '',
    bitcoin_address: '',
    avatar_url: undefined,
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        bitcoin_address: profile.bitcoin_address || '',
        avatar_url: profile.avatar_url || undefined,
      })
    }
  }, [profile])

  // Skip rendering the form until profile is available
  if (authStoreLoading || !profile) {
    return (
      <div className="w-full py-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return
      }
      
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user!.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabaseBrowserClient.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabaseBrowserClient.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }))

      toast.success('Avatar uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Error uploading avatar')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('User not found. Please log in again.')
      return
    }
    
    // Log detailed user information for debugging
    console.log('%cPROFILE PAGE - User info before update:', 'background: #222; color: #bada55', {
      userId: user.id,
      userObject: user,
      profileFromStore: profile
    });
    
    setIsLoading(true)

    try {
      console.log('%cPROFILE PAGE - Submitting profile update with data:', 'background: #222; color: #bada55', {
        userId: user.id,
        formData
      });
      
      // Direct call to ProfileService without timeout wrapping
      const result = await ProfileService.updateProfile(user.id, formData);
      
      console.log('%cPROFILE PAGE - Update result received:', 'background: #222; color: #bada55', result);

      if (!result.success) {
        throw new Error(result.error)
      }
      
      toast.success('Profile updated successfully!')
      
      // Make sure to wait for toast to appear and state updates to complete
      // before navigating away from the page
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('%cPROFILE PAGE - Error updating profile:', 'background: #222; color: #ff6666', error)
      
      // Provide more detailed error message with troubleshooting help
      let errorMessage = error.message || 'Failed to update profile';
      
      // Add network troubleshooting tip if it seems to be a network error
      if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage += '. Please check your internet connection and try again.';
        console.log('%cPROFILE PAGE - NETWORK ISSUE DETECTED!', 'background: red; color: white; font-size: 14px');
        console.log(
          '%cTROUBLESHOOTING: Please check DevTools -> Network tab and filter for "profiles" to see if the request is failing',
          'color: orange; font-size: 12px'
        );
      }
      
      toast.error(errorMessage);
    } finally {
      // Always ensure loading state is cleared
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full py-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-8 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Edit Profile
          </h1>

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
                name="username"
                value={formData.username}
                onChange={handleInputChange('username')}
                placeholder="Enter your username"
                disabled={isLoading}
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
                disabled={isLoading}
                autoComplete="name"
              />
              <p className="text-sm text-gray-500">
                This is the name that will be shown to other users. It can be your real name or any name you prefer.
              </p>
            </div>

            {/* Bio Textarea */}
            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio <FileText className="inline w-4 h-4 ml-1" />
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange('bio')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500 focus:border-transparent transition duration-150 ease-in-out bg-white"
                rows={4}
                placeholder="Tell us a bit about yourself or your project..."
                disabled={isLoading}
                autoComplete="off"
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
                name="bitcoin_address"
                value={formData.bitcoin_address}
                onChange={handleInputChange('bitcoin_address')}
                placeholder="Enter your Bitcoin address"
                disabled={isLoading}
                autoComplete="off"
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
  )
} 