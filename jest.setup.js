// Jest setup file for global test configuration

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/marketefficient_test';

// Mock external API calls by default
jest.mock('axios');

// Global test timeout
jest.setTimeout(10000);

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/test',
    query: {},
    asPath: '/test'
  })
}));

// Mock database connection for testing
jest.mock('./lib/database', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));