import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // scoreMatch() is a pure function, but importing MatchingEngine transitively
    // pulls in config/database.ts -> config/env.ts, which validates DATABASE_URL
    // at module-load time and process.exit(1)s if it is missing. pg-promise opens
    // connections lazily (never during these unit tests, which issue no queries),
    // so a dummy URL satisfies validation without modifying any production code.
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      NODE_ENV: 'test',
    },
  },
})
