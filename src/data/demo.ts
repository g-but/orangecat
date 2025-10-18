// Demo data for development and testing

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

// Organizations Demo Data
export interface OrganizationData {
  id: string
  name: string
  slug: string
  description: string
  members: number
  campaigns: number
  totalRaised: number
  category: string
  verified: boolean
  logoUrl?: string
  website?: string
}

export const demoOrganizations: OrganizationData[] = [
  {
    id: '1',
    name: 'Bitcoin Developers Collective',
    slug: 'bitcoin-devs',
    description: 'A community of Bitcoin developers working on core protocol improvements',
    members: 247,
    campaigns: 3,
    totalRaised: 2100000,
    category: 'Technology',
    verified: true,
    logoUrl: '/images/orgs/bitcoin-devs.png',
    website: 'https://bitcoin.dev'
  },
  {
    id: '2',
    name: 'Lightning Network Foundation',
    slug: 'lightning-network',
    description: 'Advancing Lightning Network adoption and development worldwide',
    members: 189,
    campaigns: 2,
    totalRaised: 1500000,
    category: 'Technology',
    verified: true,
    logoUrl: '/images/orgs/lightning.png',
    website: 'https://lightning.network'
  },
  {
    id: '3',
    name: 'Bitcoin Education Initiative',
    slug: 'bitcoin-education',
    description: 'Making Bitcoin education accessible to everyone',
    members: 156,
    campaigns: 1,
    totalRaised: 800000,
    category: 'Education',
    verified: false,
    logoUrl: '/images/orgs/edu.png',
    website: 'https://bitcoin.education'
  }
]

// Events Demo Data
export interface EventData {
  id: string
  title: string
  description: string
  date: string
  location: string
  attendees: number
  maxAttendees: number
  category: string
  organizer: string
  price: number
  imageUrl?: string
}

export const demoEvents: EventData[] = [
  {
    id: '1',
    title: 'Bitcoin & Coffee Meetup',
    description: 'Weekly meetup for Bitcoin enthusiasts in Zurich',
    date: '2024-02-15',
    location: 'Zurich, Switzerland',
    attendees: 23,
    maxAttendees: 50,
    category: 'Networking',
    organizer: 'Bitcoin Zurich',
    price: 0,
    imageUrl: '/images/events/coffee.png'
  },
  {
    id: '2',
    title: 'Lightning Network Workshop',
    description: 'Hands-on workshop learning how to use Lightning Network',
    date: '2024-02-20',
    location: 'Bern, Switzerland',
    attendees: 15,
    maxAttendees: 25,
    category: 'Workshop',
    organizer: 'Swiss Bitcoin Association',
    price: 50000, // sats
    imageUrl: '/images/events/lightning-workshop.png'
  },
  {
    id: '3',
    title: 'Bitcoin Pizza Day Celebration',
    description: 'Celebrating the first Bitcoin purchase - 10,000 BTC for 2 pizzas!',
    date: '2024-05-22',
    location: 'Geneva, Switzerland',
    attendees: 87,
    maxAttendees: 100,
    category: 'Social',
    organizer: 'Bitcoin Switzerland',
    price: 10000, // sats
    imageUrl: '/images/events/pizza-day.png'
  }
]

// Projects Demo Data
export interface ProjectData {
  id: string
  title: string
  description: string
  category: string
  status: 'active' | 'completed' | 'paused'
  progress: number
  fundingGoal: number
  currentFunding: number
  backers: number
  deadline: string
  teamSize: number
  imageUrl?: string
}

export const demoProjects: ProjectData[] = [
  {
    id: '1',
    title: 'Bitcoin Privacy Tools',
    description: 'Developing open-source tools to enhance Bitcoin privacy and security',
    category: 'Technology',
    status: 'active',
    progress: 65,
    fundingGoal: 2000000,
    currentFunding: 1300000,
    backers: 89,
    deadline: '2024-06-01',
    teamSize: 5,
    imageUrl: '/images/projects/privacy-tools.png'
  },
  {
    id: '2',
    title: 'Bitcoin Education Platform',
    description: 'Creating comprehensive educational resources for Bitcoin adoption',
    category: 'Education',
    status: 'active',
    progress: 40,
    fundingGoal: 1500000,
    currentFunding: 600000,
    backers: 67,
    deadline: '2024-08-15',
    teamSize: 3,
    imageUrl: '/images/projects/edu-platform.png'
  },
  {
    id: '3',
    title: 'Lightning Network Infrastructure',
    description: 'Building critical infrastructure for Lightning Network scaling',
    category: 'Infrastructure',
    status: 'completed',
    progress: 100,
    fundingGoal: 3000000,
    currentFunding: 3100000,
    backers: 145,
    deadline: '2024-01-31',
    teamSize: 8,
    imageUrl: '/images/projects/lightning-infra.png'
  }
]

