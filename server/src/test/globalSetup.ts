import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

// Boots an in-process Postgres (PGlite) behind a wire-protocol socket so the
// real pg-promise driver, SQL, constraints and triggers are exercised without
// Docker. Workers inherit DATABASE_URL because they are spawned after this runs.
//
// PGlite serves one session at a time: a query issued on a second connection
// while a transaction is open waits for that transaction to finish. Tests
// cannot exercise truly concurrent requests against it.
const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../db/migrations')

export default async function setup() {
  const pg = await PGlite.create()

  const migrations = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  for (const file of migrations) {
    await pg.exec(readFileSync(join(migrationsDir, file), 'utf-8'))
  }

  const server = new PGLiteSocketServer({ db: pg, host: '127.0.0.1', port: 0, maxConnections: 20 })
  await server.start()
  process.env.DATABASE_URL = `postgres://postgres:postgres@${server.getServerConn()}/postgres`

  return async () => {
    await server.stop()
    await pg.close()
  }
}
