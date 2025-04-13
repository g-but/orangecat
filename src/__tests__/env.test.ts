describe('Environment Configuration', () => {
  it('should have required environment variables', () => {
    expect(process.env.NEXT_PUBLIC_SITE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SITE_NAME).toBeDefined()
    expect(process.env.NODE_ENV).toBeDefined()
  })

  it('should have correct test environment values', () => {
    expect(process.env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
    expect(process.env.NEXT_PUBLIC_SITE_NAME).toBe('OrangeCat')
    expect(process.env.NODE_ENV).toBe('test')
  })
}) 