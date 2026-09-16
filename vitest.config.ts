/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Node 25+ ships Web Storage enabled by default. Its global `localStorage`
// getter shadows jsdom's, and without --localstorage-file it returns undefined,
// so every test that touches storage crashes. Turn it off in the test workers.
const nodeMajor = Number(process.versions.node.split('.')[0])
const workerExecArgv = nodeMajor >= 25 ? ['--no-experimental-webstorage'] : []

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Server tests run from server/ with their own config and database.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    poolOptions: {
      forks: { execArgv: workerExecArgv },
      threads: { execArgv: workerExecArgv },
    },
  },
})
