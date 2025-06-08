/**
 * HEALTH CHECK API ENDPOINT - Production Monitoring
 * 
 * Created: 2025-06-08
 * Last Modified: 2025-06-08
 * Last Modified Summary: Production health check endpoint for Option D deployment
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const memoryUsage = process.memoryUsage()
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const usagePercent = (usedMB / totalMB) * 100

    const status = usagePercent > 90 ? 'unhealthy' : usagePercent > 75 ? 'degraded' : 'healthy'

    const response = {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: usedMB,
        total: totalMB,
        usage: usagePercent.toFixed(1)
      },
      nodejs: process.version,
      platform: process.platform
    }

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}

 