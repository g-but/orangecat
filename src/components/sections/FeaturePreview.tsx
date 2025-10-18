import { LucideIcon , ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export interface FeaturePreviewProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  fullPageHref?: string
  color: string
  iconColor: string
  preview: string
  comingSoon?: boolean
  priority?: number
  variant?: 'card' | 'compact' | 'detailed'
  showCTA?: boolean
}

export function FeaturePreview({
  title,
  description,
  icon: Icon,
  href,
  fullPageHref,
  color,
  iconColor,
  preview,
  comingSoon = false,
  variant = 'card',
  showCTA = true
}: FeaturePreviewProps) {
  const hasFullPage = Boolean(fullPageHref)

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${color.replace('bg-gradient-to-r', 'bg-gradient-to-r').replace('to-', 'to-').split(' ')[0].replace('from-', 'bg-').replace('-500', '-100')}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600 mb-2">{description}</p>
              {showCTA && hasFullPage && fullPageHref && (
                <Link href={fullPageHref} className="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center">
                  Learn More <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl ${color.replace('bg-gradient-to-r', 'bg-gradient-to-r').replace('to-', 'to-').split(' ')[0].replace('from-', 'bg-').replace('-500', '-100')}`}>
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-lg text-gray-600">{description}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-500">
          <p className="text-gray-700">{preview}</p>
        </div>

        {showCTA && (
          <div className="flex gap-3">
            {comingSoon ? (
              <Link href={href}>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              </Link>
            ) : (
              <Link href={href}>
                <Button>
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    )
  }

  // Default card variant
  return (
    <Link href={href}>
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-gray-200 hover:border-gray-300 cursor-pointer h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${color.replace('bg-gradient-to-r', 'bg-gradient-to-r').replace('to-', 'to-').split(' ')[0].replace('from-', 'bg-').replace('-500', '-100')}`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            {comingSoon && (
              <span className="px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4 leading-relaxed flex-1">{description}</p>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700">{preview}</p>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            {showCTA && hasFullPage ? (
              <span className="text-sm font-medium text-orange-600 group-hover:text-orange-700">
                Learn More
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-500">
                {comingSoon ? 'Coming Soon' : 'Learn More'}
              </span>
            )}
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 