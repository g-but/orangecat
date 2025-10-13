import { NextResponse } from 'next/server'
import { getMetricsRegistry } from '@/lib/metrics'

export async function GET(request: Request) {
  // Optional feature flag and token
  const enabled = process.env.METRICS_ENABLED === 'true'
  if (!enabled) {
    return new NextResponse('Metrics disabled', { status: 404 })
  }

  const authHeader = (request.headers.get('authorization') || '').trim()
  const token = process.env.METRICS_TOKEN
  if (token) {
    const expected = `Bearer ${token}`
    if (authHeader !== expected) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  const { prom, registry } = await getMetricsRegistry()
  if (!registry || !prom) {
    return new NextResponse('# metrics unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }

  const body = await registry.metrics()
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': prom.register?.contentType || 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
