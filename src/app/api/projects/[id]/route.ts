import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/db'
import { handleApiError, AuthError, NotFoundError, ValidationError } from '@/lib/errors'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { projectSchema } from '@/lib/validation'

// GET /api/projects/[id] - Get specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles:creator_id (
          id,
          username,
          name,
          avatar_url
        ),
        donations (
          id,
          amount,
          currency,
          status,
          anonymous,
          message,
          created_at,
          profiles:donor_id (
            id,
            username,
            name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !project) {
      throw new NotFoundError('Project')
    }

    return Response.json({ success: true, data: project })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting check (stricter for PUT)
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new AuthError()
    }

    const { id } = params
    const body = await request.json()

    // Validate input data
    const validatedData = projectSchema.parse(body)

    // Check if user owns the project
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCampaign) {
      throw new NotFoundError('Project')
    }

    if (existingCampaign.creator_id !== user.id) {
      throw new AuthError('You can only update your own projects')
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update project')
    }

    return Response.json({ success: true, data: project })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return handleApiError(new ValidationError('Invalid project data'))
    }
    return handleApiError(error)
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new AuthError()
    }

    const { id } = params

    // Check if user owns the project
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCampaign) {
      throw new NotFoundError('Project')
    }

    if (existingCampaign.creator_id !== user.id) {
      throw new AuthError('You can only delete your own projects')
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Failed to delete project')
    }

    return Response.json({ success: true, message: 'Campaign deleted' })
  } catch (error) {
    return handleApiError(error)
  }
}
