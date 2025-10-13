import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth'
import { createServerClient } from '@/services/supabase/server'
import { logger } from '@/utils/logger'

async function handleSeedOrangeCat(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient()
    const user = request.user
    const slug = 'orange-cat'

    try {
      // Exists?
      const { data: existing } = await supabase
        .from('organizations')
        .select('id, slug')
        .eq('slug', slug)
        .single()
      if (existing) {
        return NextResponse.json({ success: true, data: existing, message: 'Orange Cat already exists' })
      }

      const { data: org, error } = await supabase
        .from('organizations')
        .insert({
          profile_id: user.id,
          name: 'Orange Cat',
          slug,
          description: 'Official Orange Cat org supporting tools that empower builders. Fund Bitcoin-native crowdfunding and open-source initiatives.',
          type: 'foundation',
          category: 'Technology',
          tags: ['bitcoin', 'crowdfunding', 'open-source'],
          governance_model: 'hierarchical',
          is_public: true,
          website_url: 'https://www.orangecat.ch'
        })
        .select()
        .single()

      if (error || !org) {
        logger.error('Failed to seed Orange Cat', error)
        return NextResponse.json({ error: 'Failed to create Orange Cat' }, { status: 500 })
      }

      await supabase.from('organization_memberships').insert({
        organization_id: org.id,
        profile_id: user.id,
        role: 'owner',
        status: 'active'
      })

      return NextResponse.json({ success: true, data: org, message: 'Orange Cat created' })
    } catch (err: any) {
      logger.warn('Organizations not enabled for seed', { message: err?.message })
      return NextResponse.json({
        error: 'Organizations are not enabled on this environment.',
        hint: 'Apply db/organizations.sql to your database and retry.'
      }, { status: 501 })
    }
  } catch (error) {
    logger.error('Unexpected error in POST /api/organizations/seed-orange-cat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAuth(handleSeedOrangeCat)
