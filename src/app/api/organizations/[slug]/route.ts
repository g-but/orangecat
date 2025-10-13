import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

async function handleGetOrganizationBySlug(request: AuthenticatedRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createServerClient()
    const { slug } = params

    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select(`
          id, profile_id, name, slug, description, avatar_url, website_url,
          type, category, tags, member_count, campaign_count, total_funding,
          trust_score, is_public, treasury_address, founded_at, created_at, updated_at
        `)
        .eq('slug', slug)
        .single()

      if (error) {
        logger.warn('Error loading organization by slug', error)
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: org })
    } catch (err: any) {
      logger.warn('Organizations table not available for slug lookup', { message: err?.message })
      return NextResponse.json({
        error: 'Organizations are not yet enabled on this environment.',
        hint: 'Apply db/organizations.sql to your database and retry.'
      }, { status: 501 })
    }

  } catch (error) {
    logger.error('Unexpected error in GET /api/organizations/[slug]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGetOrganizationBySlug)

