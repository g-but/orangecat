import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

async function handleOrganizationRequest(request: AuthenticatedRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = await createServerClient()
    const { slug } = params

    // Check if it's a UUID (organization ID) or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

    try {
      let query = supabase
        .from('organizations')
        .select(`
          id, profile_id, name, slug, description, avatar_url, website_url,
          type, category, tags, member_count, campaign_count, total_funding,
          trust_score, is_public, treasury_address, founded_at, created_at, updated_at
        `)

      if (isUUID) {
        query = query.eq('id', slug)
      } else {
        query = query.eq('slug', slug)
      }

      const { data: org, error } = await query.single()

      if (error) {
        logger.warn('Error loading organization', { slug, isUUID, error })
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: org })
    } catch (err: any) {
      logger.warn('Organizations table not available for lookup', { message: err?.message })
      return NextResponse.json({
        error: 'Organizations feature not yet available',
        details: err?.message
      }, { status: 503 })
    }
  } catch (err: any) {
    logger.error('Unexpected error in organization lookup', err)
    return NextResponse.json({
      error: 'Internal server error',
      details: err?.message
    }, { status: 500 })
  }
}

export const GET = withAuth(handleOrganizationRequest)