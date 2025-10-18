'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import DefaultAvatar from '@/components/ui/DefaultAvatar'
import { ProfileStorageService } from '@/services/profile/storage'
import { cn } from '@/lib/utils'

interface ProfileUploadSectionProps {
  userId: string
  avatarUrl?: string | null
  bannerUrl?: string | null
  onAvatarUpload?: (url: string) => void
  onBannerUpload?: (url: string) => void
  className?: string
}

export function ProfileUploadSection({
  userId,
  avatarUrl,
  bannerUrl,
  onAvatarUpload,
  onBannerUpload,
  className
}: ProfileUploadSectionProps) {
  const [avatarUpload, setAvatarUpload] = useState<{ uploading: boolean; progress: number }>({
    uploading: false,
    progress: 0
  })
  const [bannerUpload, setBannerUpload] = useState<{ uploading: boolean; progress: number }>({
    uploading: false,
    progress: 0
  })
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [previewBanner, setPreviewBanner] = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    const uploadState = type === 'avatar' ? setAvatarUpload : setBannerUpload
    const setPreview = type === 'avatar' ? setPreviewAvatar : setPreviewBanner

    try {
      uploadState({ uploading: true, progress: 0 })

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      // Upload file
      const result = await (type === 'avatar'
        ? ProfileStorageService.uploadAvatar(userId, file, (progress) => {
            uploadState({ uploading: false, progress: progress.percentage })
          })
        : ProfileStorageService.uploadBanner(userId, file, (progress) => {
            uploadState({ uploading: false, progress: progress.percentage })
          })
      )

      if (result.success && result.url) {
        uploadState({ uploading: false, progress: 100 })
        setPreview(result.url)

        // Notify parent component
        if (type === 'avatar' && onAvatarUpload) {
          onAvatarUpload(result.url)
        } else if (type === 'banner' && onBannerUpload) {
          onBannerUpload(result.url)
        }

        toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} uploaded successfully!`)
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      uploadState({ uploading: false, progress: 0 })
      setPreview(null)
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className={cn("relative mb-8", className)}>
      {/* Banner */}
      <div className="relative h-60 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500 rounded-2xl shadow-xl overflow-hidden group">
        {(previewBanner || bannerUrl) && (
          <Image
            src={previewBanner || bannerUrl || ''}
            alt="Profile banner"
            fill
            className="object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

        {/* Banner Upload Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/20">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUpload.uploading}
            className="shadow-lg"
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
      </div>

      {/* Avatar */}
      <div className="absolute -bottom-16 left-8">
        <div className="relative group">
          {previewAvatar || avatarUrl ? (
            <Image
              src={previewAvatar || avatarUrl || ''}
              alt="Profile avatar"
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

          {/* Avatar Upload Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/40 rounded-2xl">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUpload.uploading}
            >
              {avatarUpload.uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
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
        </div>
      </div>
    </div>
  )
}

