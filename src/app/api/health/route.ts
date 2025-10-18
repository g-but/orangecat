import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/db'

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Test database connection
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      return Response.json(
        { 
          status: 'unhealthy', 
          error: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy'
      }
    })
  } catch (error) {
    return Response.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
