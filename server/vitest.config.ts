import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Starts an in-process Postgres and sets DATABASE_URL before any test file
    // imports config/env.ts, which validates it at module-load time.
    globalSetup: ['./src/test/globalSetup.ts'],
    env: {
      NODE_ENV: 'test',
    },
    // Every file shares the one database, so run files one at a time.
    fileParallelism: false,
  },
})
