import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      '__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'cypress',
      'e2e'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{js,ts,jsx,tsx}',
        '!src/**/*.d.ts',
        '!src/test-setup.ts',
        '!src/**/*.stories.{js,ts,jsx,tsx}',
        '!src/**/*.test.{js,ts,jsx,tsx}'
      ],
      exclude: [
        'src/generated',
        'src/types',
        'src/middleware',
        'src/config'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './src')
    }
  }
}) 