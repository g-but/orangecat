import { Users } from 'lucide-react'
import type { DashboardConfig } from '@/types/dashboard'

// People Configuration
export const peopleConfig: DashboardConfig = {
  title: "Your Network",
  subtitle: "Connect with people in your community and beyond",
  featureBanner: {
    icon: Users,
    iconColor: "bg-purple-100",
    title: "People Coming",
    description: "This is a preview of what your people dashboard will look like. Real functionality coming soon!",
    timeline: "Q2 2026",
    ctaLabel: "Learn More",
    ctaHref: "/coming-soon?feature=people",
    ctaVariant: "outline",
    gradientColors: "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
  },
  itemsTitle: "Your Connections",
  activityTitle: "Recent Activity",
  createButtonLabel: "Search People",
  createButtonHref: "/coming-soon?feature=people",
  backButtonHref: "/dashboard",
  featureName: "People & Networking",
  timeline: "Q2 2026",
  learnMoreUrl: "/people"
}

