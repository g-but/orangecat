'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { FeatureBanner as FeatureBannerType } from '@/types/dashboard'

interface FeatureBannerProps {
  banner: FeatureBannerType
}

export default function FeatureBanner({ banner }: FeatureBannerProps) {
  return (
    <div className={`${banner.gradientColors} border border-opacity-50 rounded-xl p-6`}>
      <div className="flex items-center gap-4">
        <div className={`${banner.iconColor} p-3 rounded-full`}>
          <banner.icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{banner.title} {banner.timeline}</h3>
          <p className="text-gray-600 text-sm mt-1">{banner.description}</p>
        </div>
        <Link href={banner.ctaHref}>
          <Button 
            variant={banner.ctaVariant || "outline"} 
            className={banner.ctaVariant === "outline" ? "border-opacity-50 hover:border-opacity-75" : ""}
          >
            {banner.ctaLabel}
          </Button>
        </Link>
      </div>
    </div>
  )
} 