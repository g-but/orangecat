export interface Profile {
  id: string; // Primary key, matches auth.users.id
  username?: string | null;
  name?: string | null; // Matches actual database column
  bio?: string | null;
  // Structured location fields for better search functionality
  location_country?: string | null; // ISO 3166-1 alpha-2 country code
  location_city?: string | null; // City or municipality name
  location_zip?: string | null; // ZIP or postal code
  location_search?: string | null; // Display field for autocomplete
  latitude?: number | null; // Geographic coordinates for mapping
  longitude?: number | null; // Geographic coordinates for mapping
  // Extended transparency fields
  background?: string | null; // Personal/professional background
  inspiration_statement?: string | null; // What inspires them
  location_context?: string | null; // Additional context about location
  // Legacy location field (deprecated but kept for backward compatibility)
  location?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  website?: string | null;
  // Social & Contact
  social_links?: { links: Array<{ platform: string; label?: string; value: string }> } | null;
  contact_email?: string | null;
  phone?: string | null;
  // Wallet fields (kept for backward compatibility, but wallets managed separately)
  bitcoin_address?: string | null;
  lightning_address?: string | null;
  // User preferences
  currency?: string | null; // User's preferred display currency (from CURRENCY_CODES)
  created_at: string;
  updated_at: string;

  // Enhanced categorization and association system
  profile_type?: ProfileType;
  category_tags?: string[];
  associated_entities?: AssociatedEntity[];
  inspiration_statement?: string | null; // What inspires supporters to contribute
  impact_metrics?: ImpactMetric[];
  verification_status?: VerificationStatus;
}

export type ProfileType = 'individual' | 'project' | 'organization' | 'collective' | 'project';

export interface AssociatedEntity {
  id: string;
  type: ProfileType;
  name: string;
  relationship: RelationshipType;
  verified: boolean;
}

export type RelationshipType =
  | 'creator'
  | 'collaborator'
  | 'supporter'
  | 'beneficiary'
  | 'member'
  | 'founder'
  | 'participant';

export interface ImpactMetric {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'featured';

// Profile categories with purposes
export const PROFILE_CATEGORIES = {
  individual: {
    label: 'Individual',
    description: 'A person with goals, dreams, and projects that need support',
    icon: '👤',
    color: 'blue',
    inspirationPrompts: [
      'What drives you to create and build?',
      'How will Bitcoin support change your life or work?',
      'What impact do you want to make in the world?',
    ],
  },
  project: {
    label: 'Campaign',
    description: 'A specific project or initiative seeking Bitcoin funding',
    icon: '🎯',
    color: 'orange',
    inspirationPrompts: [
      'What problem does this project solve?',
      'How will supporters see their impact?',
      'What makes this project unique and worthy of support?',
    ],
  },
  organization: {
    label: 'Organization',
    description: 'A company, nonprofit, or group working towards a mission',
    icon: '🏢',
    color: 'green',
    inspirationPrompts: [
      "What is your organization's mission and vision?",
      'How does Bitcoin funding advance your goals?',
      'What impact has your organization already made?',
    ],
  },
  collective: {
    label: 'Collective',
    description: 'A group of individuals working together on shared goals',
    icon: '👥',
    color: 'purple',
    inspirationPrompts: [
      'What brings this collective together?',
      'How does the group amplify individual efforts?',
      'What unique value does collaboration create?',
    ],
  },
  project: {
    label: 'Project',
    description: 'An ongoing initiative or creative work seeking ongoing support',
    icon: '🚀',
    color: 'teal',
    inspirationPrompts: [
      'What makes this project innovative or important?',
      'How will ongoing support help the project grow?',
      'What milestones and goals lie ahead?',
    ],
  },
} as const;

// Category tags for better discovery and association
export const CATEGORY_TAGS = {
  // Purpose-based tags
  education: { label: 'Education', icon: '📚', color: 'blue' },
  technology: { label: 'Technology', icon: '💻', color: 'indigo' },
  art: { label: 'Art & Creativity', icon: '🎨', color: 'pink' },
  environment: { label: 'Environment', icon: '🌱', color: 'green' },
  social: { label: 'Social Impact', icon: '🤝', color: 'purple' },
  health: { label: 'Health & Wellness', icon: '❤️', color: 'red' },
  business: { label: 'Business & Entrepreneurship', icon: '💼', color: 'orange' },
  research: { label: 'Research & Development', icon: '🔬', color: 'cyan' },
  community: { label: 'Community Building', icon: '🏘️', color: 'yellow' },
  journalism: { label: 'Journalism & Media', icon: '📰', color: 'gray' },

  // Bitcoin-specific tags
  bitcoin_education: { label: 'Bitcoin Education', icon: '₿', color: 'orange' },
  lightning: { label: 'Lightning Network', icon: '⚡', color: 'yellow' },
  mining: { label: 'Bitcoin Mining', icon: '⛏️', color: 'orange' },
  development: { label: 'Bitcoin Development', icon: '🔧', color: 'blue' },
  adoption: { label: 'Bitcoin Adoption', icon: '🌍', color: 'green' },

  // Stage/Status tags
  startup: { label: 'Startup', icon: '🌟', color: 'purple' },
  established: { label: 'Established', icon: '🏆', color: 'gold' },
  experimental: { label: 'Experimental', icon: '🧪', color: 'teal' },
  collaborative: { label: 'Open to Collaboration', icon: '🤝', color: 'blue' },
  urgent: { label: 'Urgent Need', icon: '🚨', color: 'red' },
} as const;
