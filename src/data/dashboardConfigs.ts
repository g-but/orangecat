import { 
  Building, 
  Users, 
  Vote, 
  Coins,
  Calendar,
  MapPin,
  Ticket,
  TrendingUp,
  Briefcase,
  GitBranch,
  Target,
  Star,
  Code,
  Clock,
  FileText,
  Wallet,
  Handshake,
  Search,
  Package,
  ShoppingBag,
  Heart
} from 'lucide-react'

import { 
  DashboardConfig, 
  DashboardStats, 
  DashboardActivity,
  OrganizationData,
  EventData,
  ProjectData
} from '@/types/dashboard'

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

// Fundraising Configuration
export const fundraisingConfig: DashboardConfig = {
  title: "Your Fundraising",
  subtitle: "Manage your fundraising campaigns and donations",
  itemsTitle: "Your Campaigns",
  activityTitle: "Recent Activity",
  createButtonLabel: "Create Campaign",
  createButtonHref: "/create",
  backButtonHref: "/dashboard",
  featureName: "Fundraising",
  learnMoreUrl: "/fundraising"
}

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

// Demo Data
// Assets Demo Data
export interface AssetData {
  id: number
  title: string
  type: string
  status: string
  dailyRate: number
  totalEarnings: number
  rentals: number
  availability: string
  color: string
}

export const demoAssets: AssetData[] = [
  {
    id: 1,
    title: "Professional Camera Kit",
    type: "Electronics",
    status: "Available",
    dailyRate: 50000, // sats
    totalEarnings: 350000,
    rentals: 7,
    availability: "Available",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    id: 2,
    title: "Mountain Bike",
    type: "Sports",
    status: "Rented",
    dailyRate: 25000,
    totalEarnings: 175000,
    rentals: 7,
    availability: "Until Feb 28",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: 3,
    title: "Power Drill Set",
    type: "Tools",
    status: "Available",
    dailyRate: 15000,
    totalEarnings: 90000,
    rentals: 6,
    availability: "Available",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  }
]

// People Demo Data
export interface PersonData {
  id: number
  name: string
  username: string
  relationship: string
  mutualConnections: number
  lastInteraction: string
  skills: string[]
  location: string
  color: string
}

export const demoPeople: PersonData[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    username: "@sarahbtc",
    relationship: "Friend",
    mutualConnections: 12,
    lastInteraction: "2 days ago",
    skills: ["Bitcoin Development", "Lightning Network"],
    location: "San Francisco",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: 2,
    name: "Mike Chen",
    username: "@mikechen",
    relationship: "Colleague",
    mutualConnections: 8,
    lastInteraction: "1 week ago",
    skills: ["Design", "UX/UI"],
    location: "New York",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    id: 3,
    name: "Alex Rivera",
    username: "@alexr",
    relationship: "Community",
    mutualConnections: 5,
    lastInteraction: "3 days ago",
    skills: ["Marketing", "Community Building"],
    location: "Austin",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  }
]

// Fundraising Demo Data
export interface CampaignData {
  id: number
  title: string
  type: string
  status: string
  raised: number
  goal: number
  supporters: number
  daysLeft: number
  progress: number
  color: string
}

export const demoCampaigns: CampaignData[] = [
  {
    id: 1,
    title: "Bitcoin Education Workshop",
    type: "Education",
    status: "Active",
    raised: 750000, // sats
    goal: 1000000,
    supporters: 23,
    daysLeft: 15,
    progress: 75,
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    id: 2,
    title: "Open Source Bitcoin Wallet",
    type: "Development",
    status: "Active",
    raised: 1250000,
    goal: 2000000,
    supporters: 45,
    daysLeft: 30,
    progress: 62,
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: 3,
    title: "Community Meetup Space",
    type: "Community",
    status: "Completed",
    raised: 500000,
    goal: 500000,
    supporters: 67,
    daysLeft: 0,
    progress: 100,
    color: "bg-purple-100 text-purple-700 border-purple-200"
  }
]

