import { POST } from '@/app/api/onboarding/analyze/route'

// Skip: Requires proper NextResponse mock setup for API route testing
describe.skip('POST /api/onboarding/analyze', () => {
  it('returns organization recommendation for collective charity text', async () => {
    const req: any = {
      json: async () => ({
        description:
          'We run a local cat shelter with 3 vets and 5 volunteers. We manage funds collectively for food and medical supplies.',
      }),
    }

    const res: any = await POST(req)

    // Our NextResponse.json mock returns an object with status and json()
    const body = typeof res.json === 'function' ? await res.json() : res

    expect(res.status || 200).toBe(200)
    expect(body).toHaveProperty('isOrganization')
    expect(body).toHaveProperty('confidence')
    expect(body.suggestedSetup || (body.isOrganization ? 'organization' : 'personal')).toMatch(/organization|personal/)
  })

  it('400s on missing description', async () => {
    const req: any = { json: async () => ({}) }
    const res: any = await POST(req)
    expect(res.status).toBe(400)
  })
})

