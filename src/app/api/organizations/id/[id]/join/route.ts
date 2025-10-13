import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

async function handleJoinOrganization(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const { id } = params

    try {
      // Ensure organization exists
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', id)
        .single()
      if (orgErr || !org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }

      // Insert membership if not exists
      const { data: existing } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('organization_id', id)
        .eq('profile_id', user.id)
        .single()

      if (existing) {
        return NextResponse.json({ success: true, message: 'Already a member' })
      }

      const { data: membership, error } = await supabase
        .from('organization_memberships')
        .insert({ organization_id: id, profile_id: user.id, role: 'member', status: 'active' })
        .select()
        .single()

      if (error) {
        logger.error('Error joining organization', error)
        return NextResponse.json({ error: 'Failed to join organization' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: membership, message: 'Joined successfully' })
    } catch (err: any) {
      logger.warn('Organizations/memberships tables not available for join', { message: err?.message })
      return NextResponse.json({
        error: 'Organization membership not enabled on this environment.',
        hint: 'Apply db/organizations.sql to your database and retry.'
      }, { status: 501 })
    }

  } catch (error) {
    logger.error('Unexpected error in POST /api/organizations/[id]/join:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAuth(handleJoinOrganization)

