import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pgPromise from 'pg-promise'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const pgp = pgPromise()
const db = pgp(DATABASE_URL)

async function migrate() {
  console.log('Running database migrations...')

  const migrationsDir = join(__dirname, 'migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    console.log(`  Executing: ${file}`)
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    await db.none(sql)
    console.log(`  Done: ${file}`)
  }

  console.log('All migrations complete.')
  await pgp.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
