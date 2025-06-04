export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content?: string
  date: string
  readTime: string
  tags: string[]
  featured?: boolean
  author?: string
  published?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    id: 'building-trust-through-transparency',
    slug: 'building-trust-through-transparency',
    title: 'Building Trust Through Transparency: Our Security Journey',
    excerpt: 'How we\'re strengthening OrangeCat\'s security infrastructure and why we\'re sharing every step of the process with our community.',
    date: '2024-12-19',
    readTime: '8 min read',
    tags: ['Security', 'Transparency', 'Building in Public', 'Platform Updates'],
    featured: true,
    published: true,
    author: 'OrangeCat Security Team',
  },
  {
    id: 'what-orangecat-actually-does',
    slug: 'what-orangecat-actually-does',
    title: 'What OrangeCat Actually Does (Without the Buzzwords)',
    excerpt: 'A straightforward explanation of how OrangeCat works, what problems it solves, and why Bitcoin wallets are becoming the new phone numbers.',
    date: '2024-12-19',
    readTime: '6 min read',
    tags: ['Explanation', 'How It Works', 'Bitcoin'],
    featured: false,
    published: true,
  },
  {
    id: 'bitcoin-yellow-pages',
    slug: 'bitcoin-yellow-pages',
    title: 'The Bitcoin Yellow Pages: Redefining Community Connection',
    excerpt: 'Discover how we\'re reimagining the yellow pages for the Bitcoin age - connecting people, projects, and organizations through Bitcoin wallets instead of phone numbers.',
    date: '2024-12-19',
    readTime: '8 min read',
    tags: ['Philosophy', 'Bitcoin', 'Community'],
    featured: false,
    published: true,
  },
  {
    id: 'getting-started-bitcoin-funding',
    slug: 'getting-started-bitcoin-funding',
    title: 'Getting Started with Bitcoin Funding',
    excerpt: 'Learn how to create your first funding page and start receiving Bitcoin donations for your projects.',
    date: '2024-03-15',
    readTime: '5 min read',
    tags: ['Guide', 'Bitcoin', 'Getting Started'],
    published: true,
  },
  {
    id: 'bitcoin-future-funding',
    slug: 'bitcoin-future-funding',
    title: 'Why Bitcoin is the Future of Funding',
    excerpt: 'Discover how Bitcoin is revolutionizing the way creators and innovators receive funding for their projects.',
    date: '2024-03-10',
    readTime: '7 min read',
    tags: ['Bitcoin', 'Future', 'Innovation'],
    published: true,
  },
  {
    id: 'success-stories-funded-projects',
    slug: 'success-stories-funded-projects',
    title: 'Success Stories: Funded Projects',
    excerpt: 'Read about successful projects that were funded through OrangeCat and how Bitcoin helped them achieve their goals.',
    date: '2024-03-05',
    readTime: '6 min read',
    tags: ['Success Stories', 'Projects', 'Case Studies'],
    published: true,
  },
]

// Helper functions for blog management
export const getPublishedPosts = () => blogPosts.filter(post => post.published !== false)
export const getFeaturedPost = () => blogPosts.find(post => post.featured && post.published !== false)
export const getPostBySlug = (slug: string) => blogPosts.find(post => post.slug === slug)
export const getPostsByTag = (tag: string) => getPublishedPosts().filter(post => post.tags.includes(tag))
export const getAllTags = () => Array.from(new Set(getPublishedPosts().flatMap(post => post.tags)))

// Function to add new blog post (for easy content management)
export const addBlogPost = (post: Omit<BlogPost, 'id'>) => {
  const newPost: BlogPost = {
    ...post,
    id: post.slug,
    published: post.published ?? true,
  }
  blogPosts.unshift(newPost) // Add to beginning of array
  return newPost
} 