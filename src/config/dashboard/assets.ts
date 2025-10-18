import { Wallet } from 'lucide-react'
import type { DashboardConfig } from '@/types/dashboard'

// Assets Configuration
export const assetsConfig: DashboardConfig = {
  title: "Your Assets",
  subtitle: "Manage and rent out your physical assets to the community",
  featureBanner: {
    icon: Wallet,
    iconColor: "bg-red-100",
    title: "Assets Coming",
    description: "This is a preview of what your assets dashboard will look like. Real functionality coming soon!",
    timeline: "Q2 2026",
    ctaLabel: "Learn More",
    ctaHref: "/coming-soon?feature=assets",
    ctaVariant: "outline",
    gradientColors: "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
  },
  itemsTitle: "Your Assets",
  activityTitle: "Recent Activity",
  createButtonLabel: "List Asset",
  createButtonHref: "/coming-soon?feature=assets",
  backButtonHref: "/dashboard",
  featureName: "Asset Management",
  timeline: "Q2 2026",
  learnMoreUrl: "/assets"
}

