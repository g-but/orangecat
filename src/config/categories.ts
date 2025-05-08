export interface Category {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  groups: {
    id: string
    name: string
    description: string
  }[]
}

export const categories: Category[] = [
  {
    id: 'health-life',
    name: 'Health & Life',
    description: 'For medical expenses, life events, and personal needs',
    icon: 'Heart',
    groups: [
      {
        id: 'medical',
        name: 'Medical Expenses',
        description: 'Medical treatments, procedures, and healthcare costs'
      },
      {
        id: 'life-events',
        name: 'Life Events',
        description: 'Birth of a child, weddings, funerals, and other significant life moments'
      },
      {
        id: 'personal',
        name: 'Personal Needs',
        description: 'Personal emergencies, family support, and individual assistance'
      }
    ]
  },
  {
    id: 'creators',
    name: 'Creators',
    description: 'For content creators, artists, and digital creators',
    icon: 'Palette',
    groups: [
      {
        id: 'content-creators',
        name: 'Content Creators',
        description: 'Bloggers, YouTubers, podcasters, and social media creators'
      },
      {
        id: 'artists',
        name: 'Artists',
        description: 'Visual artists, musicians, DJs, and digital artists'
      },
      {
        id: 'writers',
        name: 'Writers',
        description: 'Authors, journalists, and independent writers'
      }
    ]
  },
  {
    id: 'builders',
    name: 'Builders',
    description: 'For developers, founders, and technical creators',
    icon: 'Code',
    groups: [
      {
        id: 'open-source',
        name: 'Open Source Developers',
        description: 'Maintainers and contributors to open source projects'
      },
      {
        id: 'founders',
        name: 'Solo Founders',
        description: 'Independent entrepreneurs and startup founders'
      },
      {
        id: 'vibe-coders',
        name: 'Vibe Coders',
        description: 'Creative developers and experimental projects'
      }
    ]
  },
  {
    id: 'education',
    name: 'Education',
    description: 'For students, teachers, and educational initiatives',
    icon: 'GraduationCap',
    groups: [
      {
        id: 'students',
        name: 'Students',
        description: 'Individual students and student projects'
      },
      {
        id: 'classes',
        name: 'Classes & Courses',
        description: 'Educational programs and course creators'
      },
      {
        id: 'research',
        name: 'Research',
        description: 'Academic research and educational initiatives'
      }
    ]
  },
  {
    id: 'organizations',
    name: 'Organizations',
    description: 'For non-profits, charities, and community initiatives',
    icon: 'Building2',
    groups: [
      {
        id: 'non-profits',
        name: 'Non-Profits',
        description: 'Registered non-profit organizations'
      },
      {
        id: 'charities',
        name: 'Charities',
        description: 'Charitable organizations and initiatives'
      },
      {
        id: 'communities',
        name: 'Communities',
        description: 'Community projects and initiatives'
      }
    ]
  }
] 