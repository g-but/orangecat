import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let report: any = null
    if (contentType.includes('application/csp-report') || contentType.includes('application/json')) {
      const body = await request.json().catch(() => null)
      report = body
    } else {
      const text = await request.text().catch(() => '')
      report = text
    }
    // For now, just log. In production, send to logging/alerting pipeline.
  } catch (e) {
    // swallow
  }
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  return new NextResponse('Send CSP reports via POST', { status: 405 })
}

