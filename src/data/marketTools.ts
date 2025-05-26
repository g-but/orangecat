import { 
  Building, 
  Users, 
  Target, 
  BarChart3, 
  Briefcase, 
  FileText,
  Calendar,
  Ticket,
  Music,
  Coffee,
  Share2,
  UserPlus,
  MessageSquare,
  Wallet,
  ShoppingBag,
  Package,
  Recycle,
  Heart,
  Code,
  Zap,
  GitBranch
} from 'lucide-react'
import { getRegionEmoji } from '@/utils/currency'

// Tools organized by category - regional focus for Switzerland

export const organizationTools = [
  {
    name: 'ELIZA',
    description: 'Regional QM and process management',
    url: 'https://eliza.swiss',
    icon: Building,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Teambook',
    description: 'Project planning and resource management',
    url: 'https://teambookapp.com',
    icon: Users,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    name: 'ActionPlanner',
    description: 'Business execution and action planning',
    url: 'https://actionplanner.com',
    icon: Target,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'Atlanto',
    description: 'Regional business administration and accounting',
    url: 'https://atlanto.ch',
    icon: BarChart3,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    name: 'Monday.com',
    description: 'Work management platform',
    url: 'https://monday.com',
    icon: Briefcase,
    color: 'bg-red-100 text-red-600'
  },
  {
    name: 'Notion',
    description: 'Team workspace and documentation',
    url: 'https://notion.so',
    icon: FileText,
    color: 'bg-teal-100 text-teal-600'
  }
]

export const eventTools = [
  {
    name: 'Eventfrog',
    description: 'Local event ticketing and promotion',
    url: 'https://eventfrog.ch',
    icon: Ticket,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'Ticketmaster',
    description: 'Global event ticketing platform',
    url: 'https://ticketmaster.ch',
    icon: Music,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Eventbrite',
    description: 'Event management and ticketing',
    url: 'https://eventbrite.ch',
    icon: Calendar,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    name: 'Xing Events',
    description: 'Professional networking events',
    url: 'https://events.xing.com',
    icon: Users,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    name: 'Meetup',
    description: 'Community meetup organization',
    url: 'https://meetup.com',
    icon: Coffee,
    color: 'bg-red-100 text-red-600'
  },
  {
    name: 'Facebook Events',
    description: 'Social event promotion',
    url: 'https://facebook.com/events',
    icon: Share2,
    color: 'bg-teal-100 text-teal-600'
  }
]

export const peopleTools = [
  {
    name: 'LinkedIn',
    description: 'Professional networking platform',
    url: 'https://linkedin.com',
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Xing',
    description: 'Regional professional network',
    url: 'https://xing.com',
    icon: Users,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'WhatsApp',
    description: 'Popular messaging in your region',
    url: 'https://whatsapp.com',
    icon: MessageSquare,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'Telegram',
    description: 'Secure messaging and groups',
    url: 'https://telegram.org',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Discord',
    description: 'Community organization platform',
    url: 'https://discord.com',
    icon: Users,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    name: 'Signal',
    description: 'Privacy-focused messaging',
    url: 'https://signal.org',
    icon: MessageSquare,
    color: 'bg-gray-100 text-gray-600'
  }
]

export const assetTools = [
  {
    name: 'ricardo.ch',
    description: 'Regional online marketplace',
    url: 'https://ricardo.ch',
    icon: ShoppingBag,
    color: 'bg-red-100 text-red-600'
  },
  {
    name: 'tutti.ch',
    description: 'Local classified ads platform',
    url: 'https://tutti.ch',
    icon: Package,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    name: 'Facebook Marketplace',
    description: 'Local buying and selling',
    url: 'https://facebook.com/marketplace',
    icon: ShoppingBag,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Pumpipumpe',
    description: 'Local neighborhood sharing platform',
    url: 'https://pumpipumpe.ch',
    icon: Heart,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'Sharely',
    description: 'Peer-to-peer sharing platform',
    url: 'https://sharely.ch',
    icon: Recycle,
    color: 'bg-teal-100 text-teal-600'
  },
  {
    name: 'eBay Kleinanzeigen',
    description: 'Popular classified platform',
    url: 'https://ebay-kleinanzeigen.de',
    icon: Package,
    color: 'bg-yellow-100 text-yellow-600'
  }
]

