import { 
  Building, 
  Calendar, 
  Briefcase, 
  Users, 
  Wallet, 
  Handshake,
  LucideIcon,
  Vote,
  Shield,
  Coins,
  FileText,
  BarChart3,
  Award,
  Target,
  Heart,
  Globe,
  Zap,
  Ticket,
  Music,
  Coffee,
  MapPin,
  Clock,
  Code,
  GitBranch,
  Lightbulb,
  Rocket,
  UserPlus,
  MessageSquare,
  Star,
  Network,
  ShoppingBag,
  Package,
  Recycle,
  Gift,
  ArrowRightLeft,
  Leaf
} from 'lucide-react'

// Icon mapping for serialization-safe storage
export const ICON_MAP: Record<string, LucideIcon> = {
  Building,
  Calendar,
  Briefcase,
  Users,
  Wallet,
  Handshake,
  Vote,
  Shield,
  Coins,
  FileText,
  BarChart3,
  Award,
  Target,
  Heart,
  Globe,
  Zap,
  Ticket,
  Music,
  Coffee,
  MapPin,
  Clock,
  Code,
  GitBranch,
  Lightbulb,
  Rocket,
  UserPlus,
  MessageSquare,
  Star,
  Network,
  ShoppingBag,
  Package,
  Recycle,
  Gift,
  ArrowRightLeft,
  Leaf
}

export interface Initiative {
  id: string
  name: string
  icon: string
  color: {
    primary: string
    gradient: string
    bg: string
    text: string
    border: string
  }
  description: string
  longDescription: string
  status: 'available' | 'coming-soon'
  timeline?: string
  routes: {
    landing: string
    demo?: string
    comingSoon: string
    create?: string
  }
  features: Array<{
    icon: string
    title: string
    description: string
    color: string
  }>
  types: Array<{
    name: string
    icon: string
    description: string
    example: string
    color: string
  }>
  capabilities: string[]
  useCases: string[]
  marketTools: Array<{
    name: string
    description: string
    url: string
    icon: string
    color: string
  }>
}

