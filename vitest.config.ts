import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 10000, // Increase timeout to 10 seconds
    hookTimeout: 10000, // Increase hook timeout
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
