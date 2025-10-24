import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { projectSchema, type ProjectData } from '@/lib/validation'
import { handleApiError, AuthError, ValidationError } from '@/lib/errors'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error('Failed to fetch projects')
    }

    return Response.json({ success: true, data: projects || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (stricter for POST)
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new AuthError()
    }

    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...validatedData,
        creator_id: user.id
      })
      .select('*')
      .single()

    if (error) {
      throw new Error('Failed to create project')
    }

    return Response.json({ success: true, data: project }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return handleApiError(new ValidationError('Invalid project data'))
    }
    return handleApiError(error)
  }
}