export const INITIATIVES: Record<string, Initiative> = {
  organizations: {
    id: 'organizations',
    name: 'Organizations',
    icon: 'Building',
    color: {
      primary: 'green-600',
      gradient: 'from-green-500 to-emerald-500',
      bg: 'green-100',
      text: 'green-600',
      border: 'green-200'
    },
    description: 'Create and manage modern organizations with governance tools, asset management, and member coordination features powered by Bitcoin.',
    longDescription: 'Build structured organizations with clear governance, manage collective assets, coordinate member activities, and make decisions together using Bitcoin-powered voting mechanisms.',
    status: 'coming-soon',
    timeline: 'Q1 2025',
    routes: {
      landing: '/organizations',
      demo: '/demo/organizations',
      comingSoon: '/coming-soon?feature=organizations'
    },
    features: [
      {
        icon: 'Vote',
        title: 'Governance Tools',
        description: 'Implement democratic decision-making with voting mechanisms and proposal systems.',
        color: 'text-blue-600 bg-blue-100'
      },
      {
        icon: 'Coins',
        title: 'Asset Management',
        description: 'Manage organizational Bitcoin holdings with multi-signature security and transparency.',
        color: 'text-yellow-600 bg-yellow-100'
      },
      {
        icon: 'Users',
        title: 'Member Coordination',
        description: 'Organize team members, assign roles, and coordinate activities seamlessly.',
        color: 'text-purple-600 bg-purple-100'
      },
      {
        icon: 'FileText',
        title: 'Proposal System',
        description: 'Create, discuss, and vote on organizational proposals with transparent processes.',
        color: 'text-green-600 bg-green-100'
      },
      {
        icon: 'BarChart3',
        title: 'Analytics & Reporting',
        description: 'Track organizational performance, member engagement, and financial metrics.',
        color: 'text-red-600 bg-red-100'
      },
      {
        icon: 'Shield',
        title: 'Security & Compliance',
        description: 'Enterprise-grade security with audit trails and compliance monitoring.',
        color: 'text-teal-600 bg-teal-100'
      }
    ],
    types: [
      { 
        name: 'Tech Company', 
        icon: 'Briefcase',
        description: 'Technology businesses and startups',
        example: 'Software development company',
        color: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      { 
        name: 'DAO', 
        icon: 'Vote',
        description: 'Decentralized autonomous organizations',
        example: 'Community development fund',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      { 
        name: 'Non-Profit', 
        icon: 'Award',
        description: 'Advocacy and education organizations',
        example: 'Educational foundation',
        color: 'bg-green-100 text-green-700 border-green-200'
      },
      { 
        name: 'Investment Group', 
        icon: 'BarChart3',
        description: 'Collective investment and funding groups',
        example: 'Community venture fund',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      { 
        name: 'Community Organization', 
        icon: 'Users',
        description: 'Local meetups and communities',
        example: 'Local tech meetup group',
        color: 'bg-teal-100 text-teal-700 border-teal-200'
      },
      { 
        name: 'Cooperative', 
        icon: 'Network',
        description: 'Member-owned cooperatives',
        example: 'Worker cooperative',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      }
    ],
    capabilities: [
      'Democratic governance and voting',
      'Multi-signature asset management',
      'Member role and permission management',
      'Proposal creation and discussion',
      'Financial transparency and reporting',
      'Automated compliance monitoring',
      'Meeting and decision tracking',
      'Member onboarding and verification',
      'Integration with external tools',
      'Audit trail and history'
    ],
    useCases: [
      'DAOs and Bitcoin collectives',
      'Community organizations',
      'Investment clubs',
      'Cooperative businesses'
    ],
    marketTools: [
      {
        name: 'Monday.com',
        description: 'Work management platform',
        url: 'https://monday.com',
        icon: 'Briefcase',
        color: 'bg-red-100 text-red-600'
      },
      {
        name: 'Notion',
        description: 'Team workspace and documentation',
        url: 'https://notion.so',
        icon: 'FileText',
        color: 'bg-teal-100 text-teal-600'
      },
      {
        name: 'Slack',
        description: 'Team communication platform',
        url: 'https://slack.com',
        icon: 'MessageSquare',
        color: 'bg-purple-100 text-purple-600'
      }
    ]
  },

  events: {
    id: 'events',
    name: 'Events',
    icon: 'Calendar',
    color: {
      primary: 'blue-600',
      gradient: 'from-blue-500 to-teal-500',
      bg: 'blue-100',
      text: 'blue-600',
      border: 'blue-200'
    },
    description: 'Organize and fundraise for conferences, parties, and community gatherings with Bitcoin-powered ticketing and coordination tools.',
    longDescription: 'Plan events, sell tickets with Bitcoin, manage attendee communications, coordinate logistics, and create memorable experiences for your Bitcoin community.',
    status: 'coming-soon',
    timeline: 'Q2 2025',
    routes: {
      landing: '/events',
      demo: '/demo/events',
      comingSoon: '/coming-soon?feature=events'
    },
    features: [
      {
        icon: 'Calendar',
        title: 'Event Creation',
        description: 'Create and manage events from intimate gatherings to large conferences with ease.',
        color: 'text-blue-600 bg-blue-100'
      },
      {
        icon: 'Ticket',
        title: 'Bitcoin Ticketing',
        description: 'Sell tickets with Bitcoin payments, eliminating payment processor fees and chargebacks.',
        color: 'text-orange-600 bg-orange-100'
      },
      {
        icon: 'Users',
        title: 'Attendee Management',
        description: 'Track RSVPs, manage guest lists, and communicate with attendees seamlessly.',
        color: 'text-purple-600 bg-purple-100'
      },
      {
        icon: 'MapPin',
        title: 'Venue Coordination',
        description: 'Manage venues, logistics, and coordinate with local service providers.',
        color: 'text-green-600 bg-green-100'
      },
      {
        icon: 'Clock',
        title: 'Real-time Updates',
        description: 'Send instant updates to attendees about schedule changes or important announcements.',
        color: 'text-red-600 bg-red-100'
      },
      {
        icon: 'Target',
        title: 'Event Analytics',
        description: 'Track attendance, engagement metrics, and gather feedback for future events.',
        color: 'text-teal-600 bg-teal-100'
      }
    ],
    types: [
      { 
        name: 'Conferences', 
        icon: 'Users',
        description: 'Professional conferences and seminars',
        example: 'Bitcoin Conference Zurich',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      { 
        name: 'Meetups', 
        icon: 'Coffee',
        description: 'Casual community gatherings',
        example: 'Local Bitcoin meetup',
        color: 'bg-green-100 text-green-700 border-green-200'
      },
      { 
        name: 'Workshops', 
        icon: 'Users',
        description: 'Educational and skill-building sessions',
        example: 'Lightning Network workshop',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      { 
        name: 'Social Events', 
        icon: 'Heart',
        description: 'Parties and social gatherings',
        example: 'Community celebration',
        color: 'bg-pink-100 text-pink-700 border-pink-200'
      },
      { 
        name: 'Concerts', 
        icon: 'Music',
        description: 'Musical performances and festivals',
        example: 'Bitcoin music festival',
        color: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      { 
        name: 'Gaming Events', 
        icon: 'Target',
        description: 'Gaming tournaments and competitions',
        example: 'Esports tournament',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      }
    ],
    capabilities: [
      'Event creation and management',
      'Bitcoin ticket sales',
      'Attendee management',
      'Event fundraising campaigns',
      'Real-time communication',
      'Post-event analytics',
      'Venue coordination',
      'Speaker management',
      'Sponsorship tracking',
      'Social media integration'
    ],
    useCases: [
      'Bitcoin conferences and meetups',
      'Community gatherings',
      'Educational workshops',
      'Social events and parties'
    ],
    marketTools: [
      {
        name: 'Eventbrite',
        description: 'Event management and ticketing',
        url: 'https://eventbrite.com',
        icon: 'Calendar',
        color: 'bg-orange-100 text-orange-600'
      },
      {
        name: 'Meetup',
        description: 'Community meetup organization',
        url: 'https://meetup.com',
        icon: 'Coffee',
        color: 'bg-red-100 text-red-600'
      },
      {
        name: 'Zoom Events',
        description: 'Virtual event platform',
        url: 'https://zoom.us',
        icon: 'Users',
        color: 'bg-blue-100 text-blue-600'
      }
    ]
  },

  projects: {
    id: 'projects',
    name: 'Projects',
    icon: 'Briefcase',
    color: {
      primary: 'purple-600',
      gradient: 'from-indigo-500 to-purple-500',
      bg: 'purple-100',
      text: 'purple-600',
      border: 'purple-200'
    },
    description: 'Launch and manage projects with transparent funding, milestone tracking, and collaborative tools powered by Bitcoin escrow.',
    longDescription: 'Create project proposals, track progress with milestones, manage collaborative work, and ensure transparent funding with Bitcoin escrow and automatic milestone releases.',
    status: 'coming-soon',
    timeline: 'Q1 2025',
    routes: {
      landing: '/projects',
      demo: '/demo/projects',
      comingSoon: '/coming-soon?feature=projects'
    },
    features: [
      {
        icon: 'Code',
        title: 'Project Creation',
        description: 'Start projects with clear goals, timelines, and Bitcoin-based funding mechanisms.',
        color: 'text-blue-600 bg-blue-100'
      },
      {
        icon: 'Users',
        title: 'Team Collaboration',
        description: 'Invite collaborators, assign roles, and coordinate work with transparent contribution tracking.',
        color: 'text-purple-600 bg-purple-100'
      },
      {
        icon: 'Coins',
        title: 'Bitcoin Funding',
        description: 'Raise funds, pay contributors, and manage project finances with Bitcoin micropayments.',
        color: 'text-orange-600 bg-orange-100'
      },
      {
        icon: 'Target',
        title: 'Milestone Tracking',
        description: 'Set clear milestones, track progress, and celebrate achievements with the team.',
        color: 'text-green-600 bg-green-100'
      },
      {
        icon: 'GitBranch',
        title: 'Open Source',
        description: 'Share code, documentation, and learnings with the global developer community.',
        color: 'text-gray-600 bg-gray-100'
      },
      {
        icon: 'Award',
        title: 'Recognition System',
        description: 'Build reputation through successful project completion and community contributions.',
        color: 'text-yellow-600 bg-yellow-100'
      }
    ],
    types: [
      { 
        name: 'Open Source Software', 
        icon: 'GitBranch',
        description: 'Community-driven software development',
        example: 'Bitcoin wallet, Lightning app',
        color: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      { 
        name: 'Startups', 
        icon: 'Rocket',
        description: 'Early-stage business ventures',
        example: 'Bitcoin payment processor',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      { 
        name: 'Research Projects', 
        icon: 'Lightbulb',
        description: 'Academic and scientific research',
        example: 'Bitcoin scaling research',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      { 
        name: 'Creative Projects', 
        icon: 'Award',
        description: 'Art, design, and creative endeavors',
        example: 'Bitcoin documentary, NFT art',
        color: 'bg-pink-100 text-pink-700 border-pink-200'
      },
      { 
        name: 'Community Initiatives', 
        icon: 'Users',
        description: 'Local and global community projects',
        example: 'Bitcoin education program',
        color: 'bg-green-100 text-green-700 border-green-200'
      },
      { 
        name: 'Freelance Work', 
        icon: 'Handshake',
        description: 'Individual consulting and services',
        example: 'Smart contract development',
        color: 'bg-orange-100 text-orange-700 border-orange-200'
      }
    ],
    capabilities: [
      'Project proposal creation',
      'Milestone-based funding',
      'Collaborative workspaces',
      'Bitcoin escrow management',
      'Progress tracking and reporting',
      'Community voting on proposals',
      'Resource allocation',
      'Team coordination',
      'Deadline management',
      'Performance analytics'
    ],
    useCases: [
      'Open source development',
      'Community improvement projects',
      'Research initiatives',
      'Creative collaborations'
    ],
    marketTools: [
      {
        name: 'GitHub',
        description: 'Code collaboration platform',
        url: 'https://github.com',
        icon: 'GitBranch',
        color: 'bg-gray-100 text-gray-600'
      },
      {
        name: 'Trello',
        description: 'Project management boards',
        url: 'https://trello.com',
        icon: 'Target',
        color: 'bg-blue-100 text-blue-600'
      },
      {
        name: 'Kickstarter',
        description: 'Crowdfunding platform',
        url: 'https://kickstarter.com',
        icon: 'Rocket',
        color: 'bg-green-100 text-green-600'
      }
    ]
  },

  people: {
    id: 'people',
    name: 'People',
    icon: 'Users',
    color: {
      primary: 'orange-600',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'orange-100',
      text: 'orange-600',
      border: 'orange-200'
    },
    description: 'Connect with friends, create circles, and build your Bitcoin community through networking and collaboration tools.',
    longDescription: 'Build meaningful connections within the Bitcoin community through friend networks, interest-based circles, skill sharing, and collaborative opportunities.',
    status: 'coming-soon',
    timeline: 'Q2 2025',
    routes: {
      landing: '/people',
      demo: '/demo/people',
      comingSoon: '/coming-soon?feature=people'
    },
    features: [
      {
        icon: 'UserPlus',
        title: 'Connect & Network',
        description: 'Build meaningful connections with like-minded individuals in your community and globally.',
        color: 'text-blue-600 bg-blue-100'
      },
      {
        icon: 'MessageSquare',
        title: 'Secure Messaging',
        description: 'Communicate privately with end-to-end encryption and Bitcoin-powered micropayments.',
        color: 'text-green-600 bg-green-100'
      },
      {
        icon: 'Star',
        title: 'Reputation System',
        description: 'Build trust through verified interactions and community endorsements.',
        color: 'text-yellow-600 bg-yellow-100'
      },
      {
        icon: 'Handshake',
        title: 'Skill Sharing',
        description: 'Offer your skills or find experts for projects with Bitcoin-based payments.',
        color: 'text-purple-600 bg-purple-100'
      },
      {
        icon: 'Globe',
        title: 'Global Reach',
        description: 'Connect with people worldwide without geographical or financial barriers.',
        color: 'text-teal-600 bg-teal-100'
      },
      {
        icon: 'Shield',
        title: 'Privacy First',
        description: 'Control your data and privacy with decentralized identity management.',
        color: 'text-red-600 bg-red-100'
      }
    ],
    types: [
      { 
        name: 'Professionals', 
        icon: 'Handshake',
        description: 'Business contacts and career networking',
        example: 'Developers, designers, entrepreneurs',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      { 
        name: 'Community Members', 
        icon: 'Users',
        description: 'Local neighbors and community participants',
        example: 'Local Bitcoin meetup attendees',
        color: 'bg-green-100 text-green-700 border-green-200'
      },
      { 
        name: 'Skill Partners', 
        icon: 'Zap',
        description: 'People to collaborate on projects and skills',
        example: 'Coding partners, mentors, tutors',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      { 
        name: 'Interest Groups', 
        icon: 'Heart',
        description: 'People with shared hobbies and interests',
        example: 'Bitcoin enthusiasts, gamers, artists',
        color: 'bg-pink-100 text-pink-700 border-pink-200'
      },
      { 
        name: 'Mentors & Experts', 
        icon: 'Award',
        description: 'Experienced professionals and advisors',
        example: 'Industry veterans, coaches, teachers',
        color: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      { 
        name: 'Global Network', 
        icon: 'Globe',
        description: 'International connections and partnerships',
        example: 'Remote collaborators, global friends',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      }
    ],
    capabilities: [
      'Friend connections and profiles',
      'Interest-based community circles',
      'Skill sharing and mentorship',
      'Private messaging and groups',
      'Event coordination',
      'Reputation and trust systems',
      'Professional networking',
      'Collaboration matching',
      'Knowledge sharing',
      'Community building'
    ],
    useCases: [
      'Bitcoin community networking',
      'Skill and knowledge sharing',
      'Mentorship connections',
      'Local Bitcoin groups'
    ],
    marketTools: [
      {
        name: 'LinkedIn',
        description: 'Professional networking platform',
        url: 'https://linkedin.com',
        icon: 'UserPlus',
        color: 'bg-blue-100 text-blue-600'
      },
      {
        name: 'Discord',
        description: 'Community organization platform',
        url: 'https://discord.com',
        icon: 'Users',
        color: 'bg-purple-100 text-purple-600'
      },
      {
        name: 'Telegram',
        description: 'Secure messaging and groups',
        url: 'https://telegram.org',
        icon: 'MessageSquare',
        color: 'bg-blue-100 text-blue-600'
      }
    ]
  },

  assets: {
    id: 'assets',
    name: 'Assets',
    icon: 'Wallet',
    color: {
      primary: 'red-600',
      gradient: 'from-orange-500 to-red-500',
      bg: 'red-100',
      text: 'red-600',
      border: 'red-200'
    },
    description: 'List, rent, and discover physical assets in your community with Bitcoin-powered marketplace and sharing economy features.',
    longDescription: 'Create an asset marketplace where community members can list, rent, and share physical items, creating a sustainable sharing economy powered by Bitcoin payments.',
    status: 'coming-soon',
    timeline: 'Q2 2025',
    routes: {
      landing: '/assets',
      demo: '/demo/assets',
      comingSoon: '/coming-soon?feature=assets'
    },
    features: [
      {
        icon: 'ShoppingBag',
        title: 'Sell & Trade',
        description: 'List items for sale with Bitcoin payments, eliminating fees and enabling global transactions.',
        color: 'text-green-600 bg-green-100'
      },
      {
        icon: 'Gift',
        title: 'Gift & Share',
        description: 'Give away items you no longer need to community members who can use them.',
        color: 'text-pink-600 bg-pink-100'
      },
      {
        icon: 'ArrowRightLeft',
        title: 'Borrow & Lend',
        description: 'Access tools and equipment when needed, or earn Bitcoin by lending your items.',
        color: 'text-blue-600 bg-blue-100'
      },
      {
        icon: 'MapPin',
        title: 'Local Focus',
        description: 'Connect with neighbors and local community members for sustainable exchanges.',
        color: 'text-purple-600 bg-purple-100'
      },
      {
        icon: 'Leaf',
        title: 'Zero Waste',
        description: 'Reduce waste by giving items a second life instead of throwing them away.',
        color: 'text-emerald-600 bg-emerald-100'
      },
      {
        icon: 'Handshake',
        title: 'Trust System',
        description: 'Build reputation through successful transactions and community feedback.',
        color: 'text-orange-600 bg-orange-100'
      }
    ],
    types: [
      { 
        name: 'Electronics', 
        icon: 'Package',
        description: 'Phones, laptops, gadgets, and tech accessories',
        example: 'iPhone, MacBook, gaming console',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      { 
        name: 'Tools & Equipment', 
        icon: 'ArrowRightLeft',
        description: 'Power tools, garden equipment, and specialized gear',
        example: 'Drill, lawnmower, camera equipment',
        color: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      { 
        name: 'Furniture', 
        icon: 'Heart',
        description: 'Home and office furniture, decor items',
        example: 'Desk, sofa, bookshelf',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      { 
        name: 'Books & Media', 
        icon: 'Gift',
        description: 'Books, movies, games, and educational materials',
        example: 'Textbooks, vinyl records, board games',
        color: 'bg-green-100 text-green-700 border-green-200'
      },
      { 
        name: 'Sports & Outdoor', 
        icon: 'Users',
        description: 'Sports equipment, outdoor gear, fitness items',
        example: 'Bicycle, ski equipment, camping gear',
        color: 'bg-teal-100 text-teal-700 border-teal-200'
      },
      { 
        name: 'Household Items', 
        icon: 'Recycle',
        description: 'Kitchen appliances, cleaning supplies, everyday items',
        example: 'Blender, vacuum cleaner, dishes',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      }
    ],
    capabilities: [
      'Asset listing and discovery',
      'Bitcoin-based rental payments',
      'Asset condition tracking',
      'User ratings and reviews',
      'Insurance and security deposits',
      'Community asset sharing',
      'Booking management',
      'Payment processing',
      'Dispute resolution',
      'Usage analytics'
    ],
    useCases: [
      'Tool and equipment sharing',
      'Vehicle rentals',
      'Space and venue sharing',
      'Electronics and gadgets'
    ],
    marketTools: [
      {
        name: 'Facebook Marketplace',
        description: 'Local buying and selling',
        url: 'https://facebook.com/marketplace',
        icon: 'ShoppingBag',
        color: 'bg-blue-100 text-blue-600'
      },
      {
        name: 'Craigslist',
        description: 'Classified advertisements',
        url: 'https://craigslist.org',
        icon: 'Package',
        color: 'bg-gray-100 text-gray-600'
      },
      {
        name: 'OfferUp',
        description: 'Mobile marketplace',
        url: 'https://offerup.com',
        icon: 'Gift',
        color: 'bg-green-100 text-green-600'
      }
    ]
  },

  fundraising: {
    id: 'fundraising',
    name: 'Fundraising',
    icon: 'Handshake',
    color: {
      primary: 'teal-600',
      gradient: 'from-teal-500 to-cyan-500',
      bg: 'teal-100',
      text: 'teal-600',
      border: 'teal-200'
    },
    description: 'Create powerful fundraising campaigns with Bitcoin. Engage supporters, track goals, and build community around causes that matter.',
    longDescription: 'Build sophisticated fundraising campaigns with goal tracking, supporter engagement tools, reward tiers, and advanced analytics to maximize your impact.',
    status: 'available',
    routes: {
      landing: '/fundraising',
      demo: '/demo/fundraising',
      comingSoon: '/coming-soon?feature=fundraising',
      create: '/create'
    },
    features: [
      {
        icon: 'Target',
        title: 'Campaign Creation',
        description: 'Create compelling fundraising campaigns with rich media, goals, and milestone tracking.',
        color: 'text-green-600 bg-green-100'
      },
      {
        icon: 'Heart',
        title: 'Supporter Engagement',
        description: 'Build lasting relationships with supporters through updates, messages, and community features.',
        color: 'text-red-600 bg-red-100'
      },
      {
        icon: 'Users',
        title: 'Community Building',
        description: 'Foster a community around your cause with discussion features and supporter interaction.',
        color: 'text-purple-600 bg-purple-100'
      },
      {
        icon: 'Globe',
        title: 'Global Reach',
        description: 'Accept donations from supporters worldwide without traditional banking barriers.',
        color: 'text-blue-600 bg-blue-100'
      },
      {
        icon: 'Zap',
        title: 'Lightning Fast',
        description: 'Instant Bitcoin donations via Lightning Network with minimal fees.',
        color: 'text-yellow-600 bg-yellow-100'
      },
      {
        icon: 'BarChart3',
        title: 'Analytics & Insights',
        description: 'Track campaign performance, donor patterns, and engagement metrics in real-time.',
        color: 'text-teal-600 bg-teal-100'
      }
    ],
    types: [
      { 
        name: 'Personal Causes', 
        icon: 'Heart',
        description: 'Individual fundraising for personal needs and causes',
        example: 'Medical expenses, education funding',
        color: 'bg-red-100 text-red-700 border-red-200'
      },
      { 
        name: 'Startup Funding', 
        icon: 'Rocket',
        description: 'Raise capital for Bitcoin startups and businesses',
        example: 'Lightning app development',
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      { 
        name: 'Creative Projects', 
        icon: 'Lightbulb',
        description: 'Fund creative works, art, and content creation',
        example: 'Bitcoin documentary production',
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      { 
        name: 'Community Projects', 
        icon: 'Users',
        description: 'Fundraise for community initiatives and local projects',
        example: 'Local Bitcoin meetup funding',
        color: 'bg-green-100 text-green-700 border-green-200'
      },
      { 
        name: 'Open Source', 
        icon: 'GitBranch',
        description: 'Support open source development and tools',
        example: 'Bitcoin development tools',
        color: 'bg-gray-100 text-gray-700 border-gray-200'
      },
      { 
        name: 'Charitable Causes', 
        icon: 'Award',
        description: 'Non-profit and charitable fundraising campaigns',
        example: 'Bitcoin education initiatives',
        color: 'bg-orange-100 text-orange-700 border-orange-200'
      }
    ],
    capabilities: [
      'Rich campaign page creation',
      'Bitcoin and Lightning Network payments',
      'Goal tracking and milestone rewards',
      'Supporter communication tools',
      'Social media integration',
      'Real-time analytics and reporting',
      'Automated thank you messages',
      'Recurring donation support',
      'Mobile-optimized donation flow',
      'Transparent fund management'
    ],
    useCases: [
      'Large-scale fundraising campaigns',
      'Non-profit organizations',
      'Community projects',
      'Personal causes'
    ],
    marketTools: [
      {
        name: 'GoFundMe',
        description: 'Personal fundraising platform',
        url: 'https://gofundme.com',
        icon: 'Heart',
        color: 'bg-green-100 text-green-600'
      },
      {
        name: 'Kickstarter',
        description: 'Creative project funding',
        url: 'https://kickstarter.com',
        icon: 'Lightbulb',
        color: 'bg-orange-100 text-orange-600'
      },
      {
        name: 'Patreon',
        description: 'Creator subscription platform',
        url: 'https://patreon.com',
        icon: 'Users',
        color: 'bg-red-100 text-red-600'
      }
    ]
  }
}

// Helper function to get icon component from string
export const getIconComponent = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || Briefcase // fallback icon
}

export const getInitiative = (id: string): Initiative | undefined => {
  return INITIATIVES[id]
}

export const getAllInitiatives = (): Initiative[] => {
  return Object.values(INITIATIVES)
}

export const getAvailableInitiatives = (): Initiative[] => {
  return getAllInitiatives().filter(initiative => initiative.status === 'available')
}

export const getComingSoonInitiatives = (): Initiative[] => {
  return getAllInitiatives().filter(initiative => initiative.status === 'coming-soon')
} 