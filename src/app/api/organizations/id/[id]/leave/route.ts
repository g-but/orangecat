import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

async function handleLeaveOrganization(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const { id } = params

    try {
      const { error } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('organization_id', id)
        .eq('profile_id', user.id)

      if (error) {
        logger.error('Error leaving organization', error)
        return NextResponse.json({ error: 'Failed to leave organization' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Left organization' })
    } catch (err: any) {
      logger.warn('Members table not available for leave', { message: err?.message })
      return NextResponse.json({
        error: 'Organization memberships are not enabled on this environment.',
        hint: 'Apply db/organizations.sql to your database and retry.'
      }, { status: 501 })
    }
  } catch (error) {
    logger.error('Unexpected error in POST /api/organizations/[id]/leave:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAuth(handleLeaveOrganization)

