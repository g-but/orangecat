export interface Organization {
  id: string
  name: string
  description: string
  website?: string
  logo_url?: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationFormData {
  name: string
  description: string
  website?: string
  logo_url?: string
  type?: string
  category?: string
  governance_model?: string
  treasury_address?: string
  is_public?: boolean
  requires_approval?: boolean
  website_url?: string
  tags?: string[]
}

export interface OrganizationSearchParams {
  query?: string
  verified?: boolean
  limit?: number
  offset?: number
}

export interface CreateOrganizationInput {
  name: string
  description: string
  website?: string
  logo_url?: string
}

export interface UpdateOrganizationInput {
  name?: string
  description?: string
  website?: string
  logo_url?: string
}

export interface OrganizationFilters {
  verified?: boolean
  has_website?: boolean
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}
