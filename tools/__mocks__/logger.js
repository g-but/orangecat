module.exports = {
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    supabase: jest.fn(),
    auth: jest.fn(),
    api: jest.fn(),
    database: jest.fn(),
    performance: jest.fn()
  },
  logSupabase: jest.fn(),
  logProfile: jest.fn(),
  logPerformance: jest.fn()
};
