import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

async function handleGetMembers(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          role,
          status,
          joined_at,
          profile:profiles(id, username, display_name, avatar_url)
        `)
        .eq('organization_id', id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })

      if (error) {
        logger.error('Error fetching organization members', error)
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: data || [] })
    } catch (err: any) {
      logger.warn('Members table not available', { message: err?.message })
      return NextResponse.json({
        error: 'Organization memberships are not enabled on this environment.',
        hint: 'Apply db/organizations.sql to your database and retry.'
      }, { status: 501 })
    }
  } catch (error) {
    logger.error('Unexpected error in GET /api/organizations/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGetMembers)

