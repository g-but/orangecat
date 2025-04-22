// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_SITE_NAME = 'OrangeCat'
process.env.NODE_ENV = 'test'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}))

// Make mockRouter available globally for tests
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.mockRouter = mockRouter
}