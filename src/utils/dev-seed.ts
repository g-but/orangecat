import supabase from '@/services/supabase/client'

// Sample data for testing
const sampleProfiles = [
  {
    username: 'alice_creator',
    display_name: 'Alice Johnson',
    bio: 'Creative entrepreneur passionate about sustainable technology and community building.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    username: 'bob_developer',
    display_name: 'Bob Smith',
    bio: 'Full-stack developer building the future of decentralized applications.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    username: 'charlie_artist',
    display_name: 'Charlie Brown',
    bio: 'Digital artist creating NFTs and exploring the intersection of art and technology.',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    username: 'diana_educator',
    display_name: 'Diana Wilson',
    bio: 'Educator and advocate for accessible technology education in underserved communities.',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    username: 'evan_musician',
    display_name: 'Evan Davis',
    bio: 'Independent musician and producer creating experimental electronic music.',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  }
]

const sampleCampaigns = [
  {
    title: 'Solar-Powered Community Garden',
    description: 'Building a sustainable community garden powered entirely by solar energy. This project will provide fresh produce to local families while demonstrating renewable energy solutions.',
    category: 'community',
    tags: ['sustainability', 'solar', 'community', 'garden'],
    goal_amount: 50000,
    total_funding: 12500,
    contributor_count: 25,
    is_active: true,
    is_public: true,
    featured_image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop'
  },
  {
    title: 'Open Source Learning Platform',
    description: 'Developing a free, open-source platform for online education that works offline and on low-bandwidth connections.',
    category: 'education',
    tags: ['education', 'open-source', 'technology', 'accessibility'],
    goal_amount: 75000,
    total_funding: 45000,
    contributor_count: 89,
    is_active: true,
    is_public: true,
    featured_image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop'
  },
  {
    title: 'Digital Art Exhibition Space',
    description: 'Creating a virtual reality gallery space for emerging digital artists to showcase their work and connect with collectors.',
    category: 'creative',
    tags: ['art', 'vr', 'digital', 'gallery'],
    goal_amount: 30000,
    total_funding: 18750,
    contributor_count: 42,
    is_active: true,
    is_public: true,
    featured_image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop'
  },
  {
    title: 'Blockchain Music Distribution',
    description: 'Building a decentralized platform for musicians to distribute their music directly to fans without intermediaries.',
    category: 'technology',
    tags: ['blockchain', 'music', 'decentralized', 'distribution'],
    goal_amount: 100000,
    total_funding: 67500,
    contributor_count: 156,
    is_active: true,
    is_public: true,
    featured_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop'
  },
  {
    title: 'Clean Water Initiative',
    description: 'Installing water purification systems in rural communities to provide access to clean, safe drinking water.',
    category: 'charity',
    tags: ['water', 'charity', 'health', 'community'],
    goal_amount: 80000,
    total_funding: 32000,
    contributor_count: 78,
    is_active: true,
    is_public: true,
    featured_image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop'
  }
]

export async function seedDevelopmentData() {
  try {
    
    // Check if we're in development
    if (process.env.NODE_ENV !== 'development') {
      return
    }
    
    // Check if data already exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (existingProfiles && existingProfiles.length > 0) {
      return
    }
    
    
    // Create profiles (this will require authentication, so this is more of a template)
    // In a real scenario, you'd need to create users first through Supabase Auth
    
    
    return {
      profiles: sampleProfiles,
      campaigns: sampleCampaigns
    }
    
  } catch (error) {
    throw error
  }
}

// Export sample data for manual seeding
export { sampleProfiles, sampleCampaigns } 