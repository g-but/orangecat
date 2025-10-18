import { Building } from 'lucide-react'
import type { DashboardConfig } from '@/types/dashboard'

// Organizations Configuration
export const organizationsConfig: DashboardConfig = {
  title: "Your Organizations",
  subtitle: "Manage and participate in organizations you're part of",
  featureBanner: {
    icon: Building,
    iconColor: "bg-orange-100",
    title: "Organizations Coming",
    description: "This is a preview of what your organizations dashboard will look like. Real functionality coming soon!",
    timeline: "Q1 2026",
    ctaLabel: "Learn More",
    ctaHref: "/coming-soon?feature=organizations",
    ctaVariant: "outline",
    gradientColors: "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
  },
  itemsTitle: "Your Organizations",
  activityTitle: "Recent Activity",
  createButtonLabel: "Create Organization",
  createButtonHref: "/coming-soon?feature=organizations",
  backButtonHref: "/dashboard",
  featureName: "Organizations",
  timeline: "Q1 2026",
  learnMoreUrl: "/organizations"
}