export const demoOrganizations: OrganizationData[] = [
  {
    id: 1,
    title: "Bitcoin Builders DAO",
    role: "Founder",
    members: 47,
    treasury: 125000,
    proposals: 3,
    status: "Active",
    type: "DAO",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: 2,
    title: "Local Tech Meetup",
    role: "Organizer",
    members: 23,
    treasury: 45000,
    proposals: 1,
    status: "Active",
    type: "Community",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    id: 3,
    title: "OpenSource Foundation",
    role: "Member",
    members: 156,
    treasury: 340000,
    proposals: 7,
    status: "Active",
    type: "Non-Profit",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  }
]

export const demoEvents: EventData[] = [
  {
    id: 1,
    title: "Bitcoin Conference Zurich",
    type: "Conference",
    date: "2024-03-15",
    time: "10:00 AM",
    location: "Zurich Convention Center",
    attendees: 247,
    capacity: 300,
    revenue: 485000,
    status: "Upcoming",
    role: "Organizer",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: 2,
    title: "Local Bitcoin Meetup",
    type: "Meetup",
    date: "2024-02-28",
    time: "7:00 PM",
    location: "Tech Hub Cafe",
    attendees: 43,
    capacity: 50,
    revenue: 0,
    status: "Upcoming",
    role: "Attendee",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    id: 3,
    title: "Lightning Workshop",
    type: "Workshop",
    date: "2024-02-20",
    time: "2:00 PM",
    location: "Online",
    attendees: 89,
    capacity: 100,
    revenue: 125000,
    status: "Completed",
    role: "Speaker",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  }
]

export const demoProjects: ProjectData[] = [
  {
    id: 1,
    title: "Bitcoin Wallet UI",
    type: "Open Source",
    status: "Active",
    progress: 75,
    contributors: 12,
    funding: 145000,
    deadline: "March 2024",
    role: "Lead Developer",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: 2,
    title: "Lightning Workshop Series",
    type: "Education",
    status: "Active",
    progress: 45,
    contributors: 5,
    funding: 85000,
    deadline: "April 2024",
    role: "Collaborator",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    id: 3,
    title: "Community Meetup Platform",
    type: "Community",
    status: "Completed",
    progress: 100,
    contributors: 8,
    funding: 230000,
    deadline: "Completed",
    role: "Contributor",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  }
]

// Generate stats based on demo data
export const getOrganizationsStats = (): DashboardStats[] => [
  {
    icon: Building,
    iconColor: "bg-green-100 text-green-600",
    label: "Organizations",
    value: demoOrganizations.length,
    subtitle: "Organizations"
  },
  {
    icon: Users,
    iconColor: "bg-blue-100 text-blue-600",
    label: "Total Members",
    value: demoOrganizations.reduce((sum, org) => sum + org.members, 0),
    subtitle: "Total Members"
  },
  {
    icon: Coins,
    iconColor: "bg-yellow-100 text-yellow-600",
    label: "Combined Treasury",
    value: `${(demoOrganizations.reduce((sum, org) => sum + org.treasury, 0) / 100000000).toFixed(3)} BTC`,
    subtitle: "Combined Treasury"
  },
  {
    icon: Vote,
    iconColor: "bg-purple-100 text-purple-600",
    label: "Active Proposals",
    value: demoOrganizations.reduce((sum, org) => sum + org.proposals, 0),
    subtitle: "Active Proposals"
  }
]

export const getEventsStats = (): DashboardStats[] => [
  {
    icon: Calendar,
    iconColor: "bg-blue-100 text-blue-600",
    label: "Total Events",
    value: demoEvents.length,
    subtitle: "Total Events"
  },
  {
    icon: Users,
    iconColor: "bg-green-100 text-green-600",
    label: "Total Attendees",
    value: demoEvents.reduce((sum, event) => sum + event.attendees, 0),
    subtitle: "Total Attendees"
  },
  {
    icon: Ticket,
    iconColor: "bg-yellow-100 text-yellow-600",
    label: "Total Revenue",
    value: `${(demoEvents.reduce((sum, event) => sum + event.revenue, 0) / 100000000).toFixed(3)} BTC`,
    subtitle: "Total Revenue"
  },
  {
    icon: TrendingUp,
    iconColor: "bg-purple-100 text-purple-600",
    label: "Upcoming Events",
    value: demoEvents.filter(e => e.status === "Upcoming").length,
    subtitle: "Upcoming Events"
  }
]

export const getProjectsStats = (): DashboardStats[] => [
  {
    icon: Briefcase,
    iconColor: "bg-purple-100 text-purple-600",
    label: "Total Projects",
    value: demoProjects.length,
    subtitle: "Total Projects"
  },
  {
    icon: Users,
    iconColor: "bg-blue-100 text-blue-600",
    label: "Total Contributors",
    value: demoProjects.reduce((sum, project) => sum + project.contributors, 0),
    subtitle: "Total Contributors"
  },
  {
    icon: Star,
    iconColor: "bg-green-100 text-green-600",
    label: "Total Funding",
    value: `${(demoProjects.reduce((sum, project) => sum + project.funding, 0) / 100000000).toFixed(3)} BTC`,
    subtitle: "Total Funding"
  },
  {
    icon: Target,
    iconColor: "bg-orange-100 text-orange-600",
    label: "Avg Progress",
    value: `${Math.round(demoProjects.reduce((sum, project) => sum + project.progress, 0) / demoProjects.length)}%`,
    subtitle: "Avg Progress"
  }
]

export const getAssetsStats = (): DashboardStats[] => [
  {
    icon: Wallet,
    iconColor: "bg-red-100 text-red-600",
    label: "Total Assets",
    value: demoAssets.length,
    subtitle: "Total Assets"
  },
  {
    icon: Coins,
    iconColor: "bg-green-100 text-green-600",
    label: "Total Earnings",
    value: `${(demoAssets.reduce((sum, asset) => sum + asset.totalEarnings, 0) / 100000000).toFixed(3)} BTC`,
    subtitle: "Total Earnings"
  },
  {
    icon: Package,
    iconColor: "bg-blue-100 text-blue-600",
    label: "Total Rentals",
    value: demoAssets.reduce((sum, asset) => sum + asset.rentals, 0),
    subtitle: "Total Rentals"
  },
  {
    icon: ShoppingBag,
    iconColor: "bg-purple-100 text-purple-600",
    label: "Available",
    value: demoAssets.filter(a => a.status === "Available").length,
    subtitle: "Available"
  }
]

export const getPeopleStats = (): DashboardStats[] => [
  {
    icon: Users,
    iconColor: "bg-purple-100 text-purple-600",
    label: "Connections",
    value: demoPeople.length,
    subtitle: "Connections"
  },
  {
    icon: Heart,
    iconColor: "bg-pink-100 text-pink-600",
    label: "Friends",
    value: demoPeople.filter(p => p.relationship === "Friend").length,
    subtitle: "Friends"
  },
  {
    icon: Building,
    iconColor: "bg-blue-100 text-blue-600",
    label: "Colleagues",
    value: demoPeople.filter(p => p.relationship === "Colleague").length,
    subtitle: "Colleagues"
  },
  {
    icon: Star,
    iconColor: "bg-yellow-100 text-yellow-600",
    label: "Mutual Connections",
    value: demoPeople.reduce((sum, person) => sum + person.mutualConnections, 0),
    subtitle: "Mutual Connections"
  }
]

export const getFundraisingStats = (): DashboardStats[] => [
  {
    icon: Handshake,
    iconColor: "bg-teal-100 text-teal-600",
    label: "Campaigns",
    value: demoCampaigns.length,
    subtitle: "Campaigns"
  },
  {
    icon: Coins,
    iconColor: "bg-green-100 text-green-600",
    label: "Total Raised",
    value: `${(demoCampaigns.reduce((sum, campaign) => sum + campaign.raised, 0) / 100000000).toFixed(3)} BTC`,
    subtitle: "Total Raised"
  },
  {
    icon: Users,
    iconColor: "bg-blue-100 text-blue-600",
    label: "Total Supporters",
    value: demoCampaigns.reduce((sum, campaign) => sum + campaign.supporters, 0),
    subtitle: "Total Supporters"
  },
  {
    icon: Target,
    iconColor: "bg-purple-100 text-purple-600",
    label: "Active Campaigns",
    value: demoCampaigns.filter(c => c.status === "Active").length,
    subtitle: "Active Campaigns"
  }
]

// Activity Data
export const organizationsActivity: DashboardActivity[] = [
  {
    type: "proposal",
    title: "Q1 Budget Allocation",
    context: "Bitcoin Builders DAO",
    time: "2 hours ago",
    icon: Vote
  },
  {
    type: "member",
    title: "Sarah Johnson joined",
    context: "Local Tech Meetup",
    time: "5 hours ago",
    icon: Users
  },
  {
    type: "treasury",
    title: "Received 50,000 sats donation",
    context: "OpenSource Foundation",
    time: "1 day ago",
    icon: Coins
  }
]

export const eventsActivity: DashboardActivity[] = [
  {
    type: "registration",
    title: "15 new registrations",
    context: "Bitcoin Conference Zurich",
    time: "3 hours ago",
    icon: Users
  },
  {
    type: "payment",
    title: "Ticket payment received",
    context: "Lightning Workshop",
    time: "6 hours ago",
    icon: Ticket
  },
  {
    type: "reminder",
    title: "Event reminder sent",
    context: "Local Bitcoin Meetup",
    time: "1 day ago",
    icon: Clock
  }
]

export const projectsActivity: DashboardActivity[] = [
  {
    type: "commit",
    title: "UI improvements merged",
    context: "Bitcoin Wallet UI",
    time: "2 hours ago",
    icon: Code
  },
  {
    type: "milestone",
    title: "Milestone 3 completed",
    context: "Lightning Workshop Series",
    time: "1 day ago",
    icon: Target
  },
  {
    type: "funding",
    title: "Received 25,000 sats",
    context: "Community Meetup Platform",
    time: "3 days ago",
    icon: Star
  }
]

export const assetsActivity: DashboardActivity[] = [
  {
    type: "rental",
    title: "Camera Kit rented",
    context: "Professional Camera Kit",
    time: "2 hours ago",
    icon: Package
  },
  {
    type: "payment",
    title: "Received 25,000 sats",
    context: "Mountain Bike rental",
    time: "1 day ago",
    icon: Coins
  },
  {
    type: "listing",
    title: "New asset listed",
    context: "Power Drill Set",
    time: "3 days ago",
    icon: ShoppingBag
  }
]

export const peopleActivity: DashboardActivity[] = [
  {
    type: "connection",
    title: "New connection request",
    context: "Sarah Johnson",
    time: "1 hour ago",
    icon: Users
  },
  {
    type: "message",
    title: "Message from Mike Chen",
    context: "Project collaboration",
    time: "4 hours ago",
    icon: Heart
  },
  {
    type: "skill",
    title: "Skill endorsement received",
    context: "Bitcoin Development",
    time: "2 days ago",
    icon: Star
  }
]

export const fundraisingActivity: DashboardActivity[] = [
  {
    type: "donation",
    title: "New donation received",
    context: "Bitcoin Education Workshop",
    time: "30 minutes ago",
    icon: Coins
  },
  {
    type: "supporter",
    title: "New supporter joined",
    context: "Open Source Bitcoin Wallet",
    time: "2 hours ago",
    icon: Users
  },
  {
    type: "milestone",
    title: "Goal reached!",
    context: "Community Meetup Space",
    time: "1 day ago",
    icon: Target
  }
]

// Feature Preview Data for Main Dashboard - DEPRECATED
// User requested removal of feature previews from dashboard
// Keeping for reference but not exported
const deprecatedFeaturePreviewsData = [
  {
    title: "Organizations",
    description: "View your organizations dashboard with demo data",
    icon: Building,
    iconColor: "text-green-600",
    borderColor: "border-green-200",
    backgroundColor: "bg-green-50",
    timeline: "Q1 2026",
    demoCount: "3 Demo Organizations",
    href: "/organizations"
  },
  {
    title: "Events",
    description: "View your events dashboard with demo data",
    icon: Calendar,
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    backgroundColor: "bg-blue-50",
    timeline: "Q2 2026",
    demoCount: "3 Demo Events",
    href: "/events"
  },
  {
    title: "Projects",
    description: "View your projects dashboard with demo data",
    icon: Briefcase,
    iconColor: "text-purple-600",
    borderColor: "border-purple-200", 
    backgroundColor: "bg-purple-50",
    timeline: "Q1 2026",
    demoCount: "3 Demo Projects",
    href: "/projects"
  }
] 