export const fundingTools = [
  {
    name: 'Kickstarter',
    description: 'Creative project crowdfunding',
    url: 'https://kickstarter.com',
    icon: Zap,
    color: 'bg-green-100 text-green-600'
  },
  {
    name: 'Indiegogo',
    description: 'Flexible crowdfunding platform',
    url: 'https://indiegogo.com',
    icon: Target,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    name: 'GoFundMe',
    description: 'Personal fundraising campaigns',
    url: 'https://gofundme.com',
    icon: Heart,
    color: 'bg-red-100 text-red-600'
  },
  {
    name: 'Patreon',
    description: 'Recurring creator support',
    url: 'https://patreon.com',
    icon: Users,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    name: 'GitHub Sponsors',
    description: 'Open source project funding',
    url: 'https://github.com/sponsors',
    icon: GitBranch,
    color: 'bg-gray-100 text-gray-600'
  },
  {
    name: 'Liberapay',
    description: 'Recurrent donations platform',
    url: 'https://liberapay.com',
    icon: Wallet,
    color: 'bg-blue-100 text-blue-600'
  }
]

export const projectTools = [
  {
    name: 'GitHub',
    description: 'Open source development platform',
    url: 'https://github.com',
    icon: GitBranch,
    color: 'bg-gray-100 text-gray-600'
  },
  {
    name: 'GitLab',
    description: 'DevOps and project management',
    url: 'https://gitlab.com',
    icon: Code,
    color: 'bg-orange-100 text-orange-600'
  },
  {
    name: 'Jira',
    description: 'Project tracking and management',
    url: 'https://atlassian.com/software/jira',
    icon: Target,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    name: 'Linear',
    description: 'Modern project management',
    url: 'https://linear.app',
    icon: Zap,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    name: 'Asana',
    description: 'Team project management',
    url: 'https://asana.com',
    icon: Users,
    color: 'bg-red-100 text-red-600'
  },
  {
    name: 'Trello',
    description: 'Kanban-style project boards',
    url: 'https://trello.com',
    icon: BarChart3,
    color: 'bg-teal-100 text-teal-600'
  }
]

// Helper function to get regionalized section titles
export function getRegionalToolsTitle(category: string): string {
  const emoji = getRegionEmoji()
  const regionName = "your region" // We don't want to show "Switzerland" explicitly
  
  const titles = {
    organizations: `Trusted Organizational Tools ${emoji}`,
    events: `Popular Event Platforms ${emoji}`,
    people: `Regional Networking Platforms ${emoji}`,
    assets: `Local Marketplaces ${emoji}`,
    funding: `Popular Funding Platforms ${emoji}`,
    projects: `Popular Development Platforms ${emoji}`
  }
  
  return titles[category as keyof typeof titles] || `Regional Tools ${emoji}`
}

export function getRegionalToolsDescription(category: string): string {
  const descriptions = {
    organizations: "Learning from established platforms! These organizational tools have built trust in your region and beyond. We're adding Bitcoin payments, AI-powered governance, and transparent operations 🏛️",
    events: "Learning from the best! These platforms have mastered event management in your region and globally. We're adding Bitcoin magic and AI-powered insights to the mix 🎟️",
    people: "Learning from established networks! These platforms have connected millions in your region and worldwide. We're adding Bitcoin micropayments, privacy controls, and decentralized identity 🤝",
    assets: "Learning from established platforms! These marketplaces have built trust in your region and beyond. We're adding Bitcoin payments, zero-waste focus, and community-driven sharing 🌱",
    funding: "Learning from proven platforms! These funding solutions have empowered creators globally. We're adding native Bitcoin support, lower fees, and true decentralization 🚀",
    projects: "Learning from the best! These development platforms have enabled millions of successful projects worldwide. We're adding Bitcoin payments, AI-powered matching, and decentralized governance 💻"
  }
  
  return descriptions[category as keyof typeof descriptions] || "Alternatives popular in your region"
} 