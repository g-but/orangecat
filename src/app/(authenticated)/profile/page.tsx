'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { User, Camera, Bitcoin, Shield, Globe, Edit3, Save, X, Upload, CheckCircle, AlertCircle, Star, MapPin, Link as LinkIcon, Calendar, Users, Heart, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Loading from '@/components/Loading'
import { toast } from 'sonner'
import { ProfileStorageService } from '@/services/profile/profileStorageService'
import ProfileService from '@/services/profileService'

export default function ProfilePage() {
  const { user, profile, hydrated, isLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [profileData, setProfileData] = useState({
    display_name: '',
    bio: '',
    website: '',
    avatar_url: '',
    banner_url: '',
    bitcoin_address: '',
    lightning_address: '',
  })
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadType, setUploadType] = useState<'avatar' | 'banner' | null>(null)

  // Check authentication
  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  // Trigger file input when uploadType changes
  useEffect(() => {
    if (uploadType) {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      fileInput?.click()
    }
  }, [uploadType])

  // Handle redirect on client side only
  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth')
    }
  }, [hydrated, isLoading, user, router])

  if (!user) {
    return <Loading fullScreen />
  }

  // Initialize profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || '',
        banner_url: profile.banner_url || '',
        bitcoin_address: profile.bitcoin_address || '',
        lightning_address: profile.lightning_address || '',
      })
    }
  }, [profile])

  // Calculate completion percentage
  useEffect(() => {
    const requiredFields = [
      profileData.display_name,
      profileData.bio,
      profileData.avatar_url,
      profileData.bitcoin_address,
    ]
    const optionalFields = [
      profileData.website,
      profileData.banner_url,
      profileData.lightning_address,
    ]
    
    const requiredCompleted = requiredFields.filter(field => field && field.trim()).length
    const optionalCompleted = optionalFields.filter(field => field && field.trim()).length
    
    const percentage = Math.round(((requiredCompleted * 2 + optionalCompleted) / (requiredFields.length * 2 + optionalFields.length)) * 100)
    setCompletionPercentage(Math.min(percentage, 100))
  }, [profileData])

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'avatar' | 'banner') => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0], type)
    }
  }

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      // Show upload progress
      setUploadProgress(prev => ({ ...prev, [type]: 0 }))

      // Upload to Supabase Storage
      const result = await ProfileStorageService[type === 'avatar' ? 'uploadAvatar' : 'uploadBanner'](
        user.id,
        file,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, [type]: progress.percentage }))
        }
      )

      if (!result.success) {
        toast.error(result.error || 'Upload failed')
        return
      }

      // Update profile data with new URL
      setProfileData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'banner_url']: result.url || ''
      }))

      // Clear progress
      setUploadProgress(prev => ({ ...prev, [type]: 100 }))
      
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} uploaded successfully!`)

      // Auto-save if we have the profile update functionality
      if (profile?.id) {
        await handleSave()
      }

    } catch (error) {
      toast.error('Upload failed')
    } finally {
      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = { ...prev }
          delete updated[type]
          return updated
        })
      }, 2000)
    }
  }

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      setIsSaving(true)

      // Save profile data to database - only send supported fields
      const result = await ProfileService.updateProfile(user.id, {
        display_name: profileData.display_name,
        bio: profileData.bio,
        website: profileData.website,
        avatar_url: profileData.avatar_url,
        banner_url: profileData.banner_url,
        bitcoin_address: profileData.bitcoin_address,
        lightning_address: profileData.lightning_address,
      })

      if (!result.success) {
        console.error('Profile update failed:', result.error)
        toast.error(result.error || 'Failed to update profile')
        return
      }

      console.log('Profile updated successfully:', result.data)
      toast.success('Profile updated successfully!')
      setIsEditing(false)

      // Trigger a re-fetch of the profile data
      if (typeof window !== 'undefined') {
        window.location.reload()
      }

    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const getCompletionColor = () => {
    if (completionPercentage >= 90) return 'from-green-500 to-emerald-600'
    if (completionPercentage >= 70) return 'from-orange-500 to-yellow-600'
    if (completionPercentage >= 40) return 'from-orange-500 to-red-600'
    return 'from-red-500 to-red-600'
  }

  const getBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (percentage >= 70) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      {/* Banner Section */}
      <div className="relative h-48 md:h-64">
        <div 
          className={`w-full h-full bg-gradient-to-r from-orange-400 via-orange-500 to-tiffany-500 relative overflow-hidden ${
            isEditing ? 'cursor-pointer' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, 'banner')}
          onClick={() => isEditing && setUploadType('banner')}
        >
          {profileData.banner_url && (
            <img 
              src={profileData.banner_url} 
              alt="Profile Banner" 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Upload Overlay */}
          {isEditing && (
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              dragActive ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}>
              <div className="text-center text-white">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Upload Banner</p>
                <p className="text-xs opacity-75">Drag & drop or click</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Completion Badge */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1 rounded-full border ${getBadgeColor(completionPercentage)} flex items-center space-x-2`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span className="text-sm font-medium">{completionPercentage}% Complete</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-lg border-0">
              
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div 
                  className={`relative w-32 h-32 mx-auto mb-4 ${isEditing ? 'cursor-pointer' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, 'avatar')}
                  onClick={() => isEditing && setUploadType('avatar')}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-tiffany-500 p-1 shadow-lg">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {profileData.avatar_url ? (
                        <img 
                          src={profileData.avatar_url} 
                          alt="Profile Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Upload Overlay for Avatar */}
                  {isEditing && (
                    <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity ${
                      dragActive ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                    }`}>
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Basic Info */}
                <div className="space-y-2">
                  {isEditing ? (
                    <Input
                      value={profileData.display_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Your display name"
                      className="text-center text-xl font-bold"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profileData.display_name || user.email?.split('@')[0] || 'Anonymous User'}
                    </h1>
                  )}
                  
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                  <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getCompletionColor()} transition-all duration-500`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                {completionPercentage < 100 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Complete your profile to increase visibility and trust
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSave}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-orange-600 to-tiffany-600 hover:from-orange-700 hover:to-tiffany-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
                
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View Public Profile
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-sm text-gray-500">Campaigns</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-tiffany-600">0</div>
                    <div className="text-sm text-gray-500">Supporters</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bio Section */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-lg border-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-orange-600" />
                  About Me
                </h2>
              </div>
              
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell the world about yourself, your projects, and what you're passionate about..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {profileData.bio || "No bio added yet. Share your story to connect with your community!"}
                </p>
              )}
            </Card>

            {/* Bitcoin & Payment Info */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-lg border-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                <Bitcoin className="w-5 h-5 mr-2 text-orange-600" />
                Bitcoin & Payment Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitcoin Address
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.bitcoin_address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bitcoin_address: e.target.value }))}
                      placeholder="bc1q..."
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
                      {profileData.bitcoin_address || 'Not set'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lightning Address
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.lightning_address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lightning_address: e.target.value }))}
                      placeholder="you@domain.com"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                      {profileData.lightning_address || 'Not set'}
                    </div>
                  )}
                </div>
              </div>

              {profileData.bitcoin_address && (
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-tiffany-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Ready to receive Bitcoin donations
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Contact & Social */}
            <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-lg border-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                <Globe className="w-5 h-5 mr-2 text-orange-600" />
                Contact & Social
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    profileData.website && (
                      <a 
                        href={profileData.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-orange-600 hover:text-orange-700"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {profileData.website}
                      </a>
                    )
                  )}
                </div>
              </div>
            </Card>

            {/* Info Card */}
            {isEditing && (
              <Card className="p-6 bg-white/95 backdrop-blur-sm shadow-lg border-0">
                <h2 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  Profile Status
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-tiffany-50 rounded-lg border border-orange-200">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Your profile is public and ready to receive donations
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Complete your Bitcoin address to start receiving donations
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* File Upload Input (Hidden) */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="file-upload"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && uploadType) {
            handleFileUpload(file, uploadType)
            setUploadType(null)
          }
        }}
      />
    </div>
  )
} 