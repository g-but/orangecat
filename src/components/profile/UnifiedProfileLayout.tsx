'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Edit, 
  Save, 
  X, 
  Camera, 
  Upload,
  Eye,
  EyeOff,
  Bitcoin,
  Zap,
  Globe,
  MapPin,
  Calendar,
  Users,
  Target,
  Trophy,
  Sparkles,
  Settings,
  Shield,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ScalableProfile, ProfileFormData } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ProfileStorageService } from '@/services/profile/profileStorageService'

interface UnifiedProfileLayoutProps {
  profile: ScalableProfile
  isOwnProfile: boolean
  mode?: 'view' | 'edit'
  onSave?: (data: ProfileFormData) => Promise<void>
  onModeChange?: (mode: 'view' | 'edit') => void
  className?: string
}

interface UploadState {
  uploading: boolean
  progress: number
  error?: string
}

export default function UnifiedProfileLayout({
  profile,
  isOwnProfile,
  mode = 'view',
  onSave,
  onModeChange,
  className
}: UnifiedProfileLayoutProps) {
  const router = useRouter()
  const { user } = useAuth()
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    website: profile.website || '',
    bitcoin_address: profile.bitcoin_address || '',
    lightning_address: profile.lightning_address || ''
  })
  
  // Upload states
  const [avatarUpload, setAvatarUpload] = useState<UploadState>({ uploading: false, progress: 0 })
  const [bannerUpload, setBannerUpload] = useState<UploadState>({ uploading: false, progress: 0 })
  
  // UI states
  const [isSaving, setIsSaving] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [previewBanner, setPreviewBanner] = useState<string | null>(null)
  const [showBitcoinDetails, setShowBitcoinDetails] = useState(false)
  
  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = [
      profile.display_name,
      profile.bio,
      profile.avatar_url,
      profile.banner_url,
      profile.website,
      profile.bitcoin_address,
      profile.lightning_address
    ]
    const completed = fields.filter(field => field && field.trim()).length
    return Math.round((completed / fields.length) * 100)
  }

  const completionPercentage = calculateCompletion()

  // Handle form updates
  const updateFormData = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle file upload
  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!user?.id) {
      toast.error('You must be logged in to upload files')
      return
    }

    const uploadState = type === 'avatar' ? setAvatarUpload : setBannerUpload
    const setPreview = type === 'avatar' ? setPreviewAvatar : setPreviewBanner

    try {
      uploadState({ uploading: true, progress: 0 })
      
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload file using ProfileStorageService
      const result = await (type === 'avatar' 
        ? ProfileStorageService.uploadAvatar(user.id, file, (progress) => {
            uploadState(prev => ({ ...prev, progress: progress.percentage }))
          })
        : ProfileStorageService.uploadBanner(user.id, file, (progress) => {
            uploadState(prev => ({ ...prev, progress: progress.percentage }))
          })
      )

      if (result.success && result.url) {
        uploadState({ uploading: false, progress: 100 })
        
        // Update form data with new URL
        updateFormData(`${type}_url` as keyof ProfileFormData, result.url)
        
        // Update preview to show uploaded image
        setPreview(result.url)
        
        toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} uploaded successfully!`)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
      
    } catch (error) {
      uploadState({ uploading: false, progress: 0, error: 'Upload failed' })
      setPreview(null)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle drag & drop
  const handleDrop = (e: React.DragEvent, type: 'avatar' | 'banner') => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0], type)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Handle save
  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    try {
      await onSave(formData)
      toast.success('Profile updated successfully!')
      onModeChange?.('view')
    } catch (error) {
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  // Get completion color
  const getCompletionColor = () => {
    if (completionPercentage >= 80) return 'from-green-500 to-emerald-500'
    if (completionPercentage >= 60) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100", className)}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Banner Section */}
        <div className="relative mb-8">
          {/* Banner */}
          <div 
            className="relative h-80 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500 rounded-2xl shadow-xl overflow-hidden group"
            onDrop={(e) => mode === 'edit' && handleDrop(e, 'banner')}
            onDragOver={handleDragOver}
          >
            {/* Banner Image */}
            {(previewBanner || profile.banner_url) && (
              <Image
                src={previewBanner || profile.banner_url || ''}
                alt="Profile banner"
                fill
                className="object-cover"
              />
            )}
            
            {/* Banner Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            
            {/* Banner Upload (Edit Mode) */}
            {mode === 'edit' && (
              <>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bannerInputRef.current?.click()}
                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                    disabled={bannerUpload.uploading}
                  >
                    {bannerUpload.uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading {bannerUpload.progress}%
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Change Banner
                      </>
                    )}
                  </Button>
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')}
                  className="hidden"
                />
              </>
            )}
          </div>
          
          {/* Avatar */}
          <div className="absolute -bottom-16 left-8">
            <div 
              className="relative group"
              onDrop={(e) => mode === 'edit' && handleDrop(e, 'avatar')}
              onDragOver={handleDragOver}
            >
              {previewAvatar || profile.avatar_url ? (
                <Image
                  src={previewAvatar || profile.avatar_url || ''}
                  alt={profile.display_name || 'User'}
                  width={128}
                  height={128}
                  className="rounded-2xl object-cover border-4 border-white shadow-2xl"
                />
              ) : (
                <DefaultAvatar 
                  size={128} 
                  className="rounded-2xl border-4 border-white shadow-2xl" 
                />
              )}
              
              {/* Avatar Upload (Edit Mode) */}
              {mode === 'edit' && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 rounded-2xl">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      className="bg-white/90 backdrop-blur-sm hover:bg-white text-xs"
                      disabled={avatarUpload.uploading}
                    >
                      {avatarUpload.uploading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-6 right-6 flex gap-3">
            {isOwnProfile && (
              <>
                {mode === 'edit' ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => onModeChange?.('view')}
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => onModeChange?.('edit')}
                    variant="outline"
                    className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </>
            )}
            
            {!isOwnProfile && (
              <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
                <Users className="w-4 h-4 mr-2" />
                Follow
              </Button>
            )}
          </div>
          
          {/* Profile Completion (Edit Mode) */}
          {mode === 'edit' && isOwnProfile && (
            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-700">
                  Profile {completionPercentage}% Complete
                </div>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getCompletionColor()} transition-all duration-500`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">
          
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
              {mode === 'edit' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Display Name
                    </label>
                    <Input
                      value={formData.display_name || ''}
                      onChange={(e) => updateFormData('display_name', e.target.value)}
                      placeholder="Your display name"
                      className="text-lg font-semibold"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Bio
                    </label>
                    <Textarea
                      value={formData.bio || ''}
                      onChange={(e) => updateFormData('bio', e.target.value)}
                      placeholder="Tell your story..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Website
                    </label>
                    <Input
                      value={formData.website || ''}
                      onChange={(e) => updateFormData('website', e.target.value)}
                      placeholder="https://your-website.com"
                      type="url"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profile.display_name || profile.username || 'User'}
                  </h1>
                  <p className="text-lg text-orange-600 font-medium mb-4">
                    @{profile.username}
                  </p>
                  {profile.bio && (
                    <p className="text-gray-600 text-base leading-relaxed mb-4">
                      {profile.bio}
                    </p>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Bitcoin & Payment Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Bitcoin className="w-5 h-5 text-orange-500" />
                  Bitcoin & Payment Details
                </h3>
                {mode === 'view' && (profile.bitcoin_address || profile.lightning_address) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBitcoinDetails(!showBitcoinDetails)}
                  >
                    {showBitcoinDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              
              {mode === 'edit' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Bitcoin Address
                    </label>
                    <Input
                      value={formData.bitcoin_address || ''}
                      onChange={(e) => updateFormData('bitcoin_address', e.target.value)}
                      placeholder="bc1..."
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Lightning Address
                    </label>
                    <Input
                      value={formData.lightning_address || ''}
                      onChange={(e) => updateFormData('lightning_address', e.target.value)}
                      placeholder="user@domain.com"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.bitcoin_address && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Bitcoin Address</div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <code className="text-sm font-mono flex-1 truncate">
                          {showBitcoinDetails ? profile.bitcoin_address : '••••••••••••••••'}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(profile.bitcoin_address!, 'Bitcoin address')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {profile.lightning_address && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Lightning Address</div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <code className="text-sm font-mono flex-1 truncate">
                          {showBitcoinDetails ? profile.lightning_address : '••••••••••••••••'}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(profile.lightning_address!, 'Lightning address')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!profile.bitcoin_address && !profile.lightning_address && (
                    <div className="col-span-2 text-center text-gray-500 py-8">
                      <Bitcoin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No payment details added yet</p>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onModeChange?.('edit')}
                          className="mt-2"
                        >
                          Add Payment Details
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            
            {/* Profile Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                Profile Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Campaigns</span>
                  <span className="font-medium">{profile.campaign_count || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-medium">{profile.follower_count || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Following</span>
                  <span className="font-medium">{profile.following_count || 0}</span>
                </div>
                
                {profile.total_raised && profile.total_raised > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Total Raised</span>
                    <span className="font-medium text-green-600">
                      ₿{(profile.total_raised / 100000000).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            {isOwnProfile && mode === 'view' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Link href="/create" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                  
                  <Link href="/settings" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 