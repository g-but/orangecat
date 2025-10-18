import { Briefcase } from 'lucide-react'
import type { DashboardConfig } from '@/types/dashboard'

// Projects Configuration
export const projectsConfig: DashboardConfig = {
  title: "Your Projects",
  subtitle: "Manage and collaborate on projects you're part of",
  featureBanner: {
    icon: Briefcase,
    iconColor: "bg-purple-100",
    title: "Projects Coming",
    description: "This is a preview of what your projects dashboard will look like. Real functionality coming soon!",
    timeline: "Q1 2026",
    ctaLabel: "Learn More",
    ctaHref: "/coming-soon?feature=projects",
    ctaVariant: "outline",
    gradientColors: "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"
  },
  itemsTitle: "Your Projects",
  activityTitle: "Recent Activity",
  createButtonLabel: "Create Project",
  createButtonHref: "/coming-soon?feature=projects",
  backButtonHref: "/dashboard",
  featureName: "Projects",
  timeline: "Q1 2026",
  learnMoreUrl: "/projects"
}

