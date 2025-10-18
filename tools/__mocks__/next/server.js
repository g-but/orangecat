// Mock for Next.js server functions and headers
const mockCookies = () => ({
  get: jest.fn(),
  set: jest.fn(),
});

const mockHeaders = () => ({
  get: jest.fn(),
  set: jest.fn(),
});

// Mock NextResponse
const NextResponse = {
  json: jest.fn((data, options = {}) => ({
    json: () => Promise.resolve(data),
    status: options.status || 200,
    headers: options.headers || {},
  })),
};

module.exports = {
  cookies: mockCookies,
  headers: mockHeaders,
  NextResponse,
};
