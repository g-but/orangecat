import { Calendar } from 'lucide-react'
import type { DashboardConfig } from '@/types/dashboard'

// Events Configuration
export const eventsConfig: DashboardConfig = {
  title: "Your Events",
  subtitle: "Manage events you're organizing or attending",
  featureBanner: {
    icon: Calendar,
    iconColor: "bg-blue-100",
    title: "Events Coming",
    description: "This is a preview of what your events dashboard will look like. Real functionality coming soon!",
    timeline: "Q2 2026",
    ctaLabel: "Learn More",
    ctaHref: "/coming-soon?feature=events",
    ctaVariant: "outline",
    gradientColors: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
  },
  itemsTitle: "Your Events",
  activityTitle: "Recent Activity",
  createButtonLabel: "Create Event",
  createButtonHref: "/coming-soon?feature=events",
  backButtonHref: "/dashboard",
  featureName: "Events",
  timeline: "Q2 2026",
  learnMoreUrl: "/events"
}

