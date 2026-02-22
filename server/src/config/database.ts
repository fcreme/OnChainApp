import pgPromise from 'pg-promise'
import { env } from './env.js'

const pgp = pgPromise({
  error(_err, e) {
    if (e.cn) {
      console.error('Database connection error:', e.cn)
    }
  },
})

export const db = pgp({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

export { pgp }

export async function testConnection(): Promise<boolean> {
  try {
    await db.one('SELECT 1 AS connected')
    return true
  } catch {
    return false
  }
}
