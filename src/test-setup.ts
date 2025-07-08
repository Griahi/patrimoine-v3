import { vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    }
  })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}))

// NextAuth mock removed - not using NextAuth in this project

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    entity: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    asset: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    valuation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    ownership: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    debt: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    alert: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    dashboardLayout: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    userBehavior: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

// Mock TensorFlow (pour éviter les erreurs de compilation)
vi.mock('@tensorflow/tfjs', () => ({
  sequential: vi.fn(),
  layers: {
    dense: vi.fn()
  },
  tensor: vi.fn(),
  randomNormal: vi.fn(),
  train: {
    sgd: vi.fn()
  }
}))

vi.mock('@tensorflow/tfjs-node', () => ({
  node: {
    modelFromJSON: vi.fn(),
    decodeString: vi.fn()
  }
}))

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.BRIDGE_CLIENT_ID = 'test-bridge-client'
process.env.BRIDGE_CLIENT_SECRET = 'test-bridge-secret'
process.env.YAHOO_FINANCE_API_KEY = 'test-yahoo-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.sessionStorage = sessionStorageMock

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Global test utilities
export const createMockAsset = (overrides = {}) => ({
  id: 'asset-1',
  name: 'Test Asset',
  assetTypeId: 'type-1',
  description: 'Test Description',
  metadata: {},
  externalId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  assetType: {
    id: 'type-1',
    name: 'Test Type',
    code: 'test_type',
    color: '#000000'
  },
  valuations: [],
  debts: [],
  ...overrides
})

export const createMockEntity = (overrides = {}) => ({
  id: 'entity-1',
  userId: 'user-1',
  type: 'PHYSICAL_PERSON',
  name: 'Test Entity',
  taxId: null,
  address: null,
  metadata: {},
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockValuation = (overrides = {}) => ({
  id: 'valuation-1',
  assetId: 'asset-1',
  value: 100000,
  currency: 'EUR',
  valuationDate: new Date(),
  source: 'MANUAL',
  notes: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
}) 