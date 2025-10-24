'use client'

import { useState } from 'react'
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  MessageCircle,
  Copy,
  Download,
  QrCode,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { trackEvent } from '@/utils/monitoring'

interface CampaignShareProps {
  projectId: string
  projectTitle: string
  projectDescription?: string
  projectImage?: string
  currentUrl?: string
  onClose?: () => void
  variant?: 'modal' | 'dropdown' | 'inline'
  className?: string
}

interface SharePlatform {
  name: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  action: (url: string, title: string, description?: string) => void
}

export default function CampaignShare({
  projectId,
  projectTitle,
  projectDescription = '',
  currentUrl,
  onClose,
  variant = 'dropdown',
  className = ''
}: CampaignShareProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  // Construct the project URL
  const projectUrl = currentUrl || `${window.location.origin}/project/${projectId}`
  
  // Create optimized share text
  const shareTitle = `Support: ${projectTitle}`
  const shareDescription = projectDescription || `Check out this amazing Bitcoin fundraising project: ${projectTitle}`

  // Social media sharing platforms
  const platforms: SharePlatform[] = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: (url, title, description) => {
        const text = `${title}\n\n${description}\n\n#Bitcoin #Fundraising #Crowdfunding`
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        window.open(twitterUrl, '_blank', 'width=550,height=420')
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: (url, title) => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`
        window.open(facebookUrl, '_blank', 'width=550,height=420')
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: (url, title, description) => {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || '')}`
        window.open(linkedinUrl, '_blank', 'width=550,height=420')
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      action: (url, title, description) => {
        const text = `${title}\n\n${description}\n\n${url}`
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(whatsappUrl, '_blank')
      }
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      action: (url, title, description) => {
        const subject = encodeURIComponent(`Support this project: ${title}`)
        const body = encodeURIComponent(`Hi,\n\nI wanted to share this amazing Bitcoin fundraising project with you:\n\n${title}\n\n${description}\n\nCheck it out here: ${url}\n\nBest regards`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
      }
    }
  ]

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl)
      setCopySuccess(true)
      toast.success('Campaign link copied to clipboard!')
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const trackShareEvent = (platform: string) => {
    // Analytics tracking for share events
    // Track share event for analytics
    trackEvent(`project_share_${platform}`, { projectId, projectTitle })
  }

  const handlePlatformShare = (platform: SharePlatform) => {
    trackShareEvent(platform.name)
    platform.action(projectUrl, shareTitle, shareDescription)
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Campaign
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{projectTitle}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{projectDescription}</p>
            </div>

            {/* Social Platforms Grid */}
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon
                return (
                  <button
                    key={platform.name}
                    onClick={() => handlePlatformShare(platform)}
                    className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${platform.bgColor}`}
                  >
                    <Icon className={`w-4 h-4 ${platform.color}`} />
                    <span className="text-sm font-medium text-gray-900">{platform.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Copy Link */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <input
                  type="text"
                  value={projectUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
                />
              </div>
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
                className={copySuccess ? 'bg-green-50 text-green-700 border-green-200' : ''}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-80 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {platforms.slice(0, 3).map((platform) => {
          const Icon = platform.icon
          return (
            <button
              key={platform.name}
              onClick={() => handlePlatformShare(platform)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${platform.bgColor}`}
            >
              <Icon className={`w-5 h-5 ${platform.color}`} />
              <span className="text-xs font-medium text-gray-900">{platform.name}</span>
            </button>
          )
        })}
      </div>

      {/* More Options */}
      <div className="space-y-2">
        {platforms.slice(3).map((platform) => {
          const Icon = platform.icon
          return (
            <button
              key={platform.name}
              onClick={() => handlePlatformShare(platform)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon className={`w-4 h-4 ${platform.color}`} />
              <span className="text-sm font-medium text-gray-900">{platform.name}</span>
            </button>
          )
        })}
      </div>

      {/* Copy Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-gray-50 rounded px-2 py-1">
            <input
              type="text"
              value={projectUrl}
              readOnly
              className="flex-1 bg-transparent text-xs text-gray-600 outline-none"
            />
          </div>
          <Button
            onClick={copyToClipboard}
            size="sm"
            variant="outline"
            className={copySuccess ? 'bg-green-50 text-green-700 border-green-200' : ''}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
} 