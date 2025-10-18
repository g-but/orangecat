import { z } from 'zod'

// Profile validation
// Note: Server-side normalizes empty strings to undefined before validation
// Username is mandatory (like Twitter @username), display_name is optional (like Twitter display name)
export const profileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
  website: z.string().max(200).optional(),
  bitcoin_address: z.string()
    .regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/, "Invalid Bitcoin address format")
    .optional()
    .or(z.literal('')),
  lightning_address: z.string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid Lightning address format (must be like user@domain.com)")
    .optional()
    .or(z.literal('')),
})

// Campaign validation
export const campaignSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  goal_amount: z.number().int().positive().max(1000000000000), // Max 1M BTC in sats
  currency: z.enum(['SATS', 'BTC', 'USD']).default('SATS'),
  bitcoin_address: z.string().regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/).optional(),
  lightning_address: z.string().email().optional(),
})

// Donation validation
export const donationSchema = z.object({
  campaign_id: z.string().uuid(),
  amount: z.number().int().positive().max(1000000000000),
  currency: z.enum(['SATS', 'BTC', 'USD']).default('SATS'),
  payment_method: z.enum(['bitcoin', 'lightning']),
  anonymous: z.boolean().default(false),
  message: z.string().max(500).optional(),
})

// Organization validation
export const organizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
  website: z.string().url().optional(),
  bitcoin_address: z.string().regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/).optional(),
  lightning_address: z.string().email().optional(),
})

// Helper function to normalize profile data
export function normalizeProfileData(data: any): ProfileData {
  const normalized = { ...data }

  // If display_name is empty or not provided, use username
  if (!normalized.display_name || normalized.display_name.trim() === '') {
    normalized.display_name = normalized.username
  }

  // Auto-add https:// to website if protocol is missing
  if (normalized.website && typeof normalized.website === 'string') {
    const website = normalized.website.trim()
    if (website && !website.match(/^https?:\/\//i)) {
      normalized.website = `https://${website}`
    }
  }

  // Normalize empty strings to undefined for optional fields
  Object.keys(normalized).forEach(key => {
    if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
      normalized[key] = undefined
    }
  })

  return normalized
}

export type ProfileData = z.infer<typeof profileSchema>
export type CampaignData = z.infer<typeof campaignSchema>
export type DonationData = z.infer<typeof donationSchema>
export type OrganizationData = z.infer<typeof organizationSchema>
