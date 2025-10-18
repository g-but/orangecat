// Mock for Next.js headers
const mockCookies = () => ({
  get: jest.fn(),
  set: jest.fn(),
});

module.exports = {
  cookies: mockCookies,
};
