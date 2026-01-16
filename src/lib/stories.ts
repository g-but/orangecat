import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Story {
  id: string
  category: string
  emoji: string
  name: string
  role: string
  location: string
  goal: string
  raised: string
  supporters: number
  timeline: string
  gradient: string
  summary: string
  published: boolean
  featured: boolean
  story: string
  results?: string[]
  testimonial?: string
}

const STORIES_PATH = path.join(process.cwd(), 'content/stories')

// Ensure stories directory exists
export function ensureStoriesDirectory() {
  if (!fs.existsSync(STORIES_PATH)) {
    fs.mkdirSync(STORIES_PATH, { recursive: true })
  }
}

// Get all story slugs
export function getStorySlugs(): string[] {
  ensureStoriesDirectory()

  if (!fs.existsSync(STORIES_PATH)) {
    return []
  }

  return fs.readdirSync(STORIES_PATH)
    .filter(filename => filename.endsWith('.mdx'))
    .map(filename => filename.replace(/\.mdx$/, ''))
}

// Get a single story by ID
export function getStory(id: string): Story | null {
  try {
    ensureStoriesDirectory()

    const fullPath = path.join(STORIES_PATH, `${id}.mdx`)

    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      id: data.id || id,
      category: data.category || 'General',
      emoji: data.emoji || '📝',
      name: data.name || 'Anonymous',
      role: data.role || '',
      location: data.location || '',
      goal: data.goal || '',
      raised: data.raised || '',
      supporters: data.supporters || 0,
      timeline: data.timeline || '',
      gradient: data.gradient || 'from-gray-50 to-gray-100',
      summary: data.summary || '',
      published: data.published !== false,
      featured: data.featured || false,
      story: content,
      results: data.results || [],
      testimonial: data.testimonial || ''
    }
  } catch {
    return null
  }
}

// Get all stories
export function getAllStories(): Story[] {
  const slugs = getStorySlugs()

  return slugs
    .map(slug => getStory(slug))
    .filter((story): story is Story => story !== null)
    .filter(story => story.published)
}

// Get published stories only
export function getPublishedStories(): Story[] {
  return getAllStories().filter(story => story.published)
}

// Get featured stories
export function getFeaturedStories(): Story[] {
  return getAllStories().filter(story => story.featured)
}

// Get stories by category
export function getStoriesByCategory(category: string): Story[] {
  if (category === 'All') {
    return getAllStories()
  }

  return getAllStories().filter(story =>
    story.category === category
  )
}

// Get all unique categories
export function getAllCategories(): string[] {
  const allCategories = getAllStories().map(story => story.category)
  return ['All', ...Array.from(new Set(allCategories)).sort()]
}
