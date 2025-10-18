'use client'

import { useState, useRef, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Save, X, MapPin, Link as LinkIcon, User, Camera } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { Profile, ProfileFormData } from '@/types/database'
import { ProfileStorageService } from '@/services/profile/storage'

// Import server-side schema to keep validation consistent
import { profileSchema as serverProfileSchema, normalizeProfileData } from '@/lib/validation'

// Profile Images Section Component
function ProfileImagesSection({
  profile,
  avatarPreview,
  bannerPreview,
  avatarInputRef,
  bannerInputRef,
  handleFileUpload
}: {
  profile: Profile
  avatarPreview: string | null
  bannerPreview: string | null
  avatarInputRef: React.RefObject<HTMLInputElement>
  bannerInputRef: React.RefObject<HTMLInputElement>
  handleFileUpload: (file: File, type: 'avatar' | 'banner') => Promise<void>
}) {
  return (
    <div className="space-y-4">
      {/* Banner Upload */}
      <div className="relative">
        <div
          className="relative h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden"
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerPreview || profile.banner_url ? (
            <img
              src={bannerPreview || profile.banner_url || ''}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" data-testid="camera-icon" />
                <p className="text-sm text-gray-500">Add banner photo</p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')}
          className="hidden"
        />
      </div>

      {/* Avatar Upload */}
      <div className="flex items-start gap-4">
        <div
          className="relative w-20 h-20 bg-gray-100 rounded-full border-2 border-gray-300 cursor-pointer overflow-hidden flex-shrink-0"
          onClick={() => avatarInputRef.current?.click()}
        >
          {avatarPreview || profile.avatar_url ? (
            <img
              src={avatarPreview || profile.avatar_url || ''}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <User className="w-8 h-8 text-gray-400" data-testid="camera-icon" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center rounded-full">
            <Camera className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')}
          className="hidden"
        />
      </div>
    </div>
  )
}

// Use server-side schema for consistency
const profileSchema = serverProfileSchema

type ProfileFormValues = z.infer<typeof profileSchema>

interface ModernProfileEditorProps {
  profile: Profile
  userId: string
  userEmail?: string
  onSave: (data: ProfileFormData) => Promise<void>
  onCancel: () => void
}

export default function ModernProfileEditor({
  profile,
  userId,
  userEmail,
  onSave,
  onCancel
}: ModernProfileEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Form setup with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      username: profile.username || userEmail?.split('@')[0] || '',
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      location: profile.location || '',
      avatar_url: profile.avatar_url || '',
      banner_url: profile.banner_url || '',
      website: profile.website || '',
    },
  })

  // Watch for username changes to auto-update display name if empty
  const watchedUsername = form.watch('username')
  const watchedDisplayName = form.watch('display_name')

  useEffect(() => {
    if (watchedUsername && !watchedDisplayName) {
      form.setValue('display_name', watchedUsername)
    }
  }, [watchedUsername, watchedDisplayName, form])

  // Handle file upload
  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!userId) {
      toast.error('You must be logged in to upload files')
      return
    }

    const setPreview = type === 'avatar' ? setAvatarPreview : setBannerPreview

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload file using ProfileStorageService
      const result = await ProfileStorageService.uploadAvatar(userId, file)

      if (result.success && result.url) {
        // Update form data with new URL
        form.setValue(`${type}_url` as keyof ProfileFormValues, result.url)
        setPreview(result.url)

        // Note: Success toast will be shown when profile is saved
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      setPreview(null)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true)

    try {
      // Normalize the data using our helper function
      const normalizedData = normalizeProfileData(data)
      const formData: ProfileFormData = normalizedData

      await onSave(formData)
      // Success toast is shown by useUnifiedProfile hook
    } catch (error) {
      toast.error('Failed to save profile', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Edit profile</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="rounded-full w-8 h-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Profile Images Section */}
              <ProfileImagesSection
                profile={profile}
                avatarPreview={avatarPreview}
                bannerPreview={bannerPreview}
                avatarInputRef={avatarInputRef}
                bannerInputRef={bannerInputRef}
                handleFileUpload={handleFileUpload}
              />

              {/* Form Fields */}
              <div className="space-y-4">

                {/* Name - Main field like X */}
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your display name"
                          className="text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        This is how others will see you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell your story..."
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Share your story with the community
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Where are you based?"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Your location (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-website.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Your personal website (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Username - Required field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                          <Input
                            placeholder="your_unique_username"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Your unique @username - like on Twitter. 3-30 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !watchedUsername?.trim()}
                  className="px-6 bg-black hover:bg-gray-800"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
