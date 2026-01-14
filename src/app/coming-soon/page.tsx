'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// import { createClient } from '@/lib/supabase/client' // Old import
import supabase from '@/lib/supabase/browser' // New default import
import Link from 'next/link'
import { 
  ArrowLeft, 
  Building, 
  Briefcase, 
  Calendar, 
  Handshake, 
  Wallet, 
  Users,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ComingSoonPage, { FeatureInfo } from '@/components/pages/ComingSoonPage'

const featureDetails: Record<string, FeatureInfo> = {
  organizations: {
    title: 'Organizations',
    icon: Building,
    color: 'from-green-500 to-emerald-500',
    iconColor: 'text-green-600',
    description: 'Create and manage organizations with governance, assets, and members',
    longDescription: 'Build structured organizations with clear governance, manage collective assets, coordinate member activities, and make decisions together using Bitcoin-powered voting mechanisms.',
    features: [
      'Multi-signature treasury management',
      'Member permissions and roles',
      'Governance voting with Bitcoin stakes',
      'Asset sharing and management',
      'Collective decision making',
      'Organization-wide messaging'
    ],
    timeline: 'Q1 2026',
    useCases: [
      'DAOs and Bitcoin collectives',
      'Community organizations',
      'Investment clubs',
      'Cooperative businesses'
    ],
    landingPageUrl: '/organizations'
  },
  projects: {
    title: 'Projects',
    icon: Briefcase,
    color: 'from-indigo-500 to-purple-500',
    iconColor: 'text-indigo-600',
    description: 'Launch and manage projects with transparent funding and milestone tracking',
    longDescription: 'Create project proposals, track progress with milestones, manage collaborative work, and ensure transparent funding with Bitcoin escrow and automatic milestone releases.',
    features: [
      'Project proposal creation',
      'Milestone-based funding',
      'Collaborative workspaces',
      'Bitcoin escrow management',
      'Progress tracking and reporting',
      'Community voting on proposals'
    ],
    timeline: 'Q1 2026',
    useCases: [
      'Open source development',
      'Community improvement projects',
      'Research initiatives',
      'Creative collaborations'
    ],
    landingPageUrl: '/projects'
  },
  events: {
    title: 'Events',
    icon: Calendar,
    color: 'from-blue-500 to-teal-500',
    iconColor: 'text-blue-600',
    description: 'Organize and fundraise for conferences, parties, and community gatherings',
    longDescription: 'Plan events, sell tickets with Bitcoin, manage attendee communications, coordinate logistics, and create memorable experiences for your Bitcoin community.',
    features: [
      'Event creation and management',
      'Bitcoin ticket sales',
      'Attendee management',
      'Event fundraising projects',
      'Real-time communication',
      'Post-event analytics'
    ],
    timeline: 'Q2 2026',
    useCases: [
      'Bitcoin conferences and meetups',
      'Community gatherings',
      'Educational workshops',
      'Social events and parties'
    ],
    landingPageUrl: '/events'
  },
  assets: {
    title: 'Assets Marketplace',
    icon: Wallet,
    color: 'from-orange-500 to-red-500',
    iconColor: 'text-orange-600',
    description: 'List, rent, and discover physical assets in your community',
    longDescription: 'Create an asset marketplace where community members can list, rent, and share physical items, creating a sustainable sharing economy powered by Bitcoin payments.',
    features: [
      'Asset listing and discovery',
      'Bitcoin-based rental payments',
      'Asset condition tracking',
      'User ratings and reviews',
      'Insurance and security deposits',
      'Community asset sharing'
    ],
    timeline: 'Q2 2026',
    useCases: [
      'Tool and equipment sharing',
      'Vehicle rentals',
      'Space and venue sharing',
      'Electronics and gadgets'
    ],
    landingPageUrl: '/assets'
  },
  people: {
    title: 'People & Networking',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    iconColor: 'text-purple-600',
    description: 'Connect with friends, create circles, and build your Bitcoin community',
    longDescription: 'Build meaningful connections within the Bitcoin community through friend networks, interest-based circles, skill sharing, and collaborative opportunities.',
    features: [
      'Friend connections and profiles',
      'Interest-based community circles',
      'Skill sharing and mentorship',
      'Private messaging and groups',
      'Event coordination',
      'Reputation and trust systems'
    ],
    timeline: 'Q2 2026',
    useCases: [
      'Bitcoin community networking',
      'Skill and knowledge sharing',
      'Mentorship connections',
      'Local Bitcoin groups'
    ],
    landingPageUrl: '/people'
  }
}

export default function ComingSoon() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const feature = searchParams?.get('feature') ?? null
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // const supabase = createClient() // No longer needed, supabase is imported directly
      if (!supabase) {
        setLoading(false)
        return
      }

      // Use getUser() for security - validates authentication with server
      const { data: { user }, error } = await supabase.auth.getUser()
      setIsAuthenticated(!!user && !error)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const featureInfo = feature ? featureDetails[feature as keyof typeof featureDetails] : null

  if (feature && !featureInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Feature Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">
            The feature you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (featureInfo) {
    return <ComingSoonPage featureInfo={featureInfo} isAuthenticated={isAuthenticated} />
  }

  // Default coming soon page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
        <p className="text-xl text-gray-600 mb-8">
          We&apos;re working hard to bring you something amazing. Stay tuned!
        </p>
        <div className="animate-pulse mb-8">
          <div className="h-2 w-20 bg-gray-300 rounded mx-auto"></div>
        </div>
        <Link href={isAuthenticated ? "/dashboard" : "/"}>
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
          </Button>
        </Link>
      </div>
    </div>
  )
